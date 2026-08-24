package com.sales.service.classes;

import com.sales.dto.request.UpdateMinStockRequest;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.InventoryWarningService;
import com.sales.specification.ProductSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InventoryWarningServiceImpl implements InventoryWarningService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final OrderRepository orderRepository;
    private final ActivityLogHelper activityLogHelper;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "products", targetId, oldStr, newStr, null, null);
        } catch (Exception e) {
            log.error("Lỗi khi ghi activity log cho min stock", e);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductResponse updateMinStock(String username, String productId, UpdateMinStockRequest request) {
        User currentUser = getAuthenticatedUser(username);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Đảm bảo chỉ Chủ hộ (VT-01) có quyền sửa ngưỡng tồn tối thiểu
        if (currentUser.getRole() == null || !"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        BigDecimal oldMinStock = product.getMinStockQuantity();
        product.setMinStockQuantity(request.getMinStockQuantity());
        productRepository.save(product);

        Map<String, Object> oldMap = new HashMap<>();
        oldMap.put("minStockQuantity", oldMinStock);

        Map<String, Object> newMap = new HashMap<>();
        newMap.put("minStockQuantity", request.getMinStockQuantity());

        logActivity(household, currentUser, "UPDATE_MIN_STOCK", product.getId(), oldMap, newMap);

        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .unit(product.getUnit())
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .minStockQuantity(product.getMinStockQuantity())
                .status(product.getStatus())
                .groupId(product.getGroup() != null ? product.getGroup().getId() : null)
                .groupName(product.getGroup() != null ? product.getGroup().getName() : null)
                .taxRateId(product.getTaxRate() != null ? product.getTaxRate().getId() : null)
                .taxRateName(product.getTaxRate() != null ? product.getTaxRate().getName() : null)
                .taxRatePercentage(product.getTaxRate() != null ? product.getTaxRate().getRatePercentage() : null)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LowStockWarningListResponse getLowStockWarnings(String username, String search, String groupId, int page, int size) {
        User currentUser = getAuthenticatedUser(username);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Specification<Product> spec = ProductSpecification.filterLowStockProducts(household.getId(), search, groupId);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        List<String> productIds = productPage.getContent().stream()
                .map(Product::getId)
                .collect(Collectors.toList());

        Map<String, LatestSupplierProjection> supplierMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            List<LatestSupplierProjection> suppliers = goodsReceiptDetailRepository.findLatestSuppliersByProductIds(productIds);
            for (LatestSupplierProjection s : suppliers) {
                supplierMap.put(s.getProductId(), s);
            }
        }

        List<LowStockWarningResponse> warningList = productPage.getContent().stream()
                .map(product -> {
                    BigDecimal minStock = product.getMinStockQuantity() != null ? product.getMinStockQuantity() : BigDecimal.ZERO;
                    BigDecimal currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
                    BigDecimal shortage = minStock.subtract(currentStock);
                    if (shortage.compareTo(BigDecimal.ZERO) < 0) {
                        shortage = BigDecimal.ZERO;
                    }

                    LatestSupplierProjection lastSupplier = supplierMap.get(product.getId());

                    boolean isGroupActive = product.getGroup() != null && product.getGroup().getDeletedAt() == null;

                    return LowStockWarningResponse.builder()
                            .productId(product.getId())
                            .sku(product.getSku())
                            .productName(product.getName())
                            .unit(product.getUnit())
                            .price(product.getPrice())
                            .costPrice(product.getCostPrice())
                            .stockQuantity(currentStock)
                            .minStockQuantity(minStock)
                            .shortageQuantity(shortage)
                            .groupId(isGroupActive ? product.getGroup().getId() : null)
                            .groupName(isGroupActive ? product.getGroup().getName() : null)
                            .lastSupplierId(lastSupplier != null ? lastSupplier.getSupplierId() : null)
                            .lastSupplierName(lastSupplier != null ? lastSupplier.getSupplierName() : null)
                            .lastSupplierPhone(lastSupplier != null ? lastSupplier.getSupplierPhone() : null)
                            .build();
                })
                .collect(Collectors.toList());

        PageResponse<LowStockWarningResponse> pageResponse = PageResponse.<LowStockWarningResponse>builder()
                .content(warningList)
                .pageNumber(productPage.getNumber())
                .pageSize(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();

        boolean isStockAdequate = productPage.getTotalElements() == 0;
        String message = isStockAdequate ? "Tồn kho đang đầy đủ" : "Có " + productPage.getTotalElements() + " mặt hàng dưới ngưỡng tồn tối thiểu";

        return LowStockWarningListResponse.builder()
                .page(pageResponse)
                .isStockAdequate(isStockAdequate)
                .message(message)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PurchaseSuggestionResponse> getPurchaseSuggestions(String username, Integer periodDays, String groupId, int page, int size) {
        User currentUser = getAuthenticatedUser(username);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Quyết định nhập hàng thuộc Chủ hộ (VT-01). Nhân viên (VT-02) bị chặn (NCL-18-CN-002-TC-04)
        if (currentUser.getRole() == null || !"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        int days = (periodDays != null && periodDays > 0) ? periodDays : 28;
        double periodWeeks = BigDecimal.valueOf(days).divide(BigDecimal.valueOf(7), 4, RoundingMode.HALF_UP).doubleValue();
        LocalDateTime startDateTime = LocalDateTime.now().minusDays(days);

        Pageable pageable = PageRequest.of(page, size);
        Page<PurchaseSuggestionProjection> projectionPage = orderRepository.getPurchaseSuggestions(
                household.getId(), startDateTime, periodWeeks, groupId, pageable);

        List<String> productIds = projectionPage.getContent().stream()
                .map(PurchaseSuggestionProjection::getProductId)
                .collect(Collectors.toList());

        Map<String, LatestSupplierProjection> supplierMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            List<LatestSupplierProjection> suppliers = goodsReceiptDetailRepository.findLatestSuppliersByProductIds(productIds);
            for (LatestSupplierProjection s : suppliers) {
                supplierMap.put(s.getProductId(), s);
            }
        }

        List<PurchaseSuggestionResponse> suggestions = projectionPage.getContent().stream()
                .map(proj -> {
                    BigDecimal averageWeeklySales = proj.getAverageWeeklySales() != null ? proj.getAverageWeeklySales() : BigDecimal.ZERO;
                    BigDecimal currentStock = proj.getStockQuantity() != null ? proj.getStockQuantity() : BigDecimal.ZERO;
                    BigDecimal minStock = proj.getMinStockQuantity() != null ? proj.getMinStockQuantity() : BigDecimal.ZERO;
                    BigDecimal totalSold = proj.getTotalSoldInPeriod() != null ? proj.getTotalSoldInPeriod() : BigDecimal.ZERO;
                    BigDecimal suggestedQty = proj.getSuggestedQuantity() != null ? proj.getSuggestedQuantity() : BigDecimal.ZERO;

                    boolean hasPromotion = proj.getPromotionCount() != null && proj.getPromotionCount() > 0;
                    String promotionWarning = hasPromotion ? "Dữ liệu có đợt khuyến mại trong kỳ, số lượng gợi ý có thể cao hơn nhu cầu thực tế" : null;

                    String unitStr = proj.getUnit() != null ? proj.getUnit() : "";
                    String rationale = String.format("Bán trung bình %s %s/tuần, tồn hiện có %s %s -> Gợi ý nhập %s %s",
                            averageWeeklySales.stripTrailingZeros().toPlainString(),
                            unitStr,
                            currentStock.stripTrailingZeros().toPlainString(),
                            unitStr,
                            suggestedQty.stripTrailingZeros().toPlainString(),
                            unitStr);

                    LatestSupplierProjection lastSupplier = supplierMap.get(proj.getProductId());

                    return PurchaseSuggestionResponse.builder()
                            .productId(proj.getProductId())
                            .sku(proj.getSku())
                            .productName(proj.getProductName())
                            .unit(proj.getUnit())
                            .costPrice(proj.getCostPrice())
                            .stockQuantity(currentStock)
                            .minStockQuantity(minStock)
                            .averageWeeklySales(averageWeeklySales)
                            .totalSoldInPeriod(totalSold)
                            .suggestedQuantity(suggestedQty)
                            .calculationRationale(rationale)
                            .hasPromotion(hasPromotion)
                            .promotionWarning(promotionWarning)
                            .groupId(proj.getGroupId())
                            .groupName(proj.getGroupName())
                            .lastSupplierId(lastSupplier != null ? lastSupplier.getSupplierId() : null)
                            .lastSupplierName(lastSupplier != null ? lastSupplier.getSupplierName() : null)
                            .lastSupplierPhone(lastSupplier != null ? lastSupplier.getSupplierPhone() : null)
                            .build();
                })
                .collect(Collectors.toList());

        return PageResponse.<PurchaseSuggestionResponse>builder()
                .content(suggestions)
                .pageNumber(projectionPage.getNumber())
                .pageSize(projectionPage.getSize())
                .totalElements(projectionPage.getTotalElements())
                .totalPages(projectionPage.getTotalPages())
                .last(projectionPage.isLast())
                .build();
    }
}
