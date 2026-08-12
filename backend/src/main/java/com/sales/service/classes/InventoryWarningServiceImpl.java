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
    private final ActivityLogRepository activityLogRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
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
                    .build();

            activityLogRepository.save(logRecord);
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

        List<LowStockWarningResponse> warningList = productPage.getContent().stream()
                .map(product -> {
                    BigDecimal minStock = product.getMinStockQuantity() != null ? product.getMinStockQuantity() : BigDecimal.ZERO;
                    BigDecimal currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
                    BigDecimal shortage = minStock.subtract(currentStock);
                    if (shortage.compareTo(BigDecimal.ZERO) < 0) {
                        shortage = BigDecimal.ZERO;
                    }

                    List<Supplier> suppliers = goodsReceiptDetailRepository.findLatestSupplierByProductId(product.getId(), PageRequest.of(0, 1));
                    Supplier lastSupplier = suppliers.isEmpty() ? null : suppliers.get(0);

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
                            .groupId(product.getGroup() != null ? product.getGroup().getId() : null)
                            .groupName(product.getGroup() != null ? product.getGroup().getName() : null)
                            .lastSupplierId(lastSupplier != null ? lastSupplier.getId() : null)
                            .lastSupplierName(lastSupplier != null ? lastSupplier.getName() : null)
                            .lastSupplierPhone(lastSupplier != null ? lastSupplier.getPhoneNumber() : null)
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
        if (currentUser.getRole() != null && "VT-02".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        int days = (periodDays != null && periodDays > 0) ? periodDays : 28;
        LocalDateTime startDateTime = LocalDateTime.now().minusDays(days);

        List<ProductSalesSummaryProjection> salesSummaries = orderRepository.getProductSalesSummary(household.getId(), startDateTime);
        Map<String, ProductSalesSummaryProjection> salesMap = salesSummaries.stream()
                .collect(Collectors.toMap(ProductSalesSummaryProjection::getProductId, s -> s, (s1, s2) -> s1));

        Specification<Product> spec = (root, query, criteriaBuilder) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("household").get("id"), household.getId()));
            predicates.add(criteriaBuilder.isNull(root.get("deletedAt")));
            predicates.add(criteriaBuilder.equal(root.get("status"), "ACTIVE"));
            if (org.springframework.util.StringUtils.hasText(groupId)) {
                predicates.add(criteriaBuilder.equal(root.get("group").get("id"), groupId));
            }
            return criteriaBuilder.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };

        List<Product> products = productRepository.findAll(spec);

        List<PurchaseSuggestionResponse> suggestions = new ArrayList<>();
        double weeks = days / 7.0;

        for (Product product : products) {
            ProductSalesSummaryProjection summary = salesMap.get(product.getId());

            // NCL-18-CN-002-TC-03: Bỏ qua mặt hàng mới thêm chưa có lịch sử bán
            if (summary == null || summary.getTotalQuantitySold() == null || summary.getTotalQuantitySold().compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            BigDecimal totalSold = summary.getTotalQuantitySold();
            BigDecimal averageWeeklySales = totalSold.divide(BigDecimal.valueOf(weeks), 2, RoundingMode.HALF_UP);
            BigDecimal currentStock = product.getStockQuantity() != null ? product.getStockQuantity() : BigDecimal.ZERO;
            BigDecimal minStock = product.getMinStockQuantity() != null ? product.getMinStockQuantity() : BigDecimal.ZERO;

            // Gợi ý số lượng nên nhập cho kỳ tới: max(0, ceil(averageWeeklySales - currentStock))
            BigDecimal needed = averageWeeklySales.subtract(currentStock);
            BigDecimal suggestedQty = needed.compareTo(BigDecimal.ZERO) > 0 
                    ? needed.setScale(0, RoundingMode.CEILING) 
                    : BigDecimal.ZERO;

            if (suggestedQty.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            boolean hasPromotion = summary.getPromotionCount() != null && summary.getPromotionCount() > 0;
            String promotionWarning = hasPromotion ? "Dữ liệu có đợt khuyến mại trong kỳ, số lượng gợi ý có thể cao hơn nhu cầu thực tế" : null;

            String rationale = String.format("Bán trung bình %s %s/tuần, tồn hiện có %s %s -> Gợi ý nhập %s %s",
                    averageWeeklySales.stripTrailingZeros().toPlainString(),
                    product.getUnit(),
                    currentStock.stripTrailingZeros().toPlainString(),
                    product.getUnit(),
                    suggestedQty.stripTrailingZeros().toPlainString(),
                    product.getUnit());

            suggestions.add(PurchaseSuggestionResponse.builder()
                    .productId(product.getId())
                    .sku(product.getSku())
                    .productName(product.getName())
                    .unit(product.getUnit())
                    .costPrice(product.getCostPrice())
                    .stockQuantity(currentStock)
                    .minStockQuantity(minStock)
                    .averageWeeklySales(averageWeeklySales)
                    .totalSoldInPeriod(totalSold)
                    .suggestedQuantity(suggestedQty)
                    .calculationRationale(rationale)
                    .hasPromotion(hasPromotion)
                    .promotionWarning(promotionWarning)
                    .groupId(product.getGroup() != null ? product.getGroup().getId() : null)
                    .groupName(product.getGroup() != null ? product.getGroup().getName() : null)
                    .build());
        }

        // Sắp xếp theo số lượng gợi ý giảm dần
        suggestions.sort((a, b) -> b.getSuggestedQuantity().compareTo(a.getSuggestedQuantity()));

        int totalElements = suggestions.size();
        int fromIndex = Math.min(page * size, totalElements);
        int toIndex = Math.min(fromIndex + size, totalElements);
        List<PurchaseSuggestionResponse> pageContent = suggestions.subList(fromIndex, toIndex);

        // Populate supplier info only for the paginated page content
        for (PurchaseSuggestionResponse item : pageContent) {
            List<Supplier> suppliers = goodsReceiptDetailRepository.findLatestSupplierByProductId(item.getProductId(), PageRequest.of(0, 1));
            if (!suppliers.isEmpty()) {
                Supplier lastSupplier = suppliers.get(0);
                item.setLastSupplierId(lastSupplier.getId());
                item.setLastSupplierName(lastSupplier.getName());
                item.setLastSupplierPhone(lastSupplier.getPhoneNumber());
            }
        }

        int totalPages = totalElements > 0 ? (int) Math.ceil((double) totalElements / size) : 0;

        return PageResponse.<PurchaseSuggestionResponse>builder()
                .content(pageContent)
                .pageNumber(page)
                .pageSize(size)
                .totalElements(totalElements)
                .totalPages(totalPages)
                .last(page >= totalPages - 1)
                .build();
    }
}
