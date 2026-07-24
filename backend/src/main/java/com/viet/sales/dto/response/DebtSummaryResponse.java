package com.viet.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DebtSummaryResponse {
    private BigDecimal totalActiveDebt;
    private BigDecimal totalOverdueDebt;
    private long totalDebtors;
}
