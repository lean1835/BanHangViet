package com.sales.controller;

import com.sales.constant.BatchStatus;
import com.sales.dto.ApiResponse;
import com.sales.dto.request.ApplyPriceAdjustmentRequest;
import com.sales.dto.request.PreviewPriceAdjustmentRequest;
import com.sales.dto.request.RevertPriceAdjustmentRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PriceAdjustmentBatchResponse;
import com.sales.dto.response.PriceAdjustmentPreviewResponse;
import com.sales.service.interfaces.PriceAdjustmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@Tag(name = "Price Adjustments", description = "Cập nhật giá bán hàng loạt theo nhóm hàng (NCL-02-CN-009)")
@RestController
@RequestMapping("/api/v1/price-adjustments")
@RequiredArgsConstructor
public class PriceAdjustmentController {

    private final PriceAdjustmentService priceAdjustmentService;

    @Operation(summary = "Xem trước điều chỉnh giá hàng loạt")
    @PostMapping("/preview")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PriceAdjustmentPreviewResponse>> previewPriceAdjustment(
            Principal principal,
            @Valid @RequestBody PreviewPriceAdjustmentRequest request) {

        PriceAdjustmentPreviewResponse result = priceAdjustmentService.previewPriceAdjustment(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<PriceAdjustmentPreviewResponse>builder()
                .code(1000)
                .message("Tính toán xem trước điều chỉnh giá thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Áp dụng cập nhật giá bán hàng loạt")
    @PostMapping("/apply")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PriceAdjustmentBatchResponse>> applyPriceAdjustment(
            Principal principal,
            @Valid @RequestBody ApplyPriceAdjustmentRequest request) {

        PriceAdjustmentBatchResponse result = priceAdjustmentService.applyPriceAdjustment(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<PriceAdjustmentBatchResponse>builder()
                .code(1000)
                .message("Áp dụng cập nhật giá bán hàng loạt thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Hoàn tác đợt điều chỉnh giá trong vòng 24 giờ")
    @PostMapping("/{batchId}/revert")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PriceAdjustmentBatchResponse>> revertPriceAdjustment(
            Principal principal,
            @PathVariable String batchId,
            @Valid @RequestBody RevertPriceAdjustmentRequest request) {

        PriceAdjustmentBatchResponse result = priceAdjustmentService.revertPriceAdjustment(principal.getName(), batchId, request);
        return ResponseEntity.ok(ApiResponse.<PriceAdjustmentBatchResponse>builder()
                .code(1000)
                .message("Hoàn tác đợt điều chỉnh giá thành công, toàn bộ mặt hàng đã được khôi phục về giá cũ")
                .result(result)
                .build());
    }

    @Operation(summary = "Lấy danh sách các đợt điều chỉnh giá")
    @GetMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PageResponse<PriceAdjustmentBatchResponse>>> getPriceAdjustmentBatches(
            Principal principal,
            @RequestParam(required = false) BatchStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<PriceAdjustmentBatchResponse> result = priceAdjustmentService.getPriceAdjustmentBatches(principal.getName(), status, page, size);
        return ResponseEntity.ok(ApiResponse.<PageResponse<PriceAdjustmentBatchResponse>>builder()
                .code(1000)
                .message("Lấy danh sách các đợt điều chỉnh giá thành công")
                .result(result)
                .build());
    }

    @Operation(summary = "Lấy chi tiết đợt điều chỉnh giá theo ID")
    @GetMapping("/{batchId}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PriceAdjustmentBatchResponse>> getPriceAdjustmentBatchById(
            Principal principal,
            @PathVariable String batchId) {

        PriceAdjustmentBatchResponse result = priceAdjustmentService.getPriceAdjustmentBatchById(principal.getName(), batchId);
        return ResponseEntity.ok(ApiResponse.<PriceAdjustmentBatchResponse>builder()
                .code(1000)
                .message("Lấy chi tiết đợt điều chỉnh giá thành công")
                .result(result)
                .build());
    }
}
