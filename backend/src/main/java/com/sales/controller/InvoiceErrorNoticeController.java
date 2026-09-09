package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.CreateInvoiceErrorNoticeRequest;
import com.sales.dto.response.InvoiceErrorNoticeResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.dto.response.PageResponse;
import com.sales.service.interfaces.InvoiceErrorNoticeService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/invoice-error-notices")
@RequiredArgsConstructor
public class InvoiceErrorNoticeController {

    private final InvoiceErrorNoticeService noticeService;

    @GetMapping("/eligible-invoices")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    @Operation(summary = "Lấy danh sách hóa đơn bị Hủy hoặc Điều chỉnh đủ điều kiện lập thông báo sai sót Mẫu 04/SS-HĐĐT (NCL-05-CN-005)")
    public ResponseEntity<ApiResponse<List<InvoiceResponse>>> getEligibleInvoices(Principal principal) {
        List<InvoiceResponse> result = noticeService.getEligibleInvoicesForNotice(principal.getName());
        ApiResponse<List<InvoiceResponse>> response = ApiResponse.<List<InvoiceResponse>>builder()
                .code(1000)
                .message("Lấy danh sách hóa đơn đủ điều kiện lập thông báo sai sót thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    @Operation(summary = "Lập thông báo hóa đơn điện tử có sai sót Mẫu 04/SS-HĐĐT (NCL-05-CN-005)")
    public ResponseEntity<ApiResponse<InvoiceErrorNoticeResponse>> createNotice(
            Principal principal,
            @Valid @RequestBody CreateInvoiceErrorNoticeRequest request) {
        InvoiceErrorNoticeResponse result = noticeService.createErrorNotice(principal.getName(), request);
        ApiResponse<InvoiceErrorNoticeResponse> response = ApiResponse.<InvoiceErrorNoticeResponse>builder()
                .code(1000)
                .message("Khởi tạo thông báo hóa đơn sai sót Mẫu 04/SS-HĐĐT thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    @Operation(summary = "Gửi thông báo hóa đơn sai sót tới Cơ quan thuế mô phỏng (NCL-05-CN-005)")
    public ResponseEntity<ApiResponse<InvoiceErrorNoticeResponse>> sendNotice(
            Principal principal,
            @PathVariable String id) {
        InvoiceErrorNoticeResponse result = noticeService.sendNoticeToTaxAuthority(principal.getName(), id);
        ApiResponse<InvoiceErrorNoticeResponse> response = ApiResponse.<InvoiceErrorNoticeResponse>builder()
                .code(1000)
                .message("Gửi thông báo sai sót tới Cơ quan thuế mô phỏng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    @Operation(summary = "Xem chi tiết thông báo hóa đơn sai sót Mẫu 04/SS-HĐĐT (NCL-05-CN-005)")
    public ResponseEntity<ApiResponse<InvoiceErrorNoticeResponse>> getNotice(
            Principal principal,
            @PathVariable String id) {
        InvoiceErrorNoticeResponse result = noticeService.getNotice(principal.getName(), id);
        ApiResponse<InvoiceErrorNoticeResponse> response = ApiResponse.<InvoiceErrorNoticeResponse>builder()
                .code(1000)
                .message("Lấy chi tiết thông báo sai sót thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    @Operation(summary = "Tra cứu danh sách thông báo hóa đơn sai sót (NCL-05-CN-005)")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceErrorNoticeResponse>>> getNotices(
            Principal principal,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<InvoiceErrorNoticeResponse> result = noticeService.getNotices(principal.getName(), status, page, size);
        ApiResponse<PageResponse<InvoiceErrorNoticeResponse>> response = ApiResponse.<PageResponse<InvoiceErrorNoticeResponse>>builder()
                .code(1000)
                .message("Lấy danh sách thông báo sai sót thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
