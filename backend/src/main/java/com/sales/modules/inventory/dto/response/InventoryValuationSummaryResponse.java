package com.sales.modules.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryValuationSummaryResponse {
    private LocalDate asOfDate;
    private Boolean isHistorical;
    private Long totalProducts;
    private Long valuedProductsCount;
    private Long missingCostProductsCount;
    private BigDecimal totalStockQuantity;
    private BigDecimal missingCostStockQuantity;
    private BigDecimal totalInventoryValue;
    private BigDecimal totalRetailValue;
    private BigDecimal potentialGrossProfit;
    private BigDecimal potentialProfitMargin;
    private Long averageDaysInStock;
}
