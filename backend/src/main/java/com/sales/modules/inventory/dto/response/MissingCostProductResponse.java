package com.sales.modules.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MissingCostProductResponse {
    private String productId;
    private String sku;
    private String productName;
    private String unit;
    private String groupId;
    private String groupName;
    private BigDecimal stockQuantity;
    private BigDecimal retailPrice;
    private String warningMessage;
}
