package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateProductUnitConversionRequest;
import com.sales.dto.request.UpdateProductUnitConversionRequest;
import com.sales.dto.response.ProductUnitConversionResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Product;
import com.sales.entity.ProductUnitConversion;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.ProductUnitConversionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductUnitConversionServiceImpl implements ProductUnitConversionService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductUnitConversionRepository productUnitConversionRepository;
    private final com.sales.repository.ProductPriceTierRepository productPriceTierRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final OrderItemRepository orderItemRepository;
    private final ReturnTicketItemRepository returnTicketItemRepository;
    private final InventoryAuditDetailRepository inventoryAuditDetailRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private Product getProductBelongingToHousehold(String productId, String householdId) {
        return productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductUnitConversionResponse> getUnitConversions(String currentUsername, String productId) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        Product product = getProductBelongingToHousehold(productId, household.getId());
        boolean movementExists = hasStockMovement(productId, household.getId());

        return productUnitConversionRepository.findByProductId(product.getId())
                .stream()
                .map(conversion -> mapToResponse(conversion, product, movementExists))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductUnitConversionResponse createUnitConversion(String currentUsername, String productId, CreateProductUnitConversionRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        Product product = getProductBelongingToHousehold(productId, household.getId());

        // Validate conversion factor
        validateConversionFactor(request.getConversionFactor());

        // Validate unit name
        String unitName = request.getUnitName().trim();
        if (product.getUnit().equalsIgnoreCase(unitName)) {
            throw new AppException(ErrorCode.DUPLICATE_UNIT_CONVERSION_NAME);
        }
        if (productUnitConversionRepository.existsByProductIdAndUnitNameIgnoreCase(productId, unitName)) {
            throw new AppException(ErrorCode.DUPLICATE_UNIT_CONVERSION_NAME);
        }

        // Validate barcode uniqueness if provided
        String barcode = StringUtils.hasText(request.getBarcode()) ? request.getBarcode().trim() : null;
        if (barcode != null) {
            validateBarcodeUniqueness(household.getId(), barcode, null);
        }

        // Handle default flags
        Boolean isDefaultImport = Boolean.TRUE.equals(request.getIsDefaultImport());
        Boolean isDefaultSale = Boolean.TRUE.equals(request.getIsDefaultSale());

        if (isDefaultImport) {
            clearExistingDefaultImport(productId, null);
        }
        if (isDefaultSale) {
            clearExistingDefaultSale(productId, null);
        }

        ProductUnitConversion conversion = ProductUnitConversion.builder()
                .product(product)
                .unitName(unitName)
                .conversionFactor(request.getConversionFactor())
                .price(request.getPrice())
                .barcode(barcode)
                .isDefaultImport(isDefaultImport)
                .isDefaultSale(isDefaultSale)
                .build();

        conversion = productUnitConversionRepository.save(conversion);

        logActivity(household, user, "CREATE_UNIT_CONVERSION", conversion.getId(), null, buildConversionLogMap(conversion));

        boolean movementExists = hasStockMovement(productId, household.getId());
        return mapToResponse(conversion, product, movementExists);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductUnitConversionResponse updateUnitConversion(String currentUsername, String productId, String conversionId, UpdateProductUnitConversionRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        Product product = getProductBelongingToHousehold(productId, household.getId());

        ProductUnitConversion conversion = productUnitConversionRepository.findByIdAndProductId(conversionId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_CONVERSION_NOT_FOUND));

        Map<String, Object> oldLogMap = buildConversionLogMap(conversion);

        // TC-03: If conversionFactor is changed, check if product has stock movements
        boolean factorChanged = conversion.getConversionFactor().compareTo(request.getConversionFactor()) != 0;
        if (factorChanged) {
            boolean movementExists = hasStockMovement(productId, household.getId());
            if (movementExists) {
                log.warn("Attempt to modify conversionFactor for product {} with existing stock movements", productId);
                throw new AppException(ErrorCode.CANNOT_MODIFY_CONVERSION_WITH_STOCK_MOVEMENT);
            }
            validateConversionFactor(request.getConversionFactor());
            conversion.setConversionFactor(request.getConversionFactor());
        }

        // Validate unit name
        String unitName = request.getUnitName().trim();
        if (product.getUnit().equalsIgnoreCase(unitName)) {
            throw new AppException(ErrorCode.DUPLICATE_UNIT_CONVERSION_NAME);
        }
        if (productUnitConversionRepository.existsByProductIdAndUnitNameIgnoreCaseAndIdNot(productId, unitName, conversionId)) {
            throw new AppException(ErrorCode.DUPLICATE_UNIT_CONVERSION_NAME);
        }
        conversion.setUnitName(unitName);

        // Validate barcode uniqueness if provided
        String barcode = StringUtils.hasText(request.getBarcode()) ? request.getBarcode().trim() : null;
        if (barcode != null) {
            validateBarcodeUniqueness(household.getId(), barcode, conversionId);
        }
        conversion.setBarcode(barcode);

        // Handle default flags
        Boolean isDefaultImport = Boolean.TRUE.equals(request.getIsDefaultImport());
        Boolean isDefaultSale = Boolean.TRUE.equals(request.getIsDefaultSale());

        if (isDefaultImport && !Boolean.TRUE.equals(conversion.getIsDefaultImport())) {
            clearExistingDefaultImport(productId, conversionId);
        }
        if (isDefaultSale && !Boolean.TRUE.equals(conversion.getIsDefaultSale())) {
            clearExistingDefaultSale(productId, conversionId);
        }

        conversion.setPrice(request.getPrice());
        conversion.setIsDefaultImport(isDefaultImport);
        conversion.setIsDefaultSale(isDefaultSale);

        conversion = productUnitConversionRepository.save(conversion);

        logActivity(household, user, "UPDATE_UNIT_CONVERSION", conversion.getId(), oldLogMap, buildConversionLogMap(conversion));

        boolean movementExists = hasStockMovement(productId, household.getId());
        return mapToResponse(conversion, product, movementExists);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteUnitConversion(String currentUsername, String productId, String conversionId) {
        User user = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        getProductBelongingToHousehold(productId, household.getId());

        ProductUnitConversion conversion = productUnitConversionRepository.findByIdAndProductId(conversionId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.UNIT_CONVERSION_NOT_FOUND));

        // Check if this conversion is referenced by any receipt, order item, or price tier
        if (goodsReceiptDetailRepository.existsByUnitConversionId(conversionId) ||
            orderItemRepository.existsByUnitConversionId(conversionId) ||
            (productPriceTierRepository != null && productPriceTierRepository.existsByUnitConversionId(conversionId))) {
            throw new AppException(ErrorCode.CANNOT_DELETE_CONVERSION_IN_USE);
        }

        Map<String, Object> oldLogMap = buildConversionLogMap(conversion);
        productUnitConversionRepository.delete(conversion);

        logActivity(household, user, "DELETE_UNIT_CONVERSION", conversionId, oldLogMap, null);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasStockMovement(String productId, String householdId) {
        if (goodsReceiptDetailRepository.hasStockMovementByProduct(productId, householdId)) {
            return true;
        }
        if (orderItemRepository.hasStockMovementByProduct(productId, householdId)) {
            return true;
        }
        if (returnTicketItemRepository != null && returnTicketItemRepository.hasStockMovementByProduct(productId, householdId)) {
            return true;
        }
        if (inventoryAuditDetailRepository != null && inventoryAuditDetailRepository.hasStockMovementByProduct(productId, householdId)) {
            return true;
        }
        return false;
    }

    private void validateConversionFactor(BigDecimal factor) {
        if (factor == null || factor.compareTo(BigDecimal.ZERO) <= 0 || factor.compareTo(BigDecimal.ONE) == 0) {
            throw new AppException(ErrorCode.INVALID_CONVERSION_FACTOR);
        }
    }

    private void validateBarcodeUniqueness(String householdId, String barcode, String excludeConversionId) {
        if (productRepository.existsByHouseholdIdAndBarcodeAndDeletedAtIsNull(householdId, barcode)) {
            throw new AppException(ErrorCode.BARCODE_ALREADY_EXISTS);
        }
        if (productUnitConversionRepository.existsByHouseholdIdAndBarcodeAndIdNot(householdId, barcode, excludeConversionId)) {
            throw new AppException(ErrorCode.BARCODE_ALREADY_EXISTS);
        }
    }

    private void clearExistingDefaultImport(String productId, String excludeId) {
        List<ProductUnitConversion> defaults = productUnitConversionRepository.findByProductIdAndIsDefaultImportTrue(productId);
        for (ProductUnitConversion c : defaults) {
            if (excludeId == null || !c.getId().equals(excludeId)) {
                c.setIsDefaultImport(false);
                productUnitConversionRepository.save(c);
            }
        }
    }

    private void clearExistingDefaultSale(String productId, String excludeId) {
        List<ProductUnitConversion> defaults = productUnitConversionRepository.findByProductIdAndIsDefaultSaleTrue(productId);
        for (ProductUnitConversion c : defaults) {
            if (excludeId == null || !c.getId().equals(excludeId)) {
                c.setIsDefaultSale(false);
                productUnitConversionRepository.save(c);
            }
        }
    }

    private ProductUnitConversionResponse mapToResponse(ProductUnitConversion conversion, Product product, boolean hasStockMovement) {
        return ProductUnitConversionResponse.builder()
                .id(conversion.getId())
                .productId(product.getId())
                .productName(product.getName())
                .baseUnit(product.getUnit())
                .unitName(conversion.getUnitName())
                .conversionFactor(conversion.getConversionFactor())
                .price(conversion.getPrice())
                .barcode(conversion.getBarcode())
                .isDefaultImport(conversion.getIsDefaultImport())
                .isDefaultSale(conversion.getIsDefaultSale())
                .hasStockMovement(hasStockMovement)
                .createdAt(conversion.getCreatedAt())
                .updatedAt(conversion.getUpdatedAt())
                .build();
    }

    private Map<String, Object> buildConversionLogMap(ProductUnitConversion conversion) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", conversion.getId());
        map.put("productId", conversion.getProduct() != null ? conversion.getProduct().getId() : null);
        map.put("unitName", conversion.getUnitName());
        map.put("conversionFactor", conversion.getConversionFactor());
        map.put("price", conversion.getPrice());
        map.put("barcode", conversion.getBarcode());
        map.put("isDefaultImport", conversion.getIsDefaultImport());
        map.put("isDefaultSale", conversion.getIsDefaultSale());
        return map;
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        if (activityLogHelper == null) return;
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "product_unit_conversions", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for unit conversion", e);
        }
    }
}
