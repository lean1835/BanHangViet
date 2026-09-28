package com.sales.modules.invoice.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.invoice.dto.response.InvoiceAutoRetrySummaryResponse;
import com.sales.modules.invoice.dto.response.InvoiceResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.invoice.service.EInvoiceAutoRetryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invoices/auto-retry")
@RequiredArgsConstructor
@Tag(name = "E-Invoice Auto Retry Controller", description = "Quản lý tiến trình tự động gửi lại hóa đơn điện tử chưa được cấp mã và xử lý thủ công (NCL-04-CN-007)")
public class EInvoiceAutoRetryController {
    private final EInvoiceAutoRetryService autoRetryService;

    @Operation(summary = "Kích hoạt thủ công tiến trình tự động gửi lại", description = "Cho phép chủ hộ hoặc kế toán kích hoạt quét và gửi lại các hóa đơn lỗi thuộc hộ kinh doanh hiện tại")
    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<InvoiceAutoRetrySummaryResponse>> triggerAutoRetryManually(Authentication authentication) {
        InvoiceAutoRetrySummaryResponse summary = autoRetryService.processManualAutoRetryForUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.<InvoiceAutoRetrySummaryResponse>builder()
                .code(1000)
                .message("Kích hoạt tiến trình tự động gửi lại hóa đơn thành công")
                .result(summary)
                .build());
    }

    @Operation(summary = "Gửi lại hóa đơn đơn lẻ", description = "Yêu cầu gửi lại cơ quan thuế cho một hóa đơn đang ở trạng thái lỗi hoặc xử lý thủ công")
    @PostMapping("/{invoiceId}/resend")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
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

    @Operation(summary = "Lấy danh sách hóa đơn cần xử lý thủ công", description = "Lấy danh sách hóa đơn ở trạng thái MANUAL_PROCESSING kèm phân trang")
    @GetMapping("/manual-processing")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
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
