package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PeakHoursAndDaysResponse;
import com.sales.dto.response.PurchaseSuggestionResponse;
import com.sales.service.interfaces.SalesAnalyticsService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/sales-analytics")
@RequiredArgsConstructor
@Validated
public class SalesAnalyticsController {

    private final SalesAnalyticsService salesAnalyticsService;

    @GetMapping("/peak-hours-and-days")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<PeakHoursAndDaysResponse>> getPeakHoursAndDaysAnalysis(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String posId) {

        PeakHoursAndDaysResponse result = salesAnalyticsService.getPeakHoursAndDaysAnalysis(
                principal.getName(), fromDate, toDate, posId
        );

        ApiResponse<PeakHoursAndDaysResponse> response = ApiResponse.<PeakHoursAndDaysResponse>builder()
                .code(1000)
                .message("Lấy phân tích giờ cao điểm và ngày bán chạy thành công")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping({"/purchase-forecast", "/purchase-suggestions"})
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PageResponse<PurchaseSuggestionResponse>>> getPurchaseForecast(
            Principal principal,
            @RequestParam(required = false, defaultValue = "28") @Min(1) @Max(365) Integer periodDays,
            @RequestParam(required = false) String groupId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(500) int size) {

        PageResponse<PurchaseSuggestionResponse> result = salesAnalyticsService.getPurchaseForecast(
                principal.getName(), periodDays, groupId, page, size
        );

        ApiResponse<PageResponse<PurchaseSuggestionResponse>> response = ApiResponse.<PageResponse<PurchaseSuggestionResponse>>builder()
                .code(1000)
                .message("Lấy danh sách gợi ý nhập hàng thành công")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }
}

