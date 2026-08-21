package com.sales.service.classes;

import com.sales.dto.request.AutoApplyPromotionRequest;
import com.sales.dto.request.OrderItemPromotionCheckRequest;
import com.sales.dto.response.AutoApplyPromotionResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.entity.Product;
import com.sales.entity.Promotion;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ProductRepository;
import com.sales.repository.PromotionRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.PromotionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private boolean isStoreOwner(User user) {
        return user != null && user.getRole() != null && "VT-01".equals(user.getRole().getCode());
    }

    @Override
    @Transactional(readOnly = true)
    public AutoApplyPromotionResponse autoApplyPromotions(String username, AutoApplyPromotionRequest request) {
        User currentUser = getAuthenticatedUser(username);
        String householdId = currentUser.getHousehold().getId();
        LocalDateTime now = LocalDateTime.now();

        List<Promotion> activePromotions = promotionRepository.findActivePromotionsAtTime(householdId, now);

        List<PromotionItemResultResponse> itemResults = new ArrayList<>();
        BigDecimal totalOriginalAmount = BigDecimal.ZERO;
        BigDecimal totalDiscountAmount = BigDecimal.ZERO;
        BigDecimal totalFinalAmount = BigDecimal.ZERO;

        for (OrderItemPromotionCheckRequest itemReq : request.getItems()) {
            PromotionItemResultResponse result = calculateItemWithPromotions(
                    currentUser,
                    itemReq.getProductId(),
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
            Boolean bypassPromotion,
            String requestedPromotionId
    ) {
        String householdId = user.getHousehold().getId();
        LocalDateTime now = LocalDateTime.now();
        List<Promotion> activePromotions = promotionRepository.findActivePromotionsAtTime(householdId, now);

        return calculateItemWithPromotions(user, productId, quantity, unitPrice, bypassPromotion, activePromotions);
    }

    private PromotionItemResultResponse calculateItemWithPromotions(
            User user,
            String productId,
            BigDecimal quantity,
            BigDecimal requestedUnitPrice,
            Boolean bypassPromotion,
            List<Promotion> activePromotions
    ) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        BigDecimal effectiveUnitPrice = requestedUnitPrice != null && requestedUnitPrice.compareTo(BigDecimal.ZERO) >= 0
                ? requestedUnitPrice
                : product.getPrice();

        BigDecimal originalSubtotal = effectiveUnitPrice.multiply(quantity).setScale(2, RoundingMode.HALF_UP);

        // Kiểm tra kịch bản TC-04: Nhân viên muốn bỏ khuyến mại -> Chặn và báo lỗi
        if (Boolean.TRUE.equals(bypassPromotion)) {
            if (!isStoreOwner(user)) {
                log.warn("User {} with role {} attempted to bypass promotion without store owner permission",
                        user.getUsername(), user.getRole().getCode());
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
        if ("ALL".equalsIgnoreCase(promo.getApplyScope())) {
            return true;
        }

        if ("PRODUCT".equalsIgnoreCase(promo.getApplyScope())) {
            return promo.getPromotionProducts() != null &&
                   promo.getPromotionProducts().stream()
                           .anyMatch(pp -> pp.getProduct() != null && pp.getProduct().getId().equals(product.getId()));
        }

        if ("PRODUCT_GROUP".equalsIgnoreCase(promo.getApplyScope())) {
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

        if ("PERCENTAGE".equalsIgnoreCase(promo.getDiscountType())) {
            discountPerUnit = unitPrice.multiply(promo.getDiscountValue())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        } else if ("FIXED_AMOUNT".equalsIgnoreCase(promo.getDiscountType()) || "CASH".equalsIgnoreCase(promo.getDiscountType())) {
            discountPerUnit = unitPrice.min(promo.getDiscountValue());
        }

        return discountPerUnit.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
    }

    @lombok.Value
    private static class PromotionCandidate {
        Promotion promotion;
        BigDecimal lineDiscount;
    }
}
