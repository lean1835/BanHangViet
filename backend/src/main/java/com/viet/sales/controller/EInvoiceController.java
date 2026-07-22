package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceRequest;
import com.viet.sales.dto.response.EInvoiceResponse;
import com.viet.sales.dto.response.InvoiceStatusLogResponse;
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
import java.util.List;

@RestController
@RequestMapping("/api/v1/invoices")
@RequiredArgsConstructor
public class EInvoiceController {

    private final EInvoiceService eInvoiceService;

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<EInvoiceResponse>> adjustInvoice(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody CreateAdjustmentInvoiceRequest request) {
        EInvoiceResponse result = eInvoiceService.createAdjustmentInvoice(principal.getName(), id, request);
        ApiResponse<EInvoiceResponse> response = ApiResponse.<EInvoiceResponse>builder()
                .code(1000)
                .message("Lập hóa đơn điều chỉnh thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<EInvoiceResponse>> getInvoiceById(
            Principal principal,
            @PathVariable String id) {
        EInvoiceResponse result = eInvoiceService.getInvoiceById(principal.getName(), id);
        ApiResponse<EInvoiceResponse> response = ApiResponse.<EInvoiceResponse>builder()
                .code(1000)
                .message("Lấy thông tin hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<InvoiceStatusLogResponse>>> getInvoiceLogs(
            Principal principal,
            @PathVariable String id) {
        List<InvoiceStatusLogResponse> result = eInvoiceService.getInvoiceLogs(principal.getName(), id);
        ApiResponse<List<InvoiceStatusLogResponse>> response = ApiResponse.<List<InvoiceStatusLogResponse>>builder()
                .code(1000)
                .message("Lấy lịch sử trạng thái hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<EInvoiceResponse>>> getInvoices(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<EInvoiceResponse> result = eInvoiceService.getInvoices(
                principal.getName(), startDate, endDate, status, search, page, size);
        ApiResponse<PageResponse<EInvoiceResponse>> response = ApiResponse.<PageResponse<EInvoiceResponse>>builder()
                .code(1000)
                .message("Tra cứu danh sách hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
