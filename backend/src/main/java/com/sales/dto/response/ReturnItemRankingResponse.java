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
public class ReturnItemRankingResponse {
    private String productId;
    private String productName;
    private String sku;
    private String unit;
    private BigDecimal totalReturnedQuantity;
    private BigDecimal totalReturnAmount;
    private Long returnTicketCount;
    private BigDecimal percentageOfTotalAmount;
}
