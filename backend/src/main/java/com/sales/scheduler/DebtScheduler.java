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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DebtScheduler {

    private static final String DEFAULT_HOUSEHOLD_NAME = "BanHangViet";
    private static final int DEFAULT_PAGE_SIZE = 100;
    private static final int DEFAULT_REMINDER_DAYS = 3;

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
    @Transactional(rollbackFor = Exception.class)
    public void autoSendDebtReminders() {
        log.info("Starting background job to scan and send auto debt reminders");
        LocalDate today = LocalDate.now();
        processPreDueReminders(today);
        processOverdueReminders(today);
    }

    private void processPreDueReminders(LocalDate today) {
        String lastId = "";
        int processedCount = 0;
        Integer maxDays = customerDebtRepository.findMaxPendingReminderDaysBefore();
        int maxDaysBefore = (maxDays != null) ? maxDays : DEFAULT_REMINDER_DAYS;
        LocalDateTime maxDueDate = today.plusDays(maxDaysBefore + 1).atStartOfDay();
        
        while (true) {
            List<CustomerDebt> pendingPreDue = customerDebtRepository.findPendingPreDueRemindersKeyset(
                    lastId, maxDueDate, PageRequest.of(0, DEFAULT_PAGE_SIZE));
            if (pendingPreDue == null || pendingPreDue.isEmpty()) {
                break;
            }
            
            for (CustomerDebt debt : pendingPreDue) {
                lastId = debt.getId(); // Update lastId for Keysets
                try {
                    Customer customer = debt.getCustomer();
                    if (customer == null || debt.getDueDate() == null) {
                        continue;
                    }

                    int daysBefore = customer.getReminderDaysBefore() != null ? customer.getReminderDaysBefore() : DEFAULT_REMINDER_DAYS;
                    LocalDate due = debt.getDueDate().toLocalDate();
                    LocalDate reminderStartDate = due.minusDays(daysBefore);

                    if ((today.isAfter(reminderStartDate) || today.isEqual(reminderStartDate)) &&
                            (today.isBefore(due) || today.isEqual(due))) {
                        String email = customer.getEmail();
                        if (email != null && !email.trim().isEmpty()) {
                            debt.setReminderSent(true);
                            customerDebtRepository.save(debt);

                            String householdName = debt.getHousehold() != null ? debt.getHousehold().getName() : DEFAULT_HOUSEHOLD_NAME;
                            emailService.sendDebtReminderEmailAsync(
                                    debt.getId(),
                                    email.trim(),
                                    customer.getName(),
                                    householdName,
                                    debt.getRemainingAmount(),
                                    debt.getDueDate()
                            );
                            processedCount++;
                        }
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý nhắc nợ trước hạn cho debt ID: {}", debt.getId(), e);
                }
            }
            
            if (pendingPreDue.size() < DEFAULT_PAGE_SIZE) {
                break;
            }
        }
        
        if (processedCount > 0) {
            log.info("Sent pre-due reminders for {} debts", processedCount);
        }
    }

    private void processOverdueReminders(LocalDate today) {
        String lastId = "";
        int processedCount = 0;
        Integer minDays = customerDebtRepository.findMinPendingOverdueReminderDaysAfter();
        int minDaysAfter = (minDays != null) ? minDays : DEFAULT_REMINDER_DAYS;
        LocalDateTime maxOverdueDueDate = today.minusDays(minDaysAfter - 1).atStartOfDay();
        
        while (true) {
            List<CustomerDebt> pendingOverdue = customerDebtRepository.findPendingOverdueRemindersKeyset(
                    lastId, maxOverdueDueDate, PageRequest.of(0, DEFAULT_PAGE_SIZE));
            if (pendingOverdue == null || pendingOverdue.isEmpty()) {
                break;
            }
            
            for (CustomerDebt debt : pendingOverdue) {
                lastId = debt.getId(); // Update lastId for Keysets
                try {
                    Customer customer = debt.getCustomer();
                    if (customer == null || debt.getDueDate() == null) {
                        continue;
                    }

                    int daysAfter = customer.getReminderDaysAfter() != null ? customer.getReminderDaysAfter() : DEFAULT_REMINDER_DAYS;
                    LocalDate overdueReminderDate = debt.getDueDate().toLocalDate().plusDays(daysAfter);

                    if (today.isAfter(overdueReminderDate) || today.isEqual(overdueReminderDate)) {
                        String email = customer.getEmail();
                        if (email != null && !email.trim().isEmpty()) {
                            debt.setOverdueReminderSent(true);
                            customerDebtRepository.save(debt);

                            String householdName = debt.getHousehold() != null ? debt.getHousehold().getName() : DEFAULT_HOUSEHOLD_NAME;
                            emailService.sendOverdueDebtReminderEmailAsync(
                                    debt.getId(),
                                    email.trim(),
                                    customer.getName(),
                                    householdName,
                                    debt.getRemainingAmount(),
                                    debt.getDueDate()
                            );
                            processedCount++;
                        }
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý nhắc nợ quá hạn cho debt ID: {}", debt.getId(), e);
                }
            }
            
            if (pendingOverdue.size() < DEFAULT_PAGE_SIZE) {
                break;
            }
        }
        
        if (processedCount > 0) {
            log.info("Sent overdue reminders for {} debts", processedCount);
        }
    }
}
