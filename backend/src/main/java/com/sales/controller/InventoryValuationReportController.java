package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.InventoryValuationReportResponse;
import com.sales.service.interfaces.InventoryValuationReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@Tag(name = "Báo cáo giá trị tồn kho theo giá vốn", description = "API lập báo cáo định giá tồn kho theo giá vốn và xuất bảng tính Excel (NCL-13-CN-007)")
@RestController
@RequestMapping("/api/v1/reports/inventory-valuation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VT-01') or (hasRole('VT-03') and @accountantSecurityService.hasScope(authentication, 'REPORT'))")
public class InventoryValuationReportController {

    private final InventoryValuationReportService inventoryValuationReportService;

    @Operation(summary = "Xem báo cáo giá trị tồn kho theo giá vốn",
            description = "Tính toán giá trị tồn kho toàn kho, cơ cấu nhóm hàng, chi tiết từng mặt hàng và danh sách cảnh báo thiếu giá vốn")
    @GetMapping
    public ResponseEntity<ApiResponse<InventoryValuationReportResponse>> getInventoryValuationReport(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "inventoryValue") String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir
    ) {
        InventoryValuationReportResponse result = inventoryValuationReportService.getInventoryValuationReport(
                principal.getName(), asOfDate, groupId, search, sortBy, sortDir);

        ApiResponse<InventoryValuationReportResponse> response = ApiResponse.<InventoryValuationReportResponse>builder()
                .code(1000)
                .message("Lấy báo cáo giá trị tồn kho theo giá vốn thành công")
                .result(result)
                .build();

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Xuất báo cáo giá trị tồn kho ra file Excel",
            description = "Tạo tệp bảng tính .xlsx đa sheet có đầy đủ khối thông tin, KPI tổng quan, bảng nhóm hàng và chi tiết mặt hàng")
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportInventoryValuationExcel(
            Principal principal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String search
    ) {
        byte[] excelBytes = inventoryValuationReportService.exportInventoryValuationExcel(
                principal.getName(), asOfDate, groupId, search);

        LocalDate fileDate = asOfDate != null ? asOfDate : LocalDate.now();
        String filename = "bao-cao-gia-tri-ton-kho-" + fileDate + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }
}
