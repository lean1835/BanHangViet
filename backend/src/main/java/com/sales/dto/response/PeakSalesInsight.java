package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeakSalesInsight {
    private Integer peakHour;
    private String peakHourLabel;
    private BigDecimal peakHourRevenue;
    private Long peakHourOrderCount;

    private Integer lowestHour;
    private String lowestHourLabel;
    private BigDecimal lowestHourRevenue;
    private Long lowestHourOrderCount;

    private Integer busiestDayOfWeek;
    private String busiestDayName;
    private BigDecimal busiestDayRevenue;
    private Long busiestDayOrderCount;

    private Integer quietestDayOfWeek;
    private String quietestDayName;
    private BigDecimal quietestDayRevenue;
    private Long quietestDayOrderCount;

    private List<PeakTimeSlot> topPeakSlots;
    private List<String> recommendations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PeakTimeSlot {
        private String dayName;
        private String hourLabel;
        private Long orderCount;
        private BigDecimal totalRevenue;
    }
}
