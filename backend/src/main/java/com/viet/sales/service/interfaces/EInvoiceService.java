package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.CancelInvoiceRequest;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceRequest;
import com.viet.sales.dto.request.UpdateInvoiceRequest;
import com.viet.sales.dto.response.EInvoiceResponse;
import com.viet.sales.dto.response.InvoiceResponse;
import com.viet.sales.dto.response.InvoiceStatusLogResponse;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.dto.response.InvoiceQrResponse;
import com.viet.sales.dto.response.InvoicePrintResponse;
import com.viet.sales.dto.response.PublicInvoiceResponse;

import java.time.LocalDate;
import java.util.List;

public interface EInvoiceService {
    // Luồng nghiệp vụ điều chỉnh hóa đơn (Chức năng của chúng ta)
    EInvoiceResponse createAdjustmentInvoice(String currentUsername, String originalInvoiceId, CreateAdjustmentInvoiceRequest request);
    EInvoiceResponse getInvoiceById(String currentUsername, String id);
    List<InvoiceStatusLogResponse> getInvoiceLogs(String currentUsername, String id);

    // Luồng nghiệp vụ phát hành hóa đơn (Develop Branch) & Lọc nâng cao kết hợp
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
    
    // Cổng tiếp nhận dành cho Cơ quan Thuế mô phỏng (VT-05) (Develop Branch)
    PageResponse<InvoiceResponse> getWaitingInvoicesForTax(int page, int size);
    InvoiceResponse approveInvoiceByTax(String invoiceId, String taxCode);
    InvoiceResponse rejectInvoiceByTax(String invoiceId, String errorMessage);

    // Nghiệp vụ giao hóa đơn cho khách (NCL-06)
    InvoiceQrResponse getInvoiceQr(String currentUsername, String invoiceId);
    void deliverInvoiceViaZalo(String currentUsername, String invoiceId, String phoneNumber);
    void deliverInvoiceViaEmail(String currentUsername, String invoiceId, String email);
    InvoicePrintResponse getInvoicePrintLayout(String currentUsername, String invoiceId, String pageSize);

    // Nghiệp vụ tra cứu & tải lại công khai dành cho khách hàng
    PublicInvoiceResponse lookupInvoicePublicly(String lookupCode);
    byte[] downloadInvoiceFilePublicly(String lookupCode, String format);
}
