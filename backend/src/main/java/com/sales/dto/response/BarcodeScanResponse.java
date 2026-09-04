package com.sales.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BarcodeScanResponse {

    private Boolean found;
    private String barcode;
    private String suggestedBarcode;
    private String message;

    private String productId;
    private String productSku;
    private String productName;
    private String unit;
    private BigDecimal unitPrice;
    private BigDecimal stockQuantity;

    private BigDecimal scannedQuantity;
    private BigDecimal discountAmount;
    private BigDecimal subtotal;

    private String promotionId;
    private String promotionName;

    private OrderResponse order; // Populated nếu request có truyền orderId và đã thêm/cộng dồn hàng vào đơn thành công
}
