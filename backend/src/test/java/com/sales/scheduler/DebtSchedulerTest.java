package com.sales.scheduler;

import com.sales.constant.DebtStatus;
import com.sales.constant.DebtType;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Customer;
import com.sales.entity.CustomerDebt;
import com.sales.repository.BusinessHouseholdSettingsRepository;
import com.sales.repository.CustomerDebtRepository;
import com.sales.service.interfaces.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DebtSchedulerTest {

    @Mock
    private CustomerDebtRepository customerDebtRepository;

    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private TransactionTemplate transactionTemplate;

    @InjectMocks
    private DebtScheduler debtScheduler;

    @BeforeEach
    void setUp() {
        lenient().doAnswer(invocation -> {
            Consumer<TransactionStatus> action = invocation.getArgument(0);
            action.accept(null);
            return null;
        }).when(transactionTemplate).executeWithoutResult(any());
    }

    @Test
    @DisplayName("Tác vụ quét nợ quá hạn - Cập nhật thành công các khoản nợ đã đến hạn")
    void scanAndMarkOverdueDebts_Success() {
        CustomerDebt expiredDebt = CustomerDebt.builder()
                .id("debt-expired")
                .amount(new BigDecimal("100000.00"))
                .remainingAmount(new BigDecimal("100000.00"))
                .type(DebtType.DEBT_CREATED)
                .status(DebtStatus.PENDING)
                .dueDate(LocalDateTime.now().minusDays(1))
                .build();

        List<CustomerDebt> expiredList = new ArrayList<>();
        expiredList.add(expiredDebt);

        when(customerDebtRepository.findByStatusInAndTypeAndDueDateBefore(
                eq(List.of(DebtStatus.PENDING)), eq(DebtType.DEBT_CREATED), any(LocalDateTime.class)))
                .thenReturn(expiredList);

        debtScheduler.scanAndMarkOverdueDebts();

        assertEquals(DebtStatus.OVERDUE, expiredDebt.getStatus());
        verify(transactionTemplate, times(1)).executeWithoutResult(any());
        verify(customerDebtRepository, times(1)).saveAll(expiredList);
    }

    @Test
    @DisplayName("Tác vụ quét nợ quá hạn - Không làm gì nếu không có khoản nợ nào quá hạn")
    void scanAndMarkOverdueDebts_NoExpiredDebts_NoAction() {
        when(customerDebtRepository.findByStatusInAndTypeAndDueDateBefore(
                eq(List.of(DebtStatus.PENDING)), eq(DebtType.DEBT_CREATED), any(LocalDateTime.class)))
                .thenReturn(List.of());

        debtScheduler.scanAndMarkOverdueDebts();

        verify(customerDebtRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Tự động gửi thông báo nhắc nợ - Gửi nhắc nợ trước hạn thành công")
    void autoSendDebtReminders_PreDue_Success() {
        BusinessHousehold household = BusinessHousehold.builder().name("Hộ KD A").build();
        Customer customer = Customer.builder()
                .name("Khách hàng A")
                .email("customerA@gmail.com")
                .reminderDaysBefore(3)
                .build();

        CustomerDebt debt = CustomerDebt.builder()
                .id("debt-1")
                .customer(customer)
                .household(household)
                .amount(new BigDecimal("200000"))
                .remainingAmount(new BigDecimal("200000"))
                .status(DebtStatus.PENDING)
                .type(DebtType.DEBT_CREATED)
                .dueDate(LocalDateTime.now().plusDays(2))
                .reminderSent(false)
                .build();

        when(customerDebtRepository.findMaxPendingReminderDaysBefore()).thenReturn(3);
        when(customerDebtRepository.findMinPendingOverdueReminderDaysAfter()).thenReturn(3);
        when(customerDebtRepository.findPendingPreDueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of(debt))
                .thenReturn(List.of());
        when(customerDebtRepository.findPendingOverdueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of());

        debtScheduler.autoSendDebtReminders();

        assertTrue(debt.isReminderSent());
        verify(customerDebtRepository, times(1)).saveAll(List.of(debt));
        verify(emailService, times(1)).sendCustomDebtReminderEmail(
                eq("customerA@gmail.com"), eq("Khách hàng A"), eq("Hộ KD A"), eq(new BigDecimal("200000")), anyString());
    }

    @Test
    @DisplayName("Tự động gửi thông báo nhắc nợ - Gửi nhắc nợ thất bại thì KHÔNG lưu trạng thái DB")
    void autoSendDebtReminders_PreDue_EmailFail_DoNotSaveStatus() {
        BusinessHousehold household = BusinessHousehold.builder().name("Hộ KD A").build();
        Customer customer = Customer.builder()
                .name("Khách hàng A")
                .email("customerA@gmail.com")
                .reminderDaysBefore(3)
                .build();

        CustomerDebt debt = CustomerDebt.builder()
                .id("debt-fail-1")
                .customer(customer)
                .household(household)
                .amount(new BigDecimal("200000"))
                .remainingAmount(new BigDecimal("200000"))
                .status(DebtStatus.PENDING)
                .type(DebtType.DEBT_CREATED)
                .dueDate(LocalDateTime.now().plusDays(2))
                .reminderSent(false)
                .build();

        when(customerDebtRepository.findMaxPendingReminderDaysBefore()).thenReturn(3);
        when(customerDebtRepository.findMinPendingOverdueReminderDaysAfter()).thenReturn(3);
        when(customerDebtRepository.findPendingPreDueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of(debt))
                .thenReturn(List.of());
        when(customerDebtRepository.findPendingOverdueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of());

        doThrow(new RuntimeException("SMTP connection error"))
                .when(emailService).sendCustomDebtReminderEmail(any(), any(), any(), any(), any());

        debtScheduler.autoSendDebtReminders();

        assertEquals(false, debt.isReminderSent());
        verify(customerDebtRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Tự động gửi thông báo nhắc nợ - Gửi nhắc nợ sau khi quá hạn thành công")
    void autoSendDebtReminders_Overdue_Success() {
        BusinessHousehold household = BusinessHousehold.builder().name("Hộ KD A").build();
        Customer customer = Customer.builder()
                .name("Khách hàng B")
                .email("customerB@gmail.com")
                .reminderDaysAfter(2)
                .build();

        CustomerDebt debt = CustomerDebt.builder()
                .id("debt-2")
                .customer(customer)
                .household(household)
                .amount(new BigDecimal("500000"))
                .remainingAmount(new BigDecimal("500000"))
                .status(DebtStatus.OVERDUE)
                .type(DebtType.DEBT_CREATED)
                .dueDate(LocalDateTime.now().minusDays(3))
                .overdueReminderSent(false)
                .build();

        when(customerDebtRepository.findMaxPendingReminderDaysBefore()).thenReturn(3);
        when(customerDebtRepository.findMinPendingOverdueReminderDaysAfter()).thenReturn(3);
        when(customerDebtRepository.findPendingPreDueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of());
        when(customerDebtRepository.findPendingOverdueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of(debt))
                .thenReturn(List.of());

        debtScheduler.autoSendDebtReminders();

        assertTrue(debt.isOverdueReminderSent());
        verify(customerDebtRepository, times(1)).saveAll(List.of(debt));
        verify(emailService, times(1)).sendCustomDebtReminderEmail(
                eq("customerB@gmail.com"), eq("Khách hàng B"), eq("Hộ KD A"), eq(new BigDecimal("500000")), anyString());
    }

    @Test
    @DisplayName("Tự động gửi thông báo nhắc nợ - Fallback tên hộ kinh doanh mặc định khi household null")
    void autoSendDebtReminders_NullHousehold_FallbackDefaultName() {
        Customer customer = Customer.builder()
                .name("Khách hàng C")
                .email("customerC@gmail.com")
                .reminderDaysBefore(3)
                .build();

        CustomerDebt debt = CustomerDebt.builder()
                .id("debt-3")
                .customer(customer)
                .household(null)
                .amount(new BigDecimal("300000"))
                .remainingAmount(new BigDecimal("300000"))
                .status(DebtStatus.PENDING)
                .type(DebtType.DEBT_CREATED)
                .dueDate(LocalDateTime.now().plusDays(1))
                .reminderSent(false)
                .build();

        when(customerDebtRepository.findMaxPendingReminderDaysBefore()).thenReturn(3);
        when(customerDebtRepository.findMinPendingOverdueReminderDaysAfter()).thenReturn(3);
        when(customerDebtRepository.findPendingPreDueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of(debt))
                .thenReturn(List.of());
        when(customerDebtRepository.findPendingOverdueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of());

        debtScheduler.autoSendDebtReminders();

        verify(emailService, times(1)).sendCustomDebtReminderEmail(
                eq("customerC@gmail.com"), eq("Khách hàng C"), eq("BanHangViet"), eq(new BigDecimal("300000")), anyString());
    }

    @Test
    @DisplayName("Tự động gửi thông báo nhắc nợ - Bỏ qua khi email của khách hàng null hoặc trống")
    void autoSendDebtReminders_NullOrEmptyEmail_Skip() {
        Customer customerNoEmail = Customer.builder()
                .name("Khách không mail")
                .email(null)
                .reminderDaysBefore(3)
                .build();

        CustomerDebt debt = CustomerDebt.builder()
                .id("debt-4")
                .customer(customerNoEmail)
                .amount(new BigDecimal("100000"))
                .remainingAmount(new BigDecimal("100000"))
                .status(DebtStatus.PENDING)
                .type(DebtType.DEBT_CREATED)
                .dueDate(LocalDateTime.now().plusDays(1))
                .reminderSent(false)
                .build();

        when(customerDebtRepository.findMaxPendingReminderDaysBefore()).thenReturn(3);
        when(customerDebtRepository.findMinPendingOverdueReminderDaysAfter()).thenReturn(3);
        when(customerDebtRepository.findPendingPreDueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of(debt))
                .thenReturn(List.of());
        when(customerDebtRepository.findPendingOverdueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of());

        debtScheduler.autoSendDebtReminders();

        verify(emailService, never()).sendCustomDebtReminderEmail(any(), any(), any(), any(), any());
        verify(customerDebtRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("P1-1: Nhắc nợ trước hạn dùng cache householdReminderDaysCache, chỉ gọi repository 1 lần cho cùng 1 hộ (Tránh N+1 query)")
    void autoSendDebtReminders_PreDue_HouseholdSettingsCached_NoNPlusOne() {
        BusinessHousehold household = BusinessHousehold.builder().id("hh-1").name("Hộ Kinh Doanh ABC").build();
        Customer customer1 = Customer.builder().id("c-1").name("Khách 1").email("c1@gmail.com").reminderDaysBefore(null).build();
        Customer customer2 = Customer.builder().id("c-2").name("Khách 2").email("c2@gmail.com").reminderDaysBefore(null).build();

        CustomerDebt debt1 = CustomerDebt.builder()
                .id("debt-101")
                .customer(customer1)
                .household(household)
                .amount(new BigDecimal("100000"))
                .remainingAmount(new BigDecimal("100000"))
                .status(DebtStatus.PENDING)
                .type(DebtType.DEBT_CREATED)
                .dueDate(LocalDateTime.now().plusDays(2))
                .reminderSent(false)
                .build();

        CustomerDebt debt2 = CustomerDebt.builder()
                .id("debt-102")
                .customer(customer2)
                .household(household)
                .amount(new BigDecimal("200000"))
                .remainingAmount(new BigDecimal("200000"))
                .status(DebtStatus.PENDING)
                .type(DebtType.DEBT_CREATED)
                .dueDate(LocalDateTime.now().plusDays(2))
                .reminderSent(false)
                .build();

        when(customerDebtRepository.findMaxPendingReminderDaysBefore()).thenReturn(3);
        when(settingsRepository.findMaxDebtReminderDaysBefore()).thenReturn(5);
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(
                com.sales.entity.BusinessHouseholdSettings.builder().debtReminderDaysBefore(5).build()
        ));
        when(customerDebtRepository.findMinPendingOverdueReminderDaysAfter()).thenReturn(3);
        when(customerDebtRepository.findPendingPreDueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of(debt1, debt2))
                .thenReturn(List.of());
        when(customerDebtRepository.findPendingOverdueRemindersKeyset(any(), any(), any()))
                .thenReturn(List.of());

        debtScheduler.autoSendDebtReminders();

        // Kiểm tra findByHouseholdId("hh-1") chỉ được gọi ĐÚNG 1 LẦN duy nhất dù có 2 khoản nợ cùng hộ
        verify(settingsRepository, times(1)).findByHouseholdId("hh-1");
        assertTrue(debt1.isReminderSent());
        assertTrue(debt2.isReminderSent());
        verify(emailService, times(2)).sendCustomDebtReminderEmail(any(), any(), any(), any(), any());
    }
}
