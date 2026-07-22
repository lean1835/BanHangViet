package com.viet.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompareRevenueResponse {
    private BigDecimal period1Revenue;
    private BigDecimal period2Revenue;
    private BigDecimal differenceAmount;
    private BigDecimal differencePercentage; // e.g. 15.5 meaning 15.5%
}
