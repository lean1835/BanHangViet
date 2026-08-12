package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.CreateReturnTicketRequest;
import com.sales.dto.request.RejectReturnTicketRequest;
import com.sales.dto.response.InvoiceReturnableCheckResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.ReturnTicketResponse;
import com.sales.service.interfaces.ReturnTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/return-tickets")
@RequiredArgsConstructor
public class ReturnTicketController {

    private final ReturnTicketService returnTicketService;

    @GetMapping("/check-invoice/{invoiceId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<InvoiceReturnableCheckResponse>> checkInvoiceReturnable(
            Principal principal,
            @PathVariable String invoiceId) {
        InvoiceReturnableCheckResponse result = returnTicketService.checkInvoiceReturnable(invoiceId, principal.getName());
        ApiResponse<InvoiceReturnableCheckResponse> response = ApiResponse.<InvoiceReturnableCheckResponse>builder()
                .code(1000)
                .message("Kiểm tra thông tin trả hàng của hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<ReturnTicketResponse>> createReturnTicket(
            Principal principal,
            @Valid @RequestBody CreateReturnTicketRequest request) {
        ReturnTicketResponse result = returnTicketService.createReturnTicket(request, principal.getName());
        ApiResponse<ReturnTicketResponse> response = ApiResponse.<ReturnTicketResponse>builder()
                .code(1000)
                .message("Lập phiếu trả hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<ReturnTicketResponse>> approveReturnTicket(
            Principal principal,
            @PathVariable String id) {
        ReturnTicketResponse result = returnTicketService.approveReturnTicket(id, principal.getName());
        ApiResponse<ReturnTicketResponse> response = ApiResponse.<ReturnTicketResponse>builder()
                .code(1000)
                .message("Duyệt phiếu trả hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<ReturnTicketResponse>> rejectReturnTicket(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody RejectReturnTicketRequest request) {
        ReturnTicketResponse result = returnTicketService.rejectReturnTicket(id, request, principal.getName());
        ApiResponse<ReturnTicketResponse> response = ApiResponse.<ReturnTicketResponse>builder()
                .code(1000)
                .message("Từ chối phiếu trả hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/create-adjustment-invoice")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<ReturnTicketResponse>> createDecreaseAdjustmentInvoice(
            Principal principal,
            @PathVariable String id) {
        ReturnTicketResponse result = returnTicketService.createDecreaseAdjustmentInvoice(id, principal.getName());
        ApiResponse<ReturnTicketResponse> response = ApiResponse.<ReturnTicketResponse>builder()
                .code(1000)
                .message("Lập hóa đơn điều chỉnh giảm từ phiếu trả hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }


    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<ReturnTicketResponse>> getReturnTicketDetail(
            Principal principal,
            @PathVariable String id) {
        ReturnTicketResponse result = returnTicketService.getReturnTicketDetail(id, principal.getName());
        ApiResponse<ReturnTicketResponse> response = ApiResponse.<ReturnTicketResponse>builder()
                .code(1000)
                .message("Lấy chi tiết phiếu trả hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<ReturnTicketResponse>>> getReturnTickets(
            Principal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<ReturnTicketResponse> result = returnTicketService.getReturnTickets(
                principal.getName(), status, fromDate, toDate, search, page, size
        );
        ApiResponse<PageResponse<ReturnTicketResponse>> response = ApiResponse.<PageResponse<ReturnTicketResponse>>builder()
                .code(1000)
                .message("Lấy danh sách phiếu trả hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
