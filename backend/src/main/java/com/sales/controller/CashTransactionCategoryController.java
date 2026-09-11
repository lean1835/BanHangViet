package com.sales.controller;

import com.sales.constant.CashTransactionType;
import com.sales.dto.ApiResponse;
import com.sales.dto.request.CreateCashCategoryRequest;
import com.sales.dto.request.UpdateCashCategoryRequest;
import com.sales.dto.response.CashTransactionCategoryResponse;
import com.sales.service.interfaces.CashTransactionCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cash-categories")
@RequiredArgsConstructor
@Tag(name = "Cash Transaction Categories", description = "Quản lý danh mục loại thu chi tiền mặt ngoài bán hàng")
public class CashTransactionCategoryController {

    private final CashTransactionCategoryService categoryService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    @Operation(summary = "Lấy danh mục loại thu chi tiền mặt của hộ kinh doanh")
    public ResponseEntity<ApiResponse<List<CashTransactionCategoryResponse>>> getCategories(
            Authentication authentication,
            @RequestParam(required = false) CashTransactionType type) {
        List<CashTransactionCategoryResponse> result = categoryService.getCategories(authentication.getName(), type);
        return ResponseEntity.ok(ApiResponse.<List<CashTransactionCategoryResponse>>builder()
                .code(1000)
                .message("Thành công")
                .result(result)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Tạo mới loại thu chi tiền mặt")
    public ResponseEntity<ApiResponse<CashTransactionCategoryResponse>> createCategory(
            Authentication authentication,
            @Valid @RequestBody CreateCashCategoryRequest request) {
        CashTransactionCategoryResponse result = categoryService.createCategory(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<CashTransactionCategoryResponse>builder()
                .code(1000)
                .message("Tạo loại thu chi thành công")
                .result(result)
                .build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Cập nhật loại thu chi tiền mặt")
    public ResponseEntity<ApiResponse<CashTransactionCategoryResponse>> updateCategory(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody UpdateCashCategoryRequest request) {
        CashTransactionCategoryResponse result = categoryService.updateCategory(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.<CashTransactionCategoryResponse>builder()
                .code(1000)
                .message("Cập nhật loại thu chi thành công")
                .result(result)
                .build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Xóa loại thu chi tiền mặt")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            Authentication authentication,
            @PathVariable String id) {
        categoryService.deleteCategory(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa loại thu chi thành công")
                .build());
    }
}
