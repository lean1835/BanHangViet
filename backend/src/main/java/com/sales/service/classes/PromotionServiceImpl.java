package com.sales.service.classes;

import com.sales.constant.DiscountType;
import com.sales.constant.PromotionApplyScope;
import com.sales.constant.PromotionStatus;
import com.sales.dto.request.AutoApplyPromotionRequest;
import com.sales.dto.request.OrderItemPromotionCheckRequest;
import com.sales.dto.request.PromotionCreateRequest;
import com.sales.dto.request.PromotionSearchParam;
import com.sales.dto.request.PromotionUpdateRequest;
import com.sales.dto.response.AutoApplyPromotionResponse;
import com.sales.dto.response.PromotionDetailResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.dto.response.PromotionProductStatResponse;
import com.sales.dto.response.PromotionReportResponse;
import com.sales.dto.response.PromotionResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.PromotionService;
import com.sales.specification.PromotionSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final PromotionProductGroupRepository promotionProductGroupRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductGroupRepository productGroupRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PromotionResponse createPromotion(String currentUsername, PromotionCreateRequest request) {
        User user = getCurrentUser(currentUsername);
        String householdId = user.getHousehold().getId();

        validatePromotionDates(request.getStartDate(), request.getEndDate());
        validateDiscountValue(request.getDiscountType(), request.getDiscountValue());

        if (promotionRepository.existsByHouseholdIdAndNameAndDeletedAtIsNull(householdId, request.getName().trim())) {
            throw new AppException(ErrorCode.PROMOTION_NAME_EXISTS);
        }

        Promotion promotion = Promotion.builder()
                .household(user.getHousehold())
                .name(request.getName().trim())
                .description(request.getDescription() != null ? request.getDescription().trim() : null)
                .discountType(request.getDiscountType())
                .discountValue(request.getDiscountValue())
                .applyScope(request.getApplyScope())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(PromotionStatus.ACTIVE)
                .createdByUser(user)
                .build();

        attachTargets(promotion, householdId, request.getApplyScope(), request.getProductIds(), request.getProductGroupIds());

        Promotion savedPromotion = promotionRepository.save(promotion);

        return mapToResponse(savedPromotion);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PromotionResponse updatePromotion(String currentUsername, String promotionId, PromotionUpdateRequest request) {
        User user = getCurrentUser(currentUsername);
        String householdId = user.getHousehold().getId();

        Promotion promotion = promotionRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(promotionId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_FOUND));

        validatePromotionDates(request.getStartDate(), request.getEndDate());
        validateDiscountValue(request.getDiscountType(), request.getDiscountValue());

        if (promotionRepository.existsByHouseholdIdAndNameAndIdNotAndDeletedAtIsNull(householdId, request.getName().trim(), promotionId)) {
            throw new AppException(ErrorCode.PROMOTION_NAME_EXISTS);
        }

        promotion.setName(request.getName().trim());
        promotion.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        promotion.setDiscountType(request.getDiscountType());
        promotion.setDiscountValue(request.getDiscountValue());
        promotion.setApplyScope(request.getApplyScope());
        promotion.setStartDate(request.getStartDate());
        promotion.setEndDate(request.getEndDate());

        if (request.getStatus() != null) {
            promotion.setStatus(request.getStatus());
        }

        // Clear existing mappings (handled cleanly via JPA orphanRemoval)
        promotion.getPromotionProducts().clear();
        promotion.getPromotionProductGroups().clear();

        attachTargets(promotion, householdId, request.getApplyScope(), request.getProductIds(), request.getProductGroupIds());

        Promotion updatedPromotion = promotionRepository.save(promotion);

        return mapToResponse(updatedPromotion);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePromotion(String currentUsername, String promotionId) {
        User user = getCurrentUser(currentUsername);
        String householdId = user.getHousehold().getId();

        Promotion promotion = promotionRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(promotionId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_FOUND));

        promotion.setDeletedAt(LocalDateTime.now());
        promotionRepository.save(promotion);
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionDetailResponse getPromotionById(String currentUsername, String promotionId) {
        User user = getCurrentUser(currentUsername);
        String householdId = user.getHousehold().getId();

        Promotion promotion = promotionRepository.findDetailByIdAndHouseholdId(promotionId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_FOUND));

        List<PromotionDetailResponse.ProductSummary> products = promotion.getPromotionProducts().stream()
                .map(pp -> PromotionDetailResponse.ProductSummary.builder()
                        .id(pp.getProduct().getId())
                        .sku(pp.getProduct().getSku())
                        .name(pp.getProduct().getName())
                        .price(pp.getProduct().getPrice())
                        .build())
                .collect(Collectors.toList());

        List<PromotionDetailResponse.ProductGroupSummary> productGroups = promotion.getPromotionProductGroups().stream()
                .map(pg -> PromotionDetailResponse.ProductGroupSummary.builder()
                        .id(pg.getProductGroup().getId())
                        .name(pg.getProductGroup().getName())
                        .build())
                .collect(Collectors.toList());

        return PromotionDetailResponse.builder()
                .id(promotion.getId())
                .name(promotion.getName())
                .description(promotion.getDescription())
                .discountType(promotion.getDiscountType())
                .discountValue(promotion.getDiscountValue())
                .applyScope(promotion.getApplyScope())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .status(promotion.getStatus())
                .calculatedState(calculateState(promotion))
                .createdByUserId(promotion.getCreatedByUser() != null ? promotion.getCreatedByUser().getId() : null)
                .createdByUserName(promotion.getCreatedByUser() != null ? promotion.getCreatedByUser().getFullName() : null)
                .createdAt(promotion.getCreatedAt())
                .updatedAt(promotion.getUpdatedAt())
                .products(products)
                .productGroups(productGroups)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionReportResponse getPromotionReport(String currentUsername, String promotionId) {
        User user = getCurrentUser(currentUsername);
        String householdId = user.getHousehold().getId();

        Promotion promotion = promotionRepository.findDetailByIdAndHouseholdId(promotionId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_FOUND));

        OrderItemRepository.PromotionMetricsProjection metrics = orderItemRepository.getPromotionMetrics(promotionId);
        Long totalOrdersCount = (metrics != null && metrics.getTotalOrdersCount() != null) ? metrics.getTotalOrdersCount() : 0L;
        BigDecimal totalQuantitySold = (metrics != null && metrics.getTotalQuantitySold() != null) ? metrics.getTotalQuantitySold() : BigDecimal.ZERO;
        BigDecimal promotionRevenue = (metrics != null && metrics.getPromotionRevenue() != null) ? metrics.getPromotionRevenue() : BigDecimal.ZERO;
        BigDecimal totalDiscountAmount = (metrics != null && metrics.getTotalDiscountAmount() != null) ? metrics.getTotalDiscountAmount() : BigDecimal.ZERO;

        if (totalOrdersCount == 0 || promotionRevenue.compareTo(BigDecimal.ZERO) == 0) {
            return PromotionReportResponse.builder()
                    .promotionId(promotion.getId())
                    .promotionName(promotion.getName())
                    .description(promotion.getDescription())
                    .discountType(promotion.getDiscountType())
                    .discountValue(promotion.getDiscountValue())
                    .applyScope(promotion.getApplyScope())
                    .startDate(promotion.getStartDate())
                    .endDate(promotion.getEndDate())
                    .status(promotion.getStatus())
                    .calculatedState(calculateState(promotion))
                    .hasData(false)
                    .message("Chưa có giao dịch trong đợt khuyến mại này")
                    .totalOrdersCount(0L)
                    .totalQuantitySold(BigDecimal.ZERO)
                    .promotionRevenue(BigDecimal.ZERO)
                    .totalDiscountAmount(BigDecimal.ZERO)
                    .baselineRevenue(BigDecimal.ZERO)
                    .incrementalRevenue(BigDecimal.ZERO)
                    .netResult(BigDecimal.ZERO)
                    .productStats(Collections.emptyList())
                    .build();
        }

        List<OrderItemRepository.PromotionProductStatProjection> rawStats = orderItemRepository.getPromotionProductStats(promotionId);
        List<PromotionProductStatResponse> productStats = rawStats.stream()
                .map(s -> PromotionProductStatResponse.builder()
                        .productId(s.getProductId())
                        .productName(s.getProductName())
                        .quantitySold(s.getQuantitySold())
                        .revenue(s.getRevenue())
                        .discountAmount(s.getDiscountAmount())
                        .build())
                .collect(Collectors.toList());

        LocalDateTime promoStart = promotion.getStartDate();
        LocalDateTime promoEnd = promotion.getEndDate();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime effectiveEnd = promoEnd.isAfter(now) ? now : promoEnd;
        long durationInSeconds = java.time.Duration.between(promoStart, effectiveEnd).getSeconds();
        if (durationInSeconds <= 0) {
            durationInSeconds = 86400;
        }

        LocalDateTime baselineStart = promoStart.minusSeconds(durationInSeconds);
        LocalDateTime baselineEnd = promoStart;

        BigDecimal baselineRevenue = BigDecimal.ZERO;
        if (promotion.getApplyScope() == PromotionApplyScope.ALL) {
            baselineRevenue = orderItemRepository.getBaselineRevenueForAll(householdId, baselineStart, baselineEnd);
        } else {
            List<String> productIds = new ArrayList<>();
            if (promotion.getPromotionProducts() != null && !promotion.getPromotionProducts().isEmpty()) {
                productIds.addAll(promotion.getPromotionProducts().stream()
                        .map(pp -> pp.getProduct().getId())
                        .collect(Collectors.toList()));
            }
            if (promotion.getPromotionProductGroups() != null && !promotion.getPromotionProductGroups().isEmpty()) {
                List<String> groupIds = promotion.getPromotionProductGroups().stream()
                        .map(pg -> pg.getProductGroup().getId())
                        .collect(Collectors.toList());
                if (!groupIds.isEmpty()) {
                    List<String> groupProductIds = productRepository.findProductIdsByGroupIdInAndDeletedAtIsNull(groupIds);
                    for (String gpid : groupProductIds) {
                        if (!productIds.contains(gpid)) {
                            productIds.add(gpid);
                        }
                    }
                }
            }
            if (!productIds.isEmpty()) {
                baselineRevenue = orderItemRepository.getBaselineRevenueForProducts(householdId, productIds, baselineStart, baselineEnd);
            }
        }
        if (baselineRevenue == null) {
            baselineRevenue = BigDecimal.ZERO;
        }

        BigDecimal incrementalRevenue = promotionRevenue.subtract(baselineRevenue);
        BigDecimal netResult = incrementalRevenue.subtract(totalDiscountAmount);

        return PromotionReportResponse.builder()
                .promotionId(promotion.getId())
                .promotionName(promotion.getName())
                .description(promotion.getDescription())
                .discountType(promotion.getDiscountType())
                .discountValue(promotion.getDiscountValue())
                .applyScope(promotion.getApplyScope())
                .startDate(promotion.getStartDate())
                .endDate(promotion.getEndDate())
                .status(promotion.getStatus())
                .calculatedState(calculateState(promotion))
                .hasData(true)
                .message("Lấy báo cáo hiệu quả khuyến mại thành công")
                .totalOrdersCount(totalOrdersCount)
                .totalQuantitySold(totalQuantitySold)
                .promotionRevenue(promotionRevenue)
                .totalDiscountAmount(totalDiscountAmount)
                .baselineStartDate(baselineStart)
                .baselineEndDate(baselineEnd)
                .baselineRevenue(baselineRevenue)
                .incrementalRevenue(incrementalRevenue)
                .netResult(netResult)
                .productStats(productStats)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PromotionResponse> getPromotions(String currentUsername, PromotionSearchParam param, Pageable pageable) {
        User user = getCurrentUser(currentUsername);
        String householdId = user.getHousehold().getId();

        return promotionRepository.findAll(PromotionSpecification.filterPromotions(householdId, param), pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PromotionResponse togglePromotionStatus(String currentUsername, String promotionId) {
        User user = getCurrentUser(currentUsername);
        String householdId = user.getHousehold().getId();

        Promotion promotion = promotionRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(promotionId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PROMOTION_NOT_FOUND));

        if (promotion.getStatus() == PromotionStatus.ACTIVE) {
            promotion.setStatus(PromotionStatus.INACTIVE);
        } else {
            promotion.setStatus(PromotionStatus.ACTIVE);
        }

        Promotion saved = promotionRepository.save(promotion);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AutoApplyPromotionResponse autoApplyPromotions(String username, AutoApplyPromotionRequest request) {
        User currentUser = getCurrentUser(username);
        String householdId = currentUser.getHousehold().getId();
        LocalDateTime now = LocalDateTime.now();

        List<Promotion> activePromotions = promotionRepository.findActivePromotionsAtTime(householdId, now);

        List<String> productIds = request.getItems() != null
                ? request.getItems().stream()
                        .map(OrderItemPromotionCheckRequest::getProductId)
                        .filter(id -> id != null && !id.trim().isEmpty())
                        .distinct()
                        .collect(Collectors.toList())
                : Collections.emptyList();

        Map<String, Product> productMap = productIds.isEmpty()
                ? Collections.emptyMap()
                : productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(productIds, householdId)
                        .stream()
                        .collect(Collectors.toMap(Product::getId, java.util.function.Function.identity(), (p1, p2) -> p1));

        List<PromotionItemResultResponse> itemResults = new ArrayList<>();
        BigDecimal totalOriginalAmount = BigDecimal.ZERO;
        BigDecimal totalDiscountAmount = BigDecimal.ZERO;
        BigDecimal totalFinalAmount = BigDecimal.ZERO;

        for (OrderItemPromotionCheckRequest itemReq : request.getItems()) {
            Product product = productMap.get(itemReq.getProductId());
            if (product == null) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }

            PromotionItemResultResponse result = calculateItemWithProduct(
                    currentUser,
                    product,
                    itemReq.getQuantity(),
                    itemReq.getUnitPrice(),
                    itemReq.getBypassPromotion(),
                    activePromotions
            );

            itemResults.add(result);
            totalOriginalAmount = totalOriginalAmount.add(result.getOriginalSubtotal());
            totalDiscountAmount = totalDiscountAmount.add(result.getDiscountAmount());
            totalFinalAmount = totalFinalAmount.add(result.getFinalSubtotal());
        }

        return AutoApplyPromotionResponse.builder()
                .items(itemResults)
                .totalOriginalAmount(totalOriginalAmount)
                .totalDiscountAmount(totalDiscountAmount)
                .totalFinalAmount(totalFinalAmount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionItemResultResponse calculateItemPromotion(
            User user,
            String productId,
            BigDecimal quantity,
            BigDecimal unitPrice,
            Boolean bypassPromotion
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
        return calculateItemPromotion(user, product, quantity, unitPrice, bypassPromotion);
    }

    @Override
    @Transactional(readOnly = true)
    public PromotionItemResultResponse calculateItemPromotion(
            User user,
            Product product,
            BigDecimal quantity,
            BigDecimal unitPrice,
            Boolean bypassPromotion
    ) {
        String householdId = user.getHousehold().getId();
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> activePromotions = promotionRepository.findActivePromotionsAtTime(householdId, now);

        return calculateItemWithProduct(user, product, quantity, unitPrice, bypassPromotion, activePromotions);
    }

    private PromotionItemResultResponse calculateItemWithProduct(
            User user,
            Product product,
            BigDecimal quantity,
            BigDecimal requestedUnitPrice,
            Boolean bypassPromotion,
            List<Promotion> activePromotions
    ) {

        BigDecimal effectiveUnitPrice = requestedUnitPrice != null && requestedUnitPrice.compareTo(BigDecimal.ZERO) >= 0
                ? requestedUnitPrice
                : product.getPrice();

        BigDecimal originalSubtotal = effectiveUnitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);

        // Kiểm tra kịch bản TC-04: Nhân viên muốn bỏ khuyến mại -> Chặn và báo lỗi
        if (Boolean.TRUE.equals(bypassPromotion)) {
            if (!isStoreOwner(user)) {
                log.warn("User {} with role {} attempted to bypass promotion without store owner permission",
                        user.getUsername(), user.getRole() != null ? user.getRole().getCode() : "UNKNOWN");
                throw new AppException(ErrorCode.PROMOTION_REMOVE_REQUIRES_OWNER);
            }
            return PromotionItemResultResponse.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .quantity(quantity)
                    .unitPrice(effectiveUnitPrice)
                    .originalSubtotal(originalSubtotal)
                    .discountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .finalSubtotal(originalSubtotal)
                    .promotionId(null)
                    .promotionName(null)
                    .hasPromotion(false)
                    .bypassPromotion(true)
                    .build();
        }

        // Lọc danh sách các đợt khuyến mại thỏa mãn scope với sản phẩm
        List<PromotionCandidate> candidates = new ArrayList<>();

        for (Promotion promo : activePromotions) {
            if (isPromotionApplicableToProduct(promo, product)) {
                BigDecimal lineDiscount = calculateLineDiscount(promo, effectiveUnitPrice, quantity);
                candidates.add(new PromotionCandidate(promo, lineDiscount));
            }
        }

        // TC-02: Nếu không có đợt khuyến mại nào thỏa mãn/đang hiệu lực -> bán giá gốc
        if (candidates.isEmpty()) {
            return PromotionItemResultResponse.builder()
                    .productId(product.getId())
                    .productName(product.getName())
                    .quantity(quantity)
                    .unitPrice(effectiveUnitPrice)
                    .originalSubtotal(originalSubtotal)
                    .discountAmount(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .finalSubtotal(originalSubtotal)
                    .promotionId(null)
                    .promotionName(null)
                    .hasPromotion(false)
                    .bypassPromotion(false)
                    .build();
        }

        // TC-03 & QTN-26: Áp dụng đúng 1 chương trình có lợi nhất cho khách (mức giảm tiền cao nhất)
        candidates.sort(Comparator
                .comparing(PromotionCandidate::getLineDiscount).reversed()
                .thenComparing(c -> c.getPromotion().getEndDate()));

        PromotionCandidate bestCandidate = candidates.get(0);
        Promotion bestPromo = bestCandidate.getPromotion();
        BigDecimal bestDiscountAmount = bestCandidate.getLineDiscount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalSubtotal = originalSubtotal.subtract(bestDiscountAmount).max(BigDecimal.ZERO);

        return PromotionItemResultResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .quantity(quantity)
                .unitPrice(effectiveUnitPrice)
                .originalSubtotal(originalSubtotal)
                .discountAmount(bestDiscountAmount)
                .finalSubtotal(finalSubtotal)
                .promotionId(bestPromo.getId())
                .promotionName(bestPromo.getName())
                .hasPromotion(true)
                .bypassPromotion(false)
                .build();
    }

    private boolean isPromotionApplicableToProduct(Promotion promo, Product product) {
        if (promo.getApplyScope() == PromotionApplyScope.ALL) {
            return true;
        }

        if (promo.getApplyScope() == PromotionApplyScope.PRODUCT) {
            return promo.getPromotionProducts() != null &&
                   promo.getPromotionProducts().stream()
                           .anyMatch(pp -> pp.getProduct() != null && pp.getProduct().getId().equals(product.getId()));
        }

        if (promo.getApplyScope() == PromotionApplyScope.PRODUCT_GROUP) {
            if (product.getGroup() == null) {
                return false;
            }
            return promo.getPromotionProductGroups() != null &&
                   promo.getPromotionProductGroups().stream()
                           .anyMatch(ppg -> ppg.getProductGroup() != null && ppg.getProductGroup().getId().equals(product.getGroup().getId()));
        }

        return false;
    }

    private BigDecimal calculateLineDiscount(Promotion promo, BigDecimal unitPrice, BigDecimal quantity) {
        if (unitPrice == null || quantity == null || promo.getDiscountValue() == null) {
            return BigDecimal.ZERO;
        }

        BigDecimal discountPerUnit = BigDecimal.ZERO;

        if (promo.getDiscountType() == DiscountType.PERCENTAGE) {
            discountPerUnit = unitPrice.multiply(promo.getDiscountValue())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        } else if (promo.getDiscountType() == DiscountType.FIXED_AMOUNT || promo.getDiscountType() == DiscountType.CASH) {
            discountPerUnit = unitPrice.min(promo.getDiscountValue());
        }

        return discountPerUnit.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
    }

    private boolean isStoreOwner(User user) {
        return user != null && user.getRole() != null &&
                ("VT-01".equals(user.getRole().getCode()) || "OWNER".equalsIgnoreCase(user.getRole().getCode()));
    }

    private User getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }
        return user;
    }

    private void validatePromotionDates(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null || endDate == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        if (endDate.isBefore(startDate) || endDate.isEqual(startDate)) {
            throw new AppException(ErrorCode.INVALID_PROMOTION_DATE);
        }
    }

    private void validateDiscountValue(DiscountType discountType, BigDecimal discountValue) {
        if (discountType == null || discountValue == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        if (discountValue.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_PROMOTION_DISCOUNT_VALUE);
        }
        if (discountType == DiscountType.PERCENTAGE && discountValue.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new AppException(ErrorCode.INVALID_PROMOTION_DISCOUNT_VALUE);
        }
    }

    private void attachTargets(Promotion promotion, String householdId, PromotionApplyScope applyScope, List<String> productIds, List<String> productGroupIds) {
        if (applyScope == PromotionApplyScope.PRODUCT) {
            if (productIds == null || productIds.isEmpty()) {
                throw new AppException(ErrorCode.PROMOTION_TARGET_REQUIRED);
            }
            List<Product> products = productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(productIds, householdId);
            if (products.size() != productIds.size()) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }
            Set<PromotionProduct> promoProducts = products.stream()
                    .map(prod -> PromotionProduct.builder()
                            .promotion(promotion)
                            .product(prod)
                            .build())
                    .collect(Collectors.toSet());
            promotion.getPromotionProducts().addAll(promoProducts);
        } else if (applyScope == PromotionApplyScope.PRODUCT_GROUP) {
            if (productGroupIds == null || productGroupIds.isEmpty()) {
                throw new AppException(ErrorCode.PROMOTION_TARGET_REQUIRED);
            }
            List<ProductGroup> groups = productGroupRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(productGroupIds, householdId);
            if (groups.size() != productGroupIds.size()) {
                throw new AppException(ErrorCode.PRODUCT_GROUP_NOT_FOUND);
            }
            Set<PromotionProductGroup> promoGroups = groups.stream()
                    .map(group -> PromotionProductGroup.builder()
                            .promotion(promotion)
                            .productGroup(group)
                            .build())
                    .collect(Collectors.toSet());
            promotion.getPromotionProductGroups().addAll(promoGroups);
        }
    }

    private PromotionResponse mapToResponse(Promotion p) {
        int productCount = p.getPromotionProducts() != null ? p.getPromotionProducts().size() : 0;
        int groupCount = p.getPromotionProductGroups() != null ? p.getPromotionProductGroups().size() : 0;

        return PromotionResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .applyScope(p.getApplyScope())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .status(p.getStatus())
                .calculatedState(calculateState(p))
                .createdByUserName(p.getCreatedByUser() != null ? p.getCreatedByUser().getFullName() : null)
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .totalProductsCount(productCount)
                .totalProductGroupsCount(groupCount)
                .build();
    }

    private String calculateState(Promotion p) {
        if (p.getStatus() == PromotionStatus.INACTIVE) {
            return "INACTIVE";
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(p.getStartDate())) {
            return "UPCOMING";
        } else if (now.isAfter(p.getEndDate())) {
            return "EXPIRED";
        } else {
            return "ACTIVE";
        }
    }

    @lombok.Value
    private static class PromotionCandidate {
        Promotion promotion;
        BigDecimal lineDiscount;
    }
}
