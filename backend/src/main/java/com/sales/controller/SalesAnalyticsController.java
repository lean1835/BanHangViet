package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.PeakHoursAndDaysResponse;
import com.sales.service.interfaces.SalesAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/sales-analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
public class SalesAnalyticsController {

    private final SalesAnalyticsService salesAnalyticsService;

    @GetMapping("/peak-hours-and-days")
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
}
