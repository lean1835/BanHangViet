package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.GenerateTaxRegisterRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.TaxPeriodResponse;
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
}
