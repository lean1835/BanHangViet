package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.CreateInventoryAuditRequest;
import com.sales.dto.response.InventoryAuditDetailInfoResponse;
import com.sales.dto.response.InventoryAuditResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PendingOrderCheckResponse;
import com.sales.service.interfaces.InventoryAuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/inventory-audits")
@RequiredArgsConstructor
public class InventoryAuditController {

    private final InventoryAuditService inventoryAuditService;

    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<InventoryAuditResponse>> createInventoryAudit(
            Principal principal,
            @Valid @RequestBody CreateInventoryAuditRequest request) {
        InventoryAuditResponse result = inventoryAuditService.createInventoryAudit(principal.getName(), request);
        ApiResponse<InventoryAuditResponse> response = ApiResponse.<InventoryAuditResponse>builder()
                .code(1000)
                .message("Tạo phiếu kiểm kê và điều chỉnh tồn kho thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<InventoryAuditResponse>>> getInventoryAudits(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<InventoryAuditResponse> result = inventoryAuditService.getInventoryAudits(principal.getName(), page, size);
        ApiResponse<PageResponse<InventoryAuditResponse>> response = ApiResponse.<PageResponse<InventoryAuditResponse>>builder()
                .code(1000)
                .message("Lấy danh sách phiếu kiểm kê kho thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<InventoryAuditDetailInfoResponse>> getInventoryAuditById(
            Principal principal,
            @PathVariable String id) {
        InventoryAuditDetailInfoResponse result = inventoryAuditService.getInventoryAuditById(principal.getName(), id);
        ApiResponse<InventoryAuditDetailInfoResponse> response = ApiResponse.<InventoryAuditDetailInfoResponse>builder()
                .code(1000)
                .message("Lấy chi tiết phiếu kiểm kê kho thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-pending-orders")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PendingOrderCheckResponse>> checkPendingOrders(Principal principal) {
        PendingOrderCheckResponse result = inventoryAuditService.checkPendingOrders(principal.getName());
        ApiResponse<PendingOrderCheckResponse> response = ApiResponse.<PendingOrderCheckResponse>builder()
                .code(1000)
                .message("Kiểm tra đơn hàng đang tạo thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
