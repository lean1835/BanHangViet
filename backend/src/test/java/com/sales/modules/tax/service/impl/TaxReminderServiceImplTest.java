package com.sales.modules.tax.service.impl;
import com.sales.modules.audit.entity.AppNotification;
import com.sales.modules.audit.repository.AppNotificationRepository;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.BusinessHouseholdSettings;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdSettingsRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.modules.tax.entity.TaxDeclarationPeriod;
import com.sales.modules.tax.repository.TaxDeclarationPeriodRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.common.constant.TaxNotificationType;
import com.sales.modules.tax.dto.request.UpdateTaxReminderSettingsRequest;
import com.sales.modules.tax.dto.response.TaxPeriodReminderResponse;
import com.sales.modules.tax.dto.response.TaxReminderSettingsResponse;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaxReminderServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;

    @Mock
    private TaxDeclarationPeriodRepository taxPeriodRepository;

    @Mock
    private AppNotificationRepository notificationRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private TaxReminderServiceImpl taxReminderService;

    private User ownerUser;
    private User accountantUser;
    private User cashierUser;
    private BusinessHousehold household;
    private BusinessHouseholdSettings settings;
    private TaxDeclarationPeriod quarterlyPeriod;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("house-001")
                .name("Hộ kinh doanh Tạp Hóa Việt")
                .taxCode("0400123456")
                .build();

        Role roleOwner = Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build();
        Role roleAccountant = Role.builder().id(2).code("VT-03").name("Kế toán").build();
        Role roleCashier = Role.builder().id(3).code("VT-02").name("Nhân viên bán hàng").build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("owner1")
                .household(household)
                .role(roleOwner)
                .build();

        accountantUser = User.builder()
                .id("user-acc")
                .username("accountant1")
                .household(household)
                .role(roleAccountant)
                .build();

        cashierUser = User.builder()
                .id("user-cashier")
                .username("cashier1")
                .household(household)
                .role(roleCashier)
                .build();

        settings = BusinessHouseholdSettings.builder()
                .id("settings-001")
                .household(household)
                .taxPeriodType("QUARTERLY")
                .taxReminderDaysBefore(5)
                .taxReminderEnabled(true)
                .build();

        quarterlyPeriod = TaxDeclarationPeriod.builder()
                .id("period-q1-2026")
                .household(household)
                .periodName("Bảng kê hóa đơn bán ra Quý 1 năm 2026")
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(1)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 3, 31))
                .status("GENERATED")
                .totalValidInvoices(10)
                .totalPurchaseReceipts(2)
                .declarationExported(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    // =========================================================================
    // 1. CẤU HÌNH NHẮC LỊCH (GET & UPDATE SETTINGS)
    // =========================================================================

    @Test
    @DisplayName("Lấy cấu hình nhắc lịch thuế thành công bởi Chủ hộ (VT-01)")
    void testGetReminderSettings_Success() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(settings));

        TaxReminderSettingsResponse response = taxReminderService.getReminderSettings("owner1");

        assertNotNull(response);
        assertEquals("house-001", response.getHouseholdId());
        assertEquals("QUARTERLY", response.getTaxPeriodType());
        assertEquals(5, response.getTaxReminderDaysBefore());
        assertTrue(response.getTaxReminderEnabled());
    }

    @Test
    @DisplayName("Lấy cấu hình nhắc lịch thuế thành công bởi Kế toán (VT-03)")
    void testGetReminderSettings_Accountant_Success() {
        when(userRepository.findByUsername("accountant1")).thenReturn(Optional.of(accountantUser));
        when(settingsRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(settings));

        TaxReminderSettingsResponse response = taxReminderService.getReminderSettings("accountant1");

        assertNotNull(response);
        assertEquals("QUARTERLY", response.getTaxPeriodType());
    }

    @Test
    @DisplayName("Nhân viên bán hàng (VT-02) bị chặn khi xem cấu hình nhắc lịch")
    void testGetReminderSettings_Forbidden_Cashier() {
        when(userRepository.findByUsername("cashier1")).thenReturn(Optional.of(cashierUser));

        AppException ex = assertThrows(AppException.class, () ->
                taxReminderService.getReminderSettings("cashier1"));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật cấu hình nhắc lịch thành công bởi Chủ hộ (VT-01)")
    void testUpdateReminderSettings_Success() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(settings));
        when(settingsRepository.save(any(BusinessHouseholdSettings.class))).thenAnswer(inv -> inv.getArgument(0));

        UpdateTaxReminderSettingsRequest request = UpdateTaxReminderSettingsRequest.builder()
                .taxPeriodType("MONTHLY")
                .taxReminderDaysBefore(7)
                .taxReminderEnabled(true)
                .build();

        TaxReminderSettingsResponse response = taxReminderService.updateReminderSettings("owner1", request);

        assertNotNull(response);
        assertEquals("MONTHLY", response.getTaxPeriodType());
        assertEquals(7, response.getTaxReminderDaysBefore());
        assertTrue(response.getTaxReminderEnabled());
        verify(settingsRepository, times(1)).save(any(BusinessHouseholdSettings.class));
    }

    @Test
    @DisplayName("Kế toán (VT-03) bị chặn khi cố cập nhật cấu hình nhắc lịch")
    void testUpdateReminderSettings_Forbidden_Accountant() {
        when(userRepository.findByUsername("accountant1")).thenReturn(Optional.of(accountantUser));

        UpdateTaxReminderSettingsRequest request = UpdateTaxReminderSettingsRequest.builder()
                .taxPeriodType("QUARTERLY")
                .taxReminderDaysBefore(5)
                .taxReminderEnabled(true)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                taxReminderService.updateReminderSettings("accountant1", request));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật số ngày nhắc < 1 -> Ném lỗi INVALID_REMINDER_DAYS")
    void testUpdateReminderSettings_InvalidDays_Min() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));

        UpdateTaxReminderSettingsRequest request = UpdateTaxReminderSettingsRequest.builder()
                .taxPeriodType("QUARTERLY")
                .taxReminderDaysBefore(0)
                .taxReminderEnabled(true)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                taxReminderService.updateReminderSettings("owner1", request));
        assertEquals(ErrorCode.INVALID_REMINDER_DAYS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật số ngày nhắc > 30 -> Ném lỗi INVALID_REMINDER_DAYS")
    void testUpdateReminderSettings_InvalidDays_Max() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));

        UpdateTaxReminderSettingsRequest request = UpdateTaxReminderSettingsRequest.builder()
                .taxPeriodType("QUARTERLY")
                .taxReminderDaysBefore(35)
                .taxReminderEnabled(true)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                taxReminderService.updateReminderSettings("owner1", request));
        assertEquals(ErrorCode.INVALID_REMINDER_DAYS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật loại kỳ không hợp lệ -> Ném lỗi INVALID_TAX_PERIOD_TYPE")
    void testUpdateReminderSettings_InvalidPeriodType() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));

        UpdateTaxReminderSettingsRequest request = UpdateTaxReminderSettingsRequest.builder()
                .taxPeriodType("YEARLY")
                .taxReminderDaysBefore(5)
                .taxReminderEnabled(true)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                taxReminderService.updateReminderSettings("owner1", request));
        assertEquals(ErrorCode.INVALID_TAX_PERIOD_TYPE, ex.getErrorCode());
    }

    // =========================================================================
    // 2. THUẬT TOÁN TÍNH HẠN NỘP THUẾ (STATUTORY FILING DEADLINE)
    // =========================================================================

    @Test
    @DisplayName("Tính hạn nộp theo tháng: Ngày 20 của tháng kế tiếp")
    void testCalculateTaxFilingDeadline_Monthly() {
        // Tháng 1/2026 -> 20/02/2026
        LocalDate deadline1 = taxReminderService.calculateTaxFilingDeadline("MONTHLY", 2026, 1);
        assertEquals(LocalDate.of(2026, 2, 20), deadline1);

        // Tháng 2/2026 -> 20/03/2026
        LocalDate deadline2 = taxReminderService.calculateTaxFilingDeadline("MONTHLY", 2026, 2);
        assertEquals(LocalDate.of(2026, 3, 20), deadline2);

        // Tháng 12/2026 -> 20/01/2027
        LocalDate deadline12 = taxReminderService.calculateTaxFilingDeadline("MONTHLY", 2026, 12);
        assertEquals(LocalDate.of(2027, 1, 20), deadline12);
    }

    @Test
    @DisplayName("Tính hạn nộp theo quý: Ngày cuối cùng của tháng đầu quý tiếp theo")
    void testCalculateTaxFilingDeadline_Quarterly() {
        // Quý 1/2026 -> 30/04/2026
        LocalDate q1Deadline = taxReminderService.calculateTaxFilingDeadline("QUARTERLY", 2026, 1);
        assertEquals(LocalDate.of(2026, 4, 30), q1Deadline);

        // Quý 2/2026 -> 31/07/2026
        LocalDate q2Deadline = taxReminderService.calculateTaxFilingDeadline("QUARTERLY", 2026, 2);
        assertEquals(LocalDate.of(2026, 7, 31), q2Deadline);

        // Quý 3/2026 -> 31/10/2026
        LocalDate q3Deadline = taxReminderService.calculateTaxFilingDeadline("QUARTERLY", 2026, 3);
        assertEquals(LocalDate.of(2026, 10, 31), q3Deadline);

        // Quý 4/2026 -> 31/01/2027
        LocalDate q4Deadline = taxReminderService.calculateTaxFilingDeadline("QUARTERLY", 2026, 4);
        assertEquals(LocalDate.of(2027, 1, 31), q4Deadline);
    }

    @Test
    @DisplayName("Bắt ngoại lệ khi periodNumber tháng không hợp lệ (<= 0 hoặc > 12)")
    void testCalculateTaxFilingDeadline_InvalidMonth_ThrowsException() {
        assertThrows(AppException.class, () ->
                taxReminderService.calculateTaxFilingDeadline("MONTHLY", 2026, 0));
        assertThrows(AppException.class, () ->
                taxReminderService.calculateTaxFilingDeadline("MONTHLY", 2026, 13));
    }

    // =========================================================================
    // 3. TIÊU CHÍ AC-01 (NCL-12-CN-007-TC-01): NHẮC TRƯỚC HẠN & CHECKLIST
    // =========================================================================

    @Test
    @DisplayName("NCL-12-CN-007-TC-01: Đến mốc nhắc trước hạn -> Đẩy thông báo WARNING kèm checklist")
    void testPreDueReminder_GeneratesWarningNotification() {
        when(settingsRepository.findByTaxReminderEnabledTrue()).thenReturn(List.of(settings));
        when(eInvoiceRepository.existsByHouseholdIdAndDeletedAtIsNull("house-001")).thenReturn(true);
        when(taxPeriodRepository.findByHouseholdIdOrderByYearDescPeriodNumberDesc("house-001")).thenReturn(List.of(quarterlyPeriod));
        when(notificationRepository.findByHouseholdIdAndTargetTypeAndIsClosedFalse("house-001", "TAX_PERIOD"))
                .thenReturn(Collections.emptyList());

        // Chưa có notification trước đó
        when(notificationRepository.findFirstByHouseholdIdAndTargetTypeAndTargetIdAndNotificationTypeAndIsClosedFalse(
                eq("house-001"), eq("TAX_PERIOD"), eq("period-q1-2026"), eq(TaxNotificationType.TAX_DECLARATION_REMINDER)))
                .thenReturn(Optional.empty());

        taxReminderService.scanAndGenerateTaxReminders(LocalDate.of(2026, 4, 26));

        // Kiểm tra đã lưu AppNotification
        verify(notificationRepository, atLeastOnce()).save(argThat(notif ->
                "TAX_PERIOD".equals(notif.getTargetType()) &&
                "period-q1-2026".equals(notif.getTargetId()) &&
                TaxNotificationType.TAX_DECLARATION_REMINDER.equals(notif.getNotificationType()) &&
                "WARNING".equals(notif.getSeverity()) &&
                !notif.getIsClosed()
        ));
    }

    @Test
    @DisplayName("Tự động phát hiện và nhắc kỳ đã kết thúc khi hộ chưa từng bấm Lập bảng kê")
    void testScanAndGenerateTaxReminders_AutoDetectsMissingCompletedPeriod() {
        when(settingsRepository.findByTaxReminderEnabledTrue()).thenReturn(List.of(settings));
        when(eInvoiceRepository.existsByHouseholdIdAndDeletedAtIsNull("house-001")).thenReturn(true);
        // Chưa có bất kỳ kỳ nào trong DB
        when(taxPeriodRepository.findByHouseholdIdOrderByYearDescPeriodNumberDesc("house-001")).thenReturn(Collections.emptyList());
        when(notificationRepository.findByHouseholdIdAndTargetTypeAndIsClosedFalse("house-001", "TAX_PERIOD"))
                .thenReturn(Collections.emptyList());

        // Giả sử ngày quét là 26/04/2026 (Quý 1 vừa xong, hạn 30/04/2026, còn 4 ngày <= 5 ngày nhắc)
        taxReminderService.scanAndGenerateTaxReminders(LocalDate.of(2026, 4, 26));

        verify(notificationRepository, atLeastOnce()).save(argThat(notif ->
                "TAX_PERIOD".equals(notif.getTargetType()) &&
                notif.getTargetId() != null && notif.getTargetId().startsWith("PENDING_QUARTERLY_2026_1") &&
                TaxNotificationType.TAX_DECLARATION_REMINDER.equals(notif.getNotificationType()) &&
                "WARNING".equals(notif.getSeverity()) &&
                !notif.getIsClosed()
        ));
    }

    @Test
    @DisplayName("AC-01 Checklist: Hiển thị đúng 4 hạng mục Bán ra, Mua vào, Tờ khai và Chốt kỳ")
    void testActiveReminders_ChecklistStatus() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(settings));
        when(eInvoiceRepository.existsByHouseholdIdAndDeletedAtIsNull("house-001")).thenReturn(true);
        when(taxPeriodRepository.findByHouseholdIdAndStatusNot("house-001", "LOCKED")).thenReturn(List.of(quarterlyPeriod));

        List<TaxPeriodReminderResponse> reminders = taxReminderService.getActiveReminders("owner1");

        assertNotNull(reminders);
        assertEquals(1, reminders.size());
        TaxPeriodReminderResponse r = reminders.get(0);
        assertEquals("period-q1-2026", r.getPeriodId());
        assertEquals("QUARTERLY", r.getPeriodType());
        assertNotNull(r.getChecklist());
        assertTrue(r.getChecklist().isSalesRegisterGenerated()); // totalValidInvoices = 10
        assertTrue(r.getChecklist().isPurchaseRegisterGenerated()); // totalPurchaseReceipts = 2
        assertFalse(r.getChecklist().isDeclarationExported()); // declarationExported = false
        assertFalse(r.getChecklist().isPeriodLocked()); // status = GENERATED
    }

    // =========================================================================
    // 4. TIÊU CHÍ AC-02 (NCL-12-CN-007-TC-02 & QTN-21): TỰ ĐÓNG KHI ĐÃ CHỐT
    // =========================================================================

    @Test
    @DisplayName("NCL-12-CN-007-TC-02: Kỳ đã chốt -> Tự động đóng toàn bộ nhắc việc của kỳ đó")
    void testCloseRemindersForPeriod_ClosesAllActiveNotifications() {
        AppNotification notif1 = AppNotification.builder()
                .id("notif-1")
                .household(household)
                .targetType("TAX_PERIOD")
                .targetId("period-q1-2026")
                .notificationType(TaxNotificationType.TAX_DECLARATION_REMINDER)
                .isClosed(false)
                .isRead(false)
                .build();

        AppNotification notif2 = AppNotification.builder()
                .id("notif-2")
                .household(household)
                .targetType("TAX_PERIOD")
                .targetId("period-q1-2026")
                .notificationType(TaxNotificationType.TAX_DECLARATION_OVERDUE)
                .isClosed(false)
                .isRead(false)
                .build();

        when(notificationRepository.findByHouseholdIdAndTargetTypeAndTargetIdAndIsClosedFalse(
                "house-001", "TAX_PERIOD", "period-q1-2026"))
                .thenReturn(List.of(notif1, notif2));

        taxReminderService.closeRemindersForPeriod(household, "period-q1-2026");

        assertTrue(notif1.getIsClosed());
        assertTrue(notif1.getIsRead());
        assertNotNull(notif1.getClosedAt());

        assertTrue(notif2.getIsClosed());
        assertTrue(notif2.getIsRead());
        assertNotNull(notif2.getClosedAt());

        verify(notificationRepository, times(1)).saveAll(anyList());
    }

    // =========================================================================
    // 5. TIÊU CHÍ AC-03 (NCL-12-CN-007-TC-03): CẢNH BÁO QUÁ HẠN MỨC ĐỘ CAO (DANGER)
    // =========================================================================

    @Test
    @DisplayName("NCL-12-CN-007-TC-03: Kỳ quá hạn nộp mà chưa chốt -> Mức độ cao DANGER và giữ trong danh sách")
    void testOverduePeriod_GeneratesDangerNotification() {
        // Tạo kỳ năm 2025 (chắc chắn đã quá hạn)
        TaxDeclarationPeriod overduePeriod = TaxDeclarationPeriod.builder()
                .id("period-overdue-2025")
                .household(household)
                .periodName("Bảng kê hóa đơn bán ra Quý 3 năm 2025")
                .periodType("QUARTERLY")
                .year(2025)
                .periodNumber(3)
                .startDate(LocalDate.of(2025, 7, 1))
                .endDate(LocalDate.of(2025, 9, 30))
                .status("GENERATED")
                .totalValidInvoices(5)
                .declarationExported(false)
                .build();

        when(settingsRepository.findByTaxReminderEnabledTrue()).thenReturn(List.of(settings));
        when(eInvoiceRepository.existsByHouseholdIdAndDeletedAtIsNull("house-001")).thenReturn(true);
        when(taxPeriodRepository.findByHouseholdIdOrderByYearDescPeriodNumberDesc("house-001")).thenReturn(List.of(overduePeriod));
        when(notificationRepository.findByHouseholdIdAndTargetTypeAndIsClosedFalse("house-001", "TAX_PERIOD"))
                .thenReturn(Collections.emptyList());

        when(notificationRepository.findFirstByHouseholdIdAndTargetTypeAndTargetIdAndNotificationTypeAndIsClosedFalse(
                eq("house-001"), eq("TAX_PERIOD"), eq("period-overdue-2025"), eq(TaxNotificationType.TAX_DECLARATION_OVERDUE)))
                .thenReturn(Optional.empty());

        taxReminderService.scanAndGenerateTaxReminders();

        // Xác minh tạo thông báo với mức DANGER và is_closed = false
        verify(notificationRepository, atLeastOnce()).save(argThat(notif ->
                "TAX_PERIOD".equals(notif.getTargetType()) &&
                "period-overdue-2025".equals(notif.getTargetId()) &&
                TaxNotificationType.TAX_DECLARATION_OVERDUE.equals(notif.getNotificationType()) &&
                "DANGER".equals(notif.getSeverity()) &&
                !notif.getIsClosed()
        ));
    }

    // =========================================================================
    // 6. TIỀN ĐỀ PHÁT SINH & TẮT NHẮC NHỞ
    // =========================================================================

    @Test
    @DisplayName("Hộ chưa phát sinh hóa đơn nào -> Không sinh thông báo rác")
    void testNoInvoices_ReturnsEmptyReminders() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(settings));
        when(eInvoiceRepository.existsByHouseholdIdAndDeletedAtIsNull("house-001")).thenReturn(false);

        List<TaxPeriodReminderResponse> reminders = taxReminderService.getActiveReminders("owner1");

        assertNotNull(reminders);
        assertTrue(reminders.isEmpty());
    }

    @Test
    @DisplayName("Hộ tắt tính năng nhắc lịch (taxReminderEnabled = false) -> Trả về danh sách rỗng")
    void testTaxReminderDisabled_ReturnsEmptyReminders() {
        settings.setTaxReminderEnabled(false);
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));
        when(settingsRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(settings));

        List<TaxPeriodReminderResponse> reminders = taxReminderService.getActiveReminders("owner1");

        assertNotNull(reminders);
        assertTrue(reminders.isEmpty());
    }

    // =========================================================================
    // 7. CẬP NHẬT CỜ ĐÃ XUẤT TỜ KHAI (DECLARATION EXPORTED)
    // =========================================================================

    @Test
    @DisplayName("Đánh dấu xuất tờ khai thành công và đồng bộ metadata cho thông báo nhắc lịch")
    void testMarkDeclarationAsExported_Success() {
        AppNotification activeNotif = AppNotification.builder()
                .id("notif-decl-1")
                .household(household)
                .targetType("TAX_PERIOD")
                .targetId("period-q1-2026")
                .notificationType(TaxNotificationType.TAX_DECLARATION_REMINDER)
                .metadata("{\"checklist\":{\"declarationExported\":false}}")
                .isClosed(false)
                .build();

        when(taxPeriodRepository.findById("period-q1-2026")).thenReturn(Optional.of(quarterlyPeriod));
        when(notificationRepository.findByHouseholdIdAndTargetTypeAndTargetIdAndIsClosedFalse(
                "house-001", "TAX_PERIOD", "period-q1-2026"))
                .thenReturn(List.of(activeNotif));

        taxReminderService.markDeclarationAsExported("period-q1-2026");

        assertTrue(quarterlyPeriod.getDeclarationExported());
        assertNotNull(quarterlyPeriod.getDeclarationExportedAt());
        verify(taxPeriodRepository, times(1)).save(quarterlyPeriod);
        verify(notificationRepository, times(1)).saveAll(argThat(list -> {
            AppNotification n = (AppNotification) ((List<?>) list).get(0);
            return n.getMetadata().contains("\"declarationExported\":true");
        }));
    }

    @Test
    @DisplayName("NCL-12-CN-007: Đánh dấu xuất tờ khai kèm username thành công (hộ hợp lệ)")
    void markDeclarationAsExported_WithUsername_Success() {
        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));
        when(taxPeriodRepository.findById("period-q1-2026")).thenReturn(Optional.of(quarterlyPeriod));

        taxReminderService.markDeclarationAsExported("owner_user", "period-q1-2026");

        assertTrue(quarterlyPeriod.getDeclarationExported());
        assertNotNull(quarterlyPeriod.getDeclarationExportedAt());
        verify(taxPeriodRepository, times(1)).save(quarterlyPeriod);
    }

    @Test
    @DisplayName("NCL-12-CN-007: Chặn IDOR khi người dùng cố tình đánh dấu xuất tờ khai của hộ kinh doanh khác -> Báo lỗi FORBIDDEN (403)")
    void markDeclarationAsExported_OtherHousehold_ThrowsForbidden() {
        BusinessHousehold otherHousehold = BusinessHousehold.builder()
                .id("house-other-999")
                .name("Hộ Khác")
                .build();
        TaxDeclarationPeriod otherPeriod = TaxDeclarationPeriod.builder()
                .id("period-other-1")
                .household(otherHousehold)
                .periodName("Kỳ Hộ Khác")
                .build();

        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));
        when(taxPeriodRepository.findById("period-other-1")).thenReturn(Optional.of(otherPeriod));

        AppException ex = assertThrows(AppException.class, () ->
                taxReminderService.markDeclarationAsExported("owner_user", "period-other-1")
        );

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        assertFalse(Boolean.TRUE.equals(otherPeriod.getDeclarationExported()));
        verify(taxPeriodRepository, never()).save(otherPeriod);
    }

    @Test
    @DisplayName("NCL-12-CN-007: Kỳ kê khai không tồn tại -> Ném TAX_PERIOD_NOT_FOUND (404)")
    void markDeclarationAsExported_NotFound_ThrowsException() {
        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));
        when(taxPeriodRepository.findById("period-non-existent")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                taxReminderService.markDeclarationAsExported("owner_user", "period-non-existent")
        );

        assertEquals(ErrorCode.TAX_PERIOD_NOT_FOUND, ex.getErrorCode());
    }
}
