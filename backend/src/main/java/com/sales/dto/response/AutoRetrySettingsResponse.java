package com.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;

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
    private java.math.BigDecimal expenseApprovalThreshold;
    private java.math.BigDecimal shiftDifferenceThreshold;
    private LocalDateTime updatedAt;
}


