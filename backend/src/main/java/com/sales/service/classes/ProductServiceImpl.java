package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateProductRequest;
import com.sales.dto.request.UpdateProductRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.ProductResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.ProductService;
import com.sales.specification.ProductSpecification;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductGroupRepository productGroupRepository;
    private final TaxRateRepository taxRateRepository;
    private final PosInventoryRepository posInventoryRepository;
    private final PosTransferItemRepository posTransferItemRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "products", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for product", e);
        }
    }

    private Map<String, Object> buildProductLogMap(Product product) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", product.getId());
        map.put("sku", product.getSku());
        map.put("barcode", product.getBarcode());
        map.put("name", product.getName());
        map.put("unit", product.getUnit());
        map.put("price", product.getPrice());
        map.put("stockQuantity", product.getStockQuantity());
        map.put("minStockQuantity", product.getMinStockQuantity());
        map.put("status", product.getStatus());
        map.put("groupId", product.getGroup() != null ? product.getGroup().getId() : null);
        map.put("taxRateId", product.getTaxRate() != null ? product.getTaxRate().getId() : null);
        return map;
    }

    private ProductResponse mapToResponse(Product product) {
        String householdId = product.getHousehold() != null ? product.getHousehold().getId() : null;
        List<PosInventory> posInvs = (householdId != null && posInventoryRepository != null)
                ? posInventoryRepository.findByHouseholdIdAndProductId(householdId, product.getId())
                : Collections.emptyList();

        BigDecimal inTransit = (householdId != null && posTransferItemRepository != null)
                ? posTransferItemRepository.sumInTransitFromWarehouseByProductId(householdId, product.getId())
                : BigDecimal.ZERO;

        return mapToResponse(product, posInvs, inTransit);
    }

    private ProductResponse mapToResponse(Product product, List<PosInventory> posInvs, BigDecimal inTransit) {
        return mapToResponse(product, posInvs, inTransit, null);
    }

    private ProductResponse mapToResponse(Product product, List<PosInventory> posInvs, BigDecimal inTransit, User currentUser) {
        BigDecimal totalStock = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
        BigDecimal allocatedStock = posInvs != null
                ? posInvs.stream()
                        .map(pi -> pi.getStockQuantity() != null ? pi.getStockQuantity() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                : BigDecimal.ZERO;

        BigDecimal safeInTransit = inTransit != null ? inTransit : BigDecimal.ZERO;
        BigDecimal warehouseStock = totalStock.subtract(allocatedStock).subtract(safeInTransit).max(BigDecimal.ZERO);

        List<com.sales.dto.response.PosStockBreakdownResponse> posStocks = posInvs != null
                ? posInvs.stream()
                        .map(pi -> com.sales.dto.response.PosStockBreakdownResponse.builder()
                                .posId(pi.getPointOfSale() != null ? pi.getPointOfSale().getId() : null)
                                .posCode(pi.getPointOfSale() != null ? pi.getPointOfSale().getPosCode() : null)
                                .posName(pi.getPointOfSale() != null ? pi.getPointOfSale().getName() : null)
                                .stockQuantity(pi.getStockQuantity())
                                .minStockQuantity(pi.getMinStockQuantity())
                                .build())
                        .collect(Collectors.toList())
                : Collections.emptyList();

        BigDecimal displayedStock = totalStock;
        if (currentUser != null && currentUser.getPointOfSale() != null && "VT-02".equals(currentUser.getRole().getCode())) {
            String userPosId = currentUser.getPointOfSale().getId();
            displayedStock = posInvs != null
                    ? posInvs.stream()
                            .filter(pi -> pi.getPointOfSale() != null && userPosId.equals(pi.getPointOfSale().getId()))
                            .map(pi -> pi.getStockQuantity() != null ? pi.getStockQuantity() : BigDecimal.ZERO)
                            .findFirst()
                            .orElse(BigDecimal.ZERO)
                    : BigDecimal.ZERO;
        }

        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .barcode(product.getBarcode())
                .name(product.getName())
                .unit(product.getUnit())
                .price(product.getPrice())
                .stockQuantity(displayedStock)
                .minStockQuantity(product.getMinStockQuantity())
                .status(product.getStatus())
                .groupId(product.getGroup() != null ? product.getGroup().getId() : null)
                .groupName(product.getGroup() != null ? product.getGroup().getName() : null)
                .taxRateId(product.getTaxRate().getId())
                .taxRateName(product.getTaxRate().getName())
                .taxRatePercentage(product.getTaxRate().getRatePercentage())
                .warehouseStock(warehouseStock)
                .allocatedStock(allocatedStock)
                .posStocks(posStocks)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductResponse createProduct(String currentUsername, CreateProductRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Kiểm tra trùng lặp SKU trong cùng hộ kinh doanh
        if (productRepository.existsBySkuAndHouseholdIdAndDeletedAtIsNull(request.getSku(), household.getId())) {
            throw new AppException(ErrorCode.PRODUCT_SKU_EXISTS);
        }

        if (StringUtils.hasText(request.getBarcode()) && productRepository.existsByHouseholdIdAndBarcodeAndDeletedAtIsNull(household.getId(), request.getBarcode().trim())) {
            throw new AppException(ErrorCode.BARCODE_ALREADY_EXISTS);
        }

        // Xác thực thuế suất đang hoạt động thuộc hộ kinh doanh
        TaxRate taxRate = taxRateRepository.findByIdAndHouseholdIdAndIsActiveTrue(request.getTaxRateId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_RATE_NOT_FOUND));

        // Xác thực nhóm sản phẩm thuộc hộ kinh doanh nếu được cung cấp
        ProductGroup group = null;
        if (StringUtils.hasText(request.getGroupId())) {
            group = productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getGroupId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_GROUP_NOT_FOUND));
        }

        Product product = Product.builder()
                .household(household)
                .group(group)
                .taxRate(taxRate)
                .sku(request.getSku())
                .barcode(StringUtils.hasText(request.getBarcode()) ? request.getBarcode().trim() : null)
                .name(request.getName())
                .unit(request.getUnit())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .minStockQuantity(request.getMinStockQuantity() != null ? request.getMinStockQuantity() : java.math.BigDecimal.ZERO)
                .status(request.getStatus())
                .build();

        product = productRepository.save(product);

        logActivity(household, currentUser, "CREATE_PRODUCT", product.getId(), null, buildProductLogMap(product));

        return mapToResponse(product);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductResponse updateProduct(String currentUsername, String productId, UpdateProductRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Kiểm tra SKU trùng lặp (ngoại trừ sản phẩm đang sửa)
        if (productRepository.existsBySkuAndHouseholdIdAndIdNotAndDeletedAtIsNull(request.getSku(), household.getId(), productId)) {
            throw new AppException(ErrorCode.PRODUCT_SKU_EXISTS);
        }

        if (StringUtils.hasText(request.getBarcode()) && productRepository.existsByHouseholdIdAndBarcodeAndIdNotAndDeletedAtIsNull(household.getId(), request.getBarcode().trim(), productId)) {
            throw new AppException(ErrorCode.BARCODE_ALREADY_EXISTS);
        }

        // Xác thực thuế suất đang hoạt động thuộc hộ kinh doanh
        TaxRate taxRate = taxRateRepository.findByIdAndHouseholdIdAndIsActiveTrue(request.getTaxRateId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.TAX_RATE_NOT_FOUND));

        // Xác thực nhóm sản phẩm thuộc hộ kinh doanh nếu được cung cấp
        ProductGroup group = null;
        if (StringUtils.hasText(request.getGroupId())) {
            group = productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getGroupId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_GROUP_NOT_FOUND));
        }

        Map<String, Object> oldValue = buildProductLogMap(product);

        product.setSku(request.getSku());
        if (request.getBarcode() != null) {
            if (StringUtils.hasText(request.getBarcode())) {
                product.setBarcode(request.getBarcode().trim());
            } else {
                product.setBarcode(null);
            }
        }
        product.setName(request.getName());
        product.setUnit(request.getUnit());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
        if (request.getMinStockQuantity() != null) {
            product.setMinStockQuantity(request.getMinStockQuantity());
        }
        product.setStatus(request.getStatus());
        product.setGroup(group);
        product.setTaxRate(taxRate);

        product = productRepository.save(product);

        logActivity(household, currentUser, "UPDATE_PRODUCT", product.getId(), oldValue, buildProductLogMap(product));

        return mapToResponse(product);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteProduct(String currentUsername, String productId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        Map<String, Object> oldValue = buildProductLogMap(product);

        // Soft delete
        product.setDeletedAt(LocalDateTime.now());
        product.setStatus("INACTIVE"); // Cập nhật trạng thái ngừng bán khi bị xóa
        productRepository.save(product);

        logActivity(household, currentUser, "DELETE_PRODUCT", product.getId(), oldValue, buildProductLogMap(product));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductResponse getProductById(String currentUsername, String productId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        List<PosInventory> posInvs = (household.getId() != null && posInventoryRepository != null)
                ? posInventoryRepository.findByHouseholdIdAndProductId(household.getId(), product.getId())
                : Collections.emptyList();

        BigDecimal inTransit = (household.getId() != null && posTransferItemRepository != null)
                ? posTransferItemRepository.sumInTransitFromWarehouseByProductId(household.getId(), product.getId())
                : BigDecimal.ZERO;

        return mapToResponse(product, posInvs, inTransit, currentUser);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(String currentUsername, String search, String groupId, String status, Boolean excludeInactive, String stockFilter, int page, int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Specification<Product> spec = ProductSpecification.filterProducts(household.getId(), search, groupId, status, excludeInactive, stockFilter);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        List<Product> products = productPage.getContent();

        List<String> productIds = products.stream().map(Product::getId).collect(Collectors.toList());
        Map<String, List<PosInventory>> posInvsByProduct = new HashMap<>();
        Map<String, BigDecimal> inTransitByProduct = new HashMap<>();

        if (!productIds.isEmpty()) {
            List<PosInventory> allPosInvs = posInventoryRepository.findByHouseholdIdAndProductIdIn(household.getId(), productIds);
            for (PosInventory pi : allPosInvs) {
                if (pi.getProduct() != null) {
                    posInvsByProduct.computeIfAbsent(pi.getProduct().getId(), k -> new ArrayList<>()).add(pi);
                }
            }

            List<Object[]> inTransitRows = posTransferItemRepository.sumInTransitFromWarehouseByProductIds(household.getId(), productIds);
            for (Object[] row : inTransitRows) {
                inTransitByProduct.put((String) row[0], (BigDecimal) row[1]);
            }
        }

        List<ProductResponse> content = products.stream()
                .map(p -> mapToResponse(p, posInvsByProduct.getOrDefault(p.getId(), Collections.emptyList()), inTransitByProduct.getOrDefault(p.getId(), BigDecimal.ZERO), currentUser))
                .collect(Collectors.toList());

        return PageResponse.<ProductResponse>builder()
                .content(content)
                .pageNumber(productPage.getNumber())
                .pageSize(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> voiceSearchProducts(String currentUsername, String query, String groupId, int limit) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        int effectiveLimit = limit > 0 ? Math.min(limit, 50) : 10;
        Specification<Product> spec = ProductSpecification.filterVoiceSearch(household.getId(), query, groupId);
        Pageable pageable = PageRequest.of(0, effectiveLimit, Sort.by(Sort.Direction.ASC, "name"));

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        List<Product> products = productPage.getContent();

        List<String> productIds = products.stream().map(Product::getId).collect(Collectors.toList());
        Map<String, List<PosInventory>> posInvsByProduct = new HashMap<>();
        Map<String, BigDecimal> inTransitByProduct = new HashMap<>();

        if (!productIds.isEmpty()) {
            List<PosInventory> allPosInvs = posInventoryRepository.findByHouseholdIdAndProductIdIn(household.getId(), productIds);
            for (PosInventory pi : allPosInvs) {
                if (pi.getProduct() != null) {
                    posInvsByProduct.computeIfAbsent(pi.getProduct().getId(), k -> new ArrayList<>()).add(pi);
                }
            }

            List<Object[]> inTransitRows = posTransferItemRepository.sumInTransitFromWarehouseByProductIds(household.getId(), productIds);
            for (Object[] row : inTransitRows) {
                inTransitByProduct.put((String) row[0], (BigDecimal) row[1]);
            }
        }

        return products.stream()
                .map(p -> mapToResponse(p, posInvsByProduct.getOrDefault(p.getId(), Collections.emptyList()), inTransitByProduct.getOrDefault(p.getId(), BigDecimal.ZERO), currentUser))
                .collect(Collectors.toList());
    }
}
