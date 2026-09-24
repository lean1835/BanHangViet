package com.sales.modules.tax.scheduler;
import com.sales.modules.tax.service.TaxReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class TaxDeclarationReminderScheduler {

    private final TaxReminderService taxReminderService;

    /**
     * Tự động quét và đẩy thông báo nhắc nộp tờ khai thuế định kỳ
     * Mặc định chạy vào lúc 07:00:00 sáng mỗi ngày
     */
    @Scheduled(cron = "${app.scheduler.tax-reminder.cron:0 0 7 * * *}")
    public void autoScanTaxDeclarationReminders() {
        log.info("Starting background job to scan and remind tax declaration deadlines");
        try {
            taxReminderService.scanAndGenerateTaxReminders();
        } catch (Exception e) {
            log.error("Error executing autoScanTaxDeclarationReminders: {}", e.getMessage(), e);
        }
    }
}
