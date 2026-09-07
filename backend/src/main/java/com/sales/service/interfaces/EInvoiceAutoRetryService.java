package com.sales.service.interfaces;

import com.sales.dto.response.InvoiceAutoRetrySummaryResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.dto.response.PageResponse;

public interface EInvoiceAutoRetryService {

    InvoiceAutoRetrySummaryResponse processScheduledAutoRetry();

    InvoiceAutoRetrySummaryResponse processManualAutoRetryForUser(String currentUsername);

    InvoiceResponse retryInvoiceSingle(String currentUsername, String invoiceId);

    PageResponse<InvoiceResponse> getManualProcessingInvoices(String currentUsername, int page, int size);
}
