package com.sales.modules.invoice.dto.response;
import com.sales.modules.order.dto.response.UninvoicedOrderSummaryResponse;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;

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
    private BigDecimal totalTaxableRevenue;
    private BigDecimal totalTaxAmount;
    private Integer validInvoicesCount;
    private List<UninvoicedOrderSummaryResponse> uninvoicedOrders;
    private List<PendingTaxInvoiceSummaryResponse> pendingInvoices;
    private List<FailedInvoiceSummaryResponse> failedInvoices;
}
