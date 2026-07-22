package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.TaxAuthorityActionRequest;
import com.viet.sales.dto.response.InvoiceResponse;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.service.interfaces.EInvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

@RestController
@RequestMapping("/api/v1/tax-authority/invoices")
@RequiredArgsConstructor
@Validated
public class TaxAuthorityController {

    private final EInvoiceService eInvoiceService;

    @GetMapping("/waiting")
    @PreAuthorize("hasRole('VT-05')")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> getWaitingInvoices(
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Số trang không được nhỏ hơn 0") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Kích thước trang phải lớn hơn hoặc bằng 1") @Max(value = 100, message = "Kích thước trang không được vượt quá 100") int size) {
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
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "Số trang không được nhỏ hơn 0") int page,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "Kích thước trang phải lớn hơn hoặc bằng 1") @Max(value = 100, message = "Kích thước trang không được vượt quá 100") int size) {
        PageResponse<InvoiceResponse> result = eInvoiceService.getProcessedInvoicesForTax(page, size);
        ApiResponse<PageResponse<InvoiceResponse>> response = ApiResponse.<PageResponse<InvoiceResponse>>builder()
                .code(1000)
                .message("Lấy danh sách lịch sử hóa đơn đã xử lý thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{invoiceId}/approve")
    @PreAuthorize("hasRole('VT-05')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> approveInvoice(
            @PathVariable String invoiceId,
            @RequestBody(required = false) TaxAuthorityActionRequest request) {
        String taxCode = request != null ? request.getTaxAuthorityCode() : null;
        InvoiceResponse result = eInvoiceService.approveInvoiceByTax(invoiceId, taxCode);
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
            @PathVariable String invoiceId,
            @RequestBody TaxAuthorityActionRequest request) {
        String errMsg = request != null ? request.getErrorMessage() : "Dữ liệu hóa đơn không hợp lệ theo quy định.";
        InvoiceResponse result = eInvoiceService.rejectInvoiceByTax(invoiceId, errMsg);
        ApiResponse<InvoiceResponse> response = ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Đã từ chối cấp mã hóa đơn")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
