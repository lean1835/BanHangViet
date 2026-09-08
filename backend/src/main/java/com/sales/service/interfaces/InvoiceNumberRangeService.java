package com.sales.service.interfaces;

import com.sales.dto.request.CreateInvoiceNumberRangeRequest;
import com.sales.dto.response.InvoiceNumberRangeResponse;
import com.sales.dto.response.PageResponse;

public interface InvoiceNumberRangeService {

    InvoiceNumberRangeResponse createRange(String currentUsername, CreateInvoiceNumberRangeRequest request);

    InvoiceNumberRangeResponse getActiveRange(String currentUsername);

    PageResponse<InvoiceNumberRangeResponse> getAllRanges(String currentUsername, int page, int size);

    String allocateNextInvoiceNumber(String householdId);
}
