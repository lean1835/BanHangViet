package com.sales.modules.invoice.service;
import com.sales.modules.invoice.dto.response.InvoiceAutoRetrySummaryResponse;
import com.sales.modules.invoice.dto.response.InvoiceResponse;
import com.sales.common.dto.PageResponse;

public interface EInvoiceAutoRetryService {

    InvoiceAutoRetrySummaryResponse processScheduledAutoRetry();

    InvoiceAutoRetrySummaryResponse processManualAutoRetryForUser(String currentUsername);

    InvoiceResponse retryInvoiceSingle(String currentUsername, String invoiceId);

    PageResponse<InvoiceResponse> getManualProcessingInvoices(String currentUsername, int page, int size);
}
