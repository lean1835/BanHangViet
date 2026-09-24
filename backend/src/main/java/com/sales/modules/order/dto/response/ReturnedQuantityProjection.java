package com.sales.modules.order.dto.response;

import java.math.BigDecimal;

public interface ReturnedQuantityProjection {
    String getInvoiceItemId();
    String getProductId();
    String getProductName();
    BigDecimal getTotalReturned();
}
