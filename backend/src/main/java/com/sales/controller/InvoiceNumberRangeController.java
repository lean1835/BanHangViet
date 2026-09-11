package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.CreateInvoiceNumberRangeRequest;
import com.sales.dto.response.InvoiceNumberRangeResponse;
import com.sales.dto.response.PageResponse;
import com.sales.service.interfaces.InvoiceNumberRangeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/invoice-ranges")
@RequiredArgsConstructor
public class InvoiceNumberRangeController {

    private final InvoiceNumberRangeService rangeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<InvoiceNumberRangeResponse>> createRange(
            Principal principal,
            @Valid @RequestBody CreateInvoiceNumberRangeRequest request) {
        InvoiceNumberRangeResponse result = rangeService.createRange(principal.getName(), request);
        ApiResponse<InvoiceNumberRangeResponse> response = ApiResponse.<InvoiceNumberRangeResponse>builder()
                .code(1000)
                .message("Khai báo dải số hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<InvoiceNumberRangeResponse>> getActiveRange(Principal principal) {
        InvoiceNumberRangeResponse result = rangeService.getActiveRange(principal.getName());
        ApiResponse<InvoiceNumberRangeResponse> response = ApiResponse.<InvoiceNumberRangeResponse>builder()
                .code(1000)
                .message("Lấy dải số hóa đơn đang hoạt động thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<InvoiceNumberRangeResponse>>> getAllRanges(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<InvoiceNumberRangeResponse> result = rangeService.getAllRanges(principal.getName(), page, size);
        ApiResponse<PageResponse<InvoiceNumberRangeResponse>> response = ApiResponse.<PageResponse<InvoiceNumberRangeResponse>>builder()
                .code(1000)
                .message("Lấy danh sách dải số hóa đơn thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
