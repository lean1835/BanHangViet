package com.sales.modules.tax.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxPeriodReminderResponse {
    private String periodId;
    private String periodName;
    private String periodType; // MONTHLY, QUARTERLY
    private Integer year;
    private Integer periodNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate filingDeadline;     // Hạn nộp tờ khai theo luật thuế
    private long daysRemaining;          // Số ngày còn lại (dương: còn hạn; âm: quá hạn)
    private boolean isOverdue;            // true nếu đã quá hạn
    private String severity;              // INFO, WARNING, DANGER
    private String status;                // DRAFT, GENERATED, SUBMITTED, LOCKED
    private boolean isClosed;             // true nếu nhắc việc đã tự đóng
    private String notificationId;        // ID thông báo liên kết nếu có
    private TaxPeriodChecklistResponse checklist;
    private String title;
    private String message;
    private String actionUrl;
    private LocalDateTime createdAt;
}
