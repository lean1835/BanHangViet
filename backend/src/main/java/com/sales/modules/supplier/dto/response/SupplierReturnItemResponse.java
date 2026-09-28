package com.sales.modules.supplier.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierReturnItemResponse {
    private String id;
    private String receiptDetailId;
    private String productId;
    private String productCode;
    private String productName;
    private String unitName;
    private BigDecimal quantity;
    private BigDecimal purchasePrice;
    private BigDecimal conversionFactor;
    private BigDecimal baseQuantity;
    private BigDecimal basePurchasePrice;
    private BigDecimal subtotal;
    private String itemReason;
    private BigDecimal newCostPrice;
    private BigDecimal newStockQuantity;
}
