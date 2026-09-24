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
    private BigDecimal importedQuantity;             // Số lượng đã nhập gốc
    private BigDecimal previouslyReturnedQuantity;   // Số lượng đã trả ở các phiếu trước
    private BigDecimal remainingReturnableQuantity;  // Số lượng tối đa còn được trả theo phiếu (imported - returned)
    private BigDecimal currentStockQuantity;         // Tồn kho hiện tại của mặt hàng (QTN-24)
    private BigDecimal maxAllowedReturnQuantity;     // Số lượng tối đa cho phép trả = min(remainingReturnable, currentStock)
    private BigDecimal purchasePrice;                // Đơn giá nhập
    private BigDecimal conversionFactor;
    private BigDecimal basePurchasePrice;
}
