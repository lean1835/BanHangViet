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
public class TaxRateRevenueSummaryItem {
    private BigDecimal taxRatePercentage;
    private String taxRateName;
    private BigDecimal revenueAmount;
    private BigDecimal taxAmount;
    private Integer invoiceCount;
}
