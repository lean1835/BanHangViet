package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeShiftReportResponse {
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal appliedThreshold;

    private int totalShiftsCount;
    private int totalExceededShiftsCount;

    private BigDecimal totalCashRevenue;
    private BigDecimal totalBankTransferRevenue;
    private BigDecimal totalRevenue;

    private int totalOrdersCount;
    private int totalCanceledOrdersCount;

    private BigDecimal totalDifferenceAmount;

    @Builder.Default
    private List<ShiftRevenueReportItemResponse> shifts = new ArrayList<>();

    @Builder.Default
    private List<EmployeeRevenueSummaryResponse> employeeSummaries = new ArrayList<>();
}
