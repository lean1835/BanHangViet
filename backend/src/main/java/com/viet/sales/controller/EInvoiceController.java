package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.CancelInvoiceRequest;
import com.viet.sales.dto.response.InvoiceResponse;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.service.interfaces.EInvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class EInvoiceController {

    private final EInvoiceService eInvoiceService;

    @PostMapping("/draft")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> createInvoiceDraft(
            Principal principal,
            @RequestParam String orderId) {
        InvoiceResponse result = eInvoiceService.createInvoiceDraft(principal.getName(), orderId);
        ApiResponse<InvoiceResponse> response = ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Khởi tạo hóa đơn điện tử nháp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{invoiceId}/submit")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> submitToTax(
            Principal principal,
            @PathVariable String invoiceId) {
        InvoiceResponse result = eInvoiceService.submitToTax(principal.getName(), invoiceId);
        ApiResponse<InvoiceResponse> response = ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Đã gửi hóa đơn điện tử chờ cơ quan thuế cấp mã")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{invoiceId}/resend")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> resendInvoice(
            Principal principal,
            @PathVariable String invoiceId) {
        InvoiceResponse result = eInvoiceService.resendInvoice(principal.getName(), invoiceId);
        ApiResponse<InvoiceResponse> response = ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Đã gửi lại hóa đơn điện tử lên cơ quan thuế")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{invoiceId}/cancel")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> cancelInvoice(
            Principal principal,
            @PathVariable String invoiceId,
            @Valid @RequestBody CancelInvoiceRequest request) {
        InvoiceResponse result = eInvoiceService.cancelInvoice(principal.getName(), invoiceId, request);
        ApiResponse<InvoiceResponse> response = ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Hủy hóa đơn điện tử thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{invoiceId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(
            Principal principal,
            @PathVariable String invoiceId) {
        InvoiceResponse result = eInvoiceService.getInvoice(principal.getName(), invoiceId);
        ApiResponse<InvoiceResponse> response = ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Lấy chi tiết hóa đơn điện tử thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> getInvoices(
            Principal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<InvoiceResponse> result = eInvoiceService.getInvoices(principal.getName(), status, fromDate, toDate, page, size);
        ApiResponse<PageResponse<InvoiceResponse>> response = ApiResponse.<PageResponse<InvoiceResponse>>builder()
                .code(1000)
                .message("Lấy danh sách hóa đơn điện tử thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
