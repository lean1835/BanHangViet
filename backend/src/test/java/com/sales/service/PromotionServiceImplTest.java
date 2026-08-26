package com.sales.service;

import com.sales.constant.DiscountType;
import com.sales.constant.PromotionApplyScope;
import com.sales.constant.PromotionStatus;
import com.sales.dto.request.PromotionCreateRequest;
import com.sales.dto.request.PromotionUpdateRequest;
import com.sales.dto.response.PromotionResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.PromotionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PromotionServiceImplTest {

    @Mock
    private PromotionRepository promotionRepository;

    @Mock
    private PromotionProductRepository promotionProductRepository;

    @Mock
    private PromotionProductGroupRepository promotionProductGroupRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductGroupRepository productGroupRepository;

    @InjectMocks
    private PromotionServiceImpl promotionService;

    private User mockUser;
    private BusinessHousehold mockHousehold;

    @BeforeEach
    void setUp() {
        mockHousehold = BusinessHousehold.builder()
                .id("household-123")
                .name("Hộ Kinh Doanh Mẫu")
                .taxCode("0123456789")
                .build();

        mockUser = User.builder()
                .id("user-123")
                .username("owner")
                .fullName("Chủ Hộ Kinh Doanh")
                .household(mockHousehold)
                .build();
    }

    @Test
    @DisplayName("Tạo chương trình khuyến mại áp dụng tất cả mặt hàng thành công")
    void createPromotion_Success_AllScope() {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại tháng 9")
                .description("Giảm 10% cho tất cả sản phẩm")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));
        when(promotionRepository.existsByHouseholdIdAndNameAndDeletedAtIsNull("household-123", "Khuyến mại tháng 9"))
                .thenReturn(false);

        Promotion savedPromo = Promotion.builder()
                .id("promo-1")
                .household(mockHousehold)
                .name("Khuyến mại tháng 9")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(PromotionStatus.ACTIVE)
                .createdByUser(mockUser)
                .build();

        when(promotionRepository.save(any(Promotion.class))).thenReturn(savedPromo);

        PromotionResponse response = promotionService.createPromotion("owner", request);

        assertNotNull(response);
        assertEquals("promo-1", response.getId());
        assertEquals("Khuyến mại tháng 9", response.getName());
        assertEquals(PromotionStatus.ACTIVE, response.getStatus());
        verify(promotionRepository, times(1)).save(any(Promotion.class));
    }

    @Test
    @DisplayName("TC-02: Báo lỗi khi ngày kết thúc trước ngày bắt đầu")
    void createPromotion_InvalidDate_ThrowsException() {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại sai ngày")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(1)) // End date before start date
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));

        AppException exception = assertThrows(AppException.class, () ->
                promotionService.createPromotion("owner", request));

        assertEquals(ErrorCode.INVALID_PROMOTION_DATE, exception.getErrorCode());
        verify(promotionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Báo lỗi khi tên chương trình trùng lặp")
    void createPromotion_DuplicateName_ThrowsException() {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại trùng tên")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));
        when(promotionRepository.existsByHouseholdIdAndNameAndDeletedAtIsNull("household-123", "Khuyến mại trùng tên"))
                .thenReturn(true);

        AppException exception = assertThrows(AppException.class, () ->
                promotionService.createPromotion("owner", request));

        assertEquals(ErrorCode.PROMOTION_NAME_EXISTS, exception.getErrorCode());
    }

    @Test
    @DisplayName("Báo lỗi khi chọn scope PRODUCT nhưng không truyền danh sách productIds")
    void createPromotion_MissingProductTarget_ThrowsException() {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại theo sản phẩm")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .applyScope(PromotionApplyScope.PRODUCT)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .productIds(Collections.emptyList())
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));
        when(promotionRepository.existsByHouseholdIdAndNameAndDeletedAtIsNull("household-123", "Khuyến mại theo sản phẩm"))
                .thenReturn(false);

        AppException exception = assertThrows(AppException.class, () ->
                promotionService.createPromotion("owner", request));

        assertEquals(ErrorCode.PROMOTION_TARGET_REQUIRED, exception.getErrorCode());
    }

    @Test
    @DisplayName("NCL-15-CN-001-TC-01: Tạo chương trình khuyến mại áp dụng nhóm sản phẩm thành công")
    void createPromotion_Success_ProductGroupScope() {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại Gia vị tháng 9")
                .description("Giảm 10% cho nhóm Gia vị")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .applyScope(PromotionApplyScope.PRODUCT_GROUP)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .productGroupIds(List.of("group-1"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));
        when(promotionRepository.existsByHouseholdIdAndNameAndDeletedAtIsNull("household-123", "Khuyến mại Gia vị tháng 9"))
                .thenReturn(false);

        ProductGroup mockGroup = ProductGroup.builder()
                .id("group-1")
                .name("Gia vị")
                .household(mockHousehold)
                .build();
        when(productGroupRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(List.of("group-1"), "household-123"))
                .thenReturn(List.of(mockGroup));

        Promotion savedPromo = Promotion.builder()
                .id("promo-group-1")
                .household(mockHousehold)
                .name("Khuyến mại Gia vị tháng 9")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .applyScope(PromotionApplyScope.PRODUCT_GROUP)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(PromotionStatus.ACTIVE)
                .createdByUser(mockUser)
                .build();

        when(promotionRepository.save(any(Promotion.class))).thenReturn(savedPromo);

        PromotionResponse response = promotionService.createPromotion("owner", request);

        assertNotNull(response);
        assertEquals("promo-group-1", response.getId());
        assertEquals("Khuyến mại Gia vị tháng 9", response.getName());
        assertEquals(PromotionApplyScope.PRODUCT_GROUP, response.getApplyScope());
        verify(productGroupRepository, times(1)).findAllByIdInAndHouseholdIdAndDeletedAtIsNull(List.of("group-1"), "household-123");
        verify(promotionRepository, times(1)).save(any(Promotion.class));
    }

    @Test
    @DisplayName("Tạo chương trình khuyến mại áp dụng danh sách sản phẩm thành công")
    void createPromotion_Success_ProductScope() {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại Nước ngọt")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(5000))
                .applyScope(PromotionApplyScope.PRODUCT)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .productIds(List.of("prod-1", "prod-2"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));
        when(promotionRepository.existsByHouseholdIdAndNameAndDeletedAtIsNull("household-123", "Khuyến mại Nước ngọt"))
                .thenReturn(false);

        Product prod1 = Product.builder().id("prod-1").name("Coca").household(mockHousehold).build();
        Product prod2 = Product.builder().id("prod-2").name("Pepsi").household(mockHousehold).build();
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(List.of("prod-1", "prod-2"), "household-123"))
                .thenReturn(List.of(prod1, prod2));

        Promotion savedPromo = Promotion.builder()
                .id("promo-prod-1")
                .household(mockHousehold)
                .name("Khuyến mại Nước ngọt")
                .discountType(DiscountType.FIXED_AMOUNT)
                .discountValue(BigDecimal.valueOf(5000))
                .applyScope(PromotionApplyScope.PRODUCT)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(PromotionStatus.ACTIVE)
                .createdByUser(mockUser)
                .build();

        when(promotionRepository.save(any(Promotion.class))).thenReturn(savedPromo);

        PromotionResponse response = promotionService.createPromotion("owner", request);

        assertNotNull(response);
        assertEquals("promo-prod-1", response.getId());
        assertEquals(PromotionApplyScope.PRODUCT, response.getApplyScope());
        verify(productRepository, times(1)).findAllByIdInAndHouseholdIdAndDeletedAtIsNull(List.of("prod-1", "prod-2"), "household-123");

        ArgumentCaptor<Promotion> promoCaptor = ArgumentCaptor.forClass(Promotion.class);
        verify(promotionRepository, times(1)).save(promoCaptor.capture());
        assertEquals(2, promoCaptor.getValue().getPromotionProducts().size(), "Phải lưu đủ 2 sản phẩm khuyến mại, không bị nuốt phần tử");
    }

    @Test
    @DisplayName("RISK-01 / P1 Fix: Tạo khuyến mại nhiều nhóm sản phẩm giữ nguyên toàn bộ targets trong Set")
    void createPromotion_Success_MultipleProductGroups_RetainsAllTargets() {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại Đồ uống và Bánh kẹo")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(15))
                .applyScope(PromotionApplyScope.PRODUCT_GROUP)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .productGroupIds(List.of("group-1", "group-2", "group-3"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));
        when(promotionRepository.existsByHouseholdIdAndNameAndDeletedAtIsNull("household-123", "Khuyến mại Đồ uống và Bánh kẹo"))
                .thenReturn(false);

        ProductGroup g1 = ProductGroup.builder().id("group-1").name("Đồ uống").household(mockHousehold).build();
        ProductGroup g2 = ProductGroup.builder().id("group-2").name("Bánh kẹo").household(mockHousehold).build();
        ProductGroup g3 = ProductGroup.builder().id("group-3").name("Gia vị").household(mockHousehold).build();
        when(productGroupRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(List.of("group-1", "group-2", "group-3"), "household-123"))
                .thenReturn(List.of(g1, g2, g3));

        Promotion savedPromo = Promotion.builder()
                .id("promo-groups")
                .household(mockHousehold)
                .name("Khuyến mại Đồ uống và Bánh kẹo")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(15))
                .applyScope(PromotionApplyScope.PRODUCT_GROUP)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(PromotionStatus.ACTIVE)
                .createdByUser(mockUser)
                .build();
        when(promotionRepository.save(any(Promotion.class))).thenReturn(savedPromo);

        PromotionResponse response = promotionService.createPromotion("owner", request);

        assertNotNull(response);
        ArgumentCaptor<Promotion> promoCaptor = ArgumentCaptor.forClass(Promotion.class);
        verify(promotionRepository, times(1)).save(promoCaptor.capture());
        assertEquals(3, promoCaptor.getValue().getPromotionProductGroups().size(), "Phải lưu đủ 3 nhóm sản phẩm khuyến mại");
    }

    @Test
    @DisplayName("Báo lỗi khi mức giảm giá bằng 0 hoặc âm")
    void createPromotion_ZeroOrNegativeDiscount_ThrowsException() {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại 0 đồng")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.ZERO)
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));

        AppException exception = assertThrows(AppException.class, () ->
                promotionService.createPromotion("owner", request));

        assertEquals(ErrorCode.INVALID_PROMOTION_DISCOUNT_VALUE, exception.getErrorCode());
        verify(promotionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Cập nhật chương trình khuyến mại thành công")
    void updatePromotion_Success() {
        Promotion existingPromo = Promotion.builder()
                .id("promo-1")
                .household(mockHousehold)
                .name("Tên cũ")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(5))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .status(PromotionStatus.ACTIVE)
                .build();

        PromotionUpdateRequest updateRequest = PromotionUpdateRequest.builder()
                .name("Tên mới")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(15))
                .applyScope(PromotionApplyScope.PRODUCT_GROUP)
                .startDate(LocalDateTime.now().plusDays(2))
                .endDate(LocalDateTime.now().plusDays(12))
                .productGroupIds(List.of("group-1"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));
        when(promotionRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("promo-1", "household-123"))
                .thenReturn(Optional.of(existingPromo));
        when(promotionRepository.existsByHouseholdIdAndNameAndIdNotAndDeletedAtIsNull("household-123", "Tên mới", "promo-1"))
                .thenReturn(false);

        ProductGroup mockGroup = ProductGroup.builder().id("group-1").name("Gia vị").household(mockHousehold).build();
        when(productGroupRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(List.of("group-1"), "household-123"))
                .thenReturn(List.of(mockGroup));
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(i -> i.getArgument(0));

        PromotionResponse response = promotionService.updatePromotion("owner", "promo-1", updateRequest);

        assertNotNull(response);
        assertEquals("Tên mới", response.getName());
        assertEquals(BigDecimal.valueOf(15), response.getDiscountValue());
        assertEquals(PromotionApplyScope.PRODUCT_GROUP, response.getApplyScope());
        verify(promotionRepository, times(1)).save(existingPromo);
    }

    @Test
    @DisplayName("Bật/Tắt trạng thái khuyến mại thành công")
    void togglePromotionStatus_Success() {
        Promotion existingPromo = Promotion.builder()
                .id("promo-1")
                .household(mockHousehold)
                .status(PromotionStatus.ACTIVE)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));
        when(promotionRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("promo-1", "household-123"))
                .thenReturn(Optional.of(existingPromo));
        when(promotionRepository.save(any(Promotion.class))).thenAnswer(i -> i.getArgument(0));

        PromotionResponse response = promotionService.togglePromotionStatus("owner", "promo-1");

        assertNotNull(response);
        assertEquals(PromotionStatus.INACTIVE, response.getStatus());
    }

    @Test
    @DisplayName("Xóa khuyến mại (soft delete) thành công")
    void deletePromotion_Success() {
        Promotion existingPromo = Promotion.builder()
                .id("promo-1")
                .household(mockHousehold)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(mockUser));
        when(promotionRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("promo-1", "household-123"))
                .thenReturn(Optional.of(existingPromo));

        promotionService.deletePromotion("owner", "promo-1");

        assertNotNull(existingPromo.getDeletedAt());
        verify(promotionRepository, times(1)).save(existingPromo);
    }

    // ==========================================
    // AUTO APPLY PROMOTION TESTS (NCL-15-CN-002)
    // ==========================================

    @Test
    @DisplayName("NCL-15-CN-002-TC-01: Luồng thành công - Áp dụng tự động đợt khuyến mại đang hiệu lực")
    void testTC01_AutoApplySingleActivePromotion_Success() {
        Role staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        User staffUser = User.builder().id("user-staff").username("nhanvien").role(staffRole).household(mockHousehold).build();
        Product product = Product.builder().id("prod-1").name("Nước ngọt Coca-Cola 320ml").price(new BigDecimal("10000.00")).household(mockHousehold).build();
        Promotion promo10 = Promotion.builder().id("promo-10").name("Giảm giá 10% Coca-Cola").discountType(DiscountType.PERCENTAGE).discountValue(new BigDecimal("10.00")).applyScope(PromotionApplyScope.ALL).startDate(LocalDateTime.now().minusDays(1)).endDate(LocalDateTime.now().plusDays(5)).status(PromotionStatus.ACTIVE).household(mockHousehold).build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("household-123"), any(LocalDateTime.class)))
                .thenReturn(List.of(promo10));
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(any(), eq("household-123")))
                .thenReturn(List.of(product));

        com.sales.dto.request.AutoApplyPromotionRequest request = com.sales.dto.request.AutoApplyPromotionRequest.builder()
                .items(List.of(com.sales.dto.request.OrderItemPromotionCheckRequest.builder()
                        .productId("prod-1")
                        .quantity(new BigDecimal("5"))
                        .build()))
                .build();

        com.sales.dto.response.AutoApplyPromotionResponse response = promotionService.autoApplyPromotions("nhanvien", request);

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        com.sales.dto.response.PromotionItemResultResponse itemResult = response.getItems().get(0);

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
        Role staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        User staffUser = User.builder().id("user-staff").username("nhanvien").role(staffRole).household(mockHousehold).build();
        Product product = Product.builder().id("prod-1").name("Nước ngọt Coca-Cola 320ml").price(new BigDecimal("10000.00")).household(mockHousehold).build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("household-123"), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(any(), eq("household-123")))
                .thenReturn(List.of(product));

        com.sales.dto.request.AutoApplyPromotionRequest request = com.sales.dto.request.AutoApplyPromotionRequest.builder()
                .items(List.of(com.sales.dto.request.OrderItemPromotionCheckRequest.builder()
                        .productId("prod-1")
                        .quantity(new BigDecimal("2"))
                        .build()))
                .build();

        com.sales.dto.response.AutoApplyPromotionResponse response = promotionService.autoApplyPromotions("nhanvien", request);

        assertNotNull(response);
        com.sales.dto.response.PromotionItemResultResponse itemResult = response.getItems().get(0);

        assertFalse(itemResult.isHasPromotion());
        assertNull(itemResult.getPromotionId());
        assertEquals(new BigDecimal("0.00"), itemResult.getDiscountAmount());
        assertEquals(new BigDecimal("20000.00"), itemResult.getFinalSubtotal());
    }

    @Test
    @DisplayName("NCL-15-CN-002-TC-03 & QTN-26: Trùng nhiều khuyến mại - Áp dụng đúng 1 đợt có lợi nhất cho khách (20%)")
    void testTC03_MultipleActivePromotions_ResolvesBestDiscountForCustomer_QTN26() {
        Role staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        User staffUser = User.builder().id("user-staff").username("nhanvien").role(staffRole).household(mockHousehold).build();
        Product product = Product.builder().id("prod-1").name("Nước ngọt Coca-Cola 320ml").price(new BigDecimal("10000.00")).household(mockHousehold).build();
        Promotion promo10 = Promotion.builder().id("promo-10").name("Giảm giá 10% Coca-Cola").discountType(DiscountType.PERCENTAGE).discountValue(new BigDecimal("10.00")).applyScope(PromotionApplyScope.ALL).startDate(LocalDateTime.now().minusDays(1)).endDate(LocalDateTime.now().plusDays(5)).status(PromotionStatus.ACTIVE).household(mockHousehold).build();
        Promotion promo20 = Promotion.builder().id("promo-20").name("Siêu Khuyến Mại Giảm 20%").discountType(DiscountType.PERCENTAGE).discountValue(new BigDecimal("20.00")).applyScope(PromotionApplyScope.ALL).startDate(LocalDateTime.now().minusDays(1)).endDate(LocalDateTime.now().plusDays(5)).status(PromotionStatus.ACTIVE).household(mockHousehold).build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("household-123"), any(LocalDateTime.class)))
                .thenReturn(List.of(promo10, promo20));
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(any(), eq("household-123")))
                .thenReturn(List.of(product));

        com.sales.dto.request.AutoApplyPromotionRequest request = com.sales.dto.request.AutoApplyPromotionRequest.builder()
                .items(List.of(com.sales.dto.request.OrderItemPromotionCheckRequest.builder()
                        .productId("prod-1")
                        .quantity(new BigDecimal("10"))
                        .build()))
                .build();

        com.sales.dto.response.AutoApplyPromotionResponse response = promotionService.autoApplyPromotions("nhanvien", request);

        assertNotNull(response);
        com.sales.dto.response.PromotionItemResultResponse itemResult = response.getItems().get(0);

        assertTrue(itemResult.isHasPromotion());
        assertEquals("promo-20", itemResult.getPromotionId());
        assertEquals("Siêu Khuyến Mại Giảm 20%", itemResult.getPromotionName());
        assertEquals(new BigDecimal("20000.00"), itemResult.getDiscountAmount());
        assertEquals(new BigDecimal("80000.00"), itemResult.getFinalSubtotal());
    }

    @Test
    @DisplayName("NCL-15-CN-002-TC-04: Nhân viên muốn bỏ khuyến mại -> Chặn và báo lỗi FORBIDDEN")
    void testTC04_SalespersonBypassPromotion_ThrowsException() {
        Role staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        User staffUser = User.builder().id("user-staff").username("nhanvien").role(staffRole).household(mockHousehold).build();
        Product product = Product.builder().id("prod-1").name("Nước ngọt Coca-Cola 320ml").price(new BigDecimal("10000.00")).household(mockHousehold).build();
        Promotion promo10 = Promotion.builder().id("promo-10").name("Giảm giá 10% Coca-Cola").discountType(DiscountType.PERCENTAGE).discountValue(new BigDecimal("10.00")).applyScope(PromotionApplyScope.ALL).startDate(LocalDateTime.now().minusDays(1)).endDate(LocalDateTime.now().plusDays(5)).status(PromotionStatus.ACTIVE).household(mockHousehold).build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("household-123"), any(LocalDateTime.class)))
                .thenReturn(List.of(promo10));
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(any(), eq("household-123")))
                .thenReturn(List.of(product));

        com.sales.dto.request.AutoApplyPromotionRequest request = com.sales.dto.request.AutoApplyPromotionRequest.builder()
                .items(List.of(com.sales.dto.request.OrderItemPromotionCheckRequest.builder()
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
        Role ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build();
        User ownerUser = User.builder().id("user-owner").username("chuho").role(ownerRole).household(mockHousehold).build();
        Product product = Product.builder().id("prod-1").name("Nước ngọt Coca-Cola 320ml").price(new BigDecimal("10000.00")).household(mockHousehold).build();
        Promotion promo10 = Promotion.builder().id("promo-10").name("Giảm giá 10% Coca-Cola").discountType(DiscountType.PERCENTAGE).discountValue(new BigDecimal("10.00")).applyScope(PromotionApplyScope.ALL).startDate(LocalDateTime.now().minusDays(1)).endDate(LocalDateTime.now().plusDays(5)).status(PromotionStatus.ACTIVE).household(mockHousehold).build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("household-123"), any(LocalDateTime.class)))
                .thenReturn(List.of(promo10));
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(any(), eq("household-123")))
                .thenReturn(List.of(product));

        com.sales.dto.request.AutoApplyPromotionRequest request = com.sales.dto.request.AutoApplyPromotionRequest.builder()
                .items(List.of(com.sales.dto.request.OrderItemPromotionCheckRequest.builder()
                        .productId("prod-1")
                        .quantity(new BigDecimal("1"))
                        .bypassPromotion(true)
                        .build()))
                .build();

        com.sales.dto.response.AutoApplyPromotionResponse response = promotionService.autoApplyPromotions("chuho", request);

        assertNotNull(response);
        com.sales.dto.response.PromotionItemResultResponse itemResult = response.getItems().get(0);

        assertTrue(itemResult.isBypassPromotion());
        assertFalse(itemResult.isHasPromotion());
        assertNull(itemResult.getPromotionId());
        assertEquals(new BigDecimal("0.00"), itemResult.getDiscountAmount());
        assertEquals(new BigDecimal("10000.00"), itemResult.getFinalSubtotal());
    }

    @Test
    @DisplayName("P2 Fix: autoApplyPromotions báo lỗi PRODUCT_NOT_FOUND khi sản phẩm không thuộc hộ")
    void autoApplyPromotions_ProductNotFound_ThrowsException() {
        Role staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        User staffUser = User.builder().id("user-staff").username("nhanvien").role(staffRole).household(mockHousehold).build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));
        when(promotionRepository.findActivePromotionsAtTime(eq("household-123"), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(any(), eq("household-123")))
                .thenReturn(Collections.emptyList());

        com.sales.dto.request.AutoApplyPromotionRequest request = com.sales.dto.request.AutoApplyPromotionRequest.builder()
                .items(List.of(com.sales.dto.request.OrderItemPromotionCheckRequest.builder()
                        .productId("prod-not-found")
                        .quantity(new BigDecimal("1"))
                        .build()))
                .build();

        AppException ex = assertThrows(AppException.class, () -> promotionService.autoApplyPromotions("nhanvien", request));
        assertEquals(ErrorCode.PRODUCT_NOT_FOUND, ex.getErrorCode());
    }
}
