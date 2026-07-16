package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.CreateProductRequest;
import com.viet.sales.dto.request.UpdateProductRequest;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.dto.response.ProductResponse;
import com.viet.sales.service.interfaces.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            Principal principal,
            @Valid @RequestBody CreateProductRequest request) {
        ProductResponse result = productService.createProduct(principal.getName(), request);
        ApiResponse<ProductResponse> response = ApiResponse.<ProductResponse>builder()
                .code(1000)
                .message("Thêm hàng hóa thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateProductRequest request) {
        ProductResponse result = productService.updateProduct(principal.getName(), id, request);
        ApiResponse<ProductResponse> response = ApiResponse.<ProductResponse>builder()
                .code(1000)
                .message("Cập nhật hàng hóa thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            Principal principal,
            @PathVariable String id) {
        productService.deleteProduct(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa hàng hóa thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            Principal principal,
            @PathVariable String id) {
        ProductResponse result = productService.getProductById(principal.getName(), id);
        ApiResponse<ProductResponse> response = ApiResponse.<ProductResponse>builder()
                .code(1000)
                .message("Lấy chi tiết hàng hóa thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProducts(
            Principal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String groupId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean excludeInactive,
            @RequestParam(required = false) String stockFilter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<ProductResponse> result = productService.getProducts(
                principal.getName(), search, groupId, status, excludeInactive, stockFilter, page, size);
        ApiResponse<PageResponse<ProductResponse>> response = ApiResponse.<PageResponse<ProductResponse>>builder()
                .code(1000)
                .message("Lấy danh sách hàng hóa thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
