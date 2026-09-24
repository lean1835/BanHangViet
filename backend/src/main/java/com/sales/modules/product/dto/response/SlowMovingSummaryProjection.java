package com.sales.modules.product.dto.response;

import java.math.BigDecimal;

public interface SlowMovingSummaryProjection {
    Long getTotalStagnantProducts();
    BigDecimal getTotalStagnantStockQuantity();
    BigDecimal getTotalStagnantCapital();
    BigDecimal getTotalRetailValue();
}
