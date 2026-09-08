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

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/products/{productId}/unit-conversions")
@RequiredArgsConstructor
public class ProductUnitConversionController {

    private final ProductUnitConversionService productUnitConversionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'STORE_OWNER', 'OWNER')")
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

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
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

    @PutMapping("/{conversionId}")
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
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

    @DeleteMapping("/{conversionId}")
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
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
