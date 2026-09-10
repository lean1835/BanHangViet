package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.CreateDiningTableRequest;
import com.sales.dto.request.UpdateDiningTableRequest;
import com.sales.dto.response.DiningTableResponse;
import com.sales.service.interfaces.DiningTableService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/dining-tables")
@RequiredArgsConstructor
@Tag(name = "Dining Table", description = "Quản lý danh mục Bàn ăn / Khu vực phục vụ tại chỗ (NCL-03-CN-010)")
public class DiningTableController {

    private final DiningTableService diningTableService;

    @Operation(summary = "Lấy danh sách bàn ăn theo khu vực và trạng thái")
    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<List<DiningTableResponse>>> getTables(
            Principal principal,
            @RequestParam(required = false) String area,
            @RequestParam(required = false) Boolean isActive) {
        List<DiningTableResponse> result = diningTableService.getTables(principal.getName(), area, isActive);
        return ResponseEntity.ok(ApiResponse.<List<DiningTableResponse>>builder()
                .code(1000)
                .message("Lấy danh sách bàn ăn thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Xem chi tiết một bàn ăn")
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<DiningTableResponse>> getTableById(
            Principal principal,
            @PathVariable String id) {
        DiningTableResponse result = diningTableService.getTableById(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<DiningTableResponse>builder()
                .code(1000)
                .message("Lấy thông tin bàn ăn thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Thêm mới bàn ăn (Chủ hộ VT-01)")
    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<DiningTableResponse>> createTable(
            Principal principal,
            @Valid @RequestBody CreateDiningTableRequest request) {
        DiningTableResponse result = diningTableService.createTable(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<DiningTableResponse>builder()
                .code(1000)
                .message("Thêm mới bàn ăn thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Cập nhật thông tin bàn ăn (Chủ hộ VT-01)")
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<DiningTableResponse>> updateTable(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateDiningTableRequest request) {
        DiningTableResponse result = diningTableService.updateTable(principal.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.<DiningTableResponse>builder()
                .code(1000)
                .message("Cập nhật bàn ăn thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Xóa bàn ăn (Chủ hộ VT-01)")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> deleteTable(
            Principal principal,
            @PathVariable String id) {
        diningTableService.deleteTable(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa bàn ăn thành công")
                .build());
    }
}
