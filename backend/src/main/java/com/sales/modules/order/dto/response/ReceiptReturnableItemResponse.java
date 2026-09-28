package com.sales.modules.order.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptReturnableItemResponse {
    private String receiptDetailId;
    private String productId;
    private String productCode;
    private String productName;
    private String unitName;
    private BigDecimal importedQuantity;
    private BigDecimal previouslyReturnedQuantity;
    private BigDecimal remainingReturnableQuantity;
    private BigDecimal currentStockQuantity;
    private BigDecimal maxAllowedReturnQuantity;
    private BigDecimal purchasePrice;
    private BigDecimal conversionFactor;
    private BigDecimal basePurchasePrice;
}
