package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private String id;
    private String sku;
    private String barcode;
    private String name;
    private String unit;
    private BigDecimal price;
    private BigDecimal stockQuantity;
    private BigDecimal minStockQuantity;
    private String status;

    private String groupId;
    private String groupName;

    private String taxRateId;
    private String taxRateName;
    private BigDecimal taxRatePercentage;

    private BigDecimal warehouseStock;
    private BigDecimal allocatedStock;
    private java.util.List<PosStockBreakdownResponse> posStocks;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
