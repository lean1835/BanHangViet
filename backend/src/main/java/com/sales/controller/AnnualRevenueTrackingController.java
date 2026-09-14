package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.UpdateWarningThresholdRequest;
import com.sales.dto.response.AnnualRevenueTrackingResponse;
import com.sales.dto.response.UpdateWarningThresholdResponse;
import com.sales.service.interfaces.AnnualRevenueTrackingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/tax-periods/annual-revenue-tracking")
@RequiredArgsConstructor
public class AnnualRevenueTrackingController {

    private final AnnualRevenueTrackingService annualRevenueTrackingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<AnnualRevenueTrackingResponse>> getAnnualRevenueTracking(
            Principal principal,
            @RequestParam(required = false) Integer year) {
        AnnualRevenueTrackingResponse result = annualRevenueTrackingService.getAnnualRevenueTracking(principal.getName(), year);
        ApiResponse<AnnualRevenueTrackingResponse> response = ApiResponse.<AnnualRevenueTrackingResponse>builder()
                .code(1000)
                .message("Lấy dữ liệu theo dõi doanh thu lũy kế năm thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/warning-threshold")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<UpdateWarningThresholdResponse>> updateWarningThreshold(
            Principal principal,
            @Valid @RequestBody UpdateWarningThresholdRequest request) {
        UpdateWarningThresholdResponse result = annualRevenueTrackingService.updateWarningThreshold(principal.getName(), request);
        ApiResponse<UpdateWarningThresholdResponse> response = ApiResponse.<UpdateWarningThresholdResponse>builder()
                .code(1000)
                .message("Cập nhật mức cảnh báo ngưỡng doanh thu năm thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
