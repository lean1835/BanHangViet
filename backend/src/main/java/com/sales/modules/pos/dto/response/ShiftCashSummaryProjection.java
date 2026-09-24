package com.sales.modules.pos.dto.response;

import java.math.BigDecimal;

public interface ShiftCashSummaryProjection {
    String getShiftId();
    BigDecimal getIncomeAmount();
    BigDecimal getExpenseAmount();
}
