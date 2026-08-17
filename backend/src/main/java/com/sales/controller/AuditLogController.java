package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.ActivityLogFilterRequest;
import com.sales.dto.response.ActivityLogResponse;
import com.sales.dto.response.AuditIntegrityResponse;
import com.sales.dto.response.PageResponse;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.service.interfaces.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<PageResponse<ActivityLogResponse>>> getAuditLogs(
            Principal principal,
            @ModelAttribute ActivityLogFilterRequest filter,
            HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        PageResponse<ActivityLogResponse> result = auditLogService.getAuditLogs(principal.getName(), filter, clientIp, userAgent);

        ApiResponse<PageResponse<ActivityLogResponse>> response = ApiResponse.<PageResponse<ActivityLogResponse>>builder()
                .code(1000)
                .message("Lấy danh sách nhật ký kiểm toán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify-integrity")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<AuditIntegrityResponse>> verifyIntegrity(Principal principal) {
        AuditIntegrityResponse result = auditLogService.verifyIntegrity(principal.getName());

        ApiResponse<AuditIntegrityResponse> response = ApiResponse.<AuditIntegrityResponse>builder()
                .code(1000)
                .message(result.isValid() ? "Chuỗi kiểm tra Hash Chain toàn vẹn và hợp lệ" : "Phát hiện dữ liệu nhật ký kiểm toán có dấu hiệu bị can thiệp trái phép")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<byte[]> exportAuditLogs(
            Principal principal,
            @ModelAttribute ActivityLogFilterRequest filter,
            HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        byte[] excelContent = auditLogService.exportAuditLogsToExcel(principal.getName(), filter, clientIp, userAgent);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=nhat_ky_kiem_toan.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelContent);
    }

    @RequestMapping(value = "/**", method = {RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.PATCH})
    public ResponseEntity<Void> blockModification() {
        throw new AppException(ErrorCode.AUDIT_LOG_IMMUTABLE);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
