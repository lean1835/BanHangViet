package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrossProfitReportResponse {

    @Builder.Default
    private GrossProfitSummaryDto summary = new GrossProfitSummaryDto();

    @Builder.Default
    private List<DailyGrossProfitDto> dailyReports = new ArrayList<>();

    @Builder.Default
    private List<ProductGrossProfitDto> itemReports = new ArrayList<>();

    @Builder.Default
    private List<MissingCostProductDto> missingCostPriceItems = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrossProfitSummaryDto {
        @Builder.Default
        private BigDecimal totalNetRevenue = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal totalCogs = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal totalGrossProfit = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal grossProfitMarginPercentage = BigDecimal.ZERO;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyGrossProfitDto {
        private LocalDate date;

        @Builder.Default
        private BigDecimal netRevenue = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal cogs = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal grossProfit = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal grossProfitMarginPercentage = BigDecimal.ZERO;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductGrossProfitDto {
        private String productId;
        private String productSku;
        private String productName;
        private String unit;

        @Builder.Default
        private BigDecimal quantitySold = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal netRevenue = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal cogs = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal grossProfit = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal grossProfitMarginPercentage = BigDecimal.ZERO;

        @Builder.Default
        private Boolean isNegativeMargin = false;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MissingCostProductDto {
        private String productId;
        private String productSku;
        private String productName;
        private String unit;

        @Builder.Default
        private BigDecimal quantitySold = BigDecimal.ZERO;

        @Builder.Default
        private BigDecimal netRevenue = BigDecimal.ZERO;

        private String warningMessage;
    }
}
