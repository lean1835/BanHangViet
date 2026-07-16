package com.viet.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoodsReceiptDetailResponse {
    private String id;
    private String productId;
    private String productName;
    private String productSku;
    private BigDecimal quantity;
    private BigDecimal purchasePrice;
}
