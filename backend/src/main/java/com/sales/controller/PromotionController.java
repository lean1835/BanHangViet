package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.AutoApplyPromotionRequest;
import com.sales.dto.request.PromotionCreateRequest;
import com.sales.dto.request.PromotionSearchParam;
import com.sales.dto.request.PromotionUpdateRequest;
import com.sales.dto.response.AutoApplyPromotionResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PromotionDetailResponse;
import com.sales.dto.response.PromotionReportResponse;
import com.sales.dto.response.PromotionResponse;
import com.sales.service.interfaces.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/promotions")
@RequiredArgsConstructor
public class PromotionController {

    private final PromotionService promotionService;

    @PostMapping("/auto-apply")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<AutoApplyPromotionResponse>> autoApplyPromotions(
            @Valid @RequestBody AutoApplyPromotionRequest request,
            Principal principal
    ) {
        AutoApplyPromotionResponse response = promotionService.autoApplyPromotions(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<AutoApplyPromotionResponse>builder()
                .code(1000)
                .message("Tính toán khuyến mại tự động thành công")
                .result(response)
                .build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> createPromotion(
            Principal principal,
            @Valid @RequestBody PromotionCreateRequest request) {
        PromotionResponse result = promotionService.createPromotion(principal.getName(), request);
        ApiResponse<PromotionResponse> response = ApiResponse.<PromotionResponse>builder()
                .code(1000)
                .message("Tạo chương trình khuyến mại thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> updatePromotion(
            Principal principal,
            @PathVariable("id") String id,
            @Valid @RequestBody PromotionUpdateRequest request) {
        PromotionResponse result = promotionService.updatePromotion(principal.getName(), id, request);
        ApiResponse<PromotionResponse> response = ApiResponse.<PromotionResponse>builder()
                .code(1000)
                .message("Cập nhật chương trình khuyến mại thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(
            Principal principal,
            @PathVariable("id") String id) {
        promotionService.deletePromotion(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa chương trình khuyến mại thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PromotionDetailResponse>> getPromotionById(
            Principal principal,
            @PathVariable("id") String id) {
        PromotionDetailResponse result = promotionService.getPromotionById(principal.getName(), id);
        ApiResponse<PromotionDetailResponse> response = ApiResponse.<PromotionDetailResponse>builder()
                .code(1000)
                .message("Lấy chi tiết chương trình khuyến mại thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/report")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PromotionReportResponse>> getPromotionReport(
            Principal principal,
            @PathVariable("id") String id) {
        PromotionReportResponse result = promotionService.getPromotionReport(principal.getName(), id);
        ApiResponse<PromotionReportResponse> response = ApiResponse.<PromotionReportResponse>builder()
                .code(1000)
                .message("Lấy báo cáo hiệu quả khuyến mại thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<PromotionResponse>>> getPromotions(
            Principal principal,
            @ModelAttribute PromotionSearchParam param,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "sortBy", defaultValue = "createdAt") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "DESC") String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PromotionResponse> pageResult = promotionService.getPromotions(principal.getName(), param, pageable);

        PageResponse<PromotionResponse> pageResponse = PageResponse.<PromotionResponse>builder()
                .content(pageResult.getContent())
                .pageNumber(pageResult.getNumber())
                .pageSize(pageResult.getSize())
                .totalElements(pageResult.getTotalElements())
                .totalPages(pageResult.getTotalPages())
                .last(pageResult.isLast())
                .build();

        ApiResponse<PageResponse<PromotionResponse>> response = ApiResponse.<PageResponse<PromotionResponse>>builder()
                .code(1000)
                .message("Lấy danh sách chương trình khuyến mại thành công")
                .result(pageResponse)
                .build();

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PromotionResponse>> togglePromotionStatus(
            Principal principal,
            @PathVariable("id") String id) {
        PromotionResponse result = promotionService.togglePromotionStatus(principal.getName(), id);
        ApiResponse<PromotionResponse> response = ApiResponse.<PromotionResponse>builder()
                .code(1000)
                .message("Thay đổi trạng thái chương trình khuyến mại thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
