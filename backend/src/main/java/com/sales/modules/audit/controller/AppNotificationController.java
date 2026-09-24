package com.sales.modules.audit.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.audit.dto.request.BatchUpdateNotificationSettingsRequest;
import com.sales.modules.audit.dto.request.NotificationFilterRequest;
import com.sales.modules.audit.dto.request.UpdateNotificationSettingRequest;
import com.sales.modules.audit.dto.response.AppNotificationResponse;
import com.sales.modules.audit.dto.response.NotificationBadgeCountResponse;
import com.sales.modules.audit.dto.response.NotificationSettingItemResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.audit.service.AppNotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class AppNotificationController {

    private final AppNotificationService appNotificationService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<AppNotificationResponse>>> getNotifications(
            Principal principal,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String notificationType,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(required = false) Boolean isClosed,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));

        NotificationFilterRequest filter = NotificationFilterRequest.builder()
                .severity(severity)
                .notificationType(notificationType)
                .isRead(isRead)
                .isClosed(isClosed)
                .search(search)
                .build();

        PageResponse<AppNotificationResponse> result = appNotificationService.getNotifications(
                principal.getName(), filter, safePage, safeSize);

        ApiResponse<PageResponse<AppNotificationResponse>> response = ApiResponse.<PageResponse<AppNotificationResponse>>builder()
                .code(1000)
                .message("Lấy danh sách thông báo thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/badge-count")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<NotificationBadgeCountResponse>> getBadgeCount(Principal principal) {
        NotificationBadgeCountResponse result = appNotificationService.getBadgeCount(principal.getName());
        ApiResponse<NotificationBadgeCountResponse> response = ApiResponse.<NotificationBadgeCountResponse>builder()
                .code(1000)
                .message("Lấy số lượng việc cần xử lý thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationCount(Principal principal) {
        long count = appNotificationService.getUnreadNotificationCount(principal.getName());

        ApiResponse<Long> response = ApiResponse.<Long>builder()
                .code(1000)
                .message("Lấy số lượng thông báo chưa đọc thành công")
                .result(count)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/mark-as-read")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Principal principal,
            @PathVariable String id) {
        appNotificationService.markNotificationAsRead(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Đánh dấu đã đọc thông báo thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/mark-all-as-read")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> markAllAsRead(Principal principal) {
        int updated = appNotificationService.markAllAsRead(principal.getName());
        ApiResponse<Map<String, Integer>> response = ApiResponse.<Map<String, Integer>>builder()
                .code(1000)
                .message("Đã đánh dấu tất cả thông báo là đã đọc")
                .result(Map.of("updatedCount", updated))
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/settings")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<List<NotificationSettingItemResponse>>> getNotificationSettings(Principal principal) {
        List<NotificationSettingItemResponse> result = appNotificationService.getNotificationSettings(principal.getName());
        ApiResponse<List<NotificationSettingItemResponse>> response = ApiResponse.<List<NotificationSettingItemResponse>>builder()
                .code(1000)
                .message("Lấy cấu hình nhận thông báo thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/settings")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> updateNotificationSettings(
            Principal principal,
            @Valid @RequestBody BatchUpdateNotificationSettingsRequest request) {
        appNotificationService.updateNotificationSettingsBatch(principal.getName(), request);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Cập nhật cấu hình nhận thông báo thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/settings/single")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> updateSingleNotificationSetting(
            Principal principal,
            @Valid @RequestBody UpdateNotificationSettingRequest request) {
        appNotificationService.updateNotificationSetting(principal.getName(), request);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Cập nhật cấu hình nhận thông báo thành công")
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync-reminders")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> syncReminders(Principal principal) {
        int count = appNotificationService.syncReminders(principal.getName());
        ApiResponse<Map<String, Integer>> response = ApiResponse.<Map<String, Integer>>builder()
                .code(1000)
                .message("Đồng bộ danh sách cảnh báo thành công")
                .result(Map.of("syncedCount", count))
                .build();
        return ResponseEntity.ok(response);
    }
}
