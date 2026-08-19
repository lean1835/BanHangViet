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

        Promotion dummySaved = Promotion.builder()
                .id("promo-2")
                .household(mockHousehold)
                .name(request.getName())
                .build();
        when(promotionRepository.save(any(Promotion.class))).thenReturn(dummySaved);

        AppException exception = assertThrows(AppException.class, () ->
                promotionService.createPromotion("owner", request));

        assertEquals(ErrorCode.PROMOTION_TARGET_REQUIRED, exception.getErrorCode());
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
