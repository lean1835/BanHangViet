package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.CreateSupplierRequest;
import com.sales.dto.request.UpdateSupplierRequest;
import com.sales.dto.response.SupplierResponse;
import com.sales.service.interfaces.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<SupplierResponse>> createSupplier(
            Principal principal,
            @Valid @RequestBody CreateSupplierRequest request) {
        SupplierResponse result = supplierService.createSupplier(principal.getName(), request);
        ApiResponse<SupplierResponse> response = ApiResponse.<SupplierResponse>builder()
                .code(1000)
                .message("Tạo hồ sơ nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplier(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateSupplierRequest request) {
        SupplierResponse result = supplierService.updateSupplier(principal.getName(), id, request);
        ApiResponse<SupplierResponse> response = ApiResponse.<SupplierResponse>builder()
                .code(1000)
                .message("Cập nhật thông tin nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @RequestMapping(value = "/{id}/status", method = {RequestMethod.PATCH, RequestMethod.PUT})
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateStatus(
            Principal principal,
            @PathVariable String id,
            @RequestParam String status) {
        SupplierResponse result = supplierService.toggleSupplierStatus(principal.getName(), id, status);
        ApiResponse<SupplierResponse> response = ApiResponse.<SupplierResponse>builder()
                .code(1000)
                .message("Cập nhật trạng thái nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplier(
            Principal principal,
            @PathVariable String id) {
        SupplierResponse result = supplierService.getSupplier(principal.getName(), id);
        ApiResponse<SupplierResponse> response = ApiResponse.<SupplierResponse>builder()
                .code(1000)
                .message("Lấy thông tin nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getSuppliers(Principal principal) {
        List<SupplierResponse> result = supplierService.getSuppliers(principal.getName());
        ApiResponse<List<SupplierResponse>> response = ApiResponse.<List<SupplierResponse>>builder()
                .code(1000)
                .message("Lấy danh sách nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> searchSuppliers(
            Principal principal,
            @RequestParam(required = false) String query) {
        List<SupplierResponse> result = supplierService.searchSuppliers(principal.getName(), query);
        ApiResponse<List<SupplierResponse>> response = ApiResponse.<List<SupplierResponse>>builder()
                .code(1000)
                .message("Tìm kiếm nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(
            Principal principal,
            @PathVariable String id) {
        supplierService.deleteSupplier(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa nhà cung cấp thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
