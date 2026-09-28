package com.sales.modules.product.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductGroupValuationResponse {
    private String groupId;
    private String groupName;
    private Integer productCount;
    private BigDecimal totalStockQuantity;
    private BigDecimal totalInventoryValue;
    private BigDecimal totalRetailValue;
    private BigDecimal valuePercentage;
    private Long averageDaysInStock;
}
