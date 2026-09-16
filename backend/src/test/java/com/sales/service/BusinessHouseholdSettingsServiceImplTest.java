package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.UpdateAutoRetrySettingsRequest;
import com.sales.dto.response.AutoRetrySettingsResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.BusinessHouseholdSettings;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.BusinessHouseholdSettingsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BusinessHouseholdSettingsServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;
    @Mock
    private ActivityLogHelper activityLogHelper;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private BusinessHouseholdSettingsServiceImpl settingsService;

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
                .autoRetryEnabled(true)
                .maxRetryAttempts(3)
                .retryIntervalMinutes(15)
                .maxRetryHoursDeadline(24)
                .returnDaysLimit(7)
                .maxOfflineSyncHours(24)
                .debtReminderDaysBefore(3)
                .maxOrderHoldingHours(4)
                .bankTransferTimeoutMinutes(15)
                .expenseApprovalThreshold(new BigDecimal("500000.00"))
                .shiftDifferenceThreshold(BigDecimal.ZERO)
                .build();
    }

    @Test
    @DisplayName("NCL-09-CN-008-TC-01: Chủ hộ nhập các mốc thời hạn hợp lệ -> Lưu thành công và trả về giá trị mới")
    void testUpdateSettings_ValidDeadlinesSuccess() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(settings));
        when(settingsRepository.save(any(BusinessHouseholdSettings.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateAutoRetrySettingsRequest request = UpdateAutoRetrySettingsRequest.builder()
                .autoRetryEnabled(true)
                .maxRetryAttempts(5)
                .retryIntervalMinutes(30)
                .maxRetryHoursDeadline(48)
                .returnDaysLimit(14)
                .maxOfflineSyncHours(48)
                .debtReminderDaysBefore(5)
                .maxOrderHoldingHours(6)
                .bankTransferTimeoutMinutes(20)
                .build();

        AutoRetrySettingsResponse response = settingsService.updateSettings("owner1", request);

        assertNotNull(response);
        assertEquals(5, response.getMaxRetryAttempts());
        assertEquals(30, response.getRetryIntervalMinutes());
        assertEquals(48, response.getMaxRetryHoursDeadline());
        assertEquals(14, response.getReturnDaysLimit());
        assertEquals(48, response.getMaxOfflineSyncHours());
        assertEquals(5, response.getDebtReminderDaysBefore());
        verify(settingsRepository, times(1)).save(settings);
    }

    @Test
    @DisplayName("NCL-09-CN-008-TC-02: Nhân viên không phải chủ hộ (VT-02) cố cập nhật cấu hình thời hạn -> Bị chặn với FORBIDDEN (403)")
    void testUpdateSettings_ForbiddenForNonOwner() {
        Role staffRole = Role.builder().id(2).code("VT-02").name("Thu ngân").build();
        User staff = User.builder().id("u-2").username("staff1").role(staffRole).household(household).build();

        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(staff));

        UpdateAutoRetrySettingsRequest request = UpdateAutoRetrySettingsRequest.builder()
                .autoRetryEnabled(true)
                .maxRetryAttempts(3)
                .retryIntervalMinutes(15)
                .maxRetryHoursDeadline(24)
                .build();

        AppException ex = assertThrows(AppException.class, () -> settingsService.updateSettings("staff1", request));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        verify(settingsRepository, never()).save(any());
    }

    @Test
    @DisplayName("NCL-09-CN-008-TC-03: Cập nhật cấu hình -> Ghi nhận nhật ký hoạt động (Activity Log)")
    void testUpdateSettings_ActivityLogTriggered() throws Exception {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(settings));
        when(settingsRepository.save(any(BusinessHouseholdSettings.class))).thenAnswer(inv -> inv.getArgument(0));
        when(objectMapper.writeValueAsString(any())).thenReturn("{}");

        UpdateAutoRetrySettingsRequest request = UpdateAutoRetrySettingsRequest.builder()
                .autoRetryEnabled(true)
                .maxRetryAttempts(4)
                .retryIntervalMinutes(20)
                .maxRetryHoursDeadline(36)
                .returnDaysLimit(10)
                .build();

        settingsService.updateSettings("owner1", request);

        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(ownerUser), eq("UPDATE_HOUSEHOLD_SETTINGS"),
                eq("business_household_settings"), any(), any(), any(), isNull(), isNull());
    }
}
