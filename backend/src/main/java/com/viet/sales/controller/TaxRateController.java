package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.TaxRateRequest;
import com.viet.sales.dto.response.TaxRateResponse;
import com.viet.sales.service.interfaces.TaxRateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/tax-rates")
@RequiredArgsConstructor
public class TaxRateController {

    private final TaxRateService taxRateService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<List<TaxRateResponse>>> getAllTaxRates(Principal principal) {
        List<TaxRateResponse> result = taxRateService.getAllTaxRates(principal.getName());
        ApiResponse<List<TaxRateResponse>> response = ApiResponse.<List<TaxRateResponse>>builder()
                .code(1000)
                .message("Lấy danh sách thuế suất thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<TaxRateResponse>> createTaxRate(
            Principal principal,
            @Valid @RequestBody TaxRateRequest request) {
        TaxRateResponse result = taxRateService.createTaxRate(principal.getName(), request);
        ApiResponse<TaxRateResponse> response = ApiResponse.<TaxRateResponse>builder()
                .code(1000)
                .message("Tạo thuế suất mới thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<TaxRateResponse>> updateTaxRate(
            Principal principal,
            @PathVariable("id") String id,
            @Valid @RequestBody TaxRateRequest request) {
        TaxRateResponse result = taxRateService.updateTaxRate(principal.getName(), id, request);
        ApiResponse<TaxRateResponse> response = ApiResponse.<TaxRateResponse>builder()
                .code(1000)
                .message("Cập nhật thông tin thuế suất thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<TaxRateResponse>> updateTaxRateStatus(
            Principal principal,
            @PathVariable("id") String id,
            @RequestBody(required = false) Map<String, Boolean> body) {
        Boolean isActive = body != null ? body.get("isActive") : null;
        TaxRateResponse result = taxRateService.toggleTaxRateStatus(principal.getName(), id, isActive);
        ApiResponse<TaxRateResponse> response = ApiResponse.<TaxRateResponse>builder()
                .code(1000)
                .message("Cập nhật trạng thái hiệu lực thuế suất thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
