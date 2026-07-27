package com.viet.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceItemResponse {
    private String id;
    private String productId;
    private String productName;
    private String unit;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal taxRatePercentage;
    private BigDecimal taxAmount;
    private BigDecimal discountAmount;
    private BigDecimal subtotal;
    private LocalDateTime createdAt;
}
