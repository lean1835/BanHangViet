package com.sales.dto.response;

import java.math.BigDecimal;

public interface SlowMovingSummaryProjection {
    Long getTotalStagnantProducts();
    BigDecimal getTotalStagnantStockQuantity();
    BigDecimal getTotalStagnantCapital();
    BigDecimal getTotalRetailValue();
}
