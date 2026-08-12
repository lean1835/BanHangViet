package com.sales.dto.response;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseSuggestionResponse {
    private String productId;
    private String sku;
    private String productName;
    private String unit;
    private BigDecimal costPrice;
    private BigDecimal stockQuantity;
    private BigDecimal minStockQuantity;

    private BigDecimal averageWeeklySales;
    private BigDecimal totalSoldInPeriod;
    private BigDecimal suggestedQuantity;
    private String calculationRationale;

    private boolean hasPromotion;
    private String promotionWarning;

    private String groupId;
    private String groupName;

    private String lastSupplierId;
    private String lastSupplierName;
    private String lastSupplierPhone;
}
