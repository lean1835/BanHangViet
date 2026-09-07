package com.sales.dto.response;

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
public class StockCardResponse {
    private String productId;
    private String productSku;
    private String productName;
    private String unit;
    private LocalDate fromDate;
    private LocalDate toDate;
    private BigDecimal openingStock;
    private BigDecimal totalQuantityIn;
    private BigDecimal totalQuantityOut;
    private BigDecimal closingStock;
    private BigDecimal currentStock;
    private Boolean isDiscrepancy;
    private String warning;
    private PageResponse<StockMovementResponse> movements;
}
