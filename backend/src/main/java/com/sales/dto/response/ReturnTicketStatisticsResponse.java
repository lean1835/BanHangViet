package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReturnTicketStatisticsResponse {
    private LocalDate fromDate;
    private LocalDate toDate;
    private Long totalTickets;
    private Long approvedTicketsCount;
    private Long pendingTicketsCount;
    private Long rejectedTicketsCount;
    private BigDecimal totalRefundAmount;
    private BigDecimal totalReturnedQuantity;
    private List<ReturnItemRankingResponse> topReturnedProducts;
    private List<RefundPaymentMethodSummary> paymentMethodSummaries;
    private List<DailyReturnStatistic> dailyTimeline;
    private List<ReturnTicketResponse> returnTickets;
}
