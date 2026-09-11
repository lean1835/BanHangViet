package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductPriceTierResponse {
    private String id;
    private String productId;
    private String productName;
    private String unitConversionId;
    private String unitName;
    private String tierName;
    private BigDecimal minQuantity;
    private BigDecimal maxQuantity;
    private BigDecimal price;
    private Boolean isActive;
    private BigDecimal costPrice;
    private Boolean isBelowCost;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
