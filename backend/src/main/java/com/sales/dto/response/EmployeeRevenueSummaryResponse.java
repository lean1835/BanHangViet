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
public class EmployeeRevenueSummaryResponse {
    private String userId;
    private String username;
    private String employeeName;

    private int totalShifts;

    private BigDecimal totalCashRevenue;
    private BigDecimal totalBankTransferRevenue;
    private BigDecimal totalRevenue;

    private int totalOrders;
    private int totalCanceledOrders;

    private double averageOrdersPerShift;
    private BigDecimal averageRevenuePerShift;

    private BigDecimal totalDifferenceAmount;
    private int exceededShiftsCount;
}
