package com.sales.dto.response;

import java.math.BigDecimal;

public interface PeakHeatmapProjection {
    Integer getDayOfWeek();
    Integer getHourOfDay();
    Long getOrderCount();
    BigDecimal getTotalRevenue();
}
