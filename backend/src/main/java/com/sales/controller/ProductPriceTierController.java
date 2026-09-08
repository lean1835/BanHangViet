package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.BatchSavePriceTiersRequest;
import com.sales.dto.request.CreatePriceTierRequest;
import com.sales.dto.request.ResolveTierPriceRequest;
import com.sales.dto.request.UpdatePriceTierRequest;
import com.sales.dto.response.ProductPriceTierResponse;
import com.sales.dto.response.ResolveTierPriceResponse;
import com.sales.service.interfaces.ProductPriceTierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products/{productId}/price-tiers")
@RequiredArgsConstructor
public class ProductPriceTierController {

    private final ProductPriceTierService productPriceTierService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'STORE_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<List<ProductPriceTierResponse>>> getProductPriceTiers(
            Authentication authentication,
            @PathVariable String productId
    ) {
        List<ProductPriceTierResponse> result = productPriceTierService.getProductPriceTiers(authentication.getName(), productId);
        return ResponseEntity.ok(ApiResponse.<List<ProductPriceTierResponse>>builder()
                .code(1000)
                .message("Lấy danh sách bậc giá thành công")
                .result(result)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductPriceTierResponse>> createPriceTier(
            Authentication authentication,
            @PathVariable String productId,
            @Valid @RequestBody CreatePriceTierRequest request
    ) {
        ProductPriceTierResponse result = productPriceTierService.createPriceTier(authentication.getName(), productId, request);
        return ResponseEntity.ok(ApiResponse.<ProductPriceTierResponse>builder()
                .code(1000)
                .message("Tạo bậc giá thành công")
                .result(result)
                .build());
    }

    @PutMapping("/{tierId}")
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<ProductPriceTierResponse>> updatePriceTier(
            Authentication authentication,
            @PathVariable String productId,
            @PathVariable String tierId,
            @Valid @RequestBody UpdatePriceTierRequest request
    ) {
        ProductPriceTierResponse result = productPriceTierService.updatePriceTier(authentication.getName(), productId, tierId, request);
        return ResponseEntity.ok(ApiResponse.<ProductPriceTierResponse>builder()
                .code(1000)
                .message("Cập nhật bậc giá thành công")
                .result(result)
                .build());
    }

    @DeleteMapping("/{tierId}")
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<Void>> deletePriceTier(
            Authentication authentication,
            @PathVariable String productId,
            @PathVariable String tierId
    ) {
        productPriceTierService.deletePriceTier(authentication.getName(), productId, tierId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa bậc giá thành công")
                .build());
    }

    @PutMapping("/batch")
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<List<ProductPriceTierResponse>>> batchSavePriceTiers(
            Authentication authentication,
            @PathVariable String productId,
            @Valid @RequestBody BatchSavePriceTiersRequest request
    ) {
        List<ProductPriceTierResponse> result = productPriceTierService.batchSavePriceTiers(authentication.getName(), productId, request);
        return ResponseEntity.ok(ApiResponse.<List<ProductPriceTierResponse>>builder()
                .code(1000)
                .message("Đồng bộ danh sách bậc giá thành công")
                .result(result)
                .build());
    }

    @PostMapping("/resolve")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'STORE_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<ResolveTierPriceResponse>> resolveTierPrice(
            Authentication authentication,
            @PathVariable String productId,
            @Valid @RequestBody ResolveTierPriceRequest request
    ) {
        ResolveTierPriceResponse result = productPriceTierService.resolveTierPrice(
                authentication.getName(),
                productId,
                request.getQuantity(),
                request.getUnitConversionId()
        );
        return ResponseEntity.ok(ApiResponse.<ResolveTierPriceResponse>builder()
                .code(1000)
                .message("Tính bậc giá thành công")
                .result(result)
                .build());
    }
}
