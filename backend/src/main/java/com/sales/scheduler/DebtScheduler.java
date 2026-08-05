package com.sales.scheduler;

import com.sales.entity.Customer;
import com.sales.entity.CustomerDebt;
import com.sales.repository.CustomerDebtRepository;
import com.sales.service.interfaces.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.function.BiConsumer;
import java.util.function.BiPredicate;
import java.util.function.Function;

@Component
@RequiredArgsConstructor
@Slf4j
public class DebtScheduler {

    private static final int DEFAULT_PAGE_SIZE = 100;
    private static final int DEFAULT_REMINDER_DAYS = 3;

    @Value("${app.default-household-name:BanHangViet}")
    private String defaultHouseholdName = "BanHangViet";

    private final CustomerDebtRepository customerDebtRepository;
    private final EmailService emailService;
    private final TransactionTemplate transactionTemplate;

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
        LocalDate today = LocalDate.now();
        processPreDueReminders(today);
        processOverdueReminders(today);
    }

    private void processPreDueReminders(LocalDate today) {
        Integer maxDays = customerDebtRepository.findMaxPendingReminderDaysBefore();
        int maxDaysBefore = (maxDays != null && maxDays > 0) ? maxDays : DEFAULT_REMINDER_DAYS;
        LocalDateTime maxDueDate = today.plusDays(maxDaysBefore + 1).atStartOfDay();

        int processedCount = processDebtRemindersBatch(
                lastId -> customerDebtRepository.findPendingPreDueRemindersKeyset(
                        lastId, maxDueDate, PageRequest.of(0, DEFAULT_PAGE_SIZE)),
                (customer, debt) -> {
                    int daysBefore = customer.getReminderDaysBefore() != null ? customer.getReminderDaysBefore() : DEFAULT_REMINDER_DAYS;
                    LocalDate due = debt.getDueDate().toLocalDate();
                    LocalDate reminderStartDate = due.minusDays(daysBefore);
                    return (today.isAfter(reminderStartDate) || today.isEqual(reminderStartDate)) &&
                            (today.isBefore(due) || today.isEqual(due));
                },
                (debt, email) -> {
                    String householdName = debt.getHousehold() != null ? debt.getHousehold().getName() : defaultHouseholdName;
                    emailService.sendDebtReminderEmail(
                            debt.getId(),
                            email,
                            debt.getCustomer().getName(),
                            householdName,
                            debt.getRemainingAmount(),
                            debt.getDueDate()
                    );
                    debt.setReminderSent(true);
                },
                "trước hạn"
        );

        if (processedCount > 0) {
            log.info("Sent pre-due reminders for {} debts", processedCount);
        }
    }

    private void processOverdueReminders(LocalDate today) {
        Integer minDays = customerDebtRepository.findMinPendingOverdueReminderDaysAfter();
        int minDaysAfter = (minDays != null && minDays > 0) ? minDays : DEFAULT_REMINDER_DAYS;
        LocalDateTime maxOverdueDueDate = today.minusDays(minDaysAfter - 1).atStartOfDay();

        int processedCount = processDebtRemindersBatch(
                lastId -> customerDebtRepository.findPendingOverdueRemindersKeyset(
                        lastId, maxOverdueDueDate, PageRequest.of(0, DEFAULT_PAGE_SIZE)),
                (customer, debt) -> {
                    int daysAfter = customer.getReminderDaysAfter() != null ? customer.getReminderDaysAfter() : DEFAULT_REMINDER_DAYS;
                    LocalDate overdueReminderDate = debt.getDueDate().toLocalDate().plusDays(daysAfter);
                    return today.isAfter(overdueReminderDate) || today.isEqual(overdueReminderDate);
                },
                (debt, email) -> {
                    String householdName = debt.getHousehold() != null ? debt.getHousehold().getName() : defaultHouseholdName;
                    emailService.sendOverdueDebtReminderEmail(
                            debt.getId(),
                            email,
                            debt.getCustomer().getName(),
                            householdName,
                            debt.getRemainingAmount(),
                            debt.getDueDate()
                    );
                    debt.setOverdueReminderSent(true);
                },
                "quá hạn"
        );

        if (processedCount > 0) {
            log.info("Sent overdue reminders for {} debts", processedCount);
        }
    }

    private int processDebtRemindersBatch(
            Function<String, List<CustomerDebt>> pageFetcher,
            BiPredicate<Customer, CustomerDebt> eligibilityChecker,
            BiConsumer<CustomerDebt, String> emailSender,
            String reminderTypeLog
    ) {
        String lastId = "";
        int processedCount = 0;

        while (true) {
            List<CustomerDebt> pendingDebts = pageFetcher.apply(lastId);
            if (pendingDebts == null || pendingDebts.isEmpty()) {
                break;
            }

            List<CustomerDebt> toSave = new ArrayList<>();

            for (CustomerDebt debt : pendingDebts) {
                lastId = debt.getId(); // Update lastId for keyset pagination
                try {
                    Customer customer = debt.getCustomer();
                    if (customer == null || debt.getDueDate() == null) {
                        continue;
                    }

                    if (eligibilityChecker.test(customer, debt)) {
                        String email = customer.getEmail();
                        // Defensive check: Dù query SQL đã lọc email null/rỗng, vẫn kiểm tra lại ở tầng Application để đảm bảo an toàn tuyệt đối
                        if (StringUtils.hasText(email)) {
                            emailSender.accept(debt, email.trim());
                            toSave.add(debt);
                            processedCount++;
                        }
                    }
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý nhắc nợ {} cho debt ID: {}", reminderTypeLog, debt.getId(), e);
                }
            }

            if (!toSave.isEmpty()) {
                transactionTemplate.executeWithoutResult(status -> customerDebtRepository.saveAll(toSave));
            }

            if (pendingDebts.size() < DEFAULT_PAGE_SIZE) {
                break;
            }
        }

        return processedCount;
    }
}
