package com.viet.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemResponse {
    private String id;
    private String productId;
    private String productName;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal discountAmount;
    private BigDecimal taxRatePercentage;
    private BigDecimal taxAmount;
    private BigDecimal subtotal;
}
