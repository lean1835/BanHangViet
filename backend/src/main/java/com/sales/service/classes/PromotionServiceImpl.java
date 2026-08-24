package com.sales.service.classes;

import com.sales.constant.DiscountType;
import com.sales.constant.PromotionApplyScope;
import com.sales.constant.PromotionStatus;
import com.sales.dto.request.PromotionCreateRequest;
import com.sales.dto.request.PromotionSearchParam;
import com.sales.dto.request.PromotionUpdateRequest;
import com.sales.dto.response.PromotionDetailResponse;
import com.sales.dto.response.PromotionResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.PromotionService;
import com.sales.specification.PromotionSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromotionServiceImpl implements PromotionService {

    private final PromotionRepository promotionRepository;
    private final PromotionProductRepository promotionProductRepository;
    private final PromotionProductGroupRepository promotionProductGroupRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductGroupRepository productGroupRepository;

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
}
