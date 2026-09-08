package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculateWeightResponse {

    private String productId;
    private String productName;
    private BigDecimal buyAmount;
    private BigDecimal unitPrice;
    private BigDecimal calculatedQuantity;
    private BigDecimal exactSubtotal;
    private BigDecimal roundedSubtotal;
    private BigDecimal roundingDifference;
    private String unitName;
    private BigDecimal conversionFactor;
    private BigDecimal minWeightStep;
    private Integer decimalPlaces;
}
