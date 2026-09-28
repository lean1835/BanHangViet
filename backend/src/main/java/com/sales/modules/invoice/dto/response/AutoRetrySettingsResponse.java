package com.sales.modules.invoice.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AutoRetrySettingsResponse {
    private String id;
    private String householdId;
    private Boolean autoRetryEnabled;
    private Integer maxRetryAttempts;
    private Integer retryIntervalMinutes;
    private Integer maxRetryHoursDeadline;
    private Integer maxOrderHoldingHours;
    private Integer bankTransferTimeoutMinutes;
    private BigDecimal expenseApprovalThreshold;
    private BigDecimal shiftDifferenceThreshold;
    private Integer returnDaysLimit;
    private Integer maxOfflineSyncHours;
    private Integer debtReminderDaysBefore;
    private LocalDateTime updatedAt;
}
