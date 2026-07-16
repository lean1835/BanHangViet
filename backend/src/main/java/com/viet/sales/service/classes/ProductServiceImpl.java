package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateProductRequest;
import com.viet.sales.dto.request.UpdateProductRequest;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.dto.response.ProductResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.*;
import com.viet.sales.service.interfaces.ProductService;
import com.viet.sales.specification.ProductSpecification;
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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductServiceImpl implements ProductService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductGroupRepository productGroupRepository;
    private final TaxRateRepository taxRateRepository;
    private final ActivityLogRepository activityLogRepository;
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

            ActivityLog logRecord = ActivityLog.builder()
                    .household(household)
                    .user(actor)
                    .action(action)
                    .targetTable("products")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to write activity log for product", e);
        }
    }

    private Map<String, Object> buildProductLogMap(Product product) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", product.getId());
        map.put("sku", product.getSku());
        map.put("name", product.getName());
        map.put("unit", product.getUnit());
        map.put("price", product.getPrice());
        map.put("stockQuantity", product.getStockQuantity());
        map.put("status", product.getStatus());
        map.put("groupId", product.getGroup() != null ? product.getGroup().getId() : null);
        map.put("taxRateId", product.getTaxRate() != null ? product.getTaxRate().getId() : null);
        return map;
    }

    private ProductResponse mapToResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .unit(product.getUnit())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .status(product.getStatus())
                .groupId(product.getGroup() != null ? product.getGroup().getId() : null)
                .groupName(product.getGroup() != null ? product.getGroup().getName() : null)
                .taxRateId(product.getTaxRate().getId())
                .taxRateName(product.getTaxRate().getName())
                .taxRatePercentage(product.getTaxRate().getRatePercentage())
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
                .name(request.getName())
                .unit(request.getUnit())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
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
        product.setName(request.getName());
        product.setUnit(request.getUnit());
        product.setPrice(request.getPrice());
        product.setStockQuantity(request.getStockQuantity());
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

        return mapToResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(String currentUsername, String search, String groupId, String status, Boolean excludeInactive, int page, int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Specification<Product> spec = ProductSpecification.filterProducts(household.getId(), search, groupId, status, excludeInactive);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        List<ProductResponse> content = productPage.getContent().stream()
                .map(this::mapToResponse)
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
}
