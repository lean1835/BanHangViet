package com.sales.scheduler;

import com.sales.entity.Customer;
import com.sales.entity.CustomerDebt;
import com.sales.repository.CustomerDebtRepository;
import com.sales.service.interfaces.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DebtScheduler {

    private final CustomerDebtRepository customerDebtRepository;
    private final EmailService emailService;

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional(rollbackFor = Exception.class)
    public void scanAndMarkOverdueDebts() {
        log.info("Starting background job to scan and mark overdue debts");
        List<CustomerDebt> expiredDebts = customerDebtRepository.findByStatusInAndTypeAndDueDateBefore(
                List.of("PENDING"), "DEBT_CREATED", LocalDateTime.now());
        if (!expiredDebts.isEmpty()) {
            for (CustomerDebt debt : expiredDebts) {
                debt.setStatus("OVERDUE");
            }
            customerDebtRepository.saveAll(expiredDebts);
            log.info("Marked {} debts as OVERDUE", expiredDebts.size());
        }
    }

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional(rollbackFor = Exception.class)
    public void autoSendDebtReminders() {
        log.info("Starting background job to scan and send auto debt reminders");

        // 1. Nhắc nợ trước hạn
        List<CustomerDebt> pendingPreDue = customerDebtRepository.findPendingPreDueReminders();
        List<CustomerDebt> updatedPreDue = new ArrayList<>();
        for (CustomerDebt debt : pendingPreDue) {
            Customer customer = debt.getCustomer();
            if (customer != null && customer.getReminderDaysBefore() != null) {
                LocalDateTime reminderThreshold = LocalDateTime.now().plusDays(customer.getReminderDaysBefore());
                if (reminderThreshold.isAfter(debt.getDueDate()) || reminderThreshold.isEqual(debt.getDueDate())) {
                    if (customer.getEmail() != null && !customer.getEmail().trim().isEmpty()) {
                        emailService.sendDebtReminderEmailAsync(
                                customer.getEmail(),
                                customer.getName(),
                                debt.getHousehold().getName(),
                                debt.getRemainingAmount(),
                                debt.getDueDate()
                        );
                    }
                    debt.setReminderSent(true);
                    updatedPreDue.add(debt);
                }
            }
        }
        if (!updatedPreDue.isEmpty()) {
            customerDebtRepository.saveAll(updatedPreDue);
            log.info("Sent pre-due reminders for {} debts", updatedPreDue.size());
        }

        // 2. Nhắc nợ sau khi quá hạn
        List<CustomerDebt> pendingOverdue = customerDebtRepository.findPendingOverdueReminders();
        List<CustomerDebt> updatedOverdue = new ArrayList<>();
        for (CustomerDebt debt : pendingOverdue) {
            Customer customer = debt.getCustomer();
            if (customer != null && customer.getReminderDaysAfter() != null) {
                LocalDateTime overdueThreshold = debt.getDueDate().plusDays(customer.getReminderDaysAfter());
                if (LocalDateTime.now().isAfter(overdueThreshold) || LocalDateTime.now().isEqual(overdueThreshold)) {
                    if (customer.getEmail() != null && !customer.getEmail().trim().isEmpty()) {
                        emailService.sendOverdueDebtReminderEmailAsync(
                                customer.getEmail(),
                                customer.getName(),
                                debt.getHousehold().getName(),
                                debt.getRemainingAmount(),
                                debt.getDueDate()
                        );
                    }
                    debt.setOverdueReminderSent(true);
                    updatedOverdue.add(debt);
                }
            }
        }
        if (!updatedOverdue.isEmpty()) {
            customerDebtRepository.saveAll(updatedOverdue);
            log.info("Sent overdue reminders for {} debts", updatedOverdue.size());
        }
    }
}
