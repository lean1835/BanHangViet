package com.sales.modules.platform.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.platform.dto.response.PlatformIncidentResponse;
import com.sales.modules.platform.dto.response.PlatformSystemLogResponse;
import com.sales.modules.platform.service.PlatformSystemLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/platform")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VT-04')")
public class PlatformSystemLogController {

    private final PlatformSystemLogService platformSystemLogService;

    @GetMapping("/system-logs")
    public ResponseEntity<ApiResponse<PageResponse<PlatformSystemLogResponse>>> getPlatformLogs(
            Principal principal,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String householdId,
            @RequestParam(required = false) String eventType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<PlatformSystemLogResponse> result = platformSystemLogService.getPlatformLogs(
                principal.getName(), severity, fromDate, toDate, householdId, eventType, page, size);

        return ResponseEntity.ok(ApiResponse.<PageResponse<PlatformSystemLogResponse>>builder()
                .code(1000)
                .message("Lấy nhật ký hệ thống toàn nền tảng thành công")
                .result(result)
                .build());
    }

    @GetMapping("/system-logs/{id}")
    public ResponseEntity<ApiResponse<PlatformSystemLogResponse>> getLogDetail(
            Principal principal,
            @PathVariable String id) {

        PlatformSystemLogResponse result = platformSystemLogService.getLogDetail(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<PlatformSystemLogResponse>builder()
                .code(1000)
                .message("Lấy chi tiết nhật ký hệ thống thành công")
                .result(result)
                .build());
    }

    @GetMapping("/incidents")
    public ResponseEntity<ApiResponse<List<PlatformIncidentResponse>>> getIncidents(Principal principal) {
        List<PlatformIncidentResponse> result = platformSystemLogService.getIncidents(principal.getName());
        return ResponseEntity.ok(ApiResponse.<List<PlatformIncidentResponse>>builder()
                .code(1000)
                .message("Lấy danh sách sự cố diện rộng thành công")
                .result(result)
                .build());
    }

    @PostMapping("/incidents/{id}/resolve")
    public ResponseEntity<ApiResponse<PlatformIncidentResponse>> resolveIncident(
            Principal principal,
            @PathVariable String id) {

        PlatformIncidentResponse result = platformSystemLogService.resolveIncident(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<PlatformIncidentResponse>builder()
                .code(1000)
                .message("Đóng sự cố diện rộng thành công")
                .result(result)
                .build());
    }
}
