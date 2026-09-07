package com.sales.controller;

import com.sales.dto.request.UpdateAutoRetrySettingsRequest;
import com.sales.dto.ApiResponse;
import com.sales.dto.response.AutoRetrySettingsResponse;
import com.sales.service.interfaces.BusinessHouseholdSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/household/settings")
@RequiredArgsConstructor
public class HouseholdSettingsController {

    private final BusinessHouseholdSettingsService settingsService;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<AutoRetrySettingsResponse>> getSettings(Authentication authentication) {
        AutoRetrySettingsResponse settings = settingsService.getSettings(authentication.getName());
        return ResponseEntity.ok(ApiResponse.<AutoRetrySettingsResponse>builder()
                .code(1000)
                .message("Lấy thông tin cấu hình thời hạn và gửi lại thành công")
                .result(settings)
                .build());
    }

    @PutMapping
    @PreAuthorize("hasAuthority('VT-01')")
    public ResponseEntity<ApiResponse<AutoRetrySettingsResponse>> updateSettings(
            Authentication authentication,
            @Valid @RequestBody UpdateAutoRetrySettingsRequest request) {
        AutoRetrySettingsResponse updated = settingsService.updateSettings(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.<AutoRetrySettingsResponse>builder()
                .code(1000)
                .message("Cập nhật cấu hình thời hạn và gửi lại thành công")
                .result(updated)
                .build());
    }
}
