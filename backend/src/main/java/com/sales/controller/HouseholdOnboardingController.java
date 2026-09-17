package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.OnboardingStatusResponse;
import com.sales.service.interfaces.HouseholdOnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/household/onboarding")
@RequiredArgsConstructor
@Tag(name = "Household Onboarding Controller", description = "Quản lý tiến độ trình hướng dẫn thiết lập lần đầu cho hộ kinh doanh (NCL-09-CN-007)")
public class HouseholdOnboardingController {

    private final HouseholdOnboardingService onboardingService;

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    @Operation(summary = "Lấy tiến độ 5 bước thiết lập ban đầu của hộ kinh doanh (NCL-09-CN-007)")
    public ResponseEntity<ApiResponse<OnboardingStatusResponse>> getStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        OnboardingStatusResponse response = onboardingService.getOnboardingStatus(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.<OnboardingStatusResponse>builder()
                .code(1000)
                .message("Lấy thông tin tiến độ thiết lập thành công")
                .result(response)
                .build());
    }

    @PostMapping("/skip")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Chủ hộ bấm bỏ qua trình hướng dẫn để vào bán ngay (NCL-09-CN-007)")
    public ResponseEntity<ApiResponse<OnboardingStatusResponse>> skipOnboarding(
            @AuthenticationPrincipal UserDetails userDetails) {
        OnboardingStatusResponse response = onboardingService.skipOnboarding(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.<OnboardingStatusResponse>builder()
                .code(1000)
                .message("Đã ghi nhận bỏ qua trình hướng dẫn thiết lập")
                .result(response)
                .build());
    }

    @PostMapping("/complete")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Chủ hộ xác nhận hoàn tất trình hướng dẫn thiết lập (NCL-09-CN-007)")
    public ResponseEntity<ApiResponse<OnboardingStatusResponse>> completeOnboarding(
            @AuthenticationPrincipal UserDetails userDetails) {
        OnboardingStatusResponse response = onboardingService.completeOnboarding(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.<OnboardingStatusResponse>builder()
                .code(1000)
                .message("Đã hoàn tất trình hướng dẫn thiết lập ban đầu")
                .result(response)
                .build());
    }
}
