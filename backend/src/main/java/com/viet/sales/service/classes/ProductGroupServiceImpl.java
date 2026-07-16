package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateProductGroupRequest;
import com.viet.sales.dto.request.UpdateProductGroupRequest;
import com.viet.sales.dto.response.ProductGroupDetailResponse;
import com.viet.sales.dto.response.ProductGroupResponse;
import com.viet.sales.dto.response.ProductResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.ProductGroupRepository;
import com.viet.sales.repository.ProductRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.ProductGroupService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductGroupServiceImpl implements ProductGroupService {

    private final UserRepository userRepository;
    private final ProductGroupRepository productGroupRepository;
    private final ProductRepository productRepository;
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
                    .targetTable("product_groups")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to write activity log for product group", e);
        }
    }

    private Map<String, Object> buildProductGroupLogMap(ProductGroup group, List<String> productIds) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", group.getId());
        map.put("name", group.getName());
        map.put("householdId", group.getHousehold() != null ? group.getHousehold().getId() : null);
        map.put("productIds", productIds);
        return map;
    }

    private ProductGroupResponse mapToResponse(ProductGroup group) {
        return ProductGroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .householdId(group.getHousehold().getId())
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

    private ProductResponse mapProductToResponse(Product product) {
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
    @PreAuthorize("hasRole('VT-01')")
    public ProductGroupResponse createProductGroup(String currentUsername, CreateProductGroupRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Kiểm tra trùng tên nhóm hàng trong cùng một hộ kinh doanh
        if (productGroupRepository.existsByHouseholdIdAndNameAndDeletedAtIsNull(household.getId(), request.getName())) {
            throw new AppException(ErrorCode.PRODUCT_GROUP_ALREADY_EXISTS);
        }

        ProductGroup group = ProductGroup.builder()
                .household(household)
                .name(request.getName())
                .build();

        group = productGroupRepository.save(group);

        List<String> associatedProductIds = new ArrayList<>();
        if (request.getProductIds() != null && !request.getProductIds().isEmpty()) {
            for (String prodId : request.getProductIds()) {
                Product prod = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(prodId, household.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
                prod.setGroup(group);
                productRepository.save(prod);
                associatedProductIds.add(prodId);
            }
        }

        logActivity(household, currentUser, "CREATE_PRODUCT_GROUP", group.getId(), null, buildProductGroupLogMap(group, associatedProductIds));

        return mapToResponse(group);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @PreAuthorize("hasRole('VT-01')")
    public ProductGroupResponse updateProductGroup(String currentUsername, String id, UpdateProductGroupRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        ProductGroup group = productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_GROUP_NOT_FOUND));

        // Kiểm tra trùng tên với các nhóm hàng khác của cùng hộ
        if (productGroupRepository.existsByHouseholdIdAndNameAndIdNotAndDeletedAtIsNull(household.getId(), request.getName(), id)) {
            throw new AppException(ErrorCode.PRODUCT_GROUP_ALREADY_EXISTS);
        }

        List<Product> currentProducts = productRepository.findByGroupIdAndDeletedAtIsNull(id);
        List<String> oldProductIds = currentProducts.stream().map(Product::getId).collect(Collectors.toList());
        Map<String, Object> oldLogMap = buildProductGroupLogMap(group, oldProductIds);

        group.setName(request.getName());
        group = productGroupRepository.save(group);

        List<String> newProductIds = request.getProductIds() != null ? request.getProductIds() : new ArrayList<>();

        // Gỡ liên kết các sản phẩm không còn nằm trong danh sách mới
        for (Product prod : currentProducts) {
            if (!newProductIds.contains(prod.getId())) {
                prod.setGroup(null);
                productRepository.save(prod);
            }
        }

        // Gán nhóm cho các sản phẩm mới
        for (String prodId : newProductIds) {
            Product prod = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(prodId, household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
            prod.setGroup(group);
            productRepository.save(prod);
        }

        logActivity(household, currentUser, "UPDATE_PRODUCT_GROUP", group.getId(), oldLogMap, buildProductGroupLogMap(group, newProductIds));

        return mapToResponse(group);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    @PreAuthorize("hasRole('VT-01')")
    public void deleteProductGroup(String currentUsername, String id) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        ProductGroup group = productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_GROUP_NOT_FOUND));

        List<Product> currentProducts = productRepository.findByGroupIdAndDeletedAtIsNull(id);
        List<String> oldProductIds = currentProducts.stream().map(Product::getId).collect(Collectors.toList());
        Map<String, Object> oldLogMap = buildProductGroupLogMap(group, oldProductIds);

        // Gỡ liên kết tất cả các sản phẩm đang thuộc nhóm này
        for (Product prod : currentProducts) {
            prod.setGroup(null);
            productRepository.save(prod);
        }

        // Thực hiện xóa mềm nhóm hàng
        group.setDeletedAt(LocalDateTime.now());
        productGroupRepository.save(group);

        logActivity(household, currentUser, "DELETE_PRODUCT_GROUP", group.getId(), oldLogMap, null);
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public List<ProductGroupResponse> getAllProductGroups(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        List<ProductGroup> groups = productGroupRepository.findByHouseholdIdAndDeletedAtIsNull(household.getId());
        return groups.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ProductGroupDetailResponse getProductGroupById(String currentUsername, String id) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        ProductGroup group = productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_GROUP_NOT_FOUND));

        List<Product> products = productRepository.findByGroupIdAndDeletedAtIsNull(id);
        List<ProductResponse> productResponses = products.stream().map(this::mapProductToResponse).collect(Collectors.toList());

        return ProductGroupDetailResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .householdId(group.getHousehold().getId())
                .products(productResponses)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }
}
