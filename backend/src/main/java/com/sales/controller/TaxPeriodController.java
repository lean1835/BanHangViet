package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.GenerateTaxRegisterRequest;
import com.sales.dto.request.UnlockTaxPeriodRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.TaxPeriodResponse;
import com.sales.dto.response.TaxPurchaseRegisterSummaryResponse;
import com.sales.dto.response.TaxRevenueSummaryResponse;
import com.sales.dto.response.TaxSalesRegisterResponse;
import com.sales.service.interfaces.TaxPeriodService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tax-periods")
@RequiredArgsConstructor
public class TaxPeriodController {

    private final TaxPeriodService taxPeriodService;

    @PostMapping("/generate-sales-register")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<TaxPeriodResponse>> generateSalesRegister(
            Principal principal,
            @Valid @RequestBody GenerateTaxRegisterRequest request) {
        TaxPeriodResponse result = taxPeriodService.generateSalesRegister(principal.getName(), request);
        ApiResponse<TaxPeriodResponse> response = ApiResponse.<TaxPeriodResponse>builder()
                .code(1000)
                .message("Lập bảng kê hóa đơn bán ra theo kỳ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{periodId}/sales-register")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<PageResponse<TaxSalesRegisterResponse>>> getSalesRegisterItems(
            Principal principal,
            @PathVariable String periodId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<TaxSalesRegisterResponse> result = taxPeriodService.getSalesRegisterItems(principal.getName(), periodId, page, size);
        ApiResponse<PageResponse<TaxSalesRegisterResponse>> response = ApiResponse.<PageResponse<TaxSalesRegisterResponse>>builder()
                .code(1000)
                .message("Lấy danh sách dòng bảng kê hóa đơn bán ra thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{periodId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<TaxPeriodResponse>> getTaxPeriodDetail(
            Principal principal,
            @PathVariable String periodId) {
        TaxPeriodResponse result = taxPeriodService.getTaxPeriodDetail(principal.getName(), periodId);
        ApiResponse<TaxPeriodResponse> response = ApiResponse.<TaxPeriodResponse>builder()
                .code(1000)
                .message("Lấy thông tin chi tiết kỳ kê khai thuế thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<List<TaxPeriodResponse>>> getAllTaxPeriods(Principal principal) {
        List<TaxPeriodResponse> result = taxPeriodService.getAllTaxPeriods(principal.getName());
        ApiResponse<List<TaxPeriodResponse>> response = ApiResponse.<List<TaxPeriodResponse>>builder()
                .code(1000)
                .message("Lấy danh sách các kỳ kê khai thuế thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{periodId}/tax-summary")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<TaxRevenueSummaryResponse>> getTaxRevenueSummary(
            Principal principal,
            @PathVariable String periodId) {
        TaxRevenueSummaryResponse result = taxPeriodService.getTaxRevenueSummary(principal.getName(), periodId);
        ApiResponse<TaxRevenueSummaryResponse> response = ApiResponse.<TaxRevenueSummaryResponse>builder()
                .code(1000)
                .message("Tổng hợp doanh thu chịu thuế theo kỳ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{periodId}/export-declaration")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<org.springframework.core.io.Resource> exportTaxDeclaration(
            Principal principal,
            @PathVariable String periodId) {
        return taxPeriodService.exportTaxDeclaration(principal.getName(), periodId);
    }

    @PostMapping("/{periodId}/lock")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<TaxPeriodResponse>> lockTaxPeriod(
            Principal principal,
            @PathVariable String periodId) {
        TaxPeriodResponse result = taxPeriodService.lockTaxPeriod(principal.getName(), periodId);
        ApiResponse<TaxPeriodResponse> response = ApiResponse.<TaxPeriodResponse>builder()
                .code(1000)
                .message("Chốt kỳ kê khai thuế và khóa số liệu thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{periodId}/unlock")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<TaxPeriodResponse>> unlockTaxPeriod(
            Principal principal,
            @PathVariable String periodId,
            @Valid @RequestBody UnlockTaxPeriodRequest request) {
        TaxPeriodResponse result = taxPeriodService.unlockTaxPeriod(principal.getName(), periodId, request);
        ApiResponse<TaxPeriodResponse> response = ApiResponse.<TaxPeriodResponse>builder()
                .code(1000)
                .message("Mở lại kỳ kê khai thuế thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // NCL-12-CN-006: Bảng kê hàng hóa mua vào theo kỳ
    // =========================================================================

    @PostMapping("/generate-purchase-register")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<TaxPurchaseRegisterSummaryResponse>> generatePurchaseRegister(
            Principal principal,
            @Valid @RequestBody com.sales.dto.request.GenerateTaxPurchaseRegisterRequest request) {
        TaxPurchaseRegisterSummaryResponse result = taxPeriodService.generatePurchaseRegister(principal.getName(), request);
        ApiResponse<TaxPurchaseRegisterSummaryResponse> response = ApiResponse.<TaxPurchaseRegisterSummaryResponse>builder()
                .code(1000)
                .message("Lập bảng kê hàng hóa mua vào theo kỳ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{periodId}/purchase-register")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<TaxPurchaseRegisterSummaryResponse>> getPurchaseRegisterSummary(
            Principal principal,
            @PathVariable String periodId) {
        TaxPurchaseRegisterSummaryResponse result = taxPeriodService.getPurchaseRegisterSummary(principal.getName(), periodId);
        ApiResponse<TaxPurchaseRegisterSummaryResponse> response = ApiResponse.<TaxPurchaseRegisterSummaryResponse>builder()
                .code(1000)
                .message("Lấy dữ liệu bảng kê hàng hóa mua vào thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{periodId}/purchase-register/items")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<PageResponse<com.sales.dto.response.TaxPurchaseRegisterItemResponse>>> getPurchaseRegisterItems(
            Principal principal,
            @PathVariable String periodId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean missingSupplierOnly) {
        PageResponse<com.sales.dto.response.TaxPurchaseRegisterItemResponse> result =
                taxPeriodService.getPurchaseRegisterItems(principal.getName(), periodId, page, size, missingSupplierOnly);
        ApiResponse<PageResponse<com.sales.dto.response.TaxPurchaseRegisterItemResponse>> response =
                ApiResponse.<PageResponse<com.sales.dto.response.TaxPurchaseRegisterItemResponse>>builder()
                        .code(1000)
                        .message("Lấy danh sách dòng chi tiết bảng kê mua vào thành công")
                        .result(result)
                        .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{periodId}/export-purchase-register")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'VT-04')")
    public ResponseEntity<org.springframework.core.io.Resource> exportPurchaseRegister(
            Principal principal,
            @PathVariable String periodId) {
        return taxPeriodService.exportPurchaseRegister(principal.getName(), periodId);
    }
}

