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
}
