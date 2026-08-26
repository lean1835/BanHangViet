package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlowMovingProductResponse {
    private String productId;
    private String sku;
    private String productName;
    private String unit;
    private String groupId;
    private String groupName;
    private BigDecimal stockQuantity;
    private BigDecimal costPrice;
    private BigDecimal price;
    private BigDecimal stagnantCapital;
    private BigDecimal retailInventoryValue;
    private LocalDateTime lastSaleDate;
    private Long daysWithoutSale;
}
