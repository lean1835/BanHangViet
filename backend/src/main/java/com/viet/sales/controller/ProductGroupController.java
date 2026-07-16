package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.CreateProductGroupRequest;
import com.viet.sales.dto.request.UpdateProductGroupRequest;
import com.viet.sales.dto.response.ProductGroupDetailResponse;
import com.viet.sales.dto.response.ProductGroupResponse;
import com.viet.sales.service.interfaces.ProductGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/product-groups")
@RequiredArgsConstructor
public class ProductGroupController {

    private final ProductGroupService productGroupService;

    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<ProductGroupResponse>> createProductGroup(
            Principal principal,
            @Valid @RequestBody CreateProductGroupRequest request) {
        ProductGroupResponse result = productGroupService.createProductGroup(principal.getName(), request);
        ApiResponse<ProductGroupResponse> response = ApiResponse.<ProductGroupResponse>builder()
                .code(1000)
                .message("Tạo nhóm hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<ProductGroupResponse>> updateProductGroup(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateProductGroupRequest request) {
        ProductGroupResponse result = productGroupService.updateProductGroup(principal.getName(), id, request);
        ApiResponse<ProductGroupResponse> response = ApiResponse.<ProductGroupResponse>builder()
                .code(1000)
                .message("Cập nhật nhóm hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> deleteProductGroup(
            Principal principal,
            @PathVariable String id) {
        productGroupService.deleteProductGroup(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa nhóm hàng thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<List<ProductGroupResponse>>> getAllProductGroups(Principal principal) {
        List<ProductGroupResponse> result = productGroupService.getAllProductGroups(principal.getName());
        ApiResponse<List<ProductGroupResponse>> response = ApiResponse.<List<ProductGroupResponse>>builder()
                .code(1000)
                .message("Lấy danh sách nhóm hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<ProductGroupDetailResponse>> getProductGroupById(
            Principal principal,
            @PathVariable String id) {
        ProductGroupDetailResponse result = productGroupService.getProductGroupById(principal.getName(), id);
        ApiResponse<ProductGroupDetailResponse> response = ApiResponse.<ProductGroupDetailResponse>builder()
                .code(1000)
                .message("Lấy thông tin chi tiết nhóm hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
