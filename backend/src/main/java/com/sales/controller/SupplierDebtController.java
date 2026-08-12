package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.PaySupplierDebtRequest;
import com.sales.dto.response.SupplierDebtResponse;
import com.sales.dto.response.SupplierDebtSummaryResponse;
import com.sales.service.interfaces.SupplierDebtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/supplier-debts")
@RequiredArgsConstructor
public class SupplierDebtController {

    private final SupplierDebtService supplierDebtService;

    @PostMapping("/pay")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<SupplierDebtResponse>> paySupplierDebt(
            Principal principal,
            @Valid @RequestBody PaySupplierDebtRequest request) {
        SupplierDebtResponse result = supplierDebtService.paySupplierDebt(principal.getName(), request);
        ApiResponse<SupplierDebtResponse> response = ApiResponse.<SupplierDebtResponse>builder()
                .code(1000)
                .message("Thanh toán công nợ nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{supplierId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<List<SupplierDebtResponse>>> getSupplierDebtHistory(
            Principal principal,
            @PathVariable String supplierId) {
        List<SupplierDebtResponse> result = supplierDebtService.getSupplierDebtHistory(principal.getName(), supplierId);
        ApiResponse<List<SupplierDebtResponse>> response = ApiResponse.<List<SupplierDebtResponse>>builder()
                .code(1000)
                .message("Lấy lịch sử công nợ nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<List<SupplierDebtResponse>>> getSupplierDebts(
            Principal principal,
            @RequestParam(required = false) String status) {
        List<SupplierDebtResponse> result = supplierDebtService.getSupplierDebts(principal.getName(), status);
        ApiResponse<List<SupplierDebtResponse>> response = ApiResponse.<List<SupplierDebtResponse>>builder()
                .code(1000)
                .message("Lấy danh sách công nợ nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<SupplierDebtSummaryResponse>> getSupplierDebtSummary(Principal principal) {
        SupplierDebtSummaryResponse result = supplierDebtService.getSupplierDebtSummary(principal.getName());
        ApiResponse<SupplierDebtSummaryResponse> response = ApiResponse.<SupplierDebtSummaryResponse>builder()
                .code(1000)
                .message("Lấy tổng quan công nợ nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
