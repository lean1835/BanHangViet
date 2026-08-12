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
public class InventoryAuditDetailResponse {

    private String id;
    private String productId;
    private String productSku;
    private String productName;
    private String unit;
    private BigDecimal systemQuantity;
    private BigDecimal actualQuantity;
    private BigDecimal differenceQuantity;
    private String reason;
}
