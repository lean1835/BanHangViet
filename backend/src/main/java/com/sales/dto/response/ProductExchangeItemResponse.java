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
public class ProductExchangeItemResponse {

    private String id;
    private String itemType; // RETURN_ITEM, EXCHANGE_ITEM
    private String productId;
    private String invoiceItemId;
    private String productName;
    private String unit;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxRatePercentage;
    private BigDecimal taxAmount;
    private BigDecimal subtotal;
}
