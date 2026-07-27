package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.SyncCheckRequest;
import com.viet.sales.dto.request.OfflineOrderRequest;
import com.viet.sales.dto.request.SyncResolveRequest;
import com.viet.sales.dto.response.SyncCheckResponse;
import com.viet.sales.dto.response.OrderResponse;
import com.viet.sales.service.interfaces.SyncService;
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
}
