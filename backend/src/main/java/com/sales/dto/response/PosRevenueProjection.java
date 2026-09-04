package com.sales.dto.response;

import java.math.BigDecimal;

public interface PosRevenueProjection {
    String getPosId();
    Long getOrderCount();
    BigDecimal getGrossSales();
    BigDecimal getTotalDiscount();
    BigDecimal getNetRevenue();
    BigDecimal getCashRevenue();
    BigDecimal getBankRevenue();
    BigDecimal getDebtRevenue();
}
