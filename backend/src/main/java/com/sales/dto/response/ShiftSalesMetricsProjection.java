package com.sales.dto.response;

import java.math.BigDecimal;

public interface ShiftSalesMetricsProjection {
    String getShiftId();
    BigDecimal getCashRevenue();
    BigDecimal getBankTransferRevenue();
    Long getCompletedOrders();
    Long getCanceledOrders();
}
