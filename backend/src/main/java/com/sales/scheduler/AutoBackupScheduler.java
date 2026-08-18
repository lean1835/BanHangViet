package com.sales.scheduler;

import com.sales.entity.BackupConfig;
import com.sales.entity.BusinessHousehold;
import com.sales.repository.BackupConfigRepository;
import com.sales.service.interfaces.AutoBackupService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutoBackupScheduler {

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final BackupConfigRepository backupConfigRepository;
    private final AutoBackupService autoBackupService;

    /**
     * Tác vụ tự động quét và kích hoạt sao lưu ngầm theo lịch đã cấu hình.
     * Chạy hàng giờ (vào phút thứ 0 của mỗi giờ) để kiểm tra các hộ kinh doanh đến giờ sao lưu.
     */
    @Scheduled(cron = "0 0 * * * *")
    public void runDailyAutoBackupJob() {
        String currentHourMinute = LocalTime.now().format(TIME_FORMATTER);
        log.info("Bắt đầu tác vụ kiểm tra sao lưu tự động ngầm lúc HH:mm = {}", currentHourMinute);

        List<BackupConfig> enabledConfigs = backupConfigRepository.findAllEnabledAutoBackupConfigs();

        for (BackupConfig config : enabledConfigs) {
            BusinessHousehold household = config.getHousehold();
            if (household == null) {
                continue;
            }

            // So sánh giờ hiện tại với giờ hẹn scheduledTime (e.g., "01:00")
            if (currentHourMinute.equals(config.getScheduledTime())) {
                log.info("Kích hoạt sao lưu tự động cho hộ kinh doanh id={} name={} tại thời điểm {}",
                        household.getId(), household.getName(), currentHourMinute);
                try {
                    autoBackupService.runDailyAutoBackupForHousehold(household);
                } catch (Exception e) {
                    log.error("Lỗi khi chạy sao lưu tự động cho hộ id={}", household.getId(), e);
                }
            }
        }
    }
}
