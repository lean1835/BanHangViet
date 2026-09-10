package com.sales.dto.internal;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StageFinancialSummary {
    private Integer stageNumber;
    private LocalDateTime startTime;
    private BigDecimal openingCash;
    private BigDecimal cashRevenue;
    private BigDecimal expectedCash;
    private Integer completedOrdersCount;
    private Integer pendingOrdersCount;
}
