package com.sales.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public interface SlowMovingProductProjection {
    String getProductId();
    String getSku();
    String getProductName();
    String getUnit();
    BigDecimal getPrice();
    BigDecimal getCostPrice();
    BigDecimal getStockQuantity();
    String getGroupId();
    String getGroupName();
    LocalDateTime getLastSaleDate();
    LocalDateTime getCreatedAt();
    BigDecimal getStagnantCapital();
    BigDecimal getRetailInventoryValue();
}
