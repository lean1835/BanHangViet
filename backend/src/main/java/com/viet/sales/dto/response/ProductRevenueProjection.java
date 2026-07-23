package com.viet.sales.dto.response;

import java.math.BigDecimal;

public interface ProductRevenueProjection {
    String getProductId();
    String getProductName();
    String getSku();
    String getUnit();
    BigDecimal getQuantitySold();
    BigDecimal getRevenue();
}
