package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.AssignBarcodeRequest;
import com.sales.dto.response.BarcodeResponse;
import com.sales.service.interfaces.BarcodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class BarcodeController {

    private final BarcodeService barcodeService;

    @PostMapping("/{productId}/barcode/generate")
    @PreAuthorize("hasRole('VT-01') or hasRole('STORE_OWNER')")
    public ResponseEntity<ApiResponse<BarcodeResponse>> generateInternalBarcode(
            Principal principal,
            @PathVariable String productId) {
        BarcodeResponse result = barcodeService.generateInternalBarcode(principal.getName(), productId);
        ApiResponse<BarcodeResponse> response = ApiResponse.<BarcodeResponse>builder()
                .code(1000)
                .message("Sinh mã vạch nội bộ cho mặt hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{productId}/barcode/assign")
    @PreAuthorize("hasRole('VT-01') or hasRole('STORE_OWNER')")
    public ResponseEntity<ApiResponse<BarcodeResponse>> assignBarcode(
            Principal principal,
            @PathVariable String productId,
            @Valid @RequestBody AssignBarcodeRequest request) {
        BarcodeResponse result = barcodeService.assignBarcode(principal.getName(), productId, request);
        ApiResponse<BarcodeResponse> response = ApiResponse.<BarcodeResponse>builder()
                .code(1000)
                .message("Gán mã vạch cho mặt hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{productId}/barcode/print")
    @PreAuthorize("hasRole('VT-01') or hasRole('STORE_OWNER')")
    public ResponseEntity<ApiResponse<BarcodeResponse>> getBarcodePrintData(
            Principal principal,
            @PathVariable String productId,
            @RequestParam(defaultValue = "58mm") String paperSize,
            @RequestParam(defaultValue = "1") Integer quantity) {
        BarcodeResponse result = barcodeService.getBarcodePrintData(principal.getName(), productId, paperSize, quantity);
        ApiResponse<BarcodeResponse> response = ApiResponse.<BarcodeResponse>builder()
                .code(1000)
                .message("Lấy thông tin tem in mã vạch thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
