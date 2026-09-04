package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.PointOfSaleRequest;
import com.sales.dto.response.PointOfSaleResponse;
import com.sales.dto.response.PosRevenueReportResponse;
import com.sales.service.interfaces.PointOfSaleService;
import com.sales.service.interfaces.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/points-of-sale")
@RequiredArgsConstructor
public class PointOfSaleController {

    private final PointOfSaleService pointOfSaleService;
    private final ReportService reportService;

    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PointOfSaleResponse>> createPointOfSale(
            Principal principal,
            @Valid @RequestBody PointOfSaleRequest request) {
        PointOfSaleResponse result = pointOfSaleService.createPointOfSale(principal.getName(), request);
        ApiResponse<PointOfSaleResponse> response = ApiResponse.<PointOfSaleResponse>builder()
                .code(1000)
                .message("Tạo điểm bán mới thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<Page<PointOfSaleResponse>>> getAllPointsOfSale(
            Principal principal,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PointOfSaleResponse> result = pointOfSaleService.getAllPointsOfSale(
                principal.getName(), keyword, isActive, pageable);

        ApiResponse<Page<PointOfSaleResponse>> response = ApiResponse.<Page<PointOfSaleResponse>>builder()
                .code(1000)
                .message("Lấy danh sách điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<PointOfSaleResponse>>> getActivePointsOfSale(Principal principal) {
        List<PointOfSaleResponse> result = pointOfSaleService.getActivePointsOfSale(principal.getName());
        ApiResponse<List<PointOfSaleResponse>> response = ApiResponse.<List<PointOfSaleResponse>>builder()
                .code(1000)
                .message("Lấy danh sách điểm bán đang hoạt động thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PointOfSaleResponse>> getPointOfSaleById(
            Principal principal,
            @PathVariable String id) {
        PointOfSaleResponse result = pointOfSaleService.getPointOfSaleById(principal.getName(), id);
        ApiResponse<PointOfSaleResponse> response = ApiResponse.<PointOfSaleResponse>builder()
                .code(1000)
                .message("Lấy chi tiết điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PointOfSaleResponse>> updatePointOfSale(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody PointOfSaleRequest request) {
        PointOfSaleResponse result = pointOfSaleService.updatePointOfSale(principal.getName(), id, request);
        ApiResponse<PointOfSaleResponse> response = ApiResponse.<PointOfSaleResponse>builder()
                .code(1000)
                .message("Cập nhật thông tin điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/default")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PointOfSaleResponse>> setDefaultPointOfSale(
            Principal principal,
            @PathVariable String id) {
        PointOfSaleResponse result = pointOfSaleService.setDefaultPointOfSale(principal.getName(), id);
        ApiResponse<PointOfSaleResponse> response = ApiResponse.<PointOfSaleResponse>builder()
                .code(1000)
                .message("Thiết lập điểm bán mặc định thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> deletePointOfSale(
            Principal principal,
            @PathVariable String id) {
        pointOfSaleService.deletePointOfSale(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa điểm bán thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reports/revenue")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<PosRevenueReportResponse>> getRevenueReport(
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
}
