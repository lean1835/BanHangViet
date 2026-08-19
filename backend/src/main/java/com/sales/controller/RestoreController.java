package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.RestoreDataRequest;
import com.sales.dto.response.BackupHistoryResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.RestoreHistoryResponse;
import com.sales.dto.response.RestorePreviewResponse;
import com.sales.dto.response.RestoreResultResponse;
import com.sales.service.interfaces.RestoreService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/restore")
@RequiredArgsConstructor
public class RestoreController {

    private final RestoreService restoreService;

    @GetMapping("/backups")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<List<BackupHistoryResponse>> getAvailableBackupsForRestore(Principal principal) {
        List<BackupHistoryResponse> response = restoreService.getAvailableBackupsForRestore(principal.getName());
        return ApiResponse.<List<BackupHistoryResponse>>builder()
                .code(1000)
                .message("Lấy danh sách bản sao lưu khả dụng để phục hồi thành công")
                .result(response)
                .build();
    }

    @GetMapping("/preview/{backupHistoryId}")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<RestorePreviewResponse> previewBackupForRestore(
            Principal principal,
            @PathVariable String backupHistoryId) {
        RestorePreviewResponse response = restoreService.previewBackupForRestore(principal.getName(), backupHistoryId);
        return ApiResponse.<RestorePreviewResponse>builder()
                .code(1000)
                .message("Lấy thông tin xem trước bản sao lưu thành công")
                .result(response)
                .build();
    }

    @PostMapping("/execute")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<RestoreResultResponse> executeRestore(
            Principal principal,
            @Valid @RequestBody RestoreDataRequest request,
            HttpServletRequest servletRequest) {
        String clientIp = extractClientIp(servletRequest);
        String userAgent = servletRequest.getHeader("User-Agent");

        RestoreResultResponse response = restoreService.executeRestore(principal.getName(), request, clientIp, userAgent);
        return ApiResponse.<RestoreResultResponse>builder()
                .code(1000)
                .message("Phục hồi dữ liệu từ bản sao lưu thành công")
                .result(response)
                .build();
    }

    @GetMapping("/histories")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<PageResponse<RestoreHistoryResponse>> getRestoreHistories(
            Principal principal,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        PageResponse<RestoreHistoryResponse> response = restoreService.getRestoreHistories(principal.getName(), page, size);
        return ApiResponse.<PageResponse<RestoreHistoryResponse>>builder()
                .code(1000)
                .message("Lấy danh sách lịch sử phục hồi thành công")
                .result(response)
                .build();
    }

    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
