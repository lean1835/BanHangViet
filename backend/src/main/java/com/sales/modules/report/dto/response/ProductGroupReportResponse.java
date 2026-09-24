package com.sales.modules.report.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductGroupReportResponse {

    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Builder.Default
    private List<ProductGroupRevenueDto> groups = new ArrayList<>();

    private ProductGroupRevenueDto unassignedSummary;

    @Builder.Default
    private Boolean hasUnassignedProducts = false;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductGroupRevenueDto {
        private String groupId;
        private String groupName;

        @Builder.Default
        private BigDecimal totalQuantitySold = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal revenue = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal percentage = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal previousPeriodRevenue = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal growthRatePercentage = BigDecimal.ZERO;
    }
}
