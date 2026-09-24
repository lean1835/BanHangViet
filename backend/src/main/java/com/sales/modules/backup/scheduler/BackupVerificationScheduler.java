package com.sales.modules.backup.scheduler;
import com.sales.modules.backup.service.BackupVerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BackupVerificationScheduler {

    private final BackupVerificationService backupVerificationService;

    /**
     * Tác vụ tự động quét và chạy thử phục hồi bản sao lưu vào môi trường tạm (NCL-14-CN-005).
     * Chạy định kỳ vào lúc 02:30 sáng hằng ngày sau khi tiến trình sao lưu tự động hoàn tất.
     */
    @Scheduled(cron = "${app.scheduler.backup-verification.cron:0 30 2 * * *}")
    public void runDailyBackupVerificationJob() {
        log.info("Khởi chạy tiến trình tự động thử phục hồi bản sao lưu định kỳ...");
        try {
            backupVerificationService.runScheduledPeriodicVerification();
            log.info("Hoàn tất tiến trình tự động thử phục hồi bản sao lưu định kỳ.");
        } catch (Exception e) {
            log.error("Lỗi khi chạy tác vụ tự động thử phục hồi bản sao lưu định kỳ", e);
        }
    }
}
