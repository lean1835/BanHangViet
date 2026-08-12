package com.sales.service.interfaces;

import com.sales.dto.request.CreateReturnTicketRequest;
import com.sales.dto.request.RejectReturnTicketRequest;
import com.sales.dto.response.InvoiceReturnableCheckResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.ReturnTicketResponse;

import java.time.LocalDate;

public interface ReturnTicketService {

    /**
     * NCL-11-CN-001: Kiểm tra khả năng và số lượng hàng hóa còn được phép trả của Hóa đơn gốc.
     */
    InvoiceReturnableCheckResponse checkInvoiceReturnable(String invoiceId, String currentUsername);

    /**
     * NCL-11-CN-001: Lập phiếu trả hàng mới từ Hóa đơn gốc.
     */
    ReturnTicketResponse createReturnTicket(CreateReturnTicketRequest request, String currentUsername);

    /**
     * NCL-11-CN-002: Duyệt phiếu trả hàng, hoàn tồn kho và ghi nhận hoàn tiền/giảm nợ cho khách hàng.
     */
    ReturnTicketResponse approveReturnTicket(String ticketId, String currentUsername);

    /**
     * NCL-11-CN-002: Từ chối phiếu trả hàng kèm lý do từ chối.
     */
    ReturnTicketResponse rejectReturnTicket(String ticketId, RejectReturnTicketRequest request, String currentUsername);

    /**
     * NCL-11-CN-003: Lập hóa đơn điều chỉnh giảm từ phiếu trả hàng đã được duyệt.
     */
    ReturnTicketResponse createDecreaseAdjustmentInvoice(String ticketId, String currentUsername);

    /**
     * Tra cứu chi tiết một phiếu trả hàng.
     */
    ReturnTicketResponse getReturnTicketDetail(String ticketId, String currentUsername);

    /**
     * Tra cứu danh sách phiếu trả hàng có phân trang và bộ lọc.
     */
    PageResponse<ReturnTicketResponse> getReturnTickets(
            String currentUsername,
            String status,
            LocalDate fromDate,
            LocalDate toDate,
            String search,
            int page,
            int size);
}

