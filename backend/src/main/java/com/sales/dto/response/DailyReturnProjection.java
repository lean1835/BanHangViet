package com.sales.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DailyReturnProjection {
    LocalDate getReportDate();
    Long getTicketCount();
    BigDecimal getTotalAmount();
    BigDecimal getTotalQuantity();
}
