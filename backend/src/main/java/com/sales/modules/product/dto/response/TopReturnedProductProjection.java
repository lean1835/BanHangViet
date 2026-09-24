package com.sales.modules.product.dto.response;

import java.math.BigDecimal;

public interface TopReturnedProductProjection {
    String getProductId();
    String getProductName();
    String getSku();
    String getUnit();
    BigDecimal getTotalReturnedQuantity();
    BigDecimal getTotalReturnAmount();
    Long getTicketCount();
}
