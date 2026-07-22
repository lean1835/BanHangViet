package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.CreateAdjustmentInvoiceRequest;
import com.viet.sales.dto.response.EInvoiceResponse;
import com.viet.sales.dto.response.InvoiceStatusLogResponse;
import com.viet.sales.dto.response.PageResponse;

import java.time.LocalDate;
import java.util.List;

public interface EInvoiceService {
    EInvoiceResponse createAdjustmentInvoice(String currentUsername, String originalInvoiceId, CreateAdjustmentInvoiceRequest request);

    EInvoiceResponse getInvoiceById(String currentUsername, String id);

    List<InvoiceStatusLogResponse> getInvoiceLogs(String currentUsername, String id);

    PageResponse<EInvoiceResponse> getInvoices(
            String currentUsername,
            LocalDate startDate,
            LocalDate endDate,
            String status,
            String search,
            int page,
            int size);
}
