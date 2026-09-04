package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.UpdateBackupConfigRequest;
import com.sales.dto.response.BackupConfigResponse;
import com.sales.dto.response.BackupHistoryResponse;
import com.sales.dto.response.BackupStatusOverviewResponse;
import com.sales.dto.response.PageResponse;
import com.sales.service.interfaces.AutoBackupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/auto-backup")
@RequiredArgsConstructor
public class AutoBackupController {

    private final AutoBackupService autoBackupService;

    @GetMapping("/config")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<BackupConfigResponse> getBackupConfig(Principal principal) {
        BackupConfigResponse response = autoBackupService.getBackupConfig(principal.getName());
        return ApiResponse.<BackupConfigResponse>builder()
                .code(1000)
                .message("Lấy cấu hình sao lưu tự động thành công")
                .result(response)
                .build();
    }

    @PutMapping("/config")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<BackupConfigResponse> updateBackupConfig(
            Principal principal,
            @Valid @RequestBody UpdateBackupConfigRequest request) {
        BackupConfigResponse response = autoBackupService.updateBackupConfig(principal.getName(), request);
        return ApiResponse.<BackupConfigResponse>builder()
                .code(1000)
                .message("Cập nhật cấu hình sao lưu tự động thành công")
                .result(response)
                .build();
    }

    @GetMapping("/histories")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<PageResponse<BackupHistoryResponse>> getBackupHistories(
            Principal principal,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        PageResponse<BackupHistoryResponse> response = autoBackupService.getBackupHistories(principal.getName(), page, size);
        return ApiResponse.<PageResponse<BackupHistoryResponse>>builder()
                .code(1000)
                .message("Lấy danh sách lịch sử sao lưu thành công")
                .result(response)
                .build();
    }

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<BackupHistoryResponse> triggerManualBackup(Principal principal) {
        BackupHistoryResponse response = autoBackupService.triggerManualBackup(principal.getName());
        return ApiResponse.<BackupHistoryResponse>builder()
                .code(1000)
                .message("Kích hoạt sao lưu dữ liệu thủ công thành công")
                .result(response)
                .build();
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<BackupStatusOverviewResponse> getBackupStatusOverview(Principal principal) {
        BackupStatusOverviewResponse response = autoBackupService.getBackupOverview(principal.getName());
        return ApiResponse.<BackupStatusOverviewResponse>builder()
                .code(1000)
                .message("Lấy tổng quan trạng thái sao lưu thành công")
                .result(response)
                .build();
    }
}
