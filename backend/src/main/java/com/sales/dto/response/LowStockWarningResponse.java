package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LowStockWarningResponse {
    private String productId;
    private String sku;
    private String productName;
    private String unit;
    private BigDecimal price;
    private BigDecimal costPrice;
    private BigDecimal stockQuantity;
    private BigDecimal minStockQuantity;
    private BigDecimal shortageQuantity;

    private String groupId;
    private String groupName;

    private String lastSupplierId;
    private String lastSupplierName;
    private String lastSupplierPhone;
}
