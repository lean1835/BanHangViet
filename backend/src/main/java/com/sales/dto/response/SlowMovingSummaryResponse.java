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
public class SlowMovingSummaryResponse {
    private Integer thresholdDays;
    private Long totalStagnantProducts;
    private BigDecimal totalStagnantStockQuantity;
    private BigDecimal totalStagnantCapital;
    private BigDecimal totalRetailValue;
}
