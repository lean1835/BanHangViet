package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.*;
import com.sales.service.interfaces.ReportExportService;
import com.sales.service.interfaces.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VT-01') or (hasRole('VT-03') and @accountantSecurityService.hasScope(authentication, 'REPORT'))")
public class ReportController {

    private final ReportService reportService;
    private final ReportExportService reportExportService;

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

    @GetMapping("/points-of-sale")
    public ResponseEntity<ApiResponse<PosRevenueReportResponse>> getPosRevenueReport(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String posId) {
        PosRevenueReportResponse result = reportService.getPosRevenueReport(principal.getName(), fromDate, toDate, posId);
        ApiResponse<PosRevenueReportResponse> response = ApiResponse.<PosRevenueReportResponse>builder()
                .code(1000)
                .message("Lấy báo cáo doanh thu theo điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/employee-shifts")
    public ResponseEntity<ApiResponse<EmployeeShiftReportResponse>> getEmployeeShiftReport(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) java.math.BigDecimal threshold) {
        EmployeeShiftReportResponse result = reportService.getEmployeeShiftReport(
                principal.getName(), fromDate, toDate, userId, threshold);
        ApiResponse<EmployeeShiftReportResponse> response = ApiResponse.<EmployeeShiftReportResponse>builder()
                .code(1000)
                .message("Lấy báo cáo doanh thu theo nhân viên và theo ca thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    // NCL-07-CN-008: Báo cáo lãi gộp theo ngày và theo mặt hàng
    @GetMapping("/gross-profit")
    public ResponseEntity<ApiResponse<GrossProfitReportResponse>> getGrossProfitReport(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String productId) {
        GrossProfitReportResponse result = reportService.getGrossProfitReport(principal.getName(), fromDate, toDate, productId);
        ApiResponse<GrossProfitReportResponse> response = ApiResponse.<GrossProfitReportResponse>builder()
                .code(1000)
                .message("Lấy báo cáo lãi gộp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    // NCL-07-CN-011: Báo cáo doanh thu theo hình thức thanh toán
    @GetMapping("/payment-methods")
    public ResponseEntity<ApiResponse<PaymentMethodReportResponse>> getPaymentMethodReport(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String shiftId) {
        PaymentMethodReportResponse result = reportService.getPaymentMethodReport(principal.getName(), fromDate, toDate, userId, shiftId);
        ApiResponse<PaymentMethodReportResponse> response = ApiResponse.<PaymentMethodReportResponse>builder()
                .code(1000)
                .message("Lấy báo cáo doanh thu theo hình thức thanh toán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    // NCL-07-CN-012: Báo cáo doanh thu theo nhóm hàng
    @GetMapping("/product-groups")
    public ResponseEntity<ApiResponse<ProductGroupReportResponse>> getProductGroupReport(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        ProductGroupReportResponse result = reportService.getProductGroupReport(principal.getName(), fromDate, toDate);
        ApiResponse<ProductGroupReportResponse> response = ApiResponse.<ProductGroupReportResponse>builder()
                .code(1000)
                .message("Lấy báo cáo doanh thu theo nhóm hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    // NCL-07-CN-012: Chi tiết mặt hàng trong nhóm hàng (drill-down)
    @GetMapping("/product-groups/{groupId}/products")
    public ResponseEntity<ApiResponse<ProductGroupRevenueDetailResponse>> getProductGroupDetail(
            Principal principal,
            @PathVariable String groupId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        ProductGroupRevenueDetailResponse result = reportService.getProductGroupDetail(principal.getName(), groupId, fromDate, toDate);
        ApiResponse<ProductGroupRevenueDetailResponse> response = ApiResponse.<ProductGroupRevenueDetailResponse>builder()
                .code(1000)
                .message("Lấy chi tiết mặt hàng trong nhóm thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    // NCL-07-CN-009: Xuất báo cáo ra file Excel (.xlsx)
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            Principal principal,
            @RequestParam(defaultValue = "DAILY") String reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String filter1,
            @RequestParam(required = false) String filter2) {
        byte[] excelData = reportExportService.exportReportToExcel(
                principal.getName(), reportType, fromDate, toDate, filter1, filter2);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "report_" + reportType.toLowerCase() + "_" + timestamp + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelData);
    }
}
