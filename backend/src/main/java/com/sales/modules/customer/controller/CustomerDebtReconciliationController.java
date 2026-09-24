package com.sales.modules.customer.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.customer.dto.request.ConfirmDebtReconciliationRequest;
import com.sales.modules.customer.dto.request.CreateDebtAdjustmentRequest;
import com.sales.modules.customer.dto.request.CreateDebtReconciliationRequest;
import com.sales.modules.customer.dto.request.DebtReconciliationPreviewRequest;
import com.sales.modules.customer.dto.response.CustomerDebtResponse;
import com.sales.modules.customer.dto.response.DebtReconciliationResponse;
import com.sales.modules.customer.dto.response.DebtStatementPrintResponse;
import com.sales.modules.customer.service.CustomerDebtReconciliationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/debts")
@RequiredArgsConstructor
public class CustomerDebtReconciliationController {

    private final CustomerDebtReconciliationService reconciliationService;

    @PostMapping("/reconciliations/preview")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<DebtReconciliationResponse>> previewReconciliation(
            Principal principal,
            @Valid @RequestBody DebtReconciliationPreviewRequest request) {

        DebtReconciliationResponse result = reconciliationService.previewReconciliation(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<DebtReconciliationResponse>builder()
                .code(1000)
                .message("Xem trước biên bản đối chiếu công nợ thành công")
                .result(result)
                .build());
    }

    @PostMapping("/reconciliations")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<DebtReconciliationResponse>> createReconciliation(
            Principal principal,
            @Valid @RequestBody CreateDebtReconciliationRequest request) {

        DebtReconciliationResponse result = reconciliationService.createReconciliation(principal.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<DebtReconciliationResponse>builder()
                .code(1000)
                .message("Tạo biên bản đối chiếu công nợ thành công")
                .result(result)
                .build());
    }

    @PostMapping("/reconciliations/{id}/confirm")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<DebtReconciliationResponse>> confirmReconciliation(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody(required = false) ConfirmDebtReconciliationRequest request) {

        DebtReconciliationResponse result = reconciliationService.confirmReconciliation(principal.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.<DebtReconciliationResponse>builder()
                .code(1000)
                .message("Xác nhận đối chiếu và khóa sổ công nợ thành công")
                .result(result)
                .build());
    }

    @PostMapping("/reconciliations/{id}/cancel")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> cancelReconciliation(
            Principal principal,
            @PathVariable String id) {

        reconciliationService.cancelReconciliation(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Hủy biên bản đối chiếu công nợ thành công")
                .build());
    }

    @GetMapping("/reconciliations/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<DebtReconciliationResponse>> getReconciliationById(
            Principal principal,
            @PathVariable String id) {

        DebtReconciliationResponse result = reconciliationService.getReconciliationById(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<DebtReconciliationResponse>builder()
                .code(1000)
                .message("Lấy thông tin biên bản đối chiếu công nợ thành công")
                .result(result)
                .build());
    }

    @GetMapping("/reconciliations")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<Page<DebtReconciliationResponse>>> getReconciliations(
            Principal principal,
            @RequestParam(required = false) String customerId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<DebtReconciliationResponse> result = reconciliationService.getReconciliations(
                principal.getName(), customerId, status, startDate, endDate, pageable);
        return ResponseEntity.ok(ApiResponse.<Page<DebtReconciliationResponse>>builder()
                .code(1000)
                .message("Lấy danh sách biên bản đối chiếu công nợ thành công")
                .result(result)
                .build());
    }

    @GetMapping("/reconciliations/{id}/print")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<DebtStatementPrintResponse>> getPrintStatement(
            Principal principal,
            @PathVariable String id) {

        DebtStatementPrintResponse result = reconciliationService.getPrintStatement(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<DebtStatementPrintResponse>builder()
                .code(1000)
                .message("Lấy thông tin in giấy xác nhận nợ thành công")
                .result(result)
                .build());
    }

    @GetMapping("/reconciliations/customer/{customerId}/latest")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<DebtReconciliationResponse>> getLatestReconciliation(
            Principal principal,
            @PathVariable String customerId) {

        DebtReconciliationResponse result = reconciliationService.getLatestReconciliation(principal.getName(), customerId);
        return ResponseEntity.ok(ApiResponse.<DebtReconciliationResponse>builder()
                .code(1000)
                .message("Lấy biên bản đối chiếu gần nhất thành công")
                .result(result)
                .build());
    }

    @PostMapping("/adjustments")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<CustomerDebtResponse>> createDebtAdjustment(
            Principal principal,
            @Valid @RequestBody CreateDebtAdjustmentRequest request) {

        CustomerDebtResponse result = reconciliationService.createDebtAdjustment(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<CustomerDebtResponse>builder()
                .code(1000)
                .message("Lập bút toán điều chỉnh công nợ thành công")
                .result(result)
                .build());
    }
}
