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
public class ReturnableItemDto {
    private String invoiceItemId;
    private String productId;
    private String productName;
    private String unit;
    private BigDecimal boughtQuantity;
    private BigDecimal alreadyReturnedQuantity;
    private BigDecimal returnableQuantity;
    private BigDecimal unitPrice;
    private BigDecimal taxRatePercentage;
}
