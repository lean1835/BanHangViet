package com.sales.service;

import com.sales.dto.response.OnboardingStatusResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.HouseholdOnboardingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HouseholdOnboardingServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;
    @Mock
    private InvoiceNumberRangeRepository invoiceNumberRangeRepository;
    @Mock
    private InvoiceTemplateRepository invoiceTemplateRepository;
    @Mock
    private TaxRateRepository taxRateRepository;
    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private HouseholdOnboardingServiceImpl onboardingService;

    private User ownerUser;
    private BusinessHousehold household;
    private BusinessHouseholdSettings settings;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Cửa Hàng Bách Hóa Việt")
                .taxCode("0123456789")
                .build();

        ownerUser = User.builder()
                .id("u-1")
                .username("owner1")
                .role(ownerRole)
                .household(household)
                .build();

        settings = BusinessHouseholdSettings.builder()
                .id("set-1")
                .household(household)
                .isOnboardingCompleted(false)
                .isOnboardingSkipped(false)
                .returnDaysLimit(7)
                .maxOfflineSyncHours(24)
                .debtReminderDaysBefore(3)
                .build();
    }

    @Test
    @DisplayName("NCL-09-CN-007-TC-01: Hộ mới tạo, còn thiếu các bước bắt buộc -> isReadyForInvoicing = false, còn bước thiếu")
    void testGetOnboardingStatus_IncompleteSteps() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(settings));

        // Invoice range trống
        when(invoiceNumberRangeRepository.findActiveRangesByHouseholdId("hh-1")).thenReturn(Collections.emptyList());
        when(invoiceTemplateRepository.findByHouseholdId("hh-1")).thenReturn(Optional.empty());

        // Chưa có thuế suất
        when(taxRateRepository.existsByHouseholdIdAndIsActiveTrue("hh-1")).thenReturn(false);

        // Chưa có sản phẩm
        when(productRepository.countByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(0L);

        // Chưa có nhân viên
        when(userRepository.existsByHouseholdIdAndRole_CodeAndDeletedAtIsNull("hh-1", "VT-02")).thenReturn(false);

        OnboardingStatusResponse response = onboardingService.getOnboardingStatus("owner1");

        assertNotNull(response);
        assertFalse(response.isReadyForInvoicing());
        assertFalse(response.isCompleted());
        assertEquals(3, response.getRemainingRequiredSteps()); // Thông tin hộ đã có tên + MST, thiếu range, thuế, sp
        assertEquals(5, response.getSteps().size());
    }

    @Test
    @DisplayName("NCL-09-CN-007-TC-02: Bốn bước bắt buộc đã hoàn tất -> isReadyForInvoicing = true, isCompleted = true không ghi DB trong GET")
    void testGetOnboardingStatus_AllRequiredCompleted() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(settings));

        // Range đã có
        when(invoiceNumberRangeRepository.findActiveRangesByHouseholdId("hh-1"))
                .thenReturn(List.of(InvoiceNumberRange.builder().id("range-1").build()));

        // Thuế suất đã có
        when(taxRateRepository.existsByHouseholdIdAndIsActiveTrue("hh-1")).thenReturn(true);

        // Sản phẩm đã có
        when(productRepository.countByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(5L);

        // Nhân viên đã có
        when(userRepository.existsByHouseholdIdAndRole_CodeAndDeletedAtIsNull("hh-1", "VT-02")).thenReturn(true);

        OnboardingStatusResponse response = onboardingService.getOnboardingStatus("owner1");

        assertNotNull(response);
        assertTrue(response.isReadyForInvoicing());
        assertTrue(response.isCompleted());
        assertEquals(0, response.getRemainingRequiredSteps());
        verify(settingsRepository, never()).save(any());
    }

    @Test
    @DisplayName("NCL-09-CN-007-TC-03: Chủ hộ bấm bỏ qua để vào bán ngay -> isSkipped = true, thanh nhắc giữ số bước còn thiếu")
    void testSkipOnboarding_Success() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(settings));
        when(settingsRepository.save(any(BusinessHouseholdSettings.class))).thenAnswer(inv -> inv.getArgument(0));

        when(invoiceNumberRangeRepository.findActiveRangesByHouseholdId("hh-1")).thenReturn(Collections.emptyList());
        when(invoiceTemplateRepository.findByHouseholdId("hh-1")).thenReturn(Optional.empty());
        when(taxRateRepository.existsByHouseholdIdAndIsActiveTrue("hh-1")).thenReturn(false);
        when(productRepository.countByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(0L);
        when(userRepository.existsByHouseholdIdAndRole_CodeAndDeletedAtIsNull("hh-1", "VT-02")).thenReturn(false);

        OnboardingStatusResponse response = onboardingService.skipOnboarding("owner1");

        assertNotNull(response);
        assertTrue(response.isSkipped());
        assertFalse(response.isCompleted());
        assertTrue(response.getRemainingRequiredSteps() > 0);
    }

    @Test
    @DisplayName("NCL-09-CN-007-TC-04: Nhân viên không phải chủ hộ (VT-02) bấm skip -> Ném lỗi FORBIDDEN")
    void testSkipOnboarding_ForbiddenForNonOwner() {
        Role staffRole = Role.builder().id(2).code("VT-02").name("Thu ngân").build();
        User staff = User.builder().id("u-2").username("staff1").role(staffRole).household(household).build();

        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staff));

        AppException ex = assertThrows(AppException.class, () -> onboardingService.skipOnboarding("staff1"));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("P2-1: Gọi completeOnboarding khi chưa hoàn tất 4 bước bắt buộc -> Ném ngoại lệ ONBOARDING_INCOMPLETE")
    void testCompleteOnboarding_IncompleteSteps_ThrowsOnboardingIncomplete() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(settings));

        // Thiếu range, thuế, sản phẩm
        when(invoiceNumberRangeRepository.findActiveRangesByHouseholdId("hh-1")).thenReturn(Collections.emptyList());
        when(invoiceTemplateRepository.findByHouseholdId("hh-1")).thenReturn(Optional.empty());
        when(taxRateRepository.existsByHouseholdIdAndIsActiveTrue("hh-1")).thenReturn(false);
        when(productRepository.countByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(0L);
        when(userRepository.existsByHouseholdIdAndRole_CodeAndDeletedAtIsNull("hh-1", "VT-02")).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> onboardingService.completeOnboarding("owner1"));
        assertEquals(ErrorCode.ONBOARDING_INCOMPLETE, ex.getErrorCode());
        verify(settingsRepository, never()).save(any());
    }

    @Test
    @DisplayName("P2-1: Gọi completeOnboarding khi đã hoàn tất 4 bước bắt buộc -> Đánh dấu hoàn tất thành công")
    void testCompleteOnboarding_AllRequiredCompleted_Success() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(settings));

        when(invoiceNumberRangeRepository.findActiveRangesByHouseholdId("hh-1"))
                .thenReturn(List.of(InvoiceNumberRange.builder().id("range-1").build()));
        when(taxRateRepository.existsByHouseholdIdAndIsActiveTrue("hh-1")).thenReturn(true);
        when(productRepository.countByHouseholdIdAndDeletedAtIsNull("hh-1")).thenReturn(5L);
        when(userRepository.existsByHouseholdIdAndRole_CodeAndDeletedAtIsNull("hh-1", "VT-02")).thenReturn(true);
        when(settingsRepository.save(any(BusinessHouseholdSettings.class))).thenAnswer(inv -> inv.getArgument(0));

        OnboardingStatusResponse response = onboardingService.completeOnboarding("owner1");

        assertNotNull(response);
        assertTrue(response.isReadyForInvoicing());
        assertTrue(response.isCompleted());
        verify(settingsRepository, atLeastOnce()).save(settings);
    }

    @Test
    @DisplayName("P2-1: Nhân viên không phải chủ hộ gọi completeOnboarding -> Ném ngoại lệ FORBIDDEN")
    void testCompleteOnboarding_ForbiddenForNonOwner() {
        Role staffRole = Role.builder().id(2).code("VT-02").name("Thu ngân").build();
        User staff = User.builder().id("u-2").username("staff1").role(staffRole).household(household).build();

        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staff));

        AppException ex = assertThrows(AppException.class, () -> onboardingService.completeOnboarding("staff1"));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }
}
