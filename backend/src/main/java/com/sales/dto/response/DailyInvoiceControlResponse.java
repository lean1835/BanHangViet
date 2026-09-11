package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyInvoiceControlResponse {

    private LocalDate controlDate;
    private Boolean isCleanDay;
    private Integer totalUninvoicedOrders;
    private Integer totalPendingInvoices;
    private Integer totalFailedInvoices;
    private java.math.BigDecimal totalTaxableRevenue;
    private java.math.BigDecimal totalTaxAmount;
    private Integer validInvoicesCount;
    private List<UninvoicedOrderSummaryResponse> uninvoicedOrders;
    private List<PendingTaxInvoiceSummaryResponse> pendingInvoices;
    private List<FailedInvoiceSummaryResponse> failedInvoices;
}
