package com.sales.dto.response;

import java.math.BigDecimal;

public interface PeakDayOfWeekProjection {
    Integer getDayOfWeek();
    Long getOrderCount();
    BigDecimal getTotalRevenue();
    BigDecimal getGrossRevenue();
    BigDecimal getTotalDiscount();
}
