package com.sales.modules.invoice.service;
import com.sales.modules.invoice.dto.request.CreateInvoiceNumberRangeRequest;
import com.sales.modules.invoice.dto.response.InvoiceNumberRangeResponse;
import com.sales.common.dto.PageResponse;

public interface InvoiceNumberRangeService {

    InvoiceNumberRangeResponse createRange(String currentUsername, CreateInvoiceNumberRangeRequest request);

    InvoiceNumberRangeResponse getActiveRange(String currentUsername);

    PageResponse<InvoiceNumberRangeResponse> getAllRanges(String currentUsername, int page, int size);

    String allocateNextInvoiceNumber(String householdId);

    String allocateNextInvoiceNumber(String householdId, String pattern, String symbol);
}
