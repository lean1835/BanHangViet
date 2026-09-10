package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShiftRevenueReportItemResponse {
    private String shiftId;
    private String userId;
    private String username;
    private String employeeName;
    private String pointOfSaleId;
    private String pointOfSaleName;
    private LocalDateTime openedAt;
    private LocalDateTime closedAt;

    private BigDecimal openingCash;
    private BigDecimal closingCashExpected;
    private BigDecimal closingCashActual;

    private BigDecimal cashRevenue;
    private BigDecimal bankTransferRevenue;
    private BigDecimal totalRevenue;

    private int totalOrders;
    private int canceledOrders;

    private BigDecimal cashIncome;
    private BigDecimal cashExpense;

    private BigDecimal differenceAmount;
    private String differenceReason;
    private boolean isDifferenceExceeded;
    private int handoversCount;

    private String status;
}
