package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.CreateProductUnitConversionRequest;
import com.sales.dto.request.UpdateProductUnitConversionRequest;
import com.sales.dto.response.ProductUnitConversionResponse;
import com.sales.service.interfaces.ProductUnitConversionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.security.Principal;
import java.util.List;

@Tag(name = "Product Unit Conversions", description = "Quản lý đơn vị tính và quy đổi đơn vị mua bán (NCL-02-CN-007)")
@RestController
@RequestMapping("/api/v1/products/{productId}/unit-conversions")
@RequiredArgsConstructor
public class ProductUnitConversionController {

    private final ProductUnitConversionService productUnitConversionService;

    @Operation(summary = "Lấy danh sách đơn vị quy đổi của sản phẩm")
    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<ProductUnitConversionResponse>>> getUnitConversions(
            Principal principal,
            @PathVariable("productId") String productId
    ) {
        List<ProductUnitConversionResponse> result = productUnitConversionService.getUnitConversions(principal.getName(), productId);
        ApiResponse<List<ProductUnitConversionResponse>> response = ApiResponse.<List<ProductUnitConversionResponse>>builder()
                .code(1000)
                .message("Lấy danh sách đơn vị quy đổi thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Tạo mới đơn vị quy đổi cho sản phẩm")
    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<ProductUnitConversionResponse>> createUnitConversion(
            Principal principal,
            @PathVariable("productId") String productId,
            @Valid @RequestBody CreateProductUnitConversionRequest request
    ) {
        ProductUnitConversionResponse result = productUnitConversionService.createUnitConversion(principal.getName(), productId, request);
        ApiResponse<ProductUnitConversionResponse> response = ApiResponse.<ProductUnitConversionResponse>builder()
                .code(1000)
                .message("Tạo đơn vị quy đổi thành công")
                .result(result)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(summary = "Cập nhật đơn vị quy đổi")
    @PutMapping("/{conversionId}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<ProductUnitConversionResponse>> updateUnitConversion(
            Principal principal,
            @PathVariable("productId") String productId,
            @PathVariable("conversionId") String conversionId,
            @Valid @RequestBody UpdateProductUnitConversionRequest request
    ) {
        ProductUnitConversionResponse result = productUnitConversionService.updateUnitConversion(principal.getName(), productId, conversionId, request);
        ApiResponse<ProductUnitConversionResponse> response = ApiResponse.<ProductUnitConversionResponse>builder()
                .code(1000)
                .message("Cập nhật đơn vị quy đổi thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Xóa đơn vị quy đổi")
    @DeleteMapping("/{conversionId}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> deleteUnitConversion(
            Principal principal,
            @PathVariable("productId") String productId,
            @PathVariable("conversionId") String conversionId
    ) {
        productUnitConversionService.deleteUnitConversion(principal.getName(), productId, conversionId);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa đơn vị quy đổi thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
