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
public class PosDailyRevenueResponse {
    private LocalDate salesDate;
    private String posId;
    private String posName;
    private Long orderCount;
    private BigDecimal netRevenue;
}
