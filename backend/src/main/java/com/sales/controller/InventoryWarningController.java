package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.LowStockWarningListResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PurchaseSuggestionResponse;
import com.sales.service.interfaces.InventoryWarningService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Validated
public class InventoryWarningController {

    private final InventoryWarningService inventoryWarningService;

    @GetMapping("/low-stock-warnings")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'VT-04')")
    public ResponseEntity<ApiResponse<LowStockWarningListResponse>> getLowStockWarnings(
            Principal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String groupId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        LowStockWarningListResponse result = inventoryWarningService.getLowStockWarnings(
                principal.getName(), search, groupId, page, size);
        ApiResponse<LowStockWarningListResponse> response = ApiResponse.<LowStockWarningListResponse>builder()
                .code(1000)
                .message("Lấy danh sách cảnh báo tồn tối thiểu thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/purchase-suggestions")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PageResponse<PurchaseSuggestionResponse>>> getPurchaseSuggestions(
            Principal principal,
            @RequestParam(required = false, defaultValue = "28") @Min(1) @Max(365) Integer periodDays,
            @RequestParam(required = false) String groupId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "10") @Min(1) @Max(100) int size) {
        PageResponse<PurchaseSuggestionResponse> result = inventoryWarningService.getPurchaseSuggestions(
                principal.getName(), periodDays, groupId, page, size);
        ApiResponse<PageResponse<PurchaseSuggestionResponse>> response = ApiResponse.<PageResponse<PurchaseSuggestionResponse>>builder()
                .code(1000)
                .message("Lấy danh sách gợi ý nhập hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
