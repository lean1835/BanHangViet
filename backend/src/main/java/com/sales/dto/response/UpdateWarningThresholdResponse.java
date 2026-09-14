package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWarningThresholdResponse {
    private String householdId;
    private BigDecimal warningThresholdPercentage;
    private BigDecimal warningRevenueAmount;
    private LocalDateTime updatedAt;
}
