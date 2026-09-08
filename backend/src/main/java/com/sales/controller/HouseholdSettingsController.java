package com.sales.controller;

import com.sales.dto.request.UpdateAutoRetrySettingsRequest;
import com.sales.dto.ApiResponse;
import com.sales.dto.response.AutoRetrySettingsResponse;
import com.sales.service.interfaces.BusinessHouseholdSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/household/settings")
@RequiredArgsConstructor
@Tag(name = "Household Settings Controller", description = "Quản lý cấu hình thời hạn và thiết lập tự động gửi lại hóa đơn cho hộ kinh doanh (NCL-09-CN-008)")
public class HouseholdSettingsController {

    private final BusinessHouseholdSettingsService settingsService;

    @Operation(summary = "Xem cấu hình thời hạn và tự động gửi lại", description = "Lấy thông tin cấu hình thời hạn và quy tắc gửi lại hóa đơn của hộ kinh doanh hiện tại")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy cấu hình thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền truy cập")
    })
    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<AutoRetrySettingsResponse>> getSettings(Authentication authentication) {
        AutoRetrySettingsResponse settings = settingsService.getSettings(authentication.getName());
        return ResponseEntity.ok(ApiResponse.<AutoRetrySettingsResponse>builder()
                .code(1000)
                .message("Lấy thông tin cấu hình thời hạn và gửi lại thành công")
                .result(settings)
                .build());
    }

    @Operation(summary = "Cập nhật cấu hình thời hạn và tự động gửi lại", description = "Chỉ chủ hộ kinh doanh (VT-01) mới có quyền cập nhật các thông số thời hạn và số lần gửi lại tối đa")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật cấu hình thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu cấu hình không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền cập nhật (chỉ dành cho VT-01)")
    })
    @PutMapping
    @PreAuthorize("hasRole('VT-01')")
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
