package com.sales.service;

import com.sales.constant.RevenueThresholdConstants;
import com.sales.constant.RevenueWarningStatus;
import com.sales.dto.request.UpdateWarningThresholdRequest;
import com.sales.dto.response.AnnualRevenueTrackingResponse;
import com.sales.dto.response.AppNotificationResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.UpdateWarningThresholdResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ActivityLogRepository;
import com.sales.repository.AppNotificationRepository;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.AnnualRevenueTrackingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnnualRevenueTrackingServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessHouseholdRepository householdRepository;

    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;

    @Mock
    private EInvoiceRepository invoiceRepository;

    @Mock
    private AppNotificationRepository notificationRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private AnnualRevenueTrackingServiceImpl revenueTrackingService;

    private BusinessHousehold household;
    private User ownerUser;
    private User accountantUser;
    private User salesStaffUser;
    private BusinessHouseholdSettings settings;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-uuid-1")
                .name("Tạp Hóa An Bình")
                .taxCode("0312345678")
                .revenueThresholdEnabled(false)
                .createdAt(LocalDateTime.of(2026, 1, 1, 0, 0))
                .build();

        Role roleOwner = Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build();
        Role roleAccountant = Role.builder().id(3).code("VT-03").name("Kế toán").build();
        Role roleStaff = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();

        ownerUser = User.builder()
                .id("user-owner-1")
                .username("owner1")
                .role(roleOwner)
                .household(household)
                .build();

        accountantUser = User.builder()
                .id("user-acc-1")
                .username("accountant1")
                .role(roleAccountant)
                .household(household)
                .build();

        salesStaffUser = User.builder()
                .id("user-staff-1")
                .username("staff1")
                .role(roleStaff)
                .household(household)
                .build();

        settings = BusinessHouseholdSettings.builder()
                .id("settings-1")
                .household(household)
                .revenueWarningThresholdPercentage(new BigDecimal("80.00"))
                .build();
    }

    @Test
    @DisplayName("TC-01: Luồng thành công - Xem doanh thu lũy kế năm dưới mức cảnh báo 80%")
    void getAnnualRevenueTracking_Success_TC01() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-uuid-1")).thenReturn(Optional.of(settings));

        EInvoice inv1 = EInvoice.builder()
                .id("inv-1")
                .household(household)
                .totalAmountBeforeTax(new BigDecimal("200000000.00"))
                .taxAmount(new BigDecimal("3000000.00"))
                .status("ISSUED")
                .createdAt(LocalDateTime.of(2026, 2, 10, 10, 0))
                .build();

        EInvoice inv2 = EInvoice.builder()
                .id("inv-2")
                .household(household)
                .totalAmountBeforeTax(new BigDecimal("250000000.00"))
                .taxAmount(new BigDecimal("3750000.00"))
                .status("ISSUED")
                .createdAt(LocalDateTime.of(2026, 5, 15, 14, 0))
                .build();

        when(invoiceRepository.findValidInvoicesForTaxPeriod(eq("hh-uuid-1"), any(), any()))
                .thenReturn(List.of(inv1, inv2));

        AnnualRevenueTrackingResponse response = revenueTrackingService.getAnnualRevenueTracking("owner1", 2026);

        assertNotNull(response);
        assertEquals(2026, response.getYear());
        assertEquals("hh-uuid-1", response.getHouseholdId());
        assertEquals(new BigDecimal("450000000.00"), response.getCumulativeRevenue());
        assertEquals(new BigDecimal("6750000.00"), response.getCumulativeTaxAmount());
        assertEquals(2, response.getValidInvoiceCount());
        assertEquals(new BigDecimal("45.00"), response.getThresholdPercentage());
        assertEquals(RevenueWarningStatus.BELOW_WARNING, response.getWarningStatus());
        assertFalse(response.getShouldShowWarning());
        assertFalse(response.getIsMandatory());
        assertNotNull(response.getMonthlyBreakdown());
    }

    @Test
    @DisplayName("QTN-22 & GAP 04: Doanh thu lũy kế trừ chính xác hóa đơn điều chỉnh giảm/trả hàng")
    void getAnnualRevenueTracking_AdjustmentsDeducted_QTN22() {
        when(userRepository.findByUsername("accountant1")).thenReturn(Optional.of(accountantUser));
        when(settingsRepository.findByHouseholdId("hh-uuid-1")).thenReturn(Optional.of(settings));

        EInvoice originalInv = EInvoice.builder()
                .id("inv-orig")
                .household(household)
                .totalAmountBeforeTax(new BigDecimal("50000000.00"))
                .taxAmount(new BigDecimal("750000.00"))
                .status("ISSUED")
                .createdAt(LocalDateTime.of(2026, 3, 1, 9, 0))
                .build();

        ReturnTicket returnTicket = ReturnTicket.builder().id("ret-1").build();
        EInvoice decreaseInv = EInvoice.builder()
                .id("inv-dec")
                .household(household)
                .returnTicket(returnTicket)
                .title("HÓA ĐƠN ĐIỀU CHỈNH GIẢM")
                .totalAmountBeforeTax(new BigDecimal("10000000.00"))
                .taxAmount(new BigDecimal("150000.00"))
                .status("ISSUED")
                .createdAt(LocalDateTime.of(2026, 3, 5, 11, 0))
                .build();

        when(invoiceRepository.findValidInvoicesForTaxPeriod(eq("hh-uuid-1"), any(), any()))
                .thenReturn(List.of(originalInv, decreaseInv));

        AnnualRevenueTrackingResponse response = revenueTrackingService.getAnnualRevenueTracking("accountant1", 2026);

        // 50.000.000 - 10.000.000 = 40.000.000 VNĐ
        assertEquals(new BigDecimal("40000000.00"), response.getCumulativeRevenue());
        assertEquals(new BigDecimal("600000.00"), response.getCumulativeTaxAmount());
        assertEquals(2, response.getValidInvoiceCount());
    }

    @Test
    @DisplayName("TC-02: Ngoại lệ - Doanh thu vượt mức cảnh báo 80% kích hoạt thông báo và nghĩa vụ pháp lý")
    void getAnnualRevenueTracking_WarningTriggered_TC02() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-uuid-1")).thenReturn(Optional.of(settings));

        // 820.500.000 VNĐ >= 80% (800.000.000 VNĐ)
        EInvoice bigInv = EInvoice.builder()
                .id("inv-big")
                .household(household)
                .totalAmountBeforeTax(new BigDecimal("820500000.00"))
                .taxAmount(new BigDecimal("12307500.00"))
                .status("ISSUED")
                .createdAt(LocalDateTime.of(2026, 8, 20, 15, 0))
                .build();

        when(invoiceRepository.findValidInvoicesForTaxPeriod(eq("hh-uuid-1"), any(), any()))
                .thenReturn(List.of(bigInv));
        when(notificationRepository.existsNotificationInYear(eq("hh-uuid-1"), eq(RevenueThresholdConstants.NOTIF_TYPE_REVENUE_WARNING), any(), any(), any()))
                .thenReturn(false);

        AnnualRevenueTrackingResponse response = revenueTrackingService.getAnnualRevenueTracking("owner1", 2026);

        assertEquals(RevenueWarningStatus.WARNING_TRIGGERED, response.getWarningStatus());
        assertTrue(response.getShouldShowWarning());
        assertNotNull(response.getWarningMessage());
        assertTrue(response.getWarningMessage().contains("820.500.000"));
        assertNotNull(response.getLegalObligationNotice());
        assertTrue(response.getLegalObligationNotice().contains("Nghị định 123/2020/NĐ-CP"));

        verify(notificationRepository, times(1)).save(any(AppNotification.class));
    }

    @Test
    @DisplayName("TC-03: Sai trạng thái - Hộ đã thuộc diện bắt buộc từ đầu năm thì không hiện cảnh báo ngưỡng")
    void getAnnualRevenueTracking_AlreadyMandatoryFromBeginning_TC03() {
        // Household created in 2024 with revenueThresholdEnabled = true
        BusinessHousehold mandatoryHousehold = BusinessHousehold.builder()
                .id("hh-mandatory")
                .name("Đại Lý Minh Long")
                .taxCode("0398765432")
                .revenueThresholdEnabled(true)
                .createdAt(LocalDateTime.of(2024, 6, 1, 0, 0))
                .build();

        User mandatoryOwner = User.builder()
                .id("user-m-1")
                .username("owner_mand")
                .role(Role.builder().id(1).code("VT-01").build())
                .household(mandatoryHousehold)
                .build();

        when(userRepository.findByUsername("owner_mand")).thenReturn(Optional.of(mandatoryOwner));
        when(settingsRepository.findByHouseholdId("hh-mandatory")).thenReturn(Optional.of(settings));

        EInvoice inv = EInvoice.builder()
                .id("inv-m")
                .household(mandatoryHousehold)
                .totalAmountBeforeTax(new BigDecimal("950000000.00"))
                .taxAmount(new BigDecimal("14250000.00"))
                .status("ISSUED")
                .createdAt(LocalDateTime.of(2026, 7, 10, 10, 0))
                .build();

        when(invoiceRepository.findValidInvoicesForTaxPeriod(eq("hh-mandatory"), any(), any()))
                .thenReturn(List.of(inv));

        AnnualRevenueTrackingResponse response = revenueTrackingService.getAnnualRevenueTracking("owner_mand", 2026);

        assertEquals(RevenueWarningStatus.ALREADY_MANDATORY, response.getWarningStatus());
        assertFalse(response.getShouldShowWarning());
        assertTrue(response.getIsMandatoryFromBeginning());
        assertTrue(response.getIsMandatory());
        assertNull(response.getWarningMessage());

        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("QTN-01: Doanh thu chạm/vượt 1 tỷ đồng tự động bật cờ bắt buộc và ghi ActivityLog")
    void getAnnualRevenueTracking_ExceededThreshold_QTN01() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-uuid-1")).thenReturn(Optional.of(settings));

        // 1.050.000.000 VNĐ >= 1 TỶ ĐỒNG
        EInvoice inv = EInvoice.builder()
                .id("inv-1b")
                .household(household)
                .totalAmountBeforeTax(new BigDecimal("1050000000.00"))
                .taxAmount(new BigDecimal("15750000.00"))
                .status("ISSUED")
                .createdAt(LocalDateTime.of(2026, 9, 1, 10, 0))
                .build();

        when(invoiceRepository.findValidInvoicesForTaxPeriod(eq("hh-uuid-1"), any(), any()))
                .thenReturn(List.of(inv));
        when(notificationRepository.existsNotificationInYear(eq("hh-uuid-1"), eq(RevenueThresholdConstants.NOTIF_TYPE_REVENUE_EXCEEDED), any(), any(), any()))
                .thenReturn(false);

        AnnualRevenueTrackingResponse response = revenueTrackingService.getAnnualRevenueTracking("owner1", 2026);

        assertEquals(RevenueWarningStatus.EXCEEDED, response.getWarningStatus());
        assertTrue(response.getShouldShowWarning());
        assertTrue(response.getIsMandatory());

        // Verify household is marked mandatory
        assertTrue(household.getRevenueThresholdEnabled());
        verify(householdRepository, times(1)).save(household);

        // Verify activity log is written
        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(ownerUser), eq(RevenueThresholdConstants.ACTION_REVENUE_THRESHOLD_EXCEEDED),
                eq("business_households"), eq("hh-uuid-1"), eq("false"), eq("true"), any(), any()
        );

        // Verify DANGER notification pushed
        verify(notificationRepository, times(1)).save(argThat(notif ->
                RevenueThresholdConstants.NOTIF_TYPE_REVENUE_EXCEEDED.equals(notif.getNotificationType())
                        && "DANGER".equals(notif.getSeverity())
        ));
    }

    @Test
    @DisplayName("QTN-10: Nhân viên bán hàng (VT-02) bị chặn không được xem báo cáo lũy kế doanh thu")
    void getAnnualRevenueTracking_ForbiddenForSalesStaff_QTN10() {
        when(userRepository.findByUsername("staff1")).thenReturn(Optional.of(salesStaffUser));

        AppException ex = assertThrows(AppException.class, () ->
                revenueTrackingService.getAnnualRevenueTracking("staff1", 2026)
        );

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật mức cảnh báo ngưỡng thành công (Chủ hộ VT-01)")
    void updateWarningThreshold_Success_VT01() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-uuid-1")).thenReturn(Optional.of(settings));
        when(settingsRepository.save(any(BusinessHouseholdSettings.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateWarningThresholdRequest request = UpdateWarningThresholdRequest.builder()
                .warningThresholdPercentage(new BigDecimal("85.00"))
                .build();

        UpdateWarningThresholdResponse response = revenueTrackingService.updateWarningThreshold("owner1", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("85.00"), response.getWarningThresholdPercentage());
        assertEquals(new BigDecimal("850000000.00"), response.getWarningRevenueAmount());

        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(ownerUser), eq(RevenueThresholdConstants.ACTION_UPDATE_WARNING_THRESHOLD),
                eq("business_household_settings"), any(), any(), eq("85.00"), any(), any()
        );
    }

    @Test
    @DisplayName("Cập nhật mức cảnh báo thất bại do không phải Chủ hộ (VT-03)")
    void updateWarningThreshold_ForbiddenForAccountant() {
        when(userRepository.findByUsername("accountant1")).thenReturn(Optional.of(accountantUser));

        UpdateWarningThresholdRequest request = UpdateWarningThresholdRequest.builder()
                .warningThresholdPercentage(new BigDecimal("85.00"))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                revenueTrackingService.updateWarningThreshold("accountant1", request)
        );

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật mức cảnh báo thất bại do tỷ lệ vượt ngoài khoảng [50%, 99%]")
    void updateWarningThreshold_InvalidPercentage() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));

        UpdateWarningThresholdRequest requestLow = UpdateWarningThresholdRequest.builder()
                .warningThresholdPercentage(new BigDecimal("40.00"))
                .build();

        AppException exLow = assertThrows(AppException.class, () ->
                revenueTrackingService.updateWarningThreshold("owner1", requestLow)
        );
        assertEquals(ErrorCode.INVALID_WARNING_THRESHOLD_PERCENTAGE, exLow.getErrorCode());

        UpdateWarningThresholdRequest requestHigh = UpdateWarningThresholdRequest.builder()
                .warningThresholdPercentage(new BigDecimal("105.00"))
                .build();

        AppException exHigh = assertThrows(AppException.class, () ->
                revenueTrackingService.updateWarningThreshold("owner1", requestHigh)
        );
        assertEquals(ErrorCode.INVALID_WARNING_THRESHOLD_PERCENTAGE, exHigh.getErrorCode());
    }

    @Test
    @DisplayName("Xem danh sách thông báo và đánh dấu đã đọc")
    void testNotifications_GetAndMarkAsRead() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));

        AppNotification notif = AppNotification.builder()
                .id("notif-1")
                .household(household)
                .notificationType(RevenueThresholdConstants.NOTIF_TYPE_REVENUE_WARNING)
                .severity("WARNING")
                .title("Cảnh báo doanh thu")
                .message("Đã đạt 80% ngưỡng")
                .isRead(false)
                .build();

        when(notificationRepository.findByHouseholdIdOrderByCreatedAtDesc(eq("hh-uuid-1"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(notif)));

        PageResponse<AppNotificationResponse> pageResponse = revenueTrackingService.getNotifications("owner1", 0, 10);
        assertEquals(1, pageResponse.getTotalElements());
        assertEquals("notif-1", pageResponse.getContent().get(0).getId());

        when(notificationRepository.findByIdAndHouseholdId("notif-1", "hh-uuid-1"))
                .thenReturn(Optional.of(notif));

        revenueTrackingService.markNotificationAsRead("owner1", "notif-1");
        assertTrue(notif.getIsRead());
        assertNotNull(notif.getReadAt());
        verify(notificationRepository, times(1)).save(notif);
    }

    @Test
    @DisplayName("Năm quá khứ: Không kích hoạt side-effects và projectedReachDate là null")
    void getAnnualRevenueTracking_HistoricalYear_NoSideEffects() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("hh-uuid-1")).thenReturn(Optional.of(settings));

        EInvoice inv = EInvoice.builder()
                .id("inv-past")
                .household(household)
                .totalAmountBeforeTax(new BigDecimal("900000000.00"))
                .taxAmount(new BigDecimal("13500000.00"))
                .status("ISSUED")
                .createdAt(LocalDateTime.of(2024, 6, 1, 10, 0))
                .build();

        when(invoiceRepository.findValidInvoicesForTaxPeriod(eq("hh-uuid-1"), any(), any()))
                .thenReturn(List.of(inv));

        AnnualRevenueTrackingResponse response = revenueTrackingService.getAnnualRevenueTracking("owner1", 2024);

        assertEquals(2024, response.getYear());
        assertNull(response.getProjectedReachDate());
        assertFalse(response.getProjectedInCurrentYear());
        // Side effects (push notification, updating household flag) should not be triggered for past year
        verify(notificationRepository, never()).save(any());
        verify(householdRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đếm số lượng thông báo chưa đọc của hộ kinh doanh")
    void testGetUnreadNotificationCount_Success() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(notificationRepository.countByHouseholdIdAndIsReadFalse("hh-uuid-1")).thenReturn(5L);

        long unreadCount = revenueTrackingService.getUnreadNotificationCount("owner1");
        assertEquals(5L, unreadCount);
    }
}
