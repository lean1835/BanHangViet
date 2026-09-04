package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.AssignBarcodeRequest;
import com.sales.dto.request.BarcodeScanRequest;
import com.sales.dto.response.BarcodeResponse;
import com.sales.dto.response.BarcodeScanResponse;
import com.sales.service.interfaces.BarcodeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/barcodes")
@RequiredArgsConstructor
@Validated
public class BarcodeController {

    private final BarcodeService barcodeService;

    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<BarcodeScanResponse>> scanBarcode(
            Principal principal,
            @Valid @RequestBody BarcodeScanRequest request
    ) {
        BarcodeScanResponse response = barcodeService.scanBarcode(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<BarcodeScanResponse>builder()
                .code(1000)
                .message(response.getMessage())
                .result(response)
                .build());
    }

    @PostMapping("/products/{productId}/generate")
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
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

    @PostMapping("/products/{productId}/assign")
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
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

    @GetMapping("/products/{productId}/print")
    @PreAuthorize("hasAnyRole('VT-01', 'STORE_OWNER', 'OWNER')")
    public ResponseEntity<ApiResponse<BarcodeResponse>> getBarcodePrintData(
            Principal principal,
            @PathVariable String productId,
            @RequestParam(defaultValue = "58mm") @Pattern(regexp = "^(58mm|80mm|standard)$", message = "Khổ giấy in chỉ hỗ trợ: 58mm, 80mm, standard") String paperSize,
            @RequestParam(defaultValue = "1") @Min(value = 1, message = "Số lượng tem in tối thiểu là 1") Integer quantity) {
        BarcodeResponse result = barcodeService.getBarcodePrintData(principal.getName(), productId, paperSize, quantity);
        ApiResponse<BarcodeResponse> response = ApiResponse.<BarcodeResponse>builder()
                .code(1000)
                .message("Lấy thông tin tem in mã vạch thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}

