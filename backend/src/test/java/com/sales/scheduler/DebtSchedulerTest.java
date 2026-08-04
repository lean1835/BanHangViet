package com.sales.scheduler;

import com.sales.entity.BusinessHousehold;
import com.sales.entity.Customer;
import com.sales.entity.CustomerDebt;
import com.sales.repository.CustomerDebtRepository;
import com.sales.service.interfaces.EmailService;
import org.junit.jupiter.api.DisplayName;
import org.springframework.data.domain.Pageable;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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
    private EmailService emailService;

    @InjectMocks
    private DebtScheduler debtScheduler;

    @Test
    @DisplayName("Tác vụ quét nợ quá hạn - Cập nhật thành công các khoản nợ đã đến hạn")
    void scanAndMarkOverdueDebts_Success() {
        CustomerDebt expiredDebt = CustomerDebt.builder()
                .id("debt-expired")
                .amount(new BigDecimal("100000.00"))
                .remainingAmount(new BigDecimal("100000.00"))
                .type("DEBT_CREATED")
                .status("PENDING")
                .dueDate(LocalDateTime.now().minusDays(1))
                .build();

        List<CustomerDebt> expiredList = new ArrayList<>();
        expiredList.add(expiredDebt);

        when(customerDebtRepository.findByStatusInAndTypeAndDueDateBefore(
                eq(List.of("PENDING")), eq("DEBT_CREATED"), any(LocalDateTime.class)))
                .thenReturn(expiredList);

        debtScheduler.scanAndMarkOverdueDebts();

        assertEquals("OVERDUE", expiredDebt.getStatus());
        verify(customerDebtRepository, times(1)).saveAll(expiredList);
    }

    @Test
    @DisplayName("Tác vụ quét nợ quá hạn - Không làm gì nếu không có khoản nợ nào quá hạn")
    void scanAndMarkOverdueDebts_NoExpiredDebts_NoAction() {
        when(customerDebtRepository.findByStatusInAndTypeAndDueDateBefore(
                eq(List.of("PENDING")), eq("DEBT_CREATED"), any(LocalDateTime.class)))
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
                .status("PENDING")
                .type("DEBT_CREATED")
                .dueDate(LocalDateTime.now().plusDays(2)) // 2 days before due date, threshold is 3 days
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
 
         assertTrue(debt.getReminderSent());
         verify(emailService, times(1)).sendDebtReminderEmailAsync(
                 eq("customerA@gmail.com"), eq("Khách hàng A"), eq("Hộ KD A"), eq(new BigDecimal("200000")), any(LocalDateTime.class));
         verify(customerDebtRepository, times(1)).saveAll(List.of(debt));
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
                .status("OVERDUE")
                .type("DEBT_CREATED")
                .dueDate(LocalDateTime.now().minusDays(3)) // 3 days past due, threshold is 2 days
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
 
         assertTrue(debt.getOverdueReminderSent());
         verify(emailService, times(1)).sendOverdueDebtReminderEmailAsync(
                 eq("customerB@gmail.com"), eq("Khách hàng B"), eq("Hộ KD A"), eq(new BigDecimal("500000")), any(LocalDateTime.class));
         verify(customerDebtRepository, times(1)).saveAll(List.of(debt));
    }
}
