package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.AutoApplyPromotionRequest;
import com.sales.dto.response.AutoApplyPromotionResponse;
import com.sales.service.interfaces.PromotionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
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
}
