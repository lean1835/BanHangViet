package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeakHoursAndDaysResponse {
    private FilterInfo filterInfo;
    private List<HourlySalesData> hourlyStats;
    private List<DayOfWeekSalesData> dayOfWeekStats;
    private List<SalesHeatmapCell> heatmap;
    private PeakSalesInsight insights;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FilterInfo {
        private LocalDate fromDate;
        private LocalDate toDate;
        private String posId;
        private String posName;
        private Long totalOrders;
        private BigDecimal totalRevenue;
        private BigDecimal averageOrderValue;
    }
}
