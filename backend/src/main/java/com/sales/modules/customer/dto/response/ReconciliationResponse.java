package com.sales.modules.customer.dto.response;
import com.sales.modules.invoice.dto.response.InvoiceResponse;

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
public class ReconciliationResponse {
    private LocalDate date;
    private BigDecimal totalCash;
    private BigDecimal totalTransfer;
    private BigDecimal totalDebt;
    private BigDecimal closingCashExpected;
    private BigDecimal closingCashActual;
    private long errorInvoicesCount;
    private List<InvoiceResponse> errorInvoices;
}
