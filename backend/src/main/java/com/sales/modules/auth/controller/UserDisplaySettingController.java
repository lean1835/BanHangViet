package com.sales.modules.auth.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.pos.dto.request.ToggleSimpleModeRequest;
import com.sales.modules.auth.dto.request.UpdateUserDisplaySettingRequest;
import com.sales.modules.pos.dto.response.PosSimplifiedLayoutResponse;
import com.sales.modules.auth.dto.response.UserDisplaySettingResponse;
import com.sales.modules.auth.service.UserDisplaySettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/profile/display-settings")
@RequiredArgsConstructor
@Tag(name = "User Display Settings Controller", description = "Quản lý chế độ hiển thị chữ lớn, nút to và thao tác đơn giản theo tài khoản (NCL-19-CN-001)")
public class UserDisplaySettingController {

    private final UserDisplaySettingService userDisplaySettingService;

    @Operation(summary = "Xem cấu hình hiển thị cá nhân", description = "Lấy cấu hình hiển thị (cỡ chữ, kích thước nút, chế độ đơn giản) của tài khoản hiện tại")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy cấu hình hiển thị thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
    @GetMapping
    public ResponseEntity<ApiResponse<UserDisplaySettingResponse>> getDisplaySettings(Principal principal) {
        UserDisplaySettingResponse result = userDisplaySettingService.getDisplaySetting(principal.getName());
        ApiResponse<UserDisplaySettingResponse> response = ApiResponse.<UserDisplaySettingResponse>builder()
                .code(1000)
                .message("Lấy cấu hình hiển thị người dùng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Cập nhật cấu hình hiển thị cá nhân", description = "Cho phép người dùng tùy chỉnh cỡ chữ, kích thước nút, độ tương phản cao, nhãn chữ và chế độ đơn giản")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Cập nhật cấu hình hiển thị thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu cấu hình không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
    @PutMapping
    public ResponseEntity<ApiResponse<UserDisplaySettingResponse>> updateDisplaySettings(
            Principal principal,
            @Valid @RequestBody UpdateUserDisplaySettingRequest request) {
        UserDisplaySettingResponse result = userDisplaySettingService.updateDisplaySetting(principal.getName(), request);
        ApiResponse<UserDisplaySettingResponse> response = ApiResponse.<UserDisplaySettingResponse>builder()
                .code(1000)
                .message("Cập nhật cấu hình hiển thị thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Bật/Tắt nhanh chế độ chữ lớn và thao tác đơn giản", description = "Chuyển đổi trạng thái chế độ đơn giản, tự động điều chỉnh tỷ lệ cỡ chữ và nút bấm")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Chuyển đổi trạng thái thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu yêu cầu không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
    @PatchMapping("/toggle-simple-mode")
    public ResponseEntity<ApiResponse<UserDisplaySettingResponse>> toggleSimpleMode(
            Principal principal,
            @Valid @RequestBody ToggleSimpleModeRequest request) {
        UserDisplaySettingResponse result = userDisplaySettingService.toggleSimpleMode(principal.getName(), request);
        String msg = Boolean.TRUE.equals(request.getEnabled())
                ? "Đã bật chế độ chữ lớn và thao tác đơn giản"
                : "Đã tắt chế độ chữ lớn và thao tác đơn giản";
        ApiResponse<UserDisplaySettingResponse> response = ApiResponse.<UserDisplaySettingResponse>builder()
                .code(1000)
                .message(msg)
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Lấy bố cục rút gọn màn hình POS", description = "Trả về danh mục các chức năng chính (Primary) và chức năng phụ (More Actions) chuẩn hóa cho màn hình bán hàng")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy bố cục màn hình POS thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực")
    })
    @GetMapping("/pos-layout")
    public ResponseEntity<ApiResponse<PosSimplifiedLayoutResponse>> getPosLayout(Principal principal) {
        PosSimplifiedLayoutResponse result = userDisplaySettingService.getSimplifiedPosLayout(principal.getName());
        ApiResponse<PosSimplifiedLayoutResponse> response = ApiResponse.<PosSimplifiedLayoutResponse>builder()
                .code(1000)
                .message("Lấy bố cục màn hình POS thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
