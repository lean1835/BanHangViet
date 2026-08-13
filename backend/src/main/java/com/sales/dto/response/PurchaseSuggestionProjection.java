package com.sales.dto.response;

import java.math.BigDecimal;

public interface PurchaseSuggestionProjection {
    String getProductId();
    String getSku();
    String getProductName();
    String getUnit();
    BigDecimal getCostPrice();
    BigDecimal getStockQuantity();
    BigDecimal getMinStockQuantity();
    String getGroupId();
    String getGroupName();
    BigDecimal getTotalSoldInPeriod();
    Long getPromotionCount();
    BigDecimal getAverageWeeklySales();
    BigDecimal getSuggestedQuantity();
}
