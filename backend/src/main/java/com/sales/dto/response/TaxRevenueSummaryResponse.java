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
public class TaxRevenueSummaryResponse {
    private String periodId;
    private String periodName;
    private String periodType;
    private Integer year;
    private Integer periodNumber;
    private BigDecimal totalRevenue;
    private BigDecimal totalTaxAmount;
    private List<TaxRateRevenueSummaryItem> taxRateSummaries;
}
