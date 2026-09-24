package com.sales.modules.supplier.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.supplier.dto.request.CreateSupplierReturnRequest;
import com.sales.common.dto.PageResponse;
import com.sales.modules.order.dto.response.ReceiptReturnableCheckResponse;
import com.sales.modules.supplier.dto.response.SupplierReturnDetailResponse;
import com.sales.modules.supplier.dto.response.SupplierReturnResponse;
import com.sales.modules.supplier.service.SupplierReturnService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/supplier-returns")
@RequiredArgsConstructor
public class SupplierReturnController {

    private final SupplierReturnService supplierReturnService;

    @GetMapping("/check-receipt/{receiptId}")
    @PreAuthorize("hasRole('VT-01') or (hasRole('VT-03') and @accountantSecurityService.hasScope(authentication, 'REPORT'))")
    public ResponseEntity<ApiResponse<ReceiptReturnableCheckResponse>> checkReceiptReturnable(
            Principal principal,
            @PathVariable String receiptId) {
        ReceiptReturnableCheckResponse result = supplierReturnService.checkReceiptReturnable(principal.getName(), receiptId);
        ApiResponse<ReceiptReturnableCheckResponse> response = ApiResponse.<ReceiptReturnableCheckResponse>builder()
                .code(1000)
                .message("Kiểm tra thông tin trả hàng của phiếu nhập thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<SupplierReturnResponse>> createSupplierReturn(
            Principal principal,
            @Valid @RequestBody CreateSupplierReturnRequest request) {
        SupplierReturnResponse result = supplierReturnService.createSupplierReturn(principal.getName(), request);
        ApiResponse<SupplierReturnResponse> response = ApiResponse.<SupplierReturnResponse>builder()
                .code(1000)
                .message("Lập phiếu trả hàng cho nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('VT-01') or (hasRole('VT-03') and @accountantSecurityService.hasScope(authentication, 'REPORT'))")
    public ResponseEntity<ApiResponse<PageResponse<SupplierReturnResponse>>> getSupplierReturns(
            Principal principal,
            @RequestParam(required = false) String supplierId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<SupplierReturnResponse> result = supplierReturnService.getSupplierReturns(
                principal.getName(), supplierId, fromDate, toDate, keyword, page, size
        );
        ApiResponse<PageResponse<SupplierReturnResponse>> response = ApiResponse.<PageResponse<SupplierReturnResponse>>builder()
                .code(1000)
                .message("Lấy danh sách phiếu trả hàng nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('VT-01') or (hasRole('VT-03') and @accountantSecurityService.hasScope(authentication, 'REPORT'))")
    public ResponseEntity<ApiResponse<SupplierReturnDetailResponse>> getSupplierReturnById(
            Principal principal,
            @PathVariable String id) {
        SupplierReturnDetailResponse result = supplierReturnService.getSupplierReturnById(principal.getName(), id);
        ApiResponse<SupplierReturnDetailResponse> response = ApiResponse.<SupplierReturnDetailResponse>builder()
                .code(1000)
                .message("Lấy chi tiết phiếu trả hàng nhà cung cấp thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
