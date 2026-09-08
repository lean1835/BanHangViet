package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private String id;
    private String productId;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
    private String promotionId;
    private String promotionName;
    private String priceTierId;
    private String priceTierName;

    private BigDecimal taxRatePercentage;
    private BigDecimal taxAmount;
    private BigDecimal roundingDifference;
    private BigDecimal subtotal;
    private String unitConversionId;
    private String unitName;
    private BigDecimal conversionFactor;
    private BigDecimal baseQuantity;
    private Boolean isSoldByWeight;
    private Integer decimalPlaces;
    private BigDecimal minWeightStep;
}
