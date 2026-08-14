package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyReturnStatistic {
    private LocalDate date;
    private Long ticketCount;
    private BigDecimal totalReturnAmount;
    private BigDecimal totalReturnedQuantity;
}
