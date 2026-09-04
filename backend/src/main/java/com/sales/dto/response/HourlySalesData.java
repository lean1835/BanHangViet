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
public class HourlySalesData {
    private Integer hour;
    private String label;
    private Long orderCount;
    private BigDecimal totalRevenue;
    private BigDecimal averageOrderValue;
    private BigDecimal revenuePercentage;
}
