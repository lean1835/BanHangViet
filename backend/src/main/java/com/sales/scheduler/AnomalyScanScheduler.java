package com.sales.scheduler;

import com.sales.service.interfaces.AnomalyDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.scheduler.anomaly-scan.enabled", havingValue = "true", matchIfMissing = true)
public class AnomalyScanScheduler {

    private final AnomalyDetectionService anomalyDetectionService;

    /**
     * Quét phát hiện thao tác bất thường định kỳ (mặc định mỗi 30 phút một lần)
     */
    @Scheduled(cron = "${app.scheduler.anomaly-scan.cron:0 */30 * * * *}")
    public void scheduleAnomalyScan() {
        log.info("Bắt đầu tác vụ định kỳ quét phát hiện thao tác bất thường (NCL-14-CN-004)...");
        try {
            anomalyDetectionService.performScheduledScan();
        } catch (Exception e) {
            log.error("Lỗi trong quá trình thực thi scheduler quét thao tác bất thường", e);
        }
    }
}
