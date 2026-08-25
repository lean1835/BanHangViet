package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.InitPosInventoryRequest;
import com.sales.dto.request.UpdatePosInventoryRequest;
import com.sales.dto.response.PosInventoryResponse;
import com.sales.service.interfaces.PosInventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/points-of-sale/{posId}/inventories")
@RequiredArgsConstructor
public class PosInventoryController {

    private final PosInventoryService posInventoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<Page<PosInventoryResponse>>> getInventoriesByPos(
            Principal principal,
            @PathVariable String posId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) Boolean lowStockOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        Sort sort = "desc".equalsIgnoreCase(sortDir)
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<PosInventoryResponse> result = posInventoryService.getInventoriesByPos(
                principal.getName(), posId, keyword, groupId, lowStockOnly, pageable);

        ApiResponse<Page<PosInventoryResponse>> response = ApiResponse.<Page<PosInventoryResponse>>builder()
                .code(1000)
                .message("Lấy danh sách tồn kho theo điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{productId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PosInventoryResponse>> getInventoryByPosAndProduct(
            Principal principal,
            @PathVariable String posId,
            @PathVariable String productId) {

        PosInventoryResponse result = posInventoryService.getInventoryByPosAndProduct(
                principal.getName(), posId, productId);

        ApiResponse<PosInventoryResponse> response = ApiResponse.<PosInventoryResponse>builder()
                .code(1000)
                .message("Lấy thông tin tồn kho sản phẩm tại điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/warning")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<PosInventoryResponse>>> getLowStockWarningsByPos(
            Principal principal,
            @PathVariable String posId) {

        List<PosInventoryResponse> result = posInventoryService.getLowStockWarningsByPos(
                principal.getName(), posId);

        ApiResponse<List<PosInventoryResponse>> response = ApiResponse.<List<PosInventoryResponse>>builder()
                .code(1000)
                .message("Lấy danh sách cảnh báo tồn kho tại điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/init")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<List<PosInventoryResponse>>> initOrUpdatePosInventories(
            Principal principal,
            @PathVariable String posId,
            @Valid @RequestBody InitPosInventoryRequest request) {

        List<PosInventoryResponse> result = posInventoryService.initOrUpdatePosInventories(
                principal.getName(), posId, request);

        ApiResponse<List<PosInventoryResponse>> response = ApiResponse.<List<PosInventoryResponse>>builder()
                .code(1000)
                .message("Khởi tạo/cập nhật tồn kho theo điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{productId}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PosInventoryResponse>> updatePosInventory(
            Principal principal,
            @PathVariable String posId,
            @PathVariable String productId,
            @Valid @RequestBody UpdatePosInventoryRequest request) {

        PosInventoryResponse result = posInventoryService.updatePosInventory(
                principal.getName(), posId, productId, request);

        ApiResponse<PosInventoryResponse> response = ApiResponse.<PosInventoryResponse>builder()
                .code(1000)
                .message("Cập nhật tồn kho sản phẩm tại điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
