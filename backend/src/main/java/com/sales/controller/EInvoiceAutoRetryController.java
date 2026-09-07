package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.InvoiceAutoRetrySummaryResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.dto.response.PageResponse;
import com.sales.service.interfaces.EInvoiceAutoRetryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invoices/auto-retry")
@RequiredArgsConstructor
public class EInvoiceAutoRetryController {

    private final EInvoiceAutoRetryService autoRetryService;

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyAuthority('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<InvoiceAutoRetrySummaryResponse>> triggerAutoRetryManually() {
        InvoiceAutoRetrySummaryResponse summary = autoRetryService.processScheduledAutoRetry();
        return ResponseEntity.ok(ApiResponse.<InvoiceAutoRetrySummaryResponse>builder()
                .code(1000)
                .message("Kích hoạt tiến trình tự động gửi lại hóa đơn thành công")
                .result(summary)
                .build());
    }

    @PostMapping("/{invoiceId}/resend")
    @PreAuthorize("hasAnyAuthority('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<InvoiceResponse>> retrySingleInvoice(
            Authentication authentication,
            @PathVariable String invoiceId) {
        InvoiceResponse response = autoRetryService.retryInvoiceSingle(authentication.getName(), invoiceId);
        return ResponseEntity.ok(ApiResponse.<InvoiceResponse>builder()
                .code(1000)
                .message("Yêu cầu gửi lại hóa đơn thành công")
                .result(response)
                .build());
    }

    @GetMapping("/manual-processing")
    @PreAuthorize("hasAnyAuthority('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceResponse>>> getManualProcessingInvoices(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<InvoiceResponse> response = autoRetryService.getManualProcessingInvoices(authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.<PageResponse<InvoiceResponse>>builder()
                .code(1000)
                .message("Lấy danh sách hóa đơn cần xử lý thủ công thành công")
                .result(response)
                .build());
    }
}
