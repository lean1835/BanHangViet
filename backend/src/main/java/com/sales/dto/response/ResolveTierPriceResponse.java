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
public class ResolveTierPriceResponse {
    private String productId;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal baseRetailPrice;
    private String matchedTierId;
    private String matchedTierName;
    private BigDecimal appliedUnitPrice;
    private BigDecimal costPrice;
    private Boolean isBelowCost;
    private BigDecimal savingAmountPerUnit;
    private BigDecimal totalSavingAmount;
}
