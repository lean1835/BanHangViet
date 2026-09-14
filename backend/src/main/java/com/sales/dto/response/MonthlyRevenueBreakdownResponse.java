package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyRevenueBreakdownResponse {
    private Integer month;
    private BigDecimal revenue;
    private BigDecimal taxAmount;
    private Integer validInvoiceCount;
    private BigDecimal cumulativeRevenue;
    private BigDecimal percentageOfThreshold;
}
