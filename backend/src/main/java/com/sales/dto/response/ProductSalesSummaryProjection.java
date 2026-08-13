package com.sales.dto.response;

import java.math.BigDecimal;

public interface ProductSalesSummaryProjection {
    String getProductId();
    BigDecimal getTotalQuantitySold();
    Long getPromotionCount();
}
