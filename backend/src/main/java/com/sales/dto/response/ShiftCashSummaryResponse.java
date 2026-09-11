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
public class ShiftCashSummaryResponse {
    private String shiftId;
    private BigDecimal openingCash;
    private BigDecimal cashSales;
    private BigDecimal bankSales;
    private BigDecimal totalSales;
    private BigDecimal totalApprovedIncome;
    private BigDecimal totalApprovedExpense;
    private BigDecimal netCashChange; // totalApprovedIncome - totalApprovedExpense
    private BigDecimal totalPendingExpense;
    private int pendingExpenseCount;
    private BigDecimal handoverDifference;
    private BigDecimal currentExpectedCash;
}
