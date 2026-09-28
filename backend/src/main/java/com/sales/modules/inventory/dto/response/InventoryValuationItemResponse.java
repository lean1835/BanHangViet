package com.sales.modules.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryValuationItemResponse {
    private String productId;
    private String sku;
    private String productName;
    private String unit;
    private String groupId;
    private String groupName;
    private BigDecimal stockQuantity;
    private BigDecimal costPrice;
    private BigDecimal inventoryValue;
    private BigDecimal retailPrice;
    private BigDecimal retailValue;
    private LocalDate lastImportDate;
    private Long daysInStock;
    private Boolean isNegativeStock;
}
