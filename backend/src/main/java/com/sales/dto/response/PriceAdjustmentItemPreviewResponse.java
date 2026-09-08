package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAdjustmentItemPreviewResponse {

    private String productId;
    private String productSku;
    private String productName;
    private String unit;
    private String groupName;
    private BigDecimal oldPrice;
    private BigDecimal newPrice;
    private BigDecimal priceDifference;
    private BigDecimal percentChange;
    private BigDecimal costPrice;
    private Boolean isBelowCost;
}
