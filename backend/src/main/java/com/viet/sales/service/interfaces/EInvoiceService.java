package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.CancelInvoiceRequest;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceRequest;
import com.viet.sales.dto.request.UpdateInvoiceRequest;
import com.viet.sales.dto.response.*;

import java.time.LocalDate;
import java.util.List;

public interface EInvoiceService {
    // Nghiệp vụ điều chỉnh hóa đơn & Lịch sử log
    InvoiceResponse createAdjustmentInvoice(String currentUsername, String originalInvoiceId,
            CreateAdjustmentInvoiceRequest request);

    List<InvoiceStatusLogResponse> getInvoiceLogs(String currentUsername, String id);

    // Nghiệp vụ phát hành hóa đơn & Tra cứu
    InvoiceResponse createInvoiceDraft(String currentUsername, String orderId);

    InvoiceResponse submitToTax(String currentUsername, String invoiceId);

    InvoiceResponse resendInvoice(String currentUsername, String invoiceId);

    InvoiceResponse cancelInvoice(String currentUsername, String invoiceId, CancelInvoiceRequest request);

    InvoiceResponse getInvoice(String currentUsername, String invoiceId);

    PageResponse<InvoiceResponse> getInvoices(
            String currentUsername,
            String status,
            LocalDate fromDate,
            LocalDate toDate,
            String search,
            int page,
            int size);

    InvoiceResponse updateInvoice(String currentUsername, String invoiceId, UpdateInvoiceRequest request);

    // Cổng tiếp nhận dành cho Cơ quan Thuế mô phỏng (VT-05)
    PageResponse<InvoiceResponse> getWaitingInvoicesForTax(int page, int size);
    PageResponse<InvoiceResponse> getProcessedInvoicesForTax(int page, int size);

    InvoiceResponse approveInvoiceByTax(String currentUsername, String invoiceId, String taxCode);

    InvoiceResponse rejectInvoiceByTax(String currentUsername, String invoiceId, String errorMessage);

    // Nghiệp vụ giao hóa đơn cho khách
    InvoiceQrResponse getInvoiceQr(String currentUsername, String invoiceId);
    void deliverInvoiceViaEmail(String currentUsername, String invoiceId, String email);
    InvoicePrintResponse getInvoicePrintLayout(String currentUsername, String invoiceId, String pageSize);

    // Nghiệp vụ tra cứu & tải lại công khai dành cho khách hàng
    PublicInvoiceResponse lookupInvoicePublicly(String lookupCode);
    byte[] downloadInvoiceFilePublicly(String lookupCode, String format);
}

