package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AdjustmentType;
import com.sales.constant.BatchStatus;
import com.sales.constant.PriceRoundingMethod;
import com.sales.dto.request.ApplyPriceAdjustmentRequest;
import com.sales.dto.request.PreviewPriceAdjustmentRequest;
import com.sales.dto.request.RevertPriceAdjustmentRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PriceAdjustmentBatchResponse;
import com.sales.dto.response.PriceAdjustmentItemPreviewResponse;
import com.sales.dto.response.PriceAdjustmentPreviewResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.PriceAdjustmentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PriceAdjustmentServiceImpl implements PriceAdjustmentService {

    private final PriceAdjustmentBatchRepository batchRepository;
    private final PriceAdjustmentItemRepository itemRepository;
    private final ProductRepository productRepository;
    private final ProductGroupRepository productGroupRepository;
    private final GoodsReceiptDetailRepository goodsReceiptDetailRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public PriceAdjustmentPreviewResponse previewPriceAdjustment(String username, PreviewPriceAdjustmentRequest request) {
        User user = validateAndGetOwnerUser(username);
        BusinessHousehold household = getHouseholdOrThrow(user);

        validateAdjustmentInput(request.getAdjustmentType(), request.getAdjustmentValue());
        List<Product> products = resolveTargetProducts(household.getId(), request.getTargetGroupId(), request.getProductIds());

        PriceRoundingMethod roundingMethod = request.getRoundingMethod() != null ? request.getRoundingMethod() : PriceRoundingMethod.NONE;

        // Batch query giá vốn theo QTN-23 tránh N+1 Query
        Map<String, BigDecimal> costPriceMap = resolveAverageCostPrices(products, household.getId());

        List<PriceAdjustmentItemPreviewResponse> itemPreviews = new ArrayList<>();
        int increasedCount = 0;
        int decreasedCount = 0;
        int unchangedCount = 0;
        int belowCostCount = 0;

        for (Product product : products) {
            BigDecimal oldPrice = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
            BigDecimal costPrice = costPriceMap.getOrDefault(product.getId(), BigDecimal.ZERO);
            BigDecimal newPrice = calculateNewPrice(oldPrice, costPrice, request.getAdjustmentType(), request.getAdjustmentValue(), roundingMethod);
            BigDecimal priceDiff = newPrice.subtract(oldPrice);
            BigDecimal percentChange = calculatePercentChange(oldPrice, newPrice);
            boolean isBelowCost = checkIsBelowCost(newPrice, costPrice);

            if (priceDiff.compareTo(BigDecimal.ZERO) > 0) {
                increasedCount++;
            } else if (priceDiff.compareTo(BigDecimal.ZERO) < 0) {
                decreasedCount++;
            } else {
                unchangedCount++;
            }

            if (isBelowCost) {
                belowCostCount++;
            }

            itemPreviews.add(PriceAdjustmentItemPreviewResponse.builder()
                    .productId(product.getId())
                    .productSku(product.getSku())
                    .productName(product.getName())
                    .unit(product.getUnit())
                    .groupName(product.getGroup() != null ? product.getGroup().getName() : null)
                    .oldPrice(oldPrice.setScale(2, RoundingMode.HALF_UP))
                    .newPrice(newPrice.setScale(2, RoundingMode.HALF_UP))
                    .priceDifference(priceDiff.setScale(2, RoundingMode.HALF_UP))
                    .percentChange(percentChange)
                    .costPrice(costPrice)
                    .isBelowCost(isBelowCost)
                    .build());
        }

        return PriceAdjustmentPreviewResponse.builder()
                .adjustmentType(request.getAdjustmentType())
                .adjustmentValue(request.getAdjustmentValue())
                .roundingMethod(roundingMethod)
                .totalItems(products.size())
                .increasedItems(increasedCount)
                .decreasedItems(decreasedCount)
                .unchangedItems(unchangedCount)
                .belowCostItems(belowCostCount)
                .items(itemPreviews)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PriceAdjustmentBatchResponse applyPriceAdjustment(String username, ApplyPriceAdjustmentRequest request) {
        User user = validateAndGetOwnerUser(username);
        BusinessHousehold household = getHouseholdOrThrow(user);

        validateAdjustmentInput(request.getAdjustmentType(), request.getAdjustmentValue());
        List<Product> products = resolveTargetProducts(household.getId(), request.getTargetGroupId(), request.getProductIds());

        PriceRoundingMethod roundingMethod = request.getRoundingMethod() != null ? request.getRoundingMethod() : PriceRoundingMethod.NONE;
        String batchCode = generateBatchCode(household.getId());

        PriceAdjustmentBatch batch = PriceAdjustmentBatch.builder()
                .batchCode(batchCode)
                .name(request.getName().trim())
                .householdId(household.getId())
                .adjustmentType(request.getAdjustmentType())
                .adjustmentValue(request.getAdjustmentValue())
                .targetGroupId(request.getTargetGroupId())
                .roundingMethod(roundingMethod)
                .status(BatchStatus.APPLIED)
                .appliedBy(user.getId())
                .appliedAt(LocalDateTime.now())
                .build();

        // Batch query giá vốn theo QTN-23 tránh N+1 Query
        Map<String, BigDecimal> costPriceMap = resolveAverageCostPrices(products, household.getId());

        List<PriceAdjustmentItem> items = new ArrayList<>();
        List<PriceAdjustmentItemPreviewResponse> itemPreviews = new ArrayList<>();
        int belowCostCount = 0;
        LocalDateTime now = LocalDateTime.now();

        for (Product product : products) {
            BigDecimal oldPrice = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
            BigDecimal costPrice = costPriceMap.getOrDefault(product.getId(), BigDecimal.ZERO);
            BigDecimal newPrice = calculateNewPrice(oldPrice, costPrice, request.getAdjustmentType(), request.getAdjustmentValue(), roundingMethod);
            BigDecimal priceDiff = newPrice.subtract(oldPrice);
            BigDecimal percentChange = calculatePercentChange(oldPrice, newPrice);
            boolean isBelowCost = checkIsBelowCost(newPrice, costPrice);

            if (isBelowCost) {
                belowCostCount++;
            }

            PriceAdjustmentItem item = PriceAdjustmentItem.builder()
                    .batch(batch)
                    .product(product)
                    .oldPrice(oldPrice.setScale(2, RoundingMode.HALF_UP))
                    .newPrice(newPrice.setScale(2, RoundingMode.HALF_UP))
                    .priceDifference(priceDiff.setScale(2, RoundingMode.HALF_UP))
                    .costPrice(costPrice)
                    .isBelowCost(isBelowCost)
                    .build();
            items.add(item);

            // Cập nhật giá sản phẩm trong database và managed entity
            product.setPrice(newPrice);
            product.setUpdatedAt(now);
            productRepository.updatePrice(product.getId(), household.getId(), newPrice, now);

            // Ghi nhận ActivityLog cho từng sản phẩm
            logActivity(household, user, "UPDATE_PRICE", product.getId(),
                    Map.of("price", oldPrice), Map.of("price", newPrice, "batchCode", batchCode));

            itemPreviews.add(PriceAdjustmentItemPreviewResponse.builder()
                    .productId(product.getId())
                    .productSku(product.getSku())
                    .productName(product.getName())
                    .unit(product.getUnit())
                    .groupName(product.getGroup() != null ? product.getGroup().getName() : null)
                    .oldPrice(oldPrice.setScale(2, RoundingMode.HALF_UP))
                    .newPrice(newPrice.setScale(2, RoundingMode.HALF_UP))
                    .priceDifference(priceDiff.setScale(2, RoundingMode.HALF_UP))
                    .percentChange(percentChange)
                    .costPrice(costPrice)
                    .isBelowCost(isBelowCost)
                    .build());
        }

        batch.setTotalItems(products.size());
        batch.setBelowCostItems(belowCostCount);
        batch.setItems(items);

        PriceAdjustmentBatch savedBatch = batchRepository.save(batch);

        // Ghi nhận ActivityLog cho đợt đổi giá
        logActivity(household, user, "CREATE_PRICE_ADJUSTMENT_BATCH", savedBatch.getId(),
                null, Map.of("batchCode", batchCode, "totalItems", products.size(), "belowCostItems", belowCostCount));

        String targetGroupName = resolveGroupName(request.getTargetGroupId());

        return mapToBatchResponse(savedBatch, user.getFullName(), null, targetGroupName, itemPreviews);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PriceAdjustmentBatchResponse revertPriceAdjustment(String username, String batchId, RevertPriceAdjustmentRequest request) {
        User user = validateAndGetOwnerUser(username);
        BusinessHousehold household = getHouseholdOrThrow(user);

        if (request.getRevertReason() == null || request.getRevertReason().trim().isEmpty()) {
            throw new AppException(ErrorCode.PRICE_ADJUSTMENT_REVERT_REASON_REQUIRED);
        }

        PriceAdjustmentBatch batch = batchRepository.findWithItemsByIdAndHouseholdId(batchId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRICE_ADJUSTMENT_BATCH_NOT_FOUND));

        if (batch.getStatus() == BatchStatus.REVERTED) {
            throw new AppException(ErrorCode.PRICE_ADJUSTMENT_ALREADY_REVERTED);
        }

        // Kiểm tra thời hạn hoàn tác 24 giờ chính xác
        if (batch.getAppliedAt().plusHours(24).isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.PRICE_ADJUSTMENT_REVERT_EXPIRED);
        }

        LocalDateTime now = LocalDateTime.now();

        // Khôi phục giá cũ cho từng sản phẩm
        for (PriceAdjustmentItem item : batch.getItems()) {
            Product product = item.getProduct();
            if (product != null) {
                product.setPrice(item.getOldPrice());
                product.setUpdatedAt(now);
                productRepository.updatePrice(product.getId(), household.getId(), item.getOldPrice(), now);

                // Ghi nhận ActivityLog hoàn tác giá
                logActivity(household, user, "REVERT_PRICE", product.getId(),
                        Map.of("price", item.getNewPrice()), Map.of("price", item.getOldPrice(), "batchCode", batch.getBatchCode()));
            }
        }

        batch.setStatus(BatchStatus.REVERTED);
        batch.setRevertedBy(user.getId());
        batch.setRevertedAt(now);
        batch.setRevertReason(request.getRevertReason().trim());

        PriceAdjustmentBatch updatedBatch = batchRepository.save(batch);

        // Ghi nhận ActivityLog hoàn tác đợt đổi giá
        logActivity(household, user, "REVERT_PRICE_ADJUSTMENT_BATCH", updatedBatch.getId(),
                Map.of("status", "APPLIED"), Map.of("status", "REVERTED", "reason", request.getRevertReason().trim()));

        String appliedByName = resolveUserName(batch.getAppliedBy());
        String targetGroupName = resolveGroupName(batch.getTargetGroupId());
        List<PriceAdjustmentItemPreviewResponse> itemPreviews = mapItemsToPreviewResponse(batch.getItems());

        return mapToBatchResponse(updatedBatch, appliedByName, user.getFullName(), targetGroupName, itemPreviews);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PriceAdjustmentBatchResponse> getPriceAdjustmentBatches(String username, BatchStatus status, int page, int size) {
        User user = validateAndGetOwnerUser(username);
        BusinessHousehold household = getHouseholdOrThrow(user);

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));
        Page<PriceAdjustmentBatch> batchPage;

        if (status != null) {
            batchPage = batchRepository.findByHouseholdIdAndStatusOrderByAppliedAtDesc(household.getId(), status, pageable);
        } else {
            batchPage = batchRepository.findByHouseholdIdOrderByAppliedAtDesc(household.getId(), pageable);
        }

        List<PriceAdjustmentBatch> batches = batchPage.getContent();

        // Batch fetching tên người dùng và nhóm hàng để triệt tiêu N+1 Query
        Set<String> userIds = new HashSet<>();
        Set<String> groupIds = new HashSet<>();
        for (PriceAdjustmentBatch b : batches) {
            if (b.getAppliedBy() != null) userIds.add(b.getAppliedBy());
            if (b.getRevertedBy() != null) userIds.add(b.getRevertedBy());
            if (b.getTargetGroupId() != null) groupIds.add(b.getTargetGroupId());
        }

        Map<String, String> userNames = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, User::getFullName, (k1, k2) -> k1));

        Map<String, String> groupNames = groupIds.isEmpty() ? Collections.emptyMap() :
                productGroupRepository.findAllById(groupIds).stream()
                        .collect(Collectors.toMap(ProductGroup::getId, ProductGroup::getName, (k1, k2) -> k1));

        List<PriceAdjustmentBatchResponse> responses = batches.stream().map(b -> {
            String appliedByName = userNames.get(b.getAppliedBy());
            String revertedByName = userNames.get(b.getRevertedBy());
            String targetGroupName = groupNames.get(b.getTargetGroupId());
            return mapToBatchResponse(b, appliedByName, revertedByName, targetGroupName, null);
        }).collect(Collectors.toList());

        return PageResponse.<PriceAdjustmentBatchResponse>builder()
                .content(responses)
                .pageNumber(batchPage.getNumber())
                .pageSize(batchPage.getSize())
                .totalElements(batchPage.getTotalElements())
                .totalPages(batchPage.getTotalPages())
                .last(batchPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PriceAdjustmentBatchResponse getPriceAdjustmentBatchById(String username, String batchId) {
        User user = validateAndGetOwnerUser(username);
        BusinessHousehold household = getHouseholdOrThrow(user);

        PriceAdjustmentBatch batch = batchRepository.findWithItemsByIdAndHouseholdId(batchId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRICE_ADJUSTMENT_BATCH_NOT_FOUND));

        String appliedByName = resolveUserName(batch.getAppliedBy());
        String revertedByName = resolveUserName(batch.getRevertedBy());
        String targetGroupName = resolveGroupName(batch.getTargetGroupId());
        List<PriceAdjustmentItemPreviewResponse> itemPreviews = mapItemsToPreviewResponse(batch.getItems());

        return mapToBatchResponse(batch, appliedByName, revertedByName, targetGroupName, itemPreviews);
    }

    // ==========================================
    // HELPER & ALGORITHM METHODS
    // ==========================================

    public BigDecimal calculateNewPrice(
            BigDecimal oldPrice,
            BigDecimal costPrice,
            AdjustmentType type,
            BigDecimal value,
            PriceRoundingMethod roundingMethod) {

        if (oldPrice == null) oldPrice = BigDecimal.ZERO;
        if (costPrice == null) costPrice = BigDecimal.ZERO;
        if (value == null) value = BigDecimal.ZERO;

        BigDecimal rawPrice;
        switch (type) {
            case PERCENTAGE:
                BigDecimal factor = BigDecimal.ONE.add(value.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
                rawPrice = oldPrice.multiply(factor);
                break;

            case FIXED_AMOUNT:
                rawPrice = oldPrice.add(value);
                break;

            case PROFIT_MARGIN:
                BigDecimal marginFactor = BigDecimal.ONE.add(value.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP));
                rawPrice = costPrice.multiply(marginFactor);
                break;

            default:
                rawPrice = oldPrice;
        }

        if (rawPrice.compareTo(BigDecimal.ZERO) < 0) {
            rawPrice = BigDecimal.ZERO;
        }

        return roundingMethod != null ? roundingMethod.apply(rawPrice) : rawPrice.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Batch query giá vốn bình quân cho danh sách sản phẩm theo QTN-23.
     * Thứ tự ưu tiên:
     * 1. Giá vốn bình quân từ các lần nhập kho (goods_receipt_details) theo QTN-23.
     * 2. Giá vốn ban đầu của sản phẩm (product.cost_price).
     * 3. 0.00 nếu mặt hàng chưa có giá vốn.
     */
    public Map<String, BigDecimal> resolveAverageCostPrices(List<Product> products, String householdId) {
        if (products == null || products.isEmpty()) {
            return Collections.emptyMap();
        }

        List<String> productIds = products.stream().map(Product::getId).collect(Collectors.toList());
        Map<String, BigDecimal> costMap = new HashMap<>();

        try {
            List<Object[]> results = goodsReceiptDetailRepository.calculateWeightedAverageCostPrices(productIds, householdId);
            if (results != null) {
                for (Object[] row : results) {
                    if (row != null && row.length >= 2) {
                        String pId = (String) row[0];
                        BigDecimal avgCost = (BigDecimal) row[1];
                        if (pId != null && avgCost != null && avgCost.compareTo(BigDecimal.ZERO) > 0) {
                            costMap.put(pId, avgCost.setScale(2, RoundingMode.HALF_UP));
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not batch calculate weighted average cost: {}", e.getMessage());
        }

        // Fallback chuẩn QTN-23: kiểm tra costPrice ban đầu của sản phẩm nếu chưa có phiếu nhập
        for (Product product : products) {
            if (!costMap.containsKey(product.getId())) {
                if (product.getCostPrice() != null && product.getCostPrice().compareTo(BigDecimal.ZERO) > 0) {
                    costMap.put(product.getId(), product.getCostPrice().setScale(2, RoundingMode.HALF_UP));
                } else {
                    costMap.put(product.getId(), BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
                }
            }
        }

        return costMap;
    }

    /**
     * Lấy giá vốn bình quân cho một sản phẩm lẻ.
     */
    public BigDecimal resolveAverageCostPrice(Product product, String householdId) {
        if (product == null) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        try {
            BigDecimal avgCost = goodsReceiptDetailRepository.calculateWeightedAverageCostPrice(product.getId(), householdId);
            if (avgCost != null && avgCost.compareTo(BigDecimal.ZERO) > 0) {
                return avgCost.setScale(2, RoundingMode.HALF_UP);
            }
        } catch (Exception e) {
            log.warn("Could not query weighted average cost for product {}: {}", product.getId(), e.getMessage());
        }

        // Fallback chuẩn QTN-23: kiểm tra costPrice ban đầu của sản phẩm
        if (product.getCostPrice() != null && product.getCostPrice().compareTo(BigDecimal.ZERO) > 0) {
            return product.getCostPrice().setScale(2, RoundingMode.HALF_UP);
        }

        return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    }

    public boolean checkIsBelowCost(BigDecimal newPrice, BigDecimal costPrice) {
        if (newPrice == null || costPrice == null) return false;
        return newPrice.compareTo(costPrice) < 0;
    }

    private BigDecimal calculatePercentChange(BigDecimal oldPrice, BigDecimal newPrice) {
        if (oldPrice == null || oldPrice.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        BigDecimal diff = newPrice.subtract(oldPrice);
        return diff.divide(oldPrice, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
    }

    private void validateAdjustmentInput(AdjustmentType adjustmentType, BigDecimal adjustmentValue) {
        if (adjustmentType == null || adjustmentValue == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        if (adjustmentType == AdjustmentType.PERCENTAGE && adjustmentValue.compareTo(new BigDecimal("-100")) < 0) {
            throw new AppException(ErrorCode.PRICE_ADJUSTMENT_INVALID_VALUE);
        }
    }

    private List<Product> resolveTargetProducts(String householdId, String targetGroupId, List<String> productIds) {
        List<Product> products;
        boolean hasGroup = targetGroupId != null && !targetGroupId.trim().isEmpty();
        boolean hasProductIds = productIds != null && !productIds.isEmpty();

        if (hasGroup) {
            // Xác thực nhóm hàng tồn tại và thuộc hộ kinh doanh
            productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(targetGroupId.trim(), householdId)
                    .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_GROUP_NOT_FOUND));

            if (hasProductIds) {
                // Người dùng lọc nhóm và tick chọn sản phẩm cụ thể trong nhóm
                products = productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(productIds, householdId).stream()
                        .filter(p -> p.getGroup() != null && targetGroupId.trim().equals(p.getGroup().getId()))
                        .collect(Collectors.toList());
            } else {
                // Đổi giá cho toàn bộ nhóm hàng
                products = productRepository.findByGroupIdAndHouseholdIdAndDeletedAtIsNull(targetGroupId.trim(), householdId);
            }
        } else if (hasProductIds) {
            // Người dùng chọn danh sách sản phẩm lẻ
            products = productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(productIds, householdId);
        } else {
            throw new AppException(ErrorCode.PRICE_ADJUSTMENT_NO_PRODUCTS_SELECTED);
        }

        if (products.isEmpty()) {
            throw new AppException(ErrorCode.PRICE_ADJUSTMENT_NO_PRODUCTS_SELECTED);
        }

        return products;
    }

    private String generateBatchCode(String householdId) {
        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "PADJ-" + today + "-";
        long count = batchRepository.countByHouseholdIdAndBatchCodeStartingWith(householdId, prefix);
        return String.format("%s%03d", prefix, count + 1);
    }

    private User validateAndGetOwnerUser(String currentUsername) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getRole() == null || !"VT-01".equals(user.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return user;
    }

    private BusinessHousehold getHouseholdOrThrow(User user) {
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }
        return household;
    }

    private String resolveGroupName(String groupId) {
        if (groupId == null) return null;
        return productGroupRepository.findById(groupId)
                .map(ProductGroup::getName)
                .orElse(null);
    }

    private String resolveUserName(String userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(User::getFullName)
                .orElse(null);
    }

    private List<PriceAdjustmentItemPreviewResponse> mapItemsToPreviewResponse(List<PriceAdjustmentItem> items) {
        if (items == null) return Collections.emptyList();
        return items.stream().map(i -> {
            Product p = i.getProduct();
            BigDecimal percentChange = calculatePercentChange(i.getOldPrice(), i.getNewPrice());
            return PriceAdjustmentItemPreviewResponse.builder()
                    .productId(p != null ? p.getId() : null)
                    .productSku(p != null ? p.getSku() : null)
                    .productName(p != null ? p.getName() : null)
                    .unit(p != null ? p.getUnit() : null)
                    .groupName(p != null && p.getGroup() != null ? p.getGroup().getName() : null)
                    .oldPrice(i.getOldPrice())
                    .newPrice(i.getNewPrice())
                    .priceDifference(i.getPriceDifference())
                    .percentChange(percentChange)
                    .costPrice(i.getCostPrice())
                    .isBelowCost(i.getIsBelowCost())
                    .build();
        }).collect(Collectors.toList());
    }

    private PriceAdjustmentBatchResponse mapToBatchResponse(
            PriceAdjustmentBatch batch,
            String appliedByName,
            String revertedByName,
            String targetGroupName,
            List<PriceAdjustmentItemPreviewResponse> itemPreviews) {

        boolean canRevert = batch.getStatus() == BatchStatus.APPLIED
                && batch.getAppliedAt().plusHours(24).isAfter(LocalDateTime.now());

        return PriceAdjustmentBatchResponse.builder()
                .id(batch.getId())
                .batchCode(batch.getBatchCode())
                .name(batch.getName())
                .adjustmentType(batch.getAdjustmentType())
                .adjustmentValue(batch.getAdjustmentValue())
                .targetGroupId(batch.getTargetGroupId())
                .targetGroupName(targetGroupName)
                .roundingMethod(batch.getRoundingMethod())
                .status(batch.getStatus())
                .totalItems(batch.getTotalItems())
                .belowCostItems(batch.getBelowCostItems())
                .appliedBy(batch.getAppliedBy())
                .appliedByName(appliedByName)
                .appliedAt(batch.getAppliedAt())
                .revertedBy(batch.getRevertedBy())
                .revertedByName(revertedByName)
                .revertedAt(batch.getRevertedAt())
                .revertReason(batch.getRevertReason())
                .canRevert(canRevert)
                .items(itemPreviews)
                .build();
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
            log.error("Failed to record price adjustment activity log for targetId {}: {}", targetId, e.getMessage());
        }
    }
}
