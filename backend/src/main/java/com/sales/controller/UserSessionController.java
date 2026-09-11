package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.RevokeAllSessionsRequest;
import com.sales.dto.request.RevokeSessionRequest;
import com.sales.dto.request.UpdateSessionSettingsRequest;
import com.sales.dto.response.SessionSettingsResponse;
import com.sales.dto.response.UserSessionResponse;
import com.sales.service.interfaces.UserSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Tag(name = "User Session Management", description = "APIs quản lý phiên đăng nhập và đăng xuất từ xa (NCL-01-CN-007)")
public class UserSessionController {

    private final UserSessionService userSessionService;

    @GetMapping
    @Operation(summary = "Xem danh sách phiên đang hoạt động",
            description = "Chủ hộ xem được toàn bộ phiên trong hộ; Nhân viên/Kế toán chỉ xem được phiên của chính mình")
    public ResponseEntity<ApiResponse<List<UserSessionResponse>>> getSessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<UserSessionResponse> sessions = userSessionService.getSessions(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.<List<UserSessionResponse>>builder()
                .code(1000)
                .message("Lấy danh sách phiên đăng nhập thành công")
                .result(sessions)
                .build());
    }

    @PostMapping("/{sessionId}/revoke")
    @Operation(summary = "Đăng xuất từ xa một phiên làm việc",
            description = "Chủ hộ có thể đăng xuất phiên bất kỳ trong hộ; Nhân viên chỉ có thể tự đăng xuất phiên của mình")
    public ResponseEntity<ApiResponse<Void>> revokeSession(
            @PathVariable String sessionId,
            @RequestBody(required = false) @Valid RevokeSessionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String reason = request != null ? request.getReason() : null;
        userSessionService.revokeSession(sessionId, reason, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Đăng xuất phiên làm việc từ xa thành công")
                .build());
    }

    @PostMapping("/users/{userId}/revoke-all")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Đăng xuất toàn bộ phiên của một người dùng",
            description = "Chủ hộ đăng xuất toàn bộ phiên làm việc của nhân viên trong hộ")
    public ResponseEntity<ApiResponse<Void>> revokeAllSessionsForUser(
            @PathVariable String userId,
            @RequestBody(required = false) @Valid RevokeAllSessionsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String reason = request != null ? request.getReason() : null;
        userSessionService.revokeAllSessionsForUser(userId, reason, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Đăng xuất toàn bộ phiên làm việc của người dùng thành công")
                .build());
    }

    @GetMapping("/settings")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Lấy cấu hình thời gian tự hết hạn phiên của hộ",
            description = "Chỉ chủ hộ (VT-01) mới có quyền truy cập cấu hình này")
    public ResponseEntity<ApiResponse<SessionSettingsResponse>> getSessionSettings(
            @AuthenticationPrincipal UserDetails userDetails) {
        SessionSettingsResponse settings = userSessionService.getSessionSettings(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.<SessionSettingsResponse>builder()
                .code(1000)
                .message("Lấy cấu hình phiên đăng nhập thành công")
                .result(settings)
                .build());
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('VT-01')")
    @Operation(summary = "Cập nhật thời gian tự hết hạn phiên của hộ",
            description = "Chủ hộ cài đặt thời gian chờ tối thiểu 5 phút và tối đa 1440 phút (24h)")
    public ResponseEntity<ApiResponse<SessionSettingsResponse>> updateSessionSettings(
            @Valid @RequestBody UpdateSessionSettingsRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        SessionSettingsResponse settings = userSessionService.updateSessionSettings(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.<SessionSettingsResponse>builder()
                .code(1000)
                .message("Cập nhật thời gian tự hết hạn phiên thành công")
                .result(settings)
                .build());
    }
}
