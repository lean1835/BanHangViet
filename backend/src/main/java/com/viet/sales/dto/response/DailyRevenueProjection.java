package com.viet.sales.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DailyRevenueProjection {
    LocalDate getSalesDate();
    Long getOrderCount();
    BigDecimal getGrossSales();
    BigDecimal getTotalDiscounts();
    BigDecimal getNetRevenue();
    BigDecimal getCashRevenue();
    BigDecimal getBankRevenue();
    BigDecimal getDebtRevenue();
}
