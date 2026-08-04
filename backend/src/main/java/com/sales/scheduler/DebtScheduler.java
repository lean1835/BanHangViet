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
import java.util.ArrayList;
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
        String lastId = "";
        int pageSize = 100;
        int processedCount = 0;
        Integer maxDays = customerDebtRepository.findMaxPendingReminderDaysBefore();
        int maxDaysBefore = (maxDays != null) ? maxDays : 3;
        LocalDateTime maxDueDate = LocalDateTime.now().plusDays(maxDaysBefore);
        
        while (true) {
            List<CustomerDebt> pendingPreDue = customerDebtRepository.findPendingPreDueRemindersKeyset(
                    lastId, maxDueDate, PageRequest.of(0, pageSize));
            if (pendingPreDue == null || pendingPreDue.isEmpty()) {
                break;
            }
            
            List<CustomerDebt> updatedBatch = new ArrayList<>();
            for (CustomerDebt debt : pendingPreDue) {
                lastId = debt.getId(); // Update lastId for Keysets
                try {
                    Customer customer = debt.getCustomer();
                    if (customer == null || debt.getDueDate() == null) {
                        continue;
                    }

                    int daysBefore = customer.getReminderDaysBefore() != null ? customer.getReminderDaysBefore() : 3;
                    LocalDateTime reminderThreshold = LocalDateTime.now().plusDays(daysBefore);

                    if (debt.getDueDate().isAfter(LocalDateTime.now()) &&
                            (reminderThreshold.isAfter(debt.getDueDate()) || reminderThreshold.isEqual(debt.getDueDate()))) {
                        String email = customer.getEmail();
                        if (email != null && !email.trim().isEmpty()) {
                            debt.setReminderSent(true);
                            updatedBatch.add(debt);
                            processedCount++;
                        }
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý nhắc nợ trước hạn cho debt ID: {}", debt.getId(), e);
                }
            }
            
            if (!updatedBatch.isEmpty()) {
                customerDebtRepository.saveAll(updatedBatch);
                for (CustomerDebt debt : updatedBatch) {
                    try {
                        Customer customer = debt.getCustomer();
                        String email = customer.getEmail();
                        String householdName = debt.getHousehold() != null ? debt.getHousehold().getName() : "BanHangViet";
                        emailService.sendDebtReminderEmailAsync(
                                email.trim(),
                                customer.getName(),
                                householdName,
                                debt.getRemainingAmount(),
                                debt.getDueDate()
                        );
                    } catch (Exception e) {
                        log.error("Lỗi khi gửi email nhắc nợ trước hạn cho debt ID: {}", debt.getId(), e);
                    }
                }
            }
            
            if (pendingPreDue.size() < pageSize) {
                break;
            }
        }
        
        if (processedCount > 0) {
            log.info("Sent pre-due reminders for {} debts", processedCount);
        }
    }

    private void processOverdueReminders() {
        String lastId = "";
        int pageSize = 100;
        int processedCount = 0;
        Integer minDays = customerDebtRepository.findMinPendingOverdueReminderDaysAfter();
        int minDaysAfter = (minDays != null) ? minDays : 3;
        LocalDateTime maxOverdueDueDate = LocalDateTime.now().minusDays(minDaysAfter);
        
        while (true) {
            List<CustomerDebt> pendingOverdue = customerDebtRepository.findPendingOverdueRemindersKeyset(
                    lastId, maxOverdueDueDate, PageRequest.of(0, pageSize));
            if (pendingOverdue == null || pendingOverdue.isEmpty()) {
                break;
            }
            
            List<CustomerDebt> updatedBatch = new ArrayList<>();
            for (CustomerDebt debt : pendingOverdue) {
                lastId = debt.getId(); // Update lastId for Keysets
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
                            debt.setOverdueReminderSent(true);
                            updatedBatch.add(debt);
                            processedCount++;
                        }
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý nhắc nợ quá hạn cho debt ID: {}", debt.getId(), e);
                }
            }
            
            if (!updatedBatch.isEmpty()) {
                customerDebtRepository.saveAll(updatedBatch);
                for (CustomerDebt debt : updatedBatch) {
                    try {
                        Customer customer = debt.getCustomer();
                        String email = customer.getEmail();
                        String householdName = debt.getHousehold() != null ? debt.getHousehold().getName() : "BanHangViet";
                        emailService.sendOverdueDebtReminderEmailAsync(
                                email.trim(),
                                customer.getName(),
                                householdName,
                                debt.getRemainingAmount(),
                                debt.getDueDate()
                        );
                    } catch (Exception e) {
                        log.error("Lỗi khi gửi email nhắc nợ quá hạn cho debt ID: {}", debt.getId(), e);
                    }
                }
            }
            
            if (pendingOverdue.size() < pageSize) {
                break;
            }
        }
        
        if (processedCount > 0) {
            log.info("Sent overdue reminders for {} debts", processedCount);
        }
    }
}
