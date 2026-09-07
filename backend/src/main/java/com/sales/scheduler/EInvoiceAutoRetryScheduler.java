package com.sales.scheduler;

import com.sales.dto.response.InvoiceAutoRetrySummaryResponse;
import com.sales.service.interfaces.EInvoiceAutoRetryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EInvoiceAutoRetryScheduler {

    private final EInvoiceAutoRetryService autoRetryService;

    // Chạy định kỳ theo biểu thức cron cấu hình trong application.yaml, mặc định là 5 phút một lần (0 */5 * * * *)
    @Scheduled(cron = "${app.invoice.auto-retry-cron:0 */5 * * * *}")
    public void runScheduledAutoRetry() {
        log.info("Kích hoạt tác vụ định kỳ tự động gửi lại hóa đơn chưa được cấp mã (NCL-04-CN-007)");
        try {
            InvoiceAutoRetrySummaryResponse summary = autoRetryService.processScheduledAutoRetry();
            if (summary.getTotalProcessed() > 0) {
                log.info("Kết quả tác vụ tự động gửi lại hóa đơn: Tổng={}, Thành công={}, Chuyển thủ công={}, Lỗi={}",
                        summary.getTotalProcessed(), summary.getSuccessCount(), summary.getMovedToManualCount(), summary.getFailedCount());
            }
        } catch (Exception e) {
            log.error("Lỗi khi chạy tác vụ định kỳ tự động gửi lại hóa đơn", e);
        }
    }
}
