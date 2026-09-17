package com.sales.service;

import com.sales.constant.NotificationTypeConstant;
import com.sales.dto.request.NotificationFilterRequest;
import com.sales.dto.request.UpdateNotificationSettingRequest;
import com.sales.dto.response.AppNotificationResponse;
import com.sales.dto.response.NotificationBadgeCountResponse;
import com.sales.dto.response.NotificationSettingItemResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.AppNotificationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppNotificationServiceImplTest {

    @Mock
    private AppNotificationRepository notificationRepository;

    @Mock
    private UserNotificationSettingRepository settingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessHouseholdRepository householdRepository;

    @Mock
    private EInvoiceRepository invoiceRepository;

    @Mock
    private CustomerDebtRepository customerDebtRepository;

    @InjectMocks
    private AppNotificationServiceImpl notificationService;

    private BusinessHousehold mockHousehold;
    private Role ownerRole;
    private Role cashierRole;
    private User ownerUser;
    private User cashierUser;

    @BeforeEach
    void setUp() {
        mockHousehold = BusinessHousehold.builder()
                .id("house-uuid-1")
                .name("Hộ Kinh Doanh Việt")
                .build();

        ownerRole = Role.builder()
                .id(1)
                .code("VT-01")
                .name("Chủ hộ kinh doanh")
                .build();

        cashierRole = Role.builder()
                .id(2)
                .code("VT-02")
                .name("Nhân viên bán hàng")
                .build();

        ownerUser = User.builder()
                .id("user-owner-1")
                .username("owner_user")
                .role(ownerRole)
                .household(mockHousehold)
                .build();

        cashierUser = User.builder()
                .id("user-cashier-1")
                .username("cashier_user")
                .role(cashierRole)
                .household(mockHousehold)
                .build();
    }

    // =========================================================================
    // TC-01: Luồng thành công - Liệt kê hóa đơn lỗi và công nợ đến hạn (GAP 42)
    // =========================================================================
    @Test
    @DisplayName("TC-01: Chủ hộ mở trung tâm thông báo thấy cả hóa đơn lỗi và công nợ đến hạn kèm actionUrl")
    void getNotifications_AsOwner_Success_PassesTC01() {
        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));
        when(settingRepository.findDisabledTypesByUserId("user-owner-1")).thenReturn(Collections.emptySet());

        AppNotification notif1 = AppNotification.builder()
                .id("notif-1")
                .household(mockHousehold)
                .notificationType(NotificationTypeConstant.INVOICE_ERROR)
                .severity("DANGER")
                .title("Cảnh báo: Hóa đơn lỗi")
                .message("Hóa đơn HD-001 gửi lỗi cơ quan thuế")
                .actionUrl("/e-invoices?id=inv-1")
                .targetType("INVOICE")
                .targetId("inv-1")
                .isRead(false)
                .isClosed(false)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();

        AppNotification notif2 = AppNotification.builder()
                .id("notif-2")
                .household(mockHousehold)
                .notificationType(NotificationTypeConstant.DEBT_DUE)
                .severity("WARNING")
                .title("Đến hạn thu nợ: Khách hàng A")
                .message("Khoản nợ 5,000,000 VNĐ đến hạn hôm nay")
                .actionUrl("/debts?customerId=cust-1")
                .targetType("CUSTOMER_DEBT")
                .targetId("debt-1")
                .isRead(false)
                .isClosed(false)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        Page<AppNotification> pageMock = new PageImpl<>(List.of(notif1, notif2));
        when(notificationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageMock);

        NotificationFilterRequest filter = new NotificationFilterRequest();
        PageResponse<AppNotificationResponse> response = notificationService.getNotifications("owner_user", filter, 0, 10);

        assertNotNull(response);
        assertEquals(2, response.getContent().size());

        AppNotificationResponse item1 = response.getContent().get(0);
        assertEquals(NotificationTypeConstant.INVOICE_ERROR, item1.getNotificationType());
        assertEquals("HÓA ĐƠN ĐIỆN TỬ", item1.getNotificationCategory());
        assertEquals("DANGER", item1.getSeverity());
        assertEquals("/e-invoices?id=inv-1", item1.getActionUrl());

        AppNotificationResponse item2 = response.getContent().get(1);
        assertEquals(NotificationTypeConstant.DEBT_DUE, item2.getNotificationType());
        assertEquals("CÔNG NỢ", item2.getNotificationCategory());
        assertEquals("WARNING", item2.getSeverity());
        assertEquals("/debts?customerId=cust-1", item2.getActionUrl());
    }

    // =========================================================================
    // TC-02: Tự động đóng thông báo khi hóa đơn lỗi được cấp mã
    // =========================================================================
    @Test
    @DisplayName("TC-02: Khi hóa đơn được cấp mã, hệ thống tự động đóng thông báo liên kết (isClosed = true, read = true)")
    void closeNotificationsByTarget_PassesTC02() {
        AppNotification activeNotif = AppNotification.builder()
                .id("notif-inv-1")
                .household(mockHousehold)
                .targetType("INVOICE")
                .targetId("inv-uuid-101")
                .notificationType(NotificationTypeConstant.INVOICE_ERROR)
                .isClosed(false)
                .isRead(false)
                .build();

        when(notificationRepository.findByTargetTypeAndTargetIdAndIsClosedFalse("INVOICE", "inv-uuid-101"))
                .thenReturn(List.of(activeNotif));

        notificationService.closeNotificationsByTarget("INVOICE", "inv-uuid-101");

        ArgumentCaptor<List<AppNotification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository, times(1)).saveAll(captor.capture());

        List<AppNotification> savedList = captor.getValue();
        assertEquals(1, savedList.size());
        AppNotification closedNotif = savedList.get(0);
        assertTrue(closedNotif.getIsClosed());
        assertNotNull(closedNotif.getClosedAt());
        assertTrue(closedNotif.getIsRead());
        assertNotNull(closedNotif.getReadAt());
    }

    @Test
    @DisplayName("Batch: Tự động đóng nhiều thông báo cùng lúc theo targetType và danh sách targetIds")
    void closeNotificationsByTargetIds_BatchClosesSuccessfully() {
        AppNotification notif1 = AppNotification.builder()
                .id("notif-debt-1")
                .household(mockHousehold)
                .targetType("CUSTOMER_DEBT")
                .targetId("debt-101")
                .notificationType(NotificationTypeConstant.DEBT_DUE)
                .isClosed(false)
                .isRead(false)
                .build();
        AppNotification notif2 = AppNotification.builder()
                .id("notif-debt-2")
                .household(mockHousehold)
                .targetType("CUSTOMER_DEBT")
                .targetId("debt-102")
                .notificationType(NotificationTypeConstant.DEBT_OVERDUE)
                .isClosed(false)
                .isRead(false)
                .build();

        when(notificationRepository.findByTargetTypeAndTargetIdInAndIsClosedFalse("CUSTOMER_DEBT", List.of("debt-101", "debt-102")))
                .thenReturn(List.of(notif1, notif2));

        notificationService.closeNotificationsByTargetIds("CUSTOMER_DEBT", List.of("debt-101", "debt-102"));

        ArgumentCaptor<List<AppNotification>> captor = ArgumentCaptor.forClass(List.class);
        verify(notificationRepository, times(1)).saveAll(captor.capture());

        List<AppNotification> savedList = captor.getValue();
        assertEquals(2, savedList.size());
        assertTrue(savedList.stream().allMatch(n -> n.getIsClosed() && n.getIsRead() && n.getClosedAt() != null));
    }

    // =========================================================================
    // TC-03: Ràng buộc phân quyền vai trò QTN-10 đối với nhân viên bán hàng
    // =========================================================================
    @Test
    @DisplayName("TC-03: Nhân viên bán hàng (VT-02) chỉ thấy thông báo tác nghiệp, bị từ chối nếu truy cập cảnh báo tài chính")
    void getNotifications_AsCashier_HidesFinancialAndRejectsForbiddenType_PassesTC03() {
        when(userRepository.findByUsername("cashier_user")).thenReturn(Optional.of(cashierUser));

        // 1. Thử request loại tài chính trực tiếp -> Phải ném ngoại lệ FORBIDDEN (QTN-10)
        NotificationFilterRequest financialFilter = NotificationFilterRequest.builder()
                .notificationType(NotificationTypeConstant.REVENUE_THRESHOLD_WARNING)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                notificationService.getNotifications("cashier_user", financialFilter, 0, 10));
        assertEquals(ErrorCode.NOTIFICATION_ACCESS_DENIED, ex.getErrorCode());

        // 2. Request thông thường -> Chỉ trả về thông báo tác nghiệp
        AppNotification cashierNotif = AppNotification.builder()
                .id("notif-cashier-1")
                .household(mockHousehold)
                .notificationType(NotificationTypeConstant.LOW_STOCK_WARNING)
                .severity("WARNING")
                .title("Tồn kho tối thiểu")
                .message("Sản phẩm mì tôm sắp hết hàng")
                .isRead(false)
                .isClosed(false)
                .build();

        Page<AppNotification> pageMock = new PageImpl<>(List.of(cashierNotif));
        when(notificationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageMock);

        NotificationFilterRequest normalFilter = new NotificationFilterRequest();
        PageResponse<AppNotificationResponse> response = notificationService.getNotifications("cashier_user", normalFilter, 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals(NotificationTypeConstant.LOW_STOCK_WARNING, response.getContent().get(0).getNotificationType());
    }

    // =========================================================================
    // TC-04: Đếm Badge Count trên Header Bar
    // =========================================================================
    @Test
    @DisplayName("TC-04: Lấy Badge Count chính xác cho Chủ hộ kinh doanh")
    void getBadgeCount_AsOwner_Success() {
        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));
        when(settingRepository.findDisabledTypesByUserId("user-owner-1")).thenReturn(Collections.emptySet());

        when(notificationRepository.countHouseholdUnread(eq("house-uuid-1"), any(), eq(0), any()))
                .thenReturn(3L);
        when(notificationRepository.countHouseholdUnclosed(eq("house-uuid-1"), any(), eq(0), any()))
                .thenReturn(5L);
        when(notificationRepository.countHouseholdBySeverity(eq("house-uuid-1"), any(), eq(0), eq("DANGER"), any()))
                .thenReturn(2L);
        when(notificationRepository.countHouseholdBySeverity(eq("house-uuid-1"), any(), eq(0), eq("WARNING"), any()))
                .thenReturn(3L);

        NotificationBadgeCountResponse badge = notificationService.getBadgeCount("owner_user");

        assertEquals(3L, badge.getUnreadCount());
        assertEquals(5L, badge.getUnclosedCount());
        assertEquals(2L, badge.getDangerCount());
        assertEquals(3L, badge.getWarningCount());
    }

    @Test
    @DisplayName("TC-04b: Lấy Badge Count cho Nhân viên bán hàng (chỉ đếm tác nghiệp theo QTN-10)")
    void getBadgeCount_AsCashier_Success() {
        when(userRepository.findByUsername("cashier_user")).thenReturn(Optional.of(cashierUser));

        when(notificationRepository.countCashierUnread(eq("house-uuid-1"), eq("user-cashier-1"), any(), any()))
                .thenReturn(1L);
        when(notificationRepository.countCashierUnclosed(eq("house-uuid-1"), eq("user-cashier-1"), any(), any()))
                .thenReturn(2L);
        when(notificationRepository.countCashierBySeverity(eq("house-uuid-1"), eq("user-cashier-1"), any(), eq("DANGER"), any()))
                .thenReturn(1L);
        when(notificationRepository.countCashierBySeverity(eq("house-uuid-1"), eq("user-cashier-1"), any(), eq("WARNING"), any()))
                .thenReturn(1L);

        NotificationBadgeCountResponse badge = notificationService.getBadgeCount("cashier_user");

        assertEquals(1L, badge.getUnreadCount());
        assertEquals(2L, badge.getUnclosedCount());
        assertEquals(1L, badge.getDangerCount());
        assertEquals(1L, badge.getWarningCount());
    }

    // =========================================================================
    // TC-05 & TC-06: Đánh dấu đã đọc đơn lẻ và tất cả
    // =========================================================================
    @Test
    @DisplayName("TC-05: Đánh dấu đã đọc thành công một thông báo")
    void markNotificationAsRead_Success() {
        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));

        AppNotification notif = AppNotification.builder()
                .id("notif-1")
                .household(mockHousehold)
                .notificationType(NotificationTypeConstant.INVOICE_ERROR)
                .isRead(false)
                .build();

        when(notificationRepository.findByIdAndHouseholdId("notif-1", "house-uuid-1")).thenReturn(Optional.of(notif));

        notificationService.markNotificationAsRead("owner_user", "notif-1");

        assertTrue(notif.getIsRead());
        assertNotNull(notif.getReadAt());
        verify(notificationRepository, times(1)).save(notif);
    }

    @Test
    @DisplayName("TC-06: Đánh dấu đã đọc toàn bộ thông báo active của hộ")
    void markAllAsRead_Success() {
        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));

        AppNotification notif1 = AppNotification.builder().id("n1").household(mockHousehold).isRead(false).build();
        AppNotification notif2 = AppNotification.builder().id("n2").household(mockHousehold).isRead(false).build();

        when(notificationRepository.findByHouseholdIdAndIsReadFalseAndIsClosedFalseAndCreatedAtGreaterThanEqual(eq("house-uuid-1"), any()))
                .thenReturn(List.of(notif1, notif2));

        int updated = notificationService.markAllAsRead("owner_user");

        assertEquals(2, updated);
        assertTrue(notif1.getIsRead());
        assertTrue(notif2.getIsRead());
        verify(notificationRepository, times(1)).saveAll(anyList());
    }

    // =========================================================================
    // TC-08 & TC-09: Cài đặt Bật/Tắt nhận thông báo & Chặn tắt loại bắt buộc
    // =========================================================================
    @Test
    @DisplayName("TC-08: Chủ hộ xem và cập nhật bật/tắt nhận thông báo thành công")
    void updateNotificationSetting_Success() {
        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));
        when(settingRepository.findByUserIdAndNotificationType("user-owner-1", NotificationTypeConstant.LOW_STOCK_WARNING))
                .thenReturn(Optional.empty());

        UpdateNotificationSettingRequest request = UpdateNotificationSettingRequest.builder()
                .notificationType(NotificationTypeConstant.LOW_STOCK_WARNING)
                .isEnabled(false)
                .build();

        notificationService.updateNotificationSetting("owner_user", request);

        ArgumentCaptor<UserNotificationSetting> captor = ArgumentCaptor.forClass(UserNotificationSetting.class);
        verify(settingRepository, times(1)).save(captor.capture());
        UserNotificationSetting saved = captor.getValue();
        assertEquals(NotificationTypeConstant.LOW_STOCK_WARNING, saved.getNotificationType());
        assertFalse(saved.getIsEnabled());
    }

    @Test
    @DisplayName("TC-09: Chặn tắt thông báo bắt buộc nghiêm trọng (INVOICE_ERROR)")
    void updateNotificationSetting_CannotDisableMandatory_ThrowsException() {
        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));

        UpdateNotificationSettingRequest request = UpdateNotificationSettingRequest.builder()
                .notificationType(NotificationTypeConstant.INVOICE_ERROR)
                .isEnabled(false)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                notificationService.updateNotificationSetting("owner_user", request));

        assertEquals(ErrorCode.CANNOT_DISABLE_MANDATORY_NOTIFICATION, ex.getErrorCode());
        verify(settingRepository, never()).save(any());
    }

    // =========================================================================
    // TC-10: Dọn dẹp dữ liệu cũ quá 30 ngày (Data Retention Policy)
    // =========================================================================
    @Test
    @DisplayName("TC-10: Scheduled cron job dọn dẹp các thông báo cũ hơn 30 ngày")
    void cleanupExpiredNotificationsJob_Success() {
        when(notificationRepository.deleteByCreatedAtBefore(any(LocalDateTime.class))).thenReturn(15L);

        notificationService.cleanupExpiredNotificationsJob();

        verify(notificationRepository, times(1)).deleteByCreatedAtBefore(any(LocalDateTime.class));
    }

    // =========================================================================
    // TC-11: Quét và làm tươi cảnh báo hệ thống (syncReminders) - Batching không N+1
    // =========================================================================
    @Test
    @DisplayName("TC-11: Quét đồng bộ hóa đơn gửi lỗi và công nợ đến hạn tạo thông báo tương ứng theo batch")
    void syncReminders_CreatesNotificationsForFailedInvoicesAndDueDebts() {
        when(userRepository.findByUsername("owner_user")).thenReturn(Optional.of(ownerUser));

        // Mock 1 hóa đơn SEND_ERROR
        EInvoice errorInv = EInvoice.builder()
                .id("inv-err-1")
                .household(mockHousehold)
                .invoiceNumber("HD2026-0099")
                .status("SEND_ERROR")
                .taxAuthorityResponse("Lỗi mạng máy chủ Thuế")
                .build();

        when(invoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull("house-uuid-1", "SEND_ERROR"))
                .thenReturn(List.of(errorInv));
        when(notificationRepository.findByHouseholdIdAndTargetTypeAndIsClosedFalse("house-uuid-1", "INVOICE"))
                .thenReturn(Collections.emptyList());

        // Mock 1 khoản công nợ đến hạn
        Customer customer = Customer.builder()
                .id("cust-1")
                .name("Nguyễn Văn An")
                .currentDebt(new BigDecimal("3500000.00"))
                .build();
        CustomerDebt dueDebt = CustomerDebt.builder()
                .id("debt-due-1")
                .household(mockHousehold)
                .customer(customer)
                .amount(new BigDecimal("3500000.00"))
                .remainingAmount(new BigDecimal("3500000.00"))
                .dueDate(LocalDateTime.now().plusDays(1))
                .status("PENDING")
                .type("DEBT_CREATED")
                .build();

        when(customerDebtRepository.findByHouseholdIdAndStatusInAndTypeOrderByDueDateAscWithRelations(eq("house-uuid-1"), any(), eq("DEBT_CREATED")))
                .thenReturn(List.of(dueDebt));
        when(notificationRepository.findByHouseholdIdAndTargetTypeAndIsClosedFalse("house-uuid-1", "CUSTOMER_DEBT"))
                .thenReturn(Collections.emptyList());

        int count = notificationService.syncReminders("owner_user");

        assertEquals(2, count);
        verify(notificationRepository, times(1)).saveAll(argThat(list -> ((List<?>) list).size() == 2));
    }

    @Test
    @DisplayName("TC-12: Nhân viên bán hàng nhận được cả thông báo gán đích danh và thông báo chung quầy (user_id IS NULL)")
    void getNotifications_AsCashier_IncludesStoreWideGeneralNotifications() {
        when(userRepository.findByUsername("cashier_user")).thenReturn(Optional.of(cashierUser));

        // Thông báo chung quầy: user = null (ví dụ: cảnh báo kho hàng quầy)
        AppNotification generalStoreNotif = AppNotification.builder()
                .id("notif-general-1")
                .household(mockHousehold)
                .user(null) // chung toàn quầy
                .notificationType(NotificationTypeConstant.LOW_STOCK_WARNING)
                .severity("WARNING")
                .title("Cảnh báo tồn kho quầy")
                .message("Mặt hàng nước ngọt sắp hết")
                .isRead(false)
                .isClosed(false)
                .build();

        // Thông báo đích danh cho cashierUser
        AppNotification directNotif = AppNotification.builder()
                .id("notif-direct-1")
                .household(mockHousehold)
                .user(cashierUser)
                .notificationType(NotificationTypeConstant.INVOICE_ERROR)
                .severity("DANGER")
                .title("Lỗi xuất hóa đơn quầy 1")
                .message("Lỗi kết nối khi xuất HĐ")
                .isRead(false)
                .isClosed(false)
                .build();

        Page<AppNotification> pageMock = new PageImpl<>(List.of(generalStoreNotif, directNotif));
        when(notificationRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(pageMock);

        PageResponse<AppNotificationResponse> response = notificationService.getNotifications(
                "cashier_user", new NotificationFilterRequest(), 0, 10);

        assertNotNull(response);
        assertEquals(2, response.getContent().size());
        assertEquals(NotificationTypeConstant.LOW_STOCK_WARNING, response.getContent().get(0).getNotificationType());
        assertEquals(NotificationTypeConstant.INVOICE_ERROR, response.getContent().get(1).getNotificationType());
    }
}
