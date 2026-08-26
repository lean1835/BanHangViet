package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.BarcodeScanRequest;
import com.sales.dto.response.BarcodeScanResponse;
import com.sales.service.interfaces.BarcodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/barcodes")
@RequiredArgsConstructor
public class BarcodeController {

    private final BarcodeService barcodeService;

    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'OWNER', 'ADMIN')")
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
}
