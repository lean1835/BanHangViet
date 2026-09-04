package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosInventoryResponse {
    private String id;
    private String pointOfSaleId;
    private String pointOfSaleName;
    private String posCode;
    private String productId;
    private String productSku;
    private String productName;
    private String unit;
    private BigDecimal price;
    private BigDecimal stockQuantity;
    private BigDecimal minStockQuantity;
    private String productStatus;
    private String groupName;
    private Boolean isLowStock;
    private BigDecimal totalProductStock;
    private BigDecimal warehouseStock;
    private BigDecimal maxAvailableQuantity;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
