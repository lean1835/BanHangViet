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
public class ProductUnitConversionResponse {

    private String id;
    private String productId;
    private String productName;
    private String baseUnit;
    private String unitName;
    private BigDecimal conversionFactor;
    private BigDecimal price;
    private String barcode;
    private Boolean isDefaultImport;
    private Boolean isDefaultSale;
    private Boolean hasStockMovement;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
