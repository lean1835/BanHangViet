package com.sales.service;

import com.sales.constant.DiscountType;
import com.sales.constant.PromotionApplyScope;
import com.sales.constant.PromotionStatus;
import com.sales.dto.request.AutoApplyPromotionRequest;
import com.sales.dto.request.OrderItemPromotionCheckRequest;
import com.sales.dto.response.AutoApplyPromotionResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ProductRepository;
import com.sales.repository.PromotionRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.PromotionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PromotionServiceTest {

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PromotionServiceImpl promotionService;

    private BusinessHousehold household;
    private Role ownerRole;
    private Role salespersonRole;
    private User ownerUser;
    private User salespersonUser;
    private Product product;
    private Promotion promo10Percent;
    private Promotion promo20Percent;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("house-1")
                .name("Hộ Tạp Hóa Việt")
                .build();

        ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build();
        salespersonRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("chuho")
                .role(ownerRole)
                .household(household)
                .build();

        salespersonUser = User.builder()
                .id("user-staff")
                .username("nhanvien")
                .role(salespersonRole)
                .household(household)
                .build();

        product = Product.builder()
                .id("prod-1")
                .name("Nước ngọt Coca-Cola 320ml")
                .price(new BigDecimal("10000.00"))
                .household(household)
                .build();

        promo10Percent = Promotion.builder()
                .id("promo-10")
                .name("Giảm giá 10% Coca-Cola")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("10.00"))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .status(PromotionStatus.ACTIVE)
                .household(household)
                .build();

        promo20Percent = Promotion.builder()
                .id("promo-20")
                .name("Siêu Khuyến Mại Giảm 20%")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(new BigDecimal("20.00"))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(5))
                .status(PromotionStatus.ACTIVE)
                .household(household)
                .build();
    }

    @Test
    @DisplayName("NCL-15-CN-002-TC-01: Luồng thành công - Áp dụng tự động đợt khuyến mại đang hiệu lực")
    void testTC01_AutoApplySingleActivePromotion_Success() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salespersonUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("house-1"), any(LocalDateTime.class)))
                .thenReturn(List.of(promo10Percent));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(product));

        AutoApplyPromotionRequest request = AutoApplyPromotionRequest.builder()
                .items(List.of(OrderItemPromotionCheckRequest.builder()
                        .productId("prod-1")
                        .quantity(new BigDecimal("5"))
                        .build()))
                .build();

        AutoApplyPromotionResponse response = promotionService.autoApplyPromotions("nhanvien", request);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        PromotionItemResultResponse itemResult = response.getItems().get(0);

        assertTrue(itemResult.isHasPromotion());
        assertEquals("promo-10", itemResult.getPromotionId());
        assertEquals("Giảm giá 10% Coca-Cola", itemResult.getPromotionName());
        assertEquals(new BigDecimal("50000.00"), itemResult.getOriginalSubtotal());
        assertEquals(new BigDecimal("5000.00"), itemResult.getDiscountAmount());
        assertEquals(new BigDecimal("45000.00"), itemResult.getFinalSubtotal());
    }

    @Test
    @DisplayName("NCL-15-CN-002-TC-02: Sai trạng thái - Không có khuyến mại hiệu lực, bán theo giá gốc")
    void testTC02_ExpiredOrInactivePromotion_Ignored() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salespersonUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("house-1"), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(product));

        AutoApplyPromotionRequest request = AutoApplyPromotionRequest.builder()
                .items(List.of(OrderItemPromotionCheckRequest.builder()
                        .productId("prod-1")
                        .quantity(new BigDecimal("2"))
                        .build()))
                .build();

        AutoApplyPromotionResponse response = promotionService.autoApplyPromotions("nhanvien", request);

        assertNotNull(response);
        PromotionItemResultResponse itemResult = response.getItems().get(0);

        assertFalse(itemResult.isHasPromotion());
        assertNull(itemResult.getPromotionId());
        assertEquals(new BigDecimal("0.00"), itemResult.getDiscountAmount());
        assertEquals(new BigDecimal("20000.00"), itemResult.getFinalSubtotal());
    }

    @Test
    @DisplayName("NCL-15-CN-002-TC-03 & QTN-26: Trùng nhiều khuyến mại - Áp dụng đúng 1 đợt có lợi nhất cho khách (20%)")
    void testTC03_MultipleActivePromotions_ResolvesBestDiscountForCustomer_QTN26() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salespersonUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("house-1"), any(LocalDateTime.class)))
                .thenReturn(List.of(promo10Percent, promo20Percent));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(product));

        AutoApplyPromotionRequest request = AutoApplyPromotionRequest.builder()
                .items(List.of(OrderItemPromotionCheckRequest.builder()
                        .productId("prod-1")
                        .quantity(new BigDecimal("10"))
                        .build()))
                .build();

        AutoApplyPromotionResponse response = promotionService.autoApplyPromotions("nhanvien", request);

        assertNotNull(response);
        PromotionItemResultResponse itemResult = response.getItems().get(0);

        assertTrue(itemResult.isHasPromotion());
        assertEquals("promo-20", itemResult.getPromotionId());
        assertEquals("Siêu Khuyến Mại Giảm 20%", itemResult.getPromotionName());
        assertEquals(new BigDecimal("20000.00"), itemResult.getDiscountAmount());
        assertEquals(new BigDecimal("80000.00"), itemResult.getFinalSubtotal());
    }

    @Test
    @DisplayName("NCL-15-CN-002-TC-04: Nhân viên muốn bỏ khuyến mại -> Chặn và báo lỗi FORBIDDEN")
    void testTC04_SalespersonBypassPromotion_ThrowsException() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salespersonUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("house-1"), any(LocalDateTime.class)))
                .thenReturn(List.of(promo10Percent));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(product));

        AutoApplyPromotionRequest request = AutoApplyPromotionRequest.builder()
                .items(List.of(OrderItemPromotionCheckRequest.builder()
                        .productId("prod-1")
                        .quantity(new BigDecimal("1"))
                        .bypassPromotion(true)
                        .build()))
                .build();

        AppException ex = assertThrows(AppException.class, () -> promotionService.autoApplyPromotions("nhanvien", request));
        assertEquals(ErrorCode.PROMOTION_REMOVE_REQUIRES_OWNER, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-15-CN-002-TC-04: Chủ hộ có quyền bỏ khuyến mại tự động")
    void testTC04_OwnerBypassPromotion_Success() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("house-1"), any(LocalDateTime.class)))
                .thenReturn(List.of(promo10Percent));
        when(productRepository.findById("prod-1")).thenReturn(Optional.of(product));

        AutoApplyPromotionRequest request = AutoApplyPromotionRequest.builder()
                .items(List.of(OrderItemPromotionCheckRequest.builder()
                        .productId("prod-1")
                        .quantity(new BigDecimal("1"))
                        .bypassPromotion(true)
                        .build()))
                .build();

        AutoApplyPromotionResponse response = promotionService.autoApplyPromotions("chuho", request);

        assertNotNull(response);
        PromotionItemResultResponse itemResult = response.getItems().get(0);

        assertTrue(itemResult.isBypassPromotion());
        assertFalse(itemResult.isHasPromotion());
        assertNull(itemResult.getPromotionId());
        assertEquals(new BigDecimal("0.00"), itemResult.getDiscountAmount());
        assertEquals(new BigDecimal("10000.00"), itemResult.getFinalSubtotal());
    }
}
