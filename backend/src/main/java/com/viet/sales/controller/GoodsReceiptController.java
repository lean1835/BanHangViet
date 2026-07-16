package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.CreateGoodsReceiptRequest;
import com.viet.sales.dto.response.GoodsReceiptDetailInfoResponse;
import com.viet.sales.dto.response.GoodsReceiptResponse;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.service.interfaces.GoodsReceiptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/goods-receipts")
@RequiredArgsConstructor
public class GoodsReceiptController {

    private final GoodsReceiptService goodsReceiptService;

    @PostMapping
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> createGoodsReceipt(
            Principal principal,
            @Valid @RequestBody CreateGoodsReceiptRequest request) {
        GoodsReceiptResponse result = goodsReceiptService.createGoodsReceipt(principal.getName(), request);
        ApiResponse<GoodsReceiptResponse> response = ApiResponse.<GoodsReceiptResponse>builder()
                .code(1000)
                .message("Tạo phiếu nhập kho thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<GoodsReceiptResponse>>> getGoodsReceipts(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<GoodsReceiptResponse> result = goodsReceiptService.getGoodsReceipts(principal.getName(), page, size);
        ApiResponse<PageResponse<GoodsReceiptResponse>> response = ApiResponse.<PageResponse<GoodsReceiptResponse>>builder()
                .code(1000)
                .message("Lấy danh sách phiếu nhập kho thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<GoodsReceiptDetailInfoResponse>> getGoodsReceiptById(
            Principal principal,
            @PathVariable String id) {
        GoodsReceiptDetailInfoResponse result = goodsReceiptService.getGoodsReceiptById(principal.getName(), id);
        ApiResponse<GoodsReceiptDetailInfoResponse> response = ApiResponse.<GoodsReceiptDetailInfoResponse>builder()
                .code(1000)
                .message("Lấy chi tiết phiếu nhập kho thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
