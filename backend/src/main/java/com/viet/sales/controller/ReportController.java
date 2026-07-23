package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.response.*;
import com.viet.sales.service.interfaces.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<List<DailyRevenueProjection>>> getDailyRevenue(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<DailyRevenueProjection> result = reportService.getDailyRevenue(principal.getName(), fromDate, toDate);
        ApiResponse<List<DailyRevenueProjection>> response = ApiResponse.<List<DailyRevenueProjection>>builder()
                .code(1000)
                .message("Lấy báo cáo doanh thu theo ngày thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductRevenueProjection>>> getProductRevenue(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        List<ProductRevenueProjection> result = reportService.getProductRevenue(principal.getName(), fromDate, toDate);
        ApiResponse<List<ProductRevenueProjection>> response = ApiResponse.<List<ProductRevenueProjection>>builder()
                .code(1000)
                .message("Lấy báo cáo doanh thu theo mặt hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/top-selling")
    public ResponseEntity<ApiResponse<List<ProductRevenueProjection>>> getTopSellingProducts(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false, defaultValue = "10") Integer limit) {
        List<ProductRevenueProjection> result = reportService.getProductRevenue(principal.getName(), fromDate, toDate, limit);
        ApiResponse<List<ProductRevenueProjection>> response = ApiResponse.<List<ProductRevenueProjection>>builder()
                .code(1000)
                .message("Lấy thống kê mặt hàng bán chạy thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reconciliation")
    public ResponseEntity<ApiResponse<ReconciliationResponse>> getReconciliation(
            Principal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        ReconciliationResponse result = reportService.getReconciliation(principal.getName(), date);
        ApiResponse<ReconciliationResponse> response = ApiResponse.<ReconciliationResponse>builder()
                .code(1000)
                .message("Lấy thông tin đối chiếu tiền thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reconciliation/lock")
    public ResponseEntity<ApiResponse<Void>> lockReconciliation(
            Principal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String notes) {
        reportService.lockReconciliation(principal.getName(), date, notes);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Chốt đối chiếu ngày thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardOverviewResponse>> getDashboardOverview(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        DashboardOverviewResponse result = reportService.getDashboardOverview(principal.getName(), fromDate, toDate);
        ApiResponse<DashboardOverviewResponse> response = ApiResponse.<DashboardOverviewResponse>builder()
                .code(1000)
                .message("Lấy dữ liệu dashboard thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/comparison")
    public ResponseEntity<ApiResponse<CompareRevenueResponse>> compareRevenue(
            Principal principal,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period1Start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period1End,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period2Start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate period2End) {
        CompareRevenueResponse result = reportService.compareRevenue(principal.getName(), period1Start, period1End, period2Start, period2End);
        ApiResponse<CompareRevenueResponse> response = ApiResponse.<CompareRevenueResponse>builder()
                .code(1000)
                .message("So sánh doanh thu hai kỳ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/activity-logs")
    public ResponseEntity<ApiResponse<PageResponse<ActivityLogResponse>>> getActivityLogs(
            Principal principal,
            @RequestParam(required = false) String targetUsername,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<ActivityLogResponse> result = reportService.getActivityLogs(principal.getName(), targetUsername, fromDate, toDate, page, size);
        ApiResponse<PageResponse<ActivityLogResponse>> response = ApiResponse.<PageResponse<ActivityLogResponse>>builder()
                .code(1000)
                .message("Lấy nhật ký hoạt động thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
