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
    private String periodType;
    private Integer year;
    private Integer periodNumber;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate filingDeadline;
    private long daysRemaining;
    private boolean isOverdue;
    private String severity;
    private String status;
    private boolean isClosed;
    private String notificationId;
    private TaxPeriodChecklistResponse checklist;
    private String title;
    private String message;
    private String actionUrl;
    private LocalDateTime createdAt;
}
