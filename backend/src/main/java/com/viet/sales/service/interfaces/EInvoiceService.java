package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.CancelInvoiceRequest;
import com.viet.sales.dto.request.UpdateInvoiceRequest;
import com.viet.sales.dto.response.InvoiceResponse;
import com.viet.sales.dto.response.PageResponse;

import java.time.LocalDate;

public interface EInvoiceService {
    InvoiceResponse createInvoiceDraft(String currentUsername, String orderId);
    InvoiceResponse submitToTax(String currentUsername, String invoiceId);
    InvoiceResponse resendInvoice(String currentUsername, String invoiceId);
    InvoiceResponse cancelInvoice(String currentUsername, String invoiceId, CancelInvoiceRequest request);
    InvoiceResponse getInvoice(String currentUsername, String invoiceId);
    PageResponse<InvoiceResponse> getInvoices(String currentUsername, String status, LocalDate fromDate, LocalDate toDate, int page, int size);
    InvoiceResponse updateInvoice(String currentUsername, String invoiceId, UpdateInvoiceRequest request);
    
    // Cổng tiếp nhận dành cho Cơ quan Thuế mô phỏng (VT-05)
    PageResponse<InvoiceResponse> getWaitingInvoicesForTax(int page, int size);
    PageResponse<InvoiceResponse> getProcessedInvoicesForTax(int page, int size);
    InvoiceResponse approveInvoiceByTax(String invoiceId, String taxCode);
    InvoiceResponse rejectInvoiceByTax(String invoiceId, String errorMessage);
}
