package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.TaxAuthorityActionRequest;
import com.viet.sales.dto.response.InvoiceResponse;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.service.interfaces.EInvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/tax-authority/invoices")
@RequiredArgsConstructor
public class TaxAuthorityController {

    private final EInvoiceService eInvoiceService;

    @GetMapping("/waiting")
    @PreAuthorize("hasRole('VT-05')")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> getWaitingInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<InvoiceResponse> result = eInvoiceService.getWaitingInvoicesForTax(page, size);
        ApiResponse<PageResponse<InvoiceResponse>> response = ApiResponse.<PageResponse<InvoiceResponse>>builder()
                .code(1000)
                .message("Lấy danh sách hóa đơn chờ cấp mã thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('VT-05')")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> getProcessedInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<InvoiceResponse> result = eInvoiceService.getProcessedInvoicesForTax(page, size);
        ApiResponse<PageResponse<InvoiceResponse>> response = ApiResponse.<PageResponse<InvoiceResponse>>builder()
                .code(1000)
                .message("Lấy lịch sử xử lý hóa đơn của Cơ quan Thuế thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{invoiceId}/approve")
    @PreAuthorize("hasRole('VT-05')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> approveInvoice(
            Principal principal,
            @PathVariable String invoiceId,
            @RequestBody(required = false) TaxAuthorityActionRequest request) {
        String taxCode = request != null ? request.getTaxAuthorityCode() : null;
        InvoiceResponse result = eInvoiceService.approveInvoiceByTax(principal != null ? principal.getName() : null, invoiceId, taxCode);
        ApiResponse<InvoiceResponse> response = ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Đã duyệt cấp mã hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{invoiceId}/reject")
    @PreAuthorize("hasRole('VT-05')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> rejectInvoice(
            Principal principal,
            @PathVariable String invoiceId,
            @RequestBody TaxAuthorityActionRequest request) {
        String errMsg = request != null ? request.getErrorMessage() : "Dữ liệu hóa đơn không hợp lệ theo quy định.";
        InvoiceResponse result = eInvoiceService.rejectInvoiceByTax(principal != null ? principal.getName() : null, invoiceId, errMsg);
        ApiResponse<InvoiceResponse> response = ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Đã từ chối cấp mã hóa đơn")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
