package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BarcodeResponse {
    private String productId;
    private String sku;
    private String productName;
    private String barcode;
    private BigDecimal price;
    private String unit;
    private String householdName;
    private String paperSize;
    private Integer quantity;
    private String barcodeBase64Image;
}
