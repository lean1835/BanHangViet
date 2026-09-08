package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.BatchSavePriceTiersRequest;
import com.sales.dto.request.CreatePriceTierRequest;
import com.sales.dto.request.UpdatePriceTierRequest;
import com.sales.dto.response.PricingDecision;
import com.sales.dto.response.ProductPriceTierResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.dto.response.ResolveTierPriceResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.GoodsReceiptDetailRepository;
import com.sales.repository.ProductPriceTierRepository;
import com.sales.repository.ProductRepository;
import com.sales.repository.ProductUnitConversionRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.ProductPriceTierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductPriceTierServiceImpl implements ProductPriceTierService {

    private final ProductPriceTierRepository productPriceTierRepository;
    private final ProductRepository productRepository;
    private final ProductUnitConversionRepository productUnitConversionRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ProductPriceTierResponse> getProductPriceTiers(String currentUsername, String productId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = getHousehold(currentUser);

        Product product = getProduct(productId, household.getId());
        BigDecimal baseCostPrice = resolveCostPrice(product, household.getId());

        List<ProductPriceTier> tiers = productPriceTierRepository
                .findByProductIdAndHouseholdIdOrderByMinQuantityAsc(productId, household.getId());

        return tiers.stream()
                .map(tier -> mapToResponse(tier, product, baseCostPrice))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductPriceTierResponse createPriceTier(String currentUsername, String productId, CreatePriceTierRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = getHousehold(currentUser);

        Product product = getProduct(productId, household.getId());

        ProductUnitConversion conversion = null;
        if (StringUtils.hasText(request.getUnitConversionId())) {
            conversion = productUnitConversionRepository.findByIdAndProductId(request.getUnitConversionId(), product.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRICE_TIER_UNIT_CONVERSION_MISMATCH));
        }

        BigDecimal costPrice = resolveEffectiveCostPrice(product, conversion, household.getId());

        // Validate basic ranges
        validateTierRanges(request.getMinQuantity(), request.getMaxQuantity(), request.getPrice());

        // Validate overlapping with existing active tiers for the same unit
        List<ProductPriceTier> existingTiers = getExistingTiersForUnit(product.getId(), household.getId(), conversion);
        validateNoOverlap(existingTiers, null, request.getMinQuantity(), request.getMaxQuantity(), request.getIsActive());

        // Validate below cost warning (AC-03 & QTN-23)
        checkBelowCostWarning(request.getPrice(), costPrice, request.getConfirmBelowCost());

        ProductPriceTier tier = ProductPriceTier.builder()
                .household(household)
                .product(product)
                .unitConversion(conversion)
                .tierName(request.getTierName().trim())
                .minQuantity(request.getMinQuantity())
                .maxQuantity(request.getMaxQuantity())
                .price(request.getPrice())
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .build();

        ProductPriceTier saved = productPriceTierRepository.save(tier);

        boolean isBelowCost = costPrice.compareTo(BigDecimal.ZERO) > 0 && saved.getPrice().compareTo(costPrice) < 0;
        String action = isBelowCost ? "CREATE_PRICE_TIER_BELOW_COST" : "CREATE_PRICE_TIER";
        logActivity(household, currentUser, action, saved.getId(), null, buildTierLogMap(saved, costPrice, isBelowCost));

        return mapToResponse(saved, product, costPrice);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductPriceTierResponse updatePriceTier(String currentUsername, String productId, String tierId, UpdatePriceTierRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = getHousehold(currentUser);

        Product product = getProduct(productId, household.getId());
        ProductPriceTier tier = productPriceTierRepository.findByIdAndHouseholdId(tierId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRICE_TIER_NOT_FOUND));

        if (!tier.getProduct().getId().equals(product.getId())) {
            throw new AppException(ErrorCode.PRICE_TIER_NOT_FOUND);
        }

        ProductUnitConversion conversion = null;
        if (StringUtils.hasText(request.getUnitConversionId())) {
            conversion = productUnitConversionRepository.findByIdAndProductId(request.getUnitConversionId(), product.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRICE_TIER_UNIT_CONVERSION_MISMATCH));
        }

        BigDecimal costPrice = resolveEffectiveCostPrice(product, conversion, household.getId());

        // Validate basic ranges
        validateTierRanges(request.getMinQuantity(), request.getMaxQuantity(), request.getPrice());

        // Validate overlapping
        List<ProductPriceTier> existingTiers = getExistingTiersForUnit(product.getId(), household.getId(), conversion);
        validateNoOverlap(existingTiers, tier.getId(), request.getMinQuantity(), request.getMaxQuantity(), request.getIsActive());

        // Validate below cost warning (AC-03 & QTN-23)
        checkBelowCostWarning(request.getPrice(), costPrice, request.getConfirmBelowCost());

        Map<String, Object> oldLogMap = buildTierLogMap(tier, costPrice, costPrice.compareTo(BigDecimal.ZERO) > 0 && tier.getPrice().compareTo(costPrice) < 0);

        tier.setTierName(request.getTierName().trim());
        tier.setMinQuantity(request.getMinQuantity());
        tier.setMaxQuantity(request.getMaxQuantity());
        tier.setPrice(request.getPrice());
        tier.setUnitConversion(conversion);
        if (request.getIsActive() != null) {
            tier.setIsActive(request.getIsActive());
        }

        ProductPriceTier updated = productPriceTierRepository.save(tier);

        boolean isBelowCost = costPrice.compareTo(BigDecimal.ZERO) > 0 && updated.getPrice().compareTo(costPrice) < 0;
        logActivity(household, currentUser, "UPDATE_PRICE_TIER", updated.getId(), oldLogMap, buildTierLogMap(updated, costPrice, isBelowCost));

        return mapToResponse(updated, product, costPrice);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deletePriceTier(String currentUsername, String productId, String tierId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = getHousehold(currentUser);

        Product product = getProduct(productId, household.getId());
        ProductPriceTier tier = productPriceTierRepository.findByIdAndHouseholdId(tierId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRICE_TIER_NOT_FOUND));

        if (!tier.getProduct().getId().equals(product.getId())) {
            throw new AppException(ErrorCode.PRICE_TIER_NOT_FOUND);
        }

        Map<String, Object> oldLogMap = buildTierLogMap(tier, BigDecimal.ZERO, false);
        productPriceTierRepository.delete(tier);

        logActivity(household, currentUser, "DELETE_PRICE_TIER", tierId, oldLogMap, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<ProductPriceTierResponse> batchSavePriceTiers(String currentUsername, String productId, BatchSavePriceTiersRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = getHousehold(currentUser);

        Product product = getProduct(productId, household.getId());

        List<CreatePriceTierRequest> tierRequests = request.getTiers();
        if (tierRequests == null || tierRequests.isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        // Cache conversions for product
        List<ProductUnitConversion> conversions = productUnitConversionRepository.findByProductId(product.getId());
        Map<String, ProductUnitConversion> conversionMap = conversions.stream()
                .collect(Collectors.toMap(ProductUnitConversion::getId, c -> c));

        BigDecimal baseCostPrice = resolveCostPrice(product, household.getId());

        // 1. Validate each tier and cross-validate overlapping within the batch
        Map<String, List<CreatePriceTierRequest>> groupedByUnit = new HashMap<>();
        for (CreatePriceTierRequest tr : tierRequests) {
            validateTierRanges(tr.getMinQuantity(), tr.getMaxQuantity(), tr.getPrice());

            ProductUnitConversion conv = null;
            if (StringUtils.hasText(tr.getUnitConversionId())) {
                conv = conversionMap.get(tr.getUnitConversionId());
                if (conv == null) {
                    throw new AppException(ErrorCode.PRICE_TIER_UNIT_CONVERSION_MISMATCH);
                }
            }

            BigDecimal costPrice = calculateCostForConversion(baseCostPrice, conv);
            checkBelowCostWarning(tr.getPrice(), costPrice, request.getConfirmBelowCost());

            String unitKey = conv != null ? conv.getId() : "BASE";
            groupedByUnit.computeIfAbsent(unitKey, k -> new ArrayList<>()).add(tr);
        }

        // Validate overlap inside each unit group
        for (List<CreatePriceTierRequest> groupList : groupedByUnit.values()) {
            List<CreatePriceTierRequest> activeInGroup = groupList.stream()
                    .filter(t -> t.getIsActive() == null || Boolean.TRUE.equals(t.getIsActive()))
                    .collect(Collectors.toList());

            for (int i = 0; i < activeInGroup.size(); i++) {
                for (int j = i + 1; j < activeInGroup.size(); j++) {
                    CreatePriceTierRequest t1 = activeInGroup.get(i);
                    CreatePriceTierRequest t2 = activeInGroup.get(j);
                    if (isIntervalOverlapping(t1.getMinQuantity(), t1.getMaxQuantity(), t2.getMinQuantity(), t2.getMaxQuantity())) {
                        throw new AppException(ErrorCode.PRICE_TIER_OVERLAPPING_QUANTITY);
                    }
                }
            }
        }

        // 2. Remove old tiers and save new tiers
        productPriceTierRepository.deleteByProductIdAndHouseholdId(product.getId(), household.getId());

        List<ProductPriceTier> entitiesToSave = new ArrayList<>();
        for (CreatePriceTierRequest tr : tierRequests) {
            ProductUnitConversion conv = StringUtils.hasText(tr.getUnitConversionId())
                    ? conversionMap.get(tr.getUnitConversionId())
                    : null;

            entitiesToSave.add(ProductPriceTier.builder()
                    .household(household)
                    .product(product)
                    .unitConversion(conv)
                    .tierName(tr.getTierName().trim())
                    .minQuantity(tr.getMinQuantity())
                    .maxQuantity(tr.getMaxQuantity())
                    .price(tr.getPrice())
                    .isActive(tr.getIsActive() != null ? tr.getIsActive() : true)
                    .build());
        }

        List<ProductPriceTier> savedEntities = productPriceTierRepository.saveAll(entitiesToSave);

        logActivity(household, currentUser, "BATCH_SAVE_PRICE_TIERS", product.getId(), null,
                Map.of("productId", product.getId(), "tierCount", savedEntities.size()));

        return savedEntities.stream()
                .map(tier -> {
                    BigDecimal cost = calculateCostForConversion(baseCostPrice, tier.getUnitConversion());
                    return mapToResponse(tier, product, cost);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ResolveTierPriceResponse resolveTierPrice(String currentUsername, String productId, BigDecimal quantity, String unitConversionId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = getHousehold(currentUser);

        Product product = getProduct(productId, household.getId());

        ProductUnitConversion conversion = null;
        if (StringUtils.hasText(unitConversionId)) {
            conversion = productUnitConversionRepository.findByIdAndProductId(unitConversionId, product.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.PRICE_TIER_UNIT_CONVERSION_MISMATCH));
        }

        BigDecimal baseRetailPrice = (conversion != null && conversion.getPrice() != null)
                ? conversion.getPrice()
                : (conversion != null ? product.getPrice().multiply(conversion.getConversionFactor()) : product.getPrice());

        BigDecimal costPrice = resolveEffectiveCostPrice(product, conversion, household.getId());

        ProductPriceTier matchedTier = matchPriceTier(household.getId(), product, quantity, unitConversionId);

        BigDecimal appliedUnitPrice = matchedTier != null ? matchedTier.getPrice() : baseRetailPrice;
        String matchedTierId = matchedTier != null ? matchedTier.getId() : null;
        String matchedTierName = matchedTier != null ? matchedTier.getTierName() : null;

        BigDecimal savingAmountPerUnit = baseRetailPrice.subtract(appliedUnitPrice).max(BigDecimal.ZERO);
        BigDecimal totalSavingAmount = savingAmountPerUnit.multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        boolean isBelowCost = costPrice.compareTo(BigDecimal.ZERO) > 0 && appliedUnitPrice.compareTo(costPrice) < 0;

        return ResolveTierPriceResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .quantity(quantity)
                .baseRetailPrice(baseRetailPrice)
                .matchedTierId(matchedTierId)
                .matchedTierName(matchedTierName)
                .appliedUnitPrice(appliedUnitPrice)
                .costPrice(costPrice)
                .isBelowCost(isBelowCost)
                .savingAmountPerUnit(savingAmountPerUnit)
                .totalSavingAmount(totalSavingAmount)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductPriceTier matchPriceTier(String householdId, Product product, BigDecimal quantity, String unitConversionId) {
        if (product == null || quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        List<ProductPriceTier> activeTiers = productPriceTierRepository
                .findByProductIdAndHouseholdIdAndIsActiveTrueOrderByMinQuantityAsc(product.getId(), householdId);

        if (activeTiers.isEmpty()) {
            return null;
        }

        // Filter for matching unit
        List<ProductPriceTier> filteredTiers = activeTiers.stream()
                .filter(t -> {
                    if (StringUtils.hasText(unitConversionId)) {
                        return t.getUnitConversion() != null && unitConversionId.equals(t.getUnitConversion().getId());
                    } else {
                        return t.getUnitConversion() == null;
                    }
                })
                .collect(Collectors.toList());

        // Find tier with minQuantity <= quantity && (maxQuantity == null || quantity <= maxQuantity)
        // With highest minQuantity
        return filteredTiers.stream()
                .filter(t -> quantity.compareTo(t.getMinQuantity()) >= 0)
                .filter(t -> t.getMaxQuantity() == null || quantity.compareTo(t.getMaxQuantity()) <= 0)
                .max(Comparator.comparing(ProductPriceTier::getMinQuantity))
                .orElse(null);
    }

    @Override
    public PricingDecision resolvePricingDecision(
            BigDecimal regularUnitPrice,
            ProductPriceTier matchedTier,
            PromotionItemResultResponse promoResult,
            BigDecimal quantity
    ) {
        BigDecimal tierUnitPrice = (matchedTier != null && matchedTier.getPrice() != null)
                ? matchedTier.getPrice()
                : regularUnitPrice;

        BigDecimal tierSaving = BigDecimal.ZERO;
        if (matchedTier != null && regularUnitPrice.compareTo(tierUnitPrice) > 0) {
            tierSaving = regularUnitPrice.subtract(tierUnitPrice).multiply(quantity).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal promoDiscount = (promoResult != null && promoResult.getDiscountAmount() != null)
                ? promoResult.getDiscountAmount().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // QTN-26: Best deal for customer
        if (promoDiscount.compareTo(BigDecimal.ZERO) > 0 && promoDiscount.compareTo(tierSaving) > 0) {
            // Promotion NCL-15 gives a strictly better benefit than price tier
            Promotion promoEntity = null;
            return PricingDecision.builder()
                    .unitPrice(regularUnitPrice)
                    .discountAmount(promoDiscount)
                    .priceTier(null)
                    .priceTierName(null)
                    .promotion(promoEntity)
                    .promotionName(promoResult != null ? promoResult.getPromotionName() : null)
                    .build();
        } else if (matchedTier != null) {
            // Price tier applies (better than or equal to promotion, or standard retail tier AC TC-02)
            return PricingDecision.builder()
                    .unitPrice(tierUnitPrice)
                    .discountAmount(BigDecimal.ZERO)
                    .priceTier(matchedTier)
                    .priceTierName(matchedTier.getTierName())
                    .promotion(null)
                    .promotionName(null)
                    .build();
        } else {
            // Regular retail price without tier or promotion
            return PricingDecision.builder()
                    .unitPrice(regularUnitPrice)
                    .discountAmount(BigDecimal.ZERO)
                    .priceTier(null)
                    .priceTierName(null)
                    .promotion(null)
                    .promotionName(null)
                    .build();
        }
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private BusinessHousehold getHousehold(User user) {
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return user.getHousehold();
    }

    private Product getProduct(String productId, String householdId) {
        return productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(productId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));
    }

    private void validateTierRanges(BigDecimal minQuantity, BigDecimal maxQuantity, BigDecimal price) {
        if (minQuantity == null || minQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.PRICE_TIER_MIN_QUANTITY_INVALID);
        }
        if (maxQuantity != null && maxQuantity.compareTo(minQuantity) < 0) {
            throw new AppException(ErrorCode.PRICE_TIER_INVALID_QUANTITY_RANGE);
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.PRICE_TIER_PRICE_NEGATIVE);
        }
    }

    private List<ProductPriceTier> getExistingTiersForUnit(String productId, String householdId, ProductUnitConversion conversion) {
        List<ProductPriceTier> allTiers = productPriceTierRepository
                .findByProductIdAndHouseholdIdOrderByMinQuantityAsc(productId, householdId);

        return allTiers.stream()
                .filter(t -> {
                    if (conversion != null) {
                        return t.getUnitConversion() != null && conversion.getId().equals(t.getUnitConversion().getId());
                    } else {
                        return t.getUnitConversion() == null;
                    }
                })
                .collect(Collectors.toList());
    }

    private void validateNoOverlap(List<ProductPriceTier> existingTiers, String updatingTierId,
                                  BigDecimal newMin, BigDecimal newMax, Boolean isActive) {
        if (isActive != null && !isActive) {
            return;
        }

        for (ProductPriceTier t : existingTiers) {
            if (updatingTierId != null && updatingTierId.equals(t.getId())) {
                continue;
            }
            if (!Boolean.TRUE.equals(t.getIsActive())) {
                continue;
            }

            if (isIntervalOverlapping(newMin, newMax, t.getMinQuantity(), t.getMaxQuantity())) {
                throw new AppException(ErrorCode.PRICE_TIER_OVERLAPPING_QUANTITY);
            }
        }
    }

    private boolean isIntervalOverlapping(BigDecimal min1, BigDecimal max1, BigDecimal min2, BigDecimal max2) {
        boolean noOverlap = (max1 != null && max1.compareTo(min2) < 0)
                || (max2 != null && max2.compareTo(min1) < 0);
        return !noOverlap;
    }

    public BigDecimal resolveCostPrice(Product product, String householdId) {
        if (product == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        try {
            BigDecimal avgCost = goodsReceiptDetailRepository.calculateWeightedAverageCostPrice(product.getId(), householdId);
            if (avgCost != null && avgCost.compareTo(BigDecimal.ZERO) > 0) {
                return avgCost.setScale(2, RoundingMode.HALF_UP);
            }
        } catch (Exception e) {
            log.warn("Could not query weighted average cost for product {}: {}", product.getId(), e.getMessage());
        }

        if (product.getCostPrice() != null && product.getCostPrice().compareTo(BigDecimal.ZERO) > 0) {
            return product.getCostPrice().setScale(2, RoundingMode.HALF_UP);
        }

        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveEffectiveCostPrice(Product product, ProductUnitConversion conversion, String householdId) {
        BigDecimal baseCost = resolveCostPrice(product, householdId);
        return calculateCostForConversion(baseCost, conversion);
    }

    private BigDecimal calculateCostForConversion(BigDecimal baseCost, ProductUnitConversion conversion) {
        if (baseCost == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        if (conversion == null || conversion.getConversionFactor() == null) {
            return baseCost.setScale(2, RoundingMode.HALF_UP);
        }
        return baseCost.multiply(conversion.getConversionFactor()).setScale(2, RoundingMode.HALF_UP);
    }

    private void checkBelowCostWarning(BigDecimal price, BigDecimal costPrice, Boolean confirmBelowCost) {
        if (costPrice != null && costPrice.compareTo(BigDecimal.ZERO) > 0) {
            if (price.compareTo(costPrice) < 0) {
                if (!Boolean.TRUE.equals(confirmBelowCost)) {
                    throw new AppException(ErrorCode.PRICE_TIER_BELOW_COST_CONFIRMATION_REQUIRED);
                }
            }
        }
    }

    private ProductPriceTierResponse mapToResponse(ProductPriceTier tier, Product product, BigDecimal costPrice) {
        boolean isBelowCost = costPrice != null && costPrice.compareTo(BigDecimal.ZERO) > 0 && tier.getPrice().compareTo(costPrice) < 0;

        String unitName = product.getUnit();
        String unitConversionId = null;
        if (tier.getUnitConversion() != null) {
            unitConversionId = tier.getUnitConversion().getId();
            unitName = tier.getUnitConversion().getUnitName();
        }

        return ProductPriceTierResponse.builder()
                .id(tier.getId())
                .productId(product.getId())
                .productName(product.getName())
                .unitConversionId(unitConversionId)
                .unitName(unitName)
                .tierName(tier.getTierName())
                .minQuantity(tier.getMinQuantity())
                .maxQuantity(tier.getMaxQuantity())
                .price(tier.getPrice())
                .isActive(tier.getIsActive())
                .costPrice(costPrice)
                .isBelowCost(isBelowCost)
                .createdAt(tier.getCreatedAt())
                .updatedAt(tier.getUpdatedAt())
                .build();
    }

    private Map<String, Object> buildTierLogMap(ProductPriceTier tier, BigDecimal costPrice, boolean isBelowCost) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", tier.getId());
        map.put("tierName", tier.getTierName());
        map.put("minQuantity", tier.getMinQuantity());
        map.put("maxQuantity", tier.getMaxQuantity());
        map.put("price", tier.getPrice());
        map.put("costPrice", costPrice);
        map.put("isBelowCost", isBelowCost);
        map.put("unitConversionId", tier.getUnitConversion() != null ? tier.getUnitConversion().getId() : null);
        map.put("isActive", tier.getIsActive());
        return map;
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;
            activityLogHelper.logActivityInNewTransaction(household, actor, action, "product_price_tiers", targetId, oldStr, newStr, null, null);
        } catch (Exception e) {
            log.warn("Could not log activity for product_price_tiers: {}", e.getMessage());
        }
    }
}
