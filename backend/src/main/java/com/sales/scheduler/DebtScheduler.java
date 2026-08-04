package com.sales.scheduler;

import com.sales.entity.Customer;
import com.sales.entity.CustomerDebt;
import com.sales.repository.CustomerDebtRepository;
import com.sales.service.interfaces.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DebtScheduler {

    private final CustomerDebtRepository customerDebtRepository;
    private final EmailService emailService;

    @Scheduled(cron = "${app.scheduler.overdue-scan.cron:0 0 0 * * *}")
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

    @Scheduled(cron = "${app.scheduler.debt-reminder.cron:0 0 1 * * *}")
    public void autoSendDebtReminders() {
        log.info("Starting background job to scan and send auto debt reminders");
        processPreDueReminders();
        processOverdueReminders();
    }

    private void processPreDueReminders() {
        int page = 0;
        int pageSize = 100;
        int processedCount = 0;
        
        while (true) {
            List<CustomerDebt> pendingPreDue = customerDebtRepository.findPendingPreDueReminders(PageRequest.of(page, pageSize));
            if (pendingPreDue == null || pendingPreDue.isEmpty()) {
                break;
            }
            boolean progressMade = false;
            for (CustomerDebt debt : pendingPreDue) {
                try {
                    Customer customer = debt.getCustomer();
                    if (customer == null || debt.getDueDate() == null) {
                        continue;
                    }

                    int daysBefore = customer.getReminderDaysBefore() != null ? customer.getReminderDaysBefore() : 3;
                    LocalDateTime reminderThreshold = LocalDateTime.now().plusDays(daysBefore);

                    if (reminderThreshold.isAfter(debt.getDueDate()) || reminderThreshold.isEqual(debt.getDueDate())) {
                        String email = customer.getEmail();
                        if (email != null && !email.trim().isEmpty()) {
                            String householdName = debt.getHousehold() != null ? debt.getHousehold().getName() : "BanHangViet";
                            emailService.sendDebtReminderEmailAsync(
                                    email.trim(),
                                    customer.getName(),
                                    householdName,
                                    debt.getRemainingAmount(),
                                    debt.getDueDate()
                            );
                            debt.setReminderSent(true);
                            customerDebtRepository.save(debt);
                            processedCount++;
                            progressMade = true;
                        }
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý nhắc nợ trước hạn cho debt ID: {}", debt.getId(), e);
                }
            }
            if (!progressMade) {
                page++;
            }
        }
        
        if (processedCount > 0) {
            log.info("Sent pre-due reminders for {} debts", processedCount);
        }
    }

    private void processOverdueReminders() {
        int page = 0;
        int pageSize = 100;
        int processedCount = 0;
        
        while (true) {
            List<CustomerDebt> pendingOverdue = customerDebtRepository.findPendingOverdueReminders(PageRequest.of(page, pageSize));
            if (pendingOverdue == null || pendingOverdue.isEmpty()) {
                break;
            }
            boolean progressMade = false;
            for (CustomerDebt debt : pendingOverdue) {
                try {
                    Customer customer = debt.getCustomer();
                    if (customer == null || debt.getDueDate() == null) {
                        continue;
                    }

                    int daysAfter = customer.getReminderDaysAfter() != null ? customer.getReminderDaysAfter() : 3;
                    LocalDateTime overdueThreshold = debt.getDueDate().plusDays(daysAfter);

                    if (LocalDateTime.now().isAfter(overdueThreshold) || LocalDateTime.now().isEqual(overdueThreshold)) {
                        String email = customer.getEmail();
                        if (email != null && !email.trim().isEmpty()) {
                            String householdName = debt.getHousehold() != null ? debt.getHousehold().getName() : "BanHangViet";
                            emailService.sendOverdueDebtReminderEmailAsync(
                                    email.trim(),
                                    customer.getName(),
                                    householdName,
                                    debt.getRemainingAmount(),
                                    debt.getDueDate()
                            );
                            debt.setOverdueReminderSent(true);
                            customerDebtRepository.save(debt);
                            processedCount++;
                            progressMade = true;
                        }
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý nhắc nợ quá hạn cho debt ID: {}", debt.getId(), e);
                }
            }
            if (!progressMade) {
                page++;
            }
        }
        
        if (processedCount > 0) {
            log.info("Sent overdue reminders for {} debts", processedCount);
        }
    }
}
