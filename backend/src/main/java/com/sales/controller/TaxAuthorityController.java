package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.TaxAuthorityActionRequest;
import com.sales.dto.response.InvoiceResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.TaxConnectionHistoryResponse;
import com.sales.dto.response.TaxConnectionStatusResponse;
import com.sales.service.interfaces.EInvoiceService;
import com.sales.service.interfaces.TaxConnectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/tax-authority/invoices")
@RequiredArgsConstructor
@Tag(name = "Tax Authority", description = "API dành cho Cơ quan thuế mô phỏng và Giám sát kết nối thuế (NCL-04-CN-010)")
public class TaxAuthorityController {

    private final EInvoiceService eInvoiceService;
    private final TaxConnectionService taxConnectionService;

    @GetMapping("/waiting")
    @PreAuthorize("hasRole('VT-05')")
    @Operation(summary = "Lấy danh sách hóa đơn chờ cấp mã", description = "Cơ quan thuế lấy danh sách hóa đơn đang ở trạng thái chờ cấp mã")
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
    @Operation(summary = "Lấy lịch sử xử lý hóa đơn", description = "Cơ quan thuế lấy danh sách hóa đơn đã xử lý phê duyệt hoặc từ chối")
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
    @Operation(summary = "Duyệt cấp mã hóa đơn", description = "Cơ quan thuế duyệt cấp mã hóa đơn điện tử")
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

    @GetMapping("/connection-status")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-05')")
    @Operation(summary = "Xem trạng thái kết nối cơ quan thuế", description = "Theo dõi trạng thái kết nối (ONLINE, SLOW, OFFLINE), thời điểm phản hồi và hàng đợi (NCL-04-CN-010)")
    public ResponseEntity<ApiResponse<TaxConnectionStatusResponse>> getConnectionStatus(Principal principal) {
        TaxConnectionStatusResponse result = taxConnectionService.getTaxConnectionStatus(principal != null ? principal.getName() : null);
        ApiResponse<TaxConnectionStatusResponse> response = ApiResponse.<TaxConnectionStatusResponse>builder()
                .code(1000)
                .message("Lấy trạng thái kết nối cơ quan thuế thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/connection-history")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-05')")
    @Operation(summary = "Xem lịch sử kết nối cơ quan thuế", description = "Xem lịch sử trạng thái kết nối và nhật ký gửi nhận trong 7 ngày gần nhất (NCL-04-CN-010)")
    public ResponseEntity<ApiResponse<TaxConnectionHistoryResponse>> getConnectionHistory(
            Principal principal,
            @RequestParam(defaultValue = "7") int days) {
        TaxConnectionHistoryResponse result = taxConnectionService.getTaxConnectionHistory(principal != null ? principal.getName() : null, days);
        ApiResponse<TaxConnectionHistoryResponse> response = ApiResponse.<TaxConnectionHistoryResponse>builder()
                .code(1000)
                .message("Lấy lịch sử kết nối cơ quan thuế thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{invoiceId}/reject")
    @PreAuthorize("hasRole('VT-05')")
    @Operation(summary = "Từ chối cấp mã hóa đơn", description = "Cơ quan thuế từ chối cấp mã kèm lý do lỗi")
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
