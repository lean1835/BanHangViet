package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosHouseholdTotalResponse {
    private Integer totalPosCount;
    private Integer activePosCount;
    private Long totalOrders;
    private Long totalInvoices;
    private BigDecimal totalGrossSales;
    private BigDecimal totalDiscount;
    private BigDecimal totalNetRevenue;
    private BigDecimal totalCashRevenue;
    private BigDecimal totalBankRevenue;
    private BigDecimal totalDebtRevenue;
}
