package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.AppNotificationResponse;
import com.sales.dto.response.PageResponse;
import com.sales.service.interfaces.AnnualRevenueTrackingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class AppNotificationController {

    private final AnnualRevenueTrackingService annualRevenueTrackingService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<AppNotificationResponse>>> getNotifications(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<AppNotificationResponse> result = annualRevenueTrackingService.getNotifications(principal.getName(), page, size);
        ApiResponse<PageResponse<AppNotificationResponse>> response = ApiResponse.<PageResponse<AppNotificationResponse>>builder()
                .code(1000)
                .message("Lấy danh sách thông báo thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<Long>> getUnreadNotificationCount(Principal principal) {
        long count = annualRevenueTrackingService.getUnreadNotificationCount(principal.getName());
        ApiResponse<Long> response = ApiResponse.<Long>builder()
                .code(1000)
                .message("Lấy số lượng thông báo chưa đọc thành công")
                .result(count)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/mark-as-read")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            Principal principal,
            @PathVariable String id) {
        annualRevenueTrackingService.markNotificationAsRead(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Đánh dấu đã đọc thông báo thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
