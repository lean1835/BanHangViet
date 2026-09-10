package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CanceledOrderStatisticsResponse {
    private long totalCanceledOrders;
    private BigDecimal totalCanceledAmount;
    private String shiftId;
    private String shiftName;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
    private List<CancelReasonStatDto> byReason;
    private List<EmployeeCancelStatDto> byEmployee;
    private List<CanceledOrderSummaryDto> recentCanceledOrders;
}
