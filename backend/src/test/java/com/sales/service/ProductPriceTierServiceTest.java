package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.BatchSavePriceTiersRequest;
import com.sales.dto.request.CreatePriceTierRequest;
import com.sales.dto.request.UpdatePriceTierRequest;
import com.sales.dto.response.PricingDecision;
import com.sales.dto.response.ProductPriceTierResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.dto.response.ResolveTierPriceResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Product;
import com.sales.entity.ProductPriceTier;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.GoodsReceiptDetailRepository;
import com.sales.repository.ProductPriceTierRepository;
import com.sales.repository.ProductRepository;
import com.sales.repository.ProductUnitConversionRepository;
import com.sales.repository.UserRepository;
import com.sales.repository.OrderItemRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.ProductPriceTierServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductPriceTierServiceTest {

    @Mock
    private ProductPriceTierRepository productPriceTierRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductUnitConversionRepository productUnitConversionRepository;

    @Mock
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private ProductPriceTierServiceImpl productPriceTierService;

    private User ownerUser;
    private BusinessHousehold household;
    private Product product;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("household-1")
                .name("Hộ Kinh Doanh Việt")
                .build();

        ownerUser = User.builder()
                .id("user-owner-1")
                .username("owner")
                .household(household)
                .build();

        product = Product.builder()
                .id("prod-1")
                .name("Redbull 250ml")
                .unit("lon")
                .price(new BigDecimal("12000.00"))
                .costPrice(new BigDecimal("9500.00"))
                .household(household)
                .build();
    }

    @Test
    @DisplayName("TC-01: Tạo bậc giá sỉ thành công")
    void testCreatePriceTier_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrice("prod-1", "household-1")).thenReturn(new BigDecimal("9500.00"));
        when(productPriceTierRepository.findByProductIdAndHouseholdIdOrderByMinQuantityAsc("prod-1", "household-1"))
                .thenReturn(Collections.emptyList());

        CreatePriceTierRequest request = CreatePriceTierRequest.builder()
                .tierName("Giá sỉ (≥ 10)")
                .minQuantity(new BigDecimal("10.000"))
                .maxQuantity(null)
                .price(new BigDecimal("10500.00"))
                .isActive(true)
                .build();

        when(productPriceTierRepository.save(any(ProductPriceTier.class))).thenAnswer(invocation -> {
            ProductPriceTier t = invocation.getArgument(0);
            t.setId("tier-1");
            return t;
        });

        ProductPriceTierResponse response = productPriceTierService.createPriceTier("owner", "prod-1", request);

        assertNotNull(response);
        assertEquals("tier-1", response.getId());
        assertEquals("Giá sỉ (≥ 10)", response.getTierName());
        assertEquals(new BigDecimal("10.000"), response.getMinQuantity());
        assertEquals(new BigDecimal("10500.00"), response.getPrice());
        assertFalse(response.getIsBelowCost());
    }

    @Test
    @DisplayName("TC-03: Cảnh báo bán dưới giá vốn khi confirmBelowCost = false (AC-03 & QTN-23)")
    void testCreatePriceTier_BelowCost_ThrowsWarning() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));
        // Giá vốn bình quân 9.500đ
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrice("prod-1", "household-1")).thenReturn(new BigDecimal("9500.00"));
        when(productPriceTierRepository.findByProductIdAndHouseholdIdOrderByMinQuantityAsc("prod-1", "household-1"))
                .thenReturn(Collections.emptyList());

        // Khai báo giá bậc 9.000đ < 9.500đ
        CreatePriceTierRequest request = CreatePriceTierRequest.builder()
                .tierName("Giá bán lỗ xả kho")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("9000.00"))
                .confirmBelowCost(false)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productPriceTierService.createPriceTier("owner", "prod-1", request));

        assertEquals(ErrorCode.PRICE_TIER_BELOW_COST_CONFIRMATION_REQUIRED, ex.getErrorCode());
        verify(productPriceTierRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-04: Lưu bậc giá dưới giá vốn thành công khi confirmBelowCost = true (AC-03)")
    void testCreatePriceTier_BelowCost_WithConfirmation_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrice("prod-1", "household-1")).thenReturn(new BigDecimal("9500.00"));
        when(productPriceTierRepository.findByProductIdAndHouseholdIdOrderByMinQuantityAsc("prod-1", "household-1"))
                .thenReturn(Collections.emptyList());

        CreatePriceTierRequest request = CreatePriceTierRequest.builder()
                .tierName("Giá bán lỗ xả kho")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("9000.00"))
                .confirmBelowCost(true)
                .build();

        when(productPriceTierRepository.save(any(ProductPriceTier.class))).thenAnswer(invocation -> {
            ProductPriceTier t = invocation.getArgument(0);
            t.setId("tier-loss");
            return t;
        });

        ProductPriceTierResponse response = productPriceTierService.createPriceTier("owner", "prod-1", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("9000.00"), response.getPrice());
        assertTrue(response.getIsBelowCost());
    }

    @Test
    @DisplayName("TC-05: Chặn tạo bậc giá có khoảng số lượng bị chồng lấn")
    void testCreatePriceTier_OverlappingRange_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));

        // Đã có bậc [10, 49]
        ProductPriceTier existingTier = ProductPriceTier.builder()
                .id("tier-1")
                .minQuantity(new BigDecimal("10.000"))
                .maxQuantity(new BigDecimal("49.000"))
                .price(new BigDecimal("10500.00"))
                .isActive(true)
                .build();

        when(productPriceTierRepository.findByProductIdAndHouseholdIdOrderByMinQuantityAsc("prod-1", "household-1"))
                .thenReturn(List.of(existingTier));

        // Thử thêm bậc [30, 100] -> trùng lặp trong khoảng [30, 49]
        CreatePriceTierRequest request = CreatePriceTierRequest.builder()
                .tierName("Bậc chồng lấn")
                .minQuantity(new BigDecimal("30.000"))
                .maxQuantity(new BigDecimal("100.000"))
                .price(new BigDecimal("10000.00"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productPriceTierService.createPriceTier("owner", "prod-1", request));

        assertEquals(ErrorCode.PRICE_TIER_OVERLAPPING_QUANTITY, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-06 & TC-07: Validate dải số lượng (min <= 0 hoặc max < min)")
    void testCreatePriceTier_InvalidRanges() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));

        // Case min <= 0
        CreatePriceTierRequest req1 = CreatePriceTierRequest.builder()
                .tierName("Lỗi min")
                .minQuantity(BigDecimal.ZERO)
                .price(new BigDecimal("10000.00"))
                .build();

        AppException ex1 = assertThrows(AppException.class, () ->
                productPriceTierService.createPriceTier("owner", "prod-1", req1));
        assertEquals(ErrorCode.PRICE_TIER_MIN_QUANTITY_INVALID, ex1.getErrorCode());

        // Case max < min
        CreatePriceTierRequest req2 = CreatePriceTierRequest.builder()
                .tierName("Lỗi range")
                .minQuantity(new BigDecimal("20.000"))
                .maxQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("10000.00"))
                .build();

        AppException ex2 = assertThrows(AppException.class, () ->
                productPriceTierService.createPriceTier("owner", "prod-1", req2));
        assertEquals(ErrorCode.PRICE_TIER_INVALID_QUANTITY_RANGE, ex2.getErrorCode());
    }

    @Test
    @DisplayName("TC-08: Khớp bậc giá sỉ khi đủ số lượng và tự động tính đúng (Match Price Tier)")
    void testMatchPriceTier_Success() {
        ProductPriceTier tierRetail = ProductPriceTier.builder()
                .id("tier-retail")
                .tierName("Giá lẻ")
                .minQuantity(new BigDecimal("1.000"))
                .maxQuantity(new BigDecimal("9.000"))
                .price(new BigDecimal("12000.00"))
                .isActive(true)
                .build();

        ProductPriceTier tierWholesale = ProductPriceTier.builder()
                .id("tier-wholesale")
                .tierName("Giá sỉ (≥ 10)")
                .minQuantity(new BigDecimal("10.000"))
                .maxQuantity(null)
                .price(new BigDecimal("10500.00"))
                .isActive(true)
                .build();

        when(productPriceTierRepository.findByProductIdAndHouseholdIdAndIsActiveTrueOrderByMinQuantityAsc("prod-1", "household-1"))
                .thenReturn(List.of(tierRetail, tierWholesale));

        // Mua số lượng 12 -> khớp tierWholesale (AC-01)
        ProductPriceTier matched = productPriceTierService.matchPriceTier("household-1", product, new BigDecimal("12.000"), null);
        assertNotNull(matched);
        assertEquals("tier-wholesale", matched.getId());
        assertEquals("Giá sỉ (≥ 10)", matched.getTierName());
        assertEquals(new BigDecimal("10500.00"), matched.getPrice());

        // Giảm số lượng xuống 5 -> khớp tierRetail (AC-02)
        ProductPriceTier matched5 = productPriceTierService.matchPriceTier("household-1", product, new BigDecimal("5.000"), null);
        assertNotNull(matched5);
        assertEquals("tier-retail", matched5.getId());
        assertEquals(new BigDecimal("12000.00"), matched5.getPrice());
    }

    @Test
    @DisplayName("TC-09: QTN-26 - Ưu đãi có lợi nhất: Bậc sỉ giảm nhiều hơn Khuyến mại -> Chọn Bậc sỉ")
    void testResolvePricingDecision_TierWins() {
        BigDecimal regularPrice = new BigDecimal("20000.00");
        BigDecimal quantity = new BigDecimal("12.000");

        // Bậc sỉ 16.000đ -> giảm 4.000đ/cái = 48.000đ
        ProductPriceTier matchedTier = ProductPriceTier.builder()
                .id("tier-sỉ")
                .tierName("Giá sỉ thùng")
                .price(new BigDecimal("16000.00"))
                .build();

        // Khuyến mại chỉ giảm 20.000đ
        PromotionItemResultResponse promoResult = PromotionItemResultResponse.builder()
                .promotionId("promo-1")
                .promotionName("Giảm giá 20k")
                .discountAmount(new BigDecimal("20000.00"))
                .build();

        PricingDecision decision = productPriceTierService.resolvePricingDecision(
                regularPrice,
                matchedTier,
                promoResult,
                quantity
        );

        assertEquals(new BigDecimal("16000.00"), decision.getUnitPrice());
        assertEquals(BigDecimal.ZERO, decision.getDiscountAmount());
        assertEquals("Giá sỉ thùng", decision.getPriceTierName());
        assertNull(decision.getPromotionName());
    }

    @Test
    @DisplayName("TC-10: QTN-26 - Ưu đãi có lợi nhất: Khuyến mại giảm nhiều hơn Bậc sỉ -> Chọn Khuyến mại")
    void testResolvePricingDecision_PromoWins() {
        BigDecimal regularPrice = new BigDecimal("20000.00");
        BigDecimal quantity = new BigDecimal("12.000");

        // Bậc sỉ 19.000đ -> giảm 1.000đ/cái = 12.000đ
        ProductPriceTier matchedTier = ProductPriceTier.builder()
                .id("tier-sỉ")
                .tierName("Giá sỉ nhỏ")
                .price(new BigDecimal("19000.00"))
                .build();

        // Khuyến mại giảm tới 30.000đ
        PromotionItemResultResponse promoResult = PromotionItemResultResponse.builder()
                .promotionId("promo-big")
                .promotionName("Giảm xả hàng 30k")
                .discountAmount(new BigDecimal("30000.00"))
                .build();

        PricingDecision decision = productPriceTierService.resolvePricingDecision(
                regularPrice,
                matchedTier,
                promoResult,
                quantity
        );

        // Giữ giá bán lẻ gốc 20.000đ và áp dụng giảm giá khuyến mại 30.000đ
        assertEquals(new BigDecimal("20000.00"), decision.getUnitPrice());
        assertEquals(new BigDecimal("30000.00"), decision.getDiscountAmount());
        assertNull(decision.getPriceTierName());
        assertEquals("Giảm xả hàng 30k", decision.getPromotionName());
    }

    @Test
    @DisplayName("TC-11: Resolve Tier Price tính đúng mức tiết kiệm")
    void testResolveTierPrice_CalculatesSavings() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrice("prod-1", "household-1")).thenReturn(new BigDecimal("9500.00"));

        ProductPriceTier tierWholesale = ProductPriceTier.builder()
                .id("tier-ws")
                .tierName("Giá sỉ (≥ 10)")
                .minQuantity(new BigDecimal("10.000"))
                .maxQuantity(null)
                .price(new BigDecimal("10500.00"))
                .isActive(true)
                .build();

        when(productPriceTierRepository.findByProductIdAndHouseholdIdAndIsActiveTrueOrderByMinQuantityAsc("prod-1", "household-1"))
                .thenReturn(List.of(tierWholesale));

        ResolveTierPriceResponse resp = productPriceTierService.resolveTierPrice("owner", "prod-1", new BigDecimal("12.000"), null);

        assertNotNull(resp);
        assertEquals(new BigDecimal("12000.00"), resp.getBaseRetailPrice());
        assertEquals(new BigDecimal("10500.00"), resp.getAppliedUnitPrice());
        assertEquals("Giá sỉ (≥ 10)", resp.getMatchedTierName());
        assertEquals(new BigDecimal("1500.00"), resp.getSavingAmountPerUnit());
        assertEquals(new BigDecimal("18000.00"), resp.getTotalSavingAmount()); // 1500 * 12
    }

    @Test
    @DisplayName("TC-12: AC TC-02 - Giữ nguyên tên bậc giá lẻ khi số lượng giảm dưới ngưỡng sỉ")
    void testResolvePricingDecision_RetailTierPreserved_WhenQuantityFallsBelowWholesale() {
        BigDecimal regularPrice = new BigDecimal("12000.00");
        BigDecimal quantity = new BigDecimal("5.000");

        // Bậc giá lẻ có giá bằng giá niêm yết
        ProductPriceTier retailTier = ProductPriceTier.builder()
                .id("tier-retail")
                .tierName("Giá bán lẻ")
                .price(new BigDecimal("12000.00"))
                .build();

        PricingDecision decision = productPriceTierService.resolvePricingDecision(
                regularPrice,
                retailTier,
                null,
                quantity
        );

        assertEquals(new BigDecimal("12000.00"), decision.getUnitPrice());
        assertEquals(BigDecimal.ZERO, decision.getDiscountAmount());
        assertEquals("Giá bán lẻ", decision.getPriceTierName());
        assertEquals(retailTier, decision.getPriceTier());
        assertNull(decision.getPromotionName());
    }

    @Test
    @DisplayName("TC-13: Đồng bộ batchSavePriceTiers thành công")
    void testBatchSavePriceTiers_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));
        when(productUnitConversionRepository.findByProductId("prod-1")).thenReturn(Collections.emptyList());
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrice("prod-1", "household-1")).thenReturn(new BigDecimal("9500.00"));
        when(productPriceTierRepository.findByProductIdAndHouseholdIdOrderByMinQuantityAsc("prod-1", "household-1")).thenReturn(Collections.emptyList());

        BatchSavePriceTiersRequest request = BatchSavePriceTiersRequest.builder()
                .tiers(List.of(
                        CreatePriceTierRequest.builder()
                                .tierName("Giá lẻ (1-9)")
                                .minQuantity(new BigDecimal("1.000"))
                                .maxQuantity(new BigDecimal("9.000"))
                                .price(new BigDecimal("12000.00"))
                                .build(),
                        CreatePriceTierRequest.builder()
                                .tierName("Giá sỉ (≥ 10)")
                                .minQuantity(new BigDecimal("10.000"))
                                .maxQuantity(null)
                                .price(new BigDecimal("10500.00"))
                                .build()
                ))
                .build();

        when(productPriceTierRepository.saveAll(anyList())).thenAnswer(invocation -> {
            List<ProductPriceTier> list = invocation.getArgument(0);
            for (int i = 0; i < list.size(); i++) {
                list.get(i).setId("saved-tier-" + (i + 1));
            }
            return list;
        });

        List<ProductPriceTierResponse> responses = productPriceTierService.batchSavePriceTiers("owner", "prod-1", request);

        assertNotNull(responses);
        assertEquals(2, responses.size());
        verify(productPriceTierRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("TC-14: Xóa bậc giá thành công")
    void testDeletePriceTier_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));

        ProductPriceTier tier = ProductPriceTier.builder()
                .id("tier-to-delete")
                .product(product)
                .household(household)
                .tierName("Giá sỉ tạm thời")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("11000.00"))
                .build();

        when(productPriceTierRepository.findByIdAndHouseholdId("tier-to-delete", "household-1")).thenReturn(Optional.of(tier));

        productPriceTierService.deletePriceTier("owner", "prod-1", "tier-to-delete");

        verify(productPriceTierRepository, times(1)).delete(tier);
    }

    @Test
    @DisplayName("P2 - Medium: Xóa bậc giá đã áp dụng trong đơn hàng lịch sử -> chuyển sang không hoạt động (isActive = false)")
    void testDeletePriceTier_ReferencedByOrders_SoftDeactivates() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));

        ProductPriceTier tier = ProductPriceTier.builder()
                .id("tier-in-use")
                .product(product)
                .household(household)
                .tierName("Giá sỉ đã dùng trong đơn")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("11000.00"))
                .isActive(true)
                .build();

        when(productPriceTierRepository.findByIdAndHouseholdId("tier-in-use", "household-1")).thenReturn(Optional.of(tier));
        when(orderItemRepository.existsByPriceTierId("tier-in-use")).thenReturn(true);

        productPriceTierService.deletePriceTier("owner", "prod-1", "tier-in-use");

        verify(productPriceTierRepository, never()).delete(any());
        verify(productPriceTierRepository, times(1)).save(argThat(t -> Boolean.FALSE.equals(t.getIsActive())));
    }

    @Test
    @DisplayName("P2 - Medium: API lấy danh sách bậc giá chỉ trả về các bậc giá đang có hiệu lực (isActive = true)")
    void testGetProductPriceTiers_FiltersActiveOnly() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "household-1")).thenReturn(Optional.of(product));
        when(goodsReceiptDetailRepository.calculateWeightedAverageCostPrice("prod-1", "household-1")).thenReturn(new BigDecimal("9500.00"));

        ProductPriceTier activeTier = ProductPriceTier.builder()
                .id("tier-active")
                .product(product)
                .household(household)
                .tierName("Giá sỉ đang hoạt động")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("10500.00"))
                .isActive(true)
                .build();

        when(productPriceTierRepository.findByProductIdAndHouseholdIdAndIsActiveTrueOrderByMinQuantityAsc("prod-1", "household-1"))
                .thenReturn(List.of(activeTier));

        List<ProductPriceTierResponse> responses = productPriceTierService.getProductPriceTiers("owner", "prod-1");

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("tier-active", responses.get(0).getId());
        verify(productPriceTierRepository, times(1))
                .findByProductIdAndHouseholdIdAndIsActiveTrueOrderByMinQuantityAsc("prod-1", "household-1");
    }
}
