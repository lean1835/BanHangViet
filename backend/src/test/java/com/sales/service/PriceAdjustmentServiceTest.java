package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AdjustmentType;
import com.sales.constant.BatchStatus;
import com.sales.constant.PriceRoundingMethod;
import com.sales.dto.request.ApplyPriceAdjustmentRequest;
import com.sales.dto.request.PreviewPriceAdjustmentRequest;
import com.sales.dto.request.RevertPriceAdjustmentRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PriceAdjustmentBatchResponse;
import com.sales.dto.response.PriceAdjustmentPreviewResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.PriceAdjustmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PriceAdjustmentServiceTest {

    @Mock
    private PriceAdjustmentBatchRepository batchRepository;

    @Mock
    private PriceAdjustmentItemRepository itemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductGroupRepository productGroupRepository;

    @Mock
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private PriceAdjustmentServiceImpl priceAdjustmentService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;
    private ProductGroup beverageGroup;
    private Product product1;
    private Product product2;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("household-001")
                .name("Tạp Hóa Việt")
                .build();

        Role ownerRole = Role.builder()
                .id(1)
                .code("VT-01")
                .name("Chủ hộ kinh doanh")
                .build();

        Role staffRole = Role.builder()
                .id(2)
                .code("VT-02")
                .name("Nhân viên bán hàng")
                .build();

        ownerUser = User.builder()
                .id("user-owner-001")
                .username("owner")
                .fullName("Nguyễn Văn Chủ")
                .role(ownerRole)
                .household(household)
                .build();

        staffUser = User.builder()
                .id("user-staff-002")
                .username("staff")
                .fullName("Trần Thị Thu Ngân")
                .role(staffRole)
                .household(household)
                .build();

        beverageGroup = ProductGroup.builder()
                .id("group-beverage")
                .name("Nước giải khát")
                .build();

        product1 = Product.builder()
                .id("prod-001")
                .sku("NUOC-COCA-330")
                .name("Coca Cola 330ml")
                .unit("lon")
                .price(new BigDecimal("10000"))
                .group(beverageGroup)
                .household(household)
                .build();

        product2 = Product.builder()
                .id("prod-002")
                .sku("NUOC-PEPSI-330")
                .name("Pepsi 330ml")
                .unit("lon")
                .price(new BigDecimal("20000"))
                .group(beverageGroup)
                .household(household)
                .build();
    }

    @Test
    @DisplayName("TC-01: Preview tăng giá 5% theo nhóm hàng, làm tròn đến 1000đ")
    void previewPriceAdjustment_percentageIncrease_success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("group-beverage", "household-001"))
                .thenReturn(Optional.of(beverageGroup));
        when(productRepository.findByGroupIdAndHouseholdIdAndDeletedAtIsNull("group-beverage", "household-001"))
                .thenReturn(List.of(product1, product2));
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrices(any(), eq("household-001")))
                .thenReturn(List.of(
                        new Object[]{"prod-001", new BigDecimal("8000")},
                        new Object[]{"prod-002", new BigDecimal("15000")}
                ));

        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId("group-beverage")
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("5.0"))
                .roundingMethod(PriceRoundingMethod.ROUND_TO_1000)
                .build();

        PriceAdjustmentPreviewResponse response = priceAdjustmentService.previewPriceAdjustment("owner", request);

        assertNotNull(response);
        assertEquals(2, response.getTotalItems());
        assertEquals(2, response.getIncreasedItems());
        assertEquals(0, response.getBelowCostItems());

        // product1: 10,000 * 1.05 = 10,500 -> round to 1000 -> 11,000
        var item1 = response.getItems().stream().filter(i -> i.getProductId().equals("prod-001")).findFirst().orElseThrow();
        assertEquals(new BigDecimal("10000.00"), item1.getOldPrice());
        assertEquals(new BigDecimal("11000.00"), item1.getNewPrice());
        assertEquals(new BigDecimal("1000.00"), item1.getPriceDifference());
        assertFalse(item1.getIsBelowCost());

        // product2: 20,000 * 1.05 = 21,000 -> round to 1000 -> 21,000
        var item2 = response.getItems().stream().filter(i -> i.getProductId().equals("prod-002")).findFirst().orElseThrow();
        assertEquals(new BigDecimal("20000.00"), item2.getOldPrice());
        assertEquals(new BigDecimal("21000.00"), item2.getNewPrice());
        assertEquals(new BigDecimal("1000.00"), item2.getPriceDifference());
        assertFalse(item2.getIsBelowCost());
    }

    @Test
    @DisplayName("TC-02: Cảnh báo giá mới thấp hơn giá vốn (isBelowCost = true)")
    void previewPriceAdjustment_warningBelowCost_success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("group-beverage", "household-001"))
                .thenReturn(Optional.of(beverageGroup));
        when(productRepository.findByGroupIdAndHouseholdIdAndDeletedAtIsNull("group-beverage", "household-001"))
                .thenReturn(List.of(product1));
        // Giá vốn là 9,500đ theo QTN-23
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrices(any(), eq("household-001")))
                .thenReturn(Collections.singletonList(new Object[]{"prod-001", new BigDecimal("9500")}));

        // Giảm giá 20%: 10,000 * 0.8 = 8,000đ -> Thấp hơn giá vốn 9,500đ!
        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId("group-beverage")
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("-20.0"))
                .roundingMethod(PriceRoundingMethod.NONE)
                .build();

        PriceAdjustmentPreviewResponse response = priceAdjustmentService.previewPriceAdjustment("owner", request);

        assertNotNull(response);
        assertEquals(1, response.getTotalItems());
        assertEquals(1, response.getBelowCostItems());
        assertEquals(1, response.getDecreasedItems());

        var item = response.getItems().get(0);
        assertEquals(new BigDecimal("8000.00"), item.getNewPrice());
        assertEquals(new BigDecimal("9500.00"), item.getCostPrice());
        assertTrue(item.getIsBelowCost());
    }

    @Test
    @DisplayName("TC-01: Apply đợt điều chỉnh giá thành công và cập nhật giá vào DB")
    void applyPriceAdjustment_success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("group-beverage", "household-001"))
                .thenReturn(Optional.of(beverageGroup));
        when(productRepository.findByGroupIdAndHouseholdIdAndDeletedAtIsNull("group-beverage", "household-001"))
                .thenReturn(List.of(product1));
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrices(any(), eq("household-001")))
                .thenReturn(Collections.singletonList(new Object[]{"prod-001", new BigDecimal("8000")}));
        when(batchRepository.countByHouseholdIdAndBatchCodeStartingWith(eq("household-001"), anyString()))
                .thenReturn(0L);
        when(batchRepository.save(any(PriceAdjustmentBatch.class))).thenAnswer(invocation -> {
            PriceAdjustmentBatch b = invocation.getArgument(0);
            b.setId("batch-uuid-001");
            return b;
        });

        ApplyPriceAdjustmentRequest request = ApplyPriceAdjustmentRequest.builder()
                .name("Đợt tăng giá nước ngọt tháng 9")
                .targetGroupId("group-beverage")
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("10.0"))
                .roundingMethod(PriceRoundingMethod.ROUND_TO_1000)
                .build();

        PriceAdjustmentBatchResponse response = priceAdjustmentService.applyPriceAdjustment("owner", request);

        assertNotNull(response);
        assertEquals("batch-uuid-001", response.getId());
        assertEquals("PADJ-" + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")) + "-001", response.getBatchCode());
        assertEquals(BatchStatus.APPLIED, response.getStatus());
        assertEquals(1, response.getTotalItems());
        assertTrue(response.getCanRevert());

        // Kiểm tra gọi batch saveAll trên productRepository
        verify(productRepository, times(1)).saveAll(anyList());
        assertEquals(new BigDecimal("11000.00"), product1.getPrice());
    }

    @Test
    @DisplayName("TC-03: Hoàn tác đợt điều chỉnh giá trong vòng 24 giờ thành công")
    void revertPriceAdjustment_within24Hours_success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        PriceAdjustmentBatch batch = PriceAdjustmentBatch.builder()
                .id("batch-001")
                .batchCode("PADJ-20260908-001")
                .name("Đợt điều chỉnh giá mẫu")
                .householdId("household-001")
                .status(BatchStatus.APPLIED)
                .appliedBy("user-owner-001")
                .appliedAt(LocalDateTime.now().minusHours(2)) // Áp dụng cách đây 2 giờ (< 24h)
                .totalItems(1)
                .items(new ArrayList<>())
                .build();

        product1.setPrice(new BigDecimal("12000.00"));

        PriceAdjustmentItem item = PriceAdjustmentItem.builder()
                .id("item-001")
                .batch(batch)
                .product(product1)
                .oldPrice(new BigDecimal("10000.00"))
                .newPrice(new BigDecimal("12000.00"))
                .priceDifference(new BigDecimal("2000.00"))
                .costPrice(new BigDecimal("8000.00"))
                .isBelowCost(false)
                .build();
        batch.getItems().add(item);

        when(batchRepository.findWithItemsByIdAndHouseholdId("batch-001", "household-001"))
                .thenReturn(Optional.of(batch));
        when(batchRepository.save(any(PriceAdjustmentBatch.class))).thenReturn(batch);

        RevertPriceAdjustmentRequest revertRequest = RevertPriceAdjustmentRequest.builder()
                .revertReason("Áp nhầm tỷ lệ điều chỉnh giá")
                .build();

        PriceAdjustmentBatchResponse response = priceAdjustmentService.revertPriceAdjustment("owner", "batch-001", revertRequest);

        assertNotNull(response);
        assertEquals(BatchStatus.REVERTED, response.getStatus());
        assertEquals("Áp nhầm tỷ lệ điều chỉnh giá", response.getRevertReason());
        assertFalse(response.getCanRevert());

        // Kiểm tra khôi phục lại giá cũ qua batch saveAll
        verify(productRepository, times(1)).saveAll(anyList());
        assertEquals(new BigDecimal("10000.00"), product1.getPrice());
    }

    @Test
    @DisplayName("Safeguard: Bỏ qua khôi phục giá nếu sản phẩm đã bị thay đổi giá thủ công sau đợt")
    void revertPriceAdjustment_productPriceChangedAfterBatch_skipsRevert() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        // Giá hiện tại là 15000 (đã bị sửa thủ công sau khi áp dụng giá 12000)
        product1.setPrice(new BigDecimal("15000.00"));

        PriceAdjustmentBatch batch = PriceAdjustmentBatch.builder()
                .id("batch-001")
                .batchCode("PADJ-20260908-001")
                .name("Đợt điều chỉnh giá mẫu")
                .householdId("household-001")
                .status(BatchStatus.APPLIED)
                .appliedBy("user-owner-001")
                .appliedAt(LocalDateTime.now().minusHours(2))
                .totalItems(1)
                .items(new ArrayList<>())
                .build();

        PriceAdjustmentItem item = PriceAdjustmentItem.builder()
                .id("item-001")
                .batch(batch)
                .product(product1)
                .oldPrice(new BigDecimal("10000.00"))
                .newPrice(new BigDecimal("12000.00"))
                .priceDifference(new BigDecimal("2000.00"))
                .costPrice(new BigDecimal("8000.00"))
                .isBelowCost(false)
                .build();
        batch.getItems().add(item);

        when(batchRepository.findWithItemsByIdAndHouseholdId("batch-001", "household-001"))
                .thenReturn(Optional.of(batch));
        when(batchRepository.save(any(PriceAdjustmentBatch.class))).thenReturn(batch);

        RevertPriceAdjustmentRequest revertRequest = RevertPriceAdjustmentRequest.builder()
                .revertReason("Áp nhầm tỷ lệ điều chỉnh giá")
                .build();

        PriceAdjustmentBatchResponse response = priceAdjustmentService.revertPriceAdjustment("owner", "batch-001", revertRequest);

        assertNotNull(response);
        assertEquals(BatchStatus.REVERTED, response.getStatus());

        // Do giá sản phẩm đã bị đổi sang 15000 khác với 12000, không được ghi đè về giá cũ 10000
        verify(productRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Ngoại lệ: Chặn hoàn tác khi quá hạn 24 giờ (PRICE_ADJUSTMENT_REVERT_EXPIRED)")
    void revertPriceAdjustment_expiredAfter24Hours_throwsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        PriceAdjustmentBatch batch = PriceAdjustmentBatch.builder()
                .id("batch-001")
                .batchCode("PADJ-20260908-001")
                .name("Đợt điều chỉnh giá đã cũ")
                .householdId("household-001")
                .status(BatchStatus.APPLIED)
                .appliedBy("user-owner-001")
                .appliedAt(LocalDateTime.now().minusHours(25)) // Quá 24 giờ!
                .totalItems(1)
                .items(new ArrayList<>())
                .build();

        when(batchRepository.findWithItemsByIdAndHouseholdId("batch-001", "household-001"))
                .thenReturn(Optional.of(batch));

        RevertPriceAdjustmentRequest revertRequest = RevertPriceAdjustmentRequest.builder()
                .revertReason("Muốn quay lại giá cũ")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                priceAdjustmentService.revertPriceAdjustment("owner", "batch-001", revertRequest));

        assertEquals(ErrorCode.PRICE_ADJUSTMENT_REVERT_EXPIRED, ex.getErrorCode());
        verify(productRepository, never()).saveAll(anyList());
    }

    @Test
    @DisplayName("Ngoại lệ: Chặn hoàn tác trùng lặp (PRICE_ADJUSTMENT_ALREADY_REVERTED)")
    void revertPriceAdjustment_alreadyReverted_throwsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        PriceAdjustmentBatch batch = PriceAdjustmentBatch.builder()
                .id("batch-001")
                .status(BatchStatus.REVERTED) // Đã hoàn tác rồi!
                .appliedAt(LocalDateTime.now().minusHours(1))
                .build();

        when(batchRepository.findWithItemsByIdAndHouseholdId("batch-001", "household-001"))
                .thenReturn(Optional.of(batch));

        RevertPriceAdjustmentRequest revertRequest = RevertPriceAdjustmentRequest.builder()
                .revertReason("Hoàn tác tiếp lần 2")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                priceAdjustmentService.revertPriceAdjustment("owner", "batch-001", revertRequest));

        assertEquals(ErrorCode.PRICE_ADJUSTMENT_ALREADY_REVERTED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ngoại lệ: Hoàn tác thiếu lý do (PRICE_ADJUSTMENT_REVERT_REASON_REQUIRED)")
    void revertPriceAdjustment_blankReason_throwsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        RevertPriceAdjustmentRequest revertRequest = RevertPriceAdjustmentRequest.builder()
                .revertReason("   ")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                priceAdjustmentService.revertPriceAdjustment("owner", "batch-001", revertRequest));

        assertEquals(ErrorCode.PRICE_ADJUSTMENT_REVERT_REASON_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ngoại lệ: Không phải chủ hộ VT-01 (FORBIDDEN)")
    void notOwner_throwsForbidden() {
        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(staffUser));

        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId("group-beverage")
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("5.0"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                priceAdjustmentService.previewPriceAdjustment("staff", request));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ngoại lệ: Không chọn sản phẩm hoặc danh sách rỗng (PRICE_ADJUSTMENT_NO_PRODUCTS_SELECTED)")
    void noProducts_throwsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("group-empty", "household-001"))
                .thenReturn(Optional.of(ProductGroup.builder().id("group-empty").name("Nhóm rỗng").build()));
        when(productRepository.findByGroupIdAndHouseholdIdAndDeletedAtIsNull("group-empty", "household-001"))
                .thenReturn(Collections.emptyList());

        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId("group-empty")
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("5.0"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                priceAdjustmentService.previewPriceAdjustment("owner", request));

        assertEquals(ErrorCode.PRICE_ADJUSTMENT_NO_PRODUCTS_SELECTED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ngoại lệ: Nhóm hàng không tồn tại (PRODUCT_GROUP_NOT_FOUND)")
    void groupNotFound_throwsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("group-non-existent", "household-001"))
                .thenReturn(Optional.empty());

        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId("group-non-existent")
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("5.0"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                priceAdjustmentService.previewPriceAdjustment("owner", request));

        assertEquals(ErrorCode.PRODUCT_GROUP_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("QTN-23: Fallback lấy giá vốn từ product.costPrice khi chưa có phiếu nhập kho")
    void fallbackToProductCostPrice_whenNoGoodsReceipts() {
        Product prodWithCost = Product.builder()
                .id("prod-cost-001")
                .sku("SKU-COST")
                .name("Sản phẩm có giá vốn ban đầu")
                .price(new BigDecimal("20000.00"))
                .costPrice(new BigDecimal("14000.00"))
                .group(beverageGroup)
                .household(household)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("group-beverage", "household-001"))
                .thenReturn(Optional.of(beverageGroup));
        when(productRepository.findByGroupIdAndHouseholdIdAndDeletedAtIsNull("group-beverage", "household-001"))
                .thenReturn(List.of(prodWithCost));
        // Giả lập chưa có phiếu nhập kho nào
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrices(any(), eq("household-001")))
                .thenReturn(Collections.emptyList());

        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId("group-beverage")
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("10.0"))
                .build();

        PriceAdjustmentPreviewResponse response = priceAdjustmentService.previewPriceAdjustment("owner", request);

        assertNotNull(response);
        var item = response.getItems().get(0);
        // Kiểm tra đúng giá vốn 14,000đ lấy từ product.costPrice chứ KHÔNG PHẢI 70% của 20,000
        assertEquals(new BigDecimal("14000.00"), item.getCostPrice());
    }

    @Test
    @DisplayName("Lọc sản phẩm: Chọn nhóm hàng kết hợp danh sách sản phẩm lẻ trong nhóm")
    void filterByGroupAndSelectedProductIds() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productGroupRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("group-beverage", "household-001"))
                .thenReturn(Optional.of(beverageGroup));
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(List.of("prod-001"), "household-001"))
                .thenReturn(List.of(product1));
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrices(any(), eq("household-001")))
                .thenReturn(Collections.singletonList(new Object[]{"prod-001", new BigDecimal("8000")}));

        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId("group-beverage")
                .productIds(List.of("prod-001"))
                .adjustmentType(AdjustmentType.FIXED_AMOUNT)
                .adjustmentValue(new BigDecimal("2000.0"))
                .build();

        PriceAdjustmentPreviewResponse response = priceAdjustmentService.previewPriceAdjustment("owner", request);

        assertNotNull(response);
        assertEquals(1, response.getTotalItems());
        assertEquals("prod-001", response.getItems().get(0).getProductId());
    }

    @Test
    @DisplayName("Ngoại lệ: Tỷ lệ phần trăm nhỏ hơn -100% (PRICE_ADJUSTMENT_INVALID_VALUE)")
    void invalidPercentage_throwsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId("group-beverage")
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("-150.0"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                priceAdjustmentService.previewPriceAdjustment("owner", request));

        assertEquals(ErrorCode.PRICE_ADJUSTMENT_INVALID_VALUE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Thử nghiệm FIXED_AMOUNT và PROFIT_MARGIN")
    void testFixedAmountAndProfitMargin() {
        // FIXED_AMOUNT: 10,000 - 3,000 = 7,000đ
        BigDecimal fixedPrice = priceAdjustmentService.calculateNewPrice(
                new BigDecimal("10000"), new BigDecimal("8000"),
                AdjustmentType.FIXED_AMOUNT, new BigDecimal("-3000"), PriceRoundingMethod.NONE);
        assertEquals(new BigDecimal("7000.00"), fixedPrice);

        // PROFIT_MARGIN: Giá vốn 8,000, lãi 25% -> 8,000 * 1.25 = 10,000đ
        BigDecimal marginPrice = priceAdjustmentService.calculateNewPrice(
                new BigDecimal("10000"), new BigDecimal("8000"),
                AdjustmentType.PROFIT_MARGIN, new BigDecimal("25.0"), PriceRoundingMethod.NONE);
        assertEquals(new BigDecimal("10000.00"), marginPrice);
    }
}
