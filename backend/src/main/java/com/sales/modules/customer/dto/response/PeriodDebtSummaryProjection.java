package com.sales.modules.customer.dto.response;

import java.math.BigDecimal;

public interface PeriodDebtSummaryProjection {
    BigDecimal getTotalCreated();
    BigDecimal getTotalPaid();
    BigDecimal getTotalRemaining();
}
