package com.sales.modules.invoice.service;
import com.sales.common.dto.PageResponse;
import com.sales.modules.invoice.dto.response.BulkIssueInvoiceResponse;
import com.sales.modules.invoice.dto.response.CustomerTaxLookupResponse;
import com.sales.modules.invoice.dto.response.DailyInvoiceControlResponse;
import com.sales.modules.invoice.dto.response.FailedCustomerDeliveryInvoiceResponse;
import com.sales.modules.invoice.dto.response.InvoiceDeliveryLogResponse;
import com.sales.modules.invoice.dto.response.InvoicePrintResponse;
import com.sales.modules.invoice.dto.response.InvoiceQrResponse;
import com.sales.modules.invoice.dto.response.InvoiceRepresentationResponse;
import com.sales.modules.invoice.dto.response.InvoiceResponse;
import com.sales.modules.invoice.dto.response.InvoiceStatusLogResponse;
import com.sales.modules.invoice.dto.response.PublicInvoiceResponse;
import com.sales.modules.invoice.dto.request.BulkIssueInvoiceRequest;
import com.sales.modules.invoice.dto.request.CancelInvoiceRequest;
import com.sales.modules.invoice.dto.request.CreateAdjustmentInvoiceRequest;
import com.sales.modules.invoice.dto.request.UpdateInvoiceRequest;

import java.time.LocalDate;
import java.util.List;
import com.sales.modules.customer.dto.request.ResendCustomerDeliveryRequest;

public interface EInvoiceService {
    BulkIssueInvoiceResponse bulkIssueInvoices(String currentUsername, BulkIssueInvoiceRequest request);

    InvoiceResponse createAdjustmentInvoice(String currentUsername, String originalInvoiceId,
            CreateAdjustmentInvoiceRequest request);

    List<InvoiceStatusLogResponse> getInvoiceLogs(String currentUsername, String id);

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

    CustomerTaxLookupResponse lookupBuyerInfoByTaxCode(String currentUsername, String taxCode);

    PageResponse<InvoiceResponse> getWaitingInvoicesForTax(int page, int size);
    PageResponse<InvoiceResponse> getProcessedInvoicesForTax(int page, int size);

    InvoiceResponse approveInvoiceByTax(String currentUsername, String invoiceId, String taxCode);

    InvoiceResponse rejectInvoiceByTax(String currentUsername, String invoiceId, String errorMessage);

    InvoiceQrResponse getInvoiceQr(String currentUsername, String invoiceId);
    void deliverInvoiceViaEmail(String currentUsername, String invoiceId, String email);
    InvoicePrintResponse getInvoicePrintLayout(String currentUsername, String invoiceId, String pageSize);

    PageResponse<FailedCustomerDeliveryInvoiceResponse> getFailedCustomerDeliveries(String currentUsername, int page, int size);
    InvoiceResponse resendCustomerDelivery(String currentUsername, String invoiceId, ResendCustomerDeliveryRequest request);
    List<InvoiceDeliveryLogResponse> getInvoiceDeliveryHistory(String currentUsername, String invoiceId);

    PublicInvoiceResponse lookupInvoicePublicly(String lookupCode);
    byte[] downloadInvoiceFilePublicly(String lookupCode, String format);

    DailyInvoiceControlResponse getDailyInvoiceControl(String currentUsername, LocalDate date);

    byte[] exportInvoicesToExcel(String currentUsername, String status, LocalDate fromDate, LocalDate toDate, String search, String clientIp, String userAgent);

    InvoiceRepresentationResponse getInvoiceRepresentation(String currentUsername, String invoiceId);
    byte[] downloadInvoicePdf(String currentUsername, String invoiceId);
    byte[] downloadInvoiceRepresentation(String currentUsername, String invoiceId);
}
