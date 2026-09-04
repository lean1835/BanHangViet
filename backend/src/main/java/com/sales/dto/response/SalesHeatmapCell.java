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
public class SalesHeatmapCell {
    private Integer dayOfWeek;
    private String dayName;
    private Integer hourOfDay;
    private String hourLabel;
    private Long orderCount;
    private BigDecimal totalRevenue;
    private Double intensity;
}
