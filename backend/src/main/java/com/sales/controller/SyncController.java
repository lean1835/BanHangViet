package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.SyncCheckRequest;
import com.sales.dto.request.OfflineOrderRequest;
import com.sales.dto.request.SyncResolveRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.SyncCheckResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.SyncReconciliationSummaryResponse;
import com.sales.dto.response.SyncSessionResponse;
import com.sales.service.interfaces.SyncService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.validation.annotation.Validated;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/sync")
@RequiredArgsConstructor
@Validated
public class SyncController {

    private final SyncService syncService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> checkHealth() {
        ApiResponse<String> response = ApiResponse.<String>builder()
                .code(1000)
                .message("Hệ thống hoạt động bình thường")
                .result("UP")
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/check")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<SyncCheckResponse>> checkConflicts(
            Principal principal,
            @Valid @RequestBody SyncCheckRequest request) {
        SyncCheckResponse result = syncService.checkConflicts(principal.getName(), request);
        ApiResponse<SyncCheckResponse> response = ApiResponse.<SyncCheckResponse>builder()
                .code(1000)
                .message("Kiểm tra xung đột hoàn tất")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bulk-upload")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> bulkUpload(
            Principal principal,
            @RequestBody @NotEmpty(message = "Danh sách đơn hàng đồng bộ không được trống") List<@Valid OfflineOrderRequest> requests) {
        List<OrderResponse> result = syncService.bulkUpload(principal.getName(), requests);
        ApiResponse<List<OrderResponse>> response = ApiResponse.<List<OrderResponse>>builder()
                .code(1000)
                .message("Đồng bộ danh sách đơn hàng hoàn tất")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resolve")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<OrderResponse>> resolveConflict(
            Principal principal,
            @Valid @RequestBody SyncResolveRequest request) {
        OrderResponse result = syncService.resolveConflict(principal.getName(), request);
        ApiResponse<OrderResponse> response = ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Giải quyết xung đột đơn hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<PageResponse<SyncSessionResponse>>> getSyncSessions(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) String status) {
        PageResponse<SyncSessionResponse> result = syncService.getSyncSessions(
                principal.getName(), page, size, fromDate, toDate, status);
        ApiResponse<PageResponse<SyncSessionResponse>> response = ApiResponse.<PageResponse<SyncSessionResponse>>builder()
                .code(1000)
                .message("Lấy danh sách phiên đồng bộ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sessions/{sessionId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<SyncSessionResponse>> getSyncSessionDetail(
            Principal principal,
            @PathVariable String sessionId) {
        SyncSessionResponse result = syncService.getSyncSessionDetail(principal.getName(), sessionId);
        ApiResponse<SyncSessionResponse> response = ApiResponse.<SyncSessionResponse>builder()
                .code(1000)
                .message("Lấy chi tiết phiên đồng bộ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reconciliation-summary")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<SyncReconciliationSummaryResponse>> getSyncReconciliationSummary(
            Principal principal,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate,
            @RequestParam(required = false) String status) {
        SyncReconciliationSummaryResponse result = syncService.getSyncReconciliationSummary(
                principal.getName(), fromDate, toDate, status);
        ApiResponse<SyncReconciliationSummaryResponse> response = ApiResponse.<SyncReconciliationSummaryResponse>builder()
                .code(1000)
                .message("Lấy thống kê đối soát đồng bộ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
