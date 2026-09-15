package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.TriggerVerificationRequest;
import com.sales.dto.response.BackupVerificationHistoryResponse;
import com.sales.dto.response.BackupVerificationStatusResponse;
import com.sales.dto.response.PageResponse;
import com.sales.service.interfaces.BackupVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/backup-verification")
@RequiredArgsConstructor
public class BackupVerificationController {

    private final BackupVerificationService backupVerificationService;

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<BackupVerificationStatusResponse> getVerificationStatus(Principal principal) {
        BackupVerificationStatusResponse response = backupVerificationService.getVerificationStatus(principal.getName());
        return ApiResponse.<BackupVerificationStatusResponse>builder()
                .code(1000)
                .message("Lấy tình trạng kiểm chứng bản sao lưu thành công")
                .result(response)
                .build();
    }

    @GetMapping("/histories")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<PageResponse<BackupVerificationHistoryResponse>> getVerificationHistories(
            Principal principal,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        PageResponse<BackupVerificationHistoryResponse> response = backupVerificationService.getVerificationHistories(principal.getName(), page, size);
        return ApiResponse.<PageResponse<BackupVerificationHistoryResponse>>builder()
                .code(1000)
                .message("Lấy danh sách lịch sử thử phục hồi thành công")
                .result(response)
                .build();
    }

    @PostMapping("/trigger")
    @PreAuthorize("hasAnyRole('VT-01', 'OWNER')")
    public ApiResponse<BackupVerificationHistoryResponse> triggerVerification(
            Principal principal,
            @jakarta.validation.Valid @RequestBody(required = false) TriggerVerificationRequest request) {
        BackupVerificationHistoryResponse response = backupVerificationService.triggerVerification(principal.getName(), request);
        return ApiResponse.<BackupVerificationHistoryResponse>builder()
                .code(1000)
                .message("Chạy thử phục hồi bản sao lưu vào môi trường tạm thành công. Dữ liệu toàn vẹn.")
                .result(response)
                .build();
    }
}
