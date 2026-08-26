package com.sales.dto.response;

import java.math.BigDecimal;

public interface PeakHourlyProjection {
    Integer getHourOfDay();
    Long getOrderCount();
    BigDecimal getTotalRevenue();
    BigDecimal getGrossRevenue();
    BigDecimal getTotalDiscount();
}
