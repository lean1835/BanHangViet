package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.AnomalyAlertFilterRequest;
import com.sales.dto.request.ReviewAnomalyAlertRequest;
import com.sales.dto.request.ScanAnomalyRequest;
import com.sales.dto.request.UpdateAnomalyRuleRequest;
import com.sales.dto.response.*;
import com.sales.service.interfaces.AnomalyDetectionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/anomaly-alerts")
@RequiredArgsConstructor
public class AnomalyAlertController {

    private final AnomalyDetectionService anomalyDetectionService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<PageResponse<AnomalyAlertResponse>>> getAnomalyAlerts(
            Principal principal,
            @ModelAttribute AnomalyAlertFilterRequest filter,
            HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        PageResponse<AnomalyAlertResponse> result = anomalyDetectionService.getAnomalyAlerts(principal.getName(), filter, clientIp, userAgent);

        ApiResponse<PageResponse<AnomalyAlertResponse>> response = ApiResponse.<PageResponse<AnomalyAlertResponse>>builder()
                .code(1000)
                .message("Lấy danh sách cảnh báo thao tác bất thường thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<AnomalyAlertSummaryResponse>> getSummary(
            Principal principal,
            @RequestParam(value = "date", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        AnomalyAlertSummaryResponse result = anomalyDetectionService.getSummary(principal.getName(), date);

        ApiResponse<AnomalyAlertSummaryResponse> response = ApiResponse.<AnomalyAlertSummaryResponse>builder()
                .code(1000)
                .message("Lấy tổng quan cảnh báo thao tác bất thường thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<AnomalyAlertResponse>> getAlertById(
            Principal principal,
            @PathVariable("id") String alertId) {
        AnomalyAlertResponse result = anomalyDetectionService.getAlertById(principal.getName(), alertId);

        ApiResponse<AnomalyAlertResponse> response = ApiResponse.<AnomalyAlertResponse>builder()
                .code(1000)
                .message("Lấy chi tiết cảnh báo thao tác bất thường thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/scan")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<ScanAnomalyResultResponse>> scanAnomalies(
            Principal principal,
            @RequestBody(required = false) ScanAnomalyRequest scanRequest,
            HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        LocalDate scanDate = (scanRequest != null && scanRequest.getScanDate() != null) ? scanRequest.getScanDate() : LocalDate.now();

        ScanAnomalyResultResponse result = anomalyDetectionService.scanAnomalies(principal.getName(), scanDate, clientIp, userAgent);

        ApiResponse<ScanAnomalyResultResponse> response = ApiResponse.<ScanAnomalyResultResponse>builder()
                .code(1000)
                .message(result.getSummaryMessage())
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<AnomalyAlertResponse>> reviewAlert(
            Principal principal,
            @PathVariable("id") String alertId,
            @Valid @RequestBody ReviewAnomalyAlertRequest reviewRequest,
            HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        AnomalyAlertResponse result = anomalyDetectionService.reviewAlert(principal.getName(), alertId, reviewRequest, clientIp, userAgent);

        ApiResponse<AnomalyAlertResponse> response = ApiResponse.<AnomalyAlertResponse>builder()
                .code(1000)
                .message("Cập nhật trạng thái xử lý cảnh báo thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/rules")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<List<AnomalyRuleConfigResponse>>> getRuleConfigs(Principal principal) {
        List<AnomalyRuleConfigResponse> result = anomalyDetectionService.getRuleConfigs(principal.getName());

        ApiResponse<List<AnomalyRuleConfigResponse>> response = ApiResponse.<List<AnomalyRuleConfigResponse>>builder()
                .code(1000)
                .message("Lấy danh sách cấu hình quy tắc cảnh báo thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-04')")
    public ResponseEntity<ApiResponse<AnomalyRuleConfigResponse>> updateRuleConfig(
            Principal principal,
            @PathVariable("id") String ruleId,
            @Valid @RequestBody UpdateAnomalyRuleRequest updateRequest,
            HttpServletRequest request) {
        String clientIp = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        AnomalyRuleConfigResponse result = anomalyDetectionService.updateRuleConfig(principal.getName(), ruleId, updateRequest, clientIp, userAgent);

        ApiResponse<AnomalyRuleConfigResponse> response = ApiResponse.<AnomalyRuleConfigResponse>builder()
                .code(1000)
                .message("Cập nhật quy tắc cảnh báo thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
