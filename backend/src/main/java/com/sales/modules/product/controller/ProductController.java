package com.sales.modules.product.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.product.dto.request.CreateProductRequest;
import com.sales.modules.product.dto.request.UpdateProductRequest;
import com.sales.common.dto.PageResponse;
import com.sales.modules.product.dto.response.ProductResponse;
import com.sales.modules.product.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import com.sales.modules.inventory.dto.request.UpdateMinStockRequest;
import com.sales.modules.inventory.service.InventoryWarningService;
import com.sales.modules.product.dto.response.ImportProductResultResponse;
import com.sales.modules.product.service.ProductImportService;
import java.util.List;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {
    private final ProductService productService;
    private final ProductImportService productImportService;
    private final InventoryWarningService inventoryWarningService;

    @GetMapping("/import-template")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<Resource> getImportTemplate() throws Exception {
        byte[] data = productImportService.getImportTemplate();
        ByteArrayResource resource = new ByteArrayResource(data);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Product_Import_Template.xlsx\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(resource);
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<ImportProductResultResponse>> importProducts(
            Principal principal,
            @RequestParam("file") MultipartFile file) {
        ImportProductResultResponse result = productImportService.importProducts(principal.getName(), file);
        ApiResponse<ImportProductResultResponse> response = ApiResponse.<ImportProductResultResponse>builder()
                .code(1000)
                .message("Nhập danh mục sản phẩm từ tệp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

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

    @PutMapping("/{id}/min-stock")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<ProductResponse>> updateMinStock(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateMinStockRequest request) {
        ProductResponse result = inventoryWarningService.updateMinStock(principal.getName(), id, request);
        ApiResponse<ProductResponse> response = ApiResponse.<ProductResponse>builder()
                .code(1000)
                .message("Cập nhật ngưỡng tồn tối thiểu thành công")
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
            @RequestParam(defaultValue = "6") int size) {
        PageResponse<ProductResponse> result = productService.getProducts(
                principal.getName(), search, groupId, status, excludeInactive, stockFilter, page, size);
        ApiResponse<PageResponse<ProductResponse>> response = ApiResponse.<PageResponse<ProductResponse>>builder()
                .code(1000)
                .message("Lấy danh sách hàng hóa thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/voice-search")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> voiceSearchProducts(
            Principal principal,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String groupId,
            @RequestParam(defaultValue = "10") int limit) {
        List<ProductResponse> result = productService.voiceSearchProducts(principal.getName(), query, groupId, limit);
        ApiResponse<List<ProductResponse>> response = ApiResponse.<List<ProductResponse>>builder()
                .code(1000)
                .message("Tìm kiếm hàng hóa bằng giọng nói thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
