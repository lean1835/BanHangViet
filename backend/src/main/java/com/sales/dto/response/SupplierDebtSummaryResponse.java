package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierDebtSummaryResponse {
    private BigDecimal totalOutstandingDebt;
    private long totalSuppliersWithDebt;
    private BigDecimal totalOverdueDebt;
}
