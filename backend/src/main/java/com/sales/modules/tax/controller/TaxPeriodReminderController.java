package com.sales.modules.tax.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.tax.dto.request.UpdateTaxReminderSettingsRequest;
import com.sales.modules.tax.dto.response.TaxPeriodReminderResponse;
import com.sales.modules.tax.dto.response.TaxReminderScanResultResponse;
import com.sales.modules.tax.dto.response.TaxReminderSettingsResponse;
import com.sales.modules.tax.service.TaxReminderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tax-periods")
@RequiredArgsConstructor
public class TaxPeriodReminderController {

    private final TaxReminderService taxReminderService;

    @GetMapping("/reminder-settings")
    @PreAuthorize("hasRole('VT-01') or (hasRole('VT-03') and @accountantSecurityService.hasScope(authentication, 'TAX_DECLARATION'))")
    public ResponseEntity<ApiResponse<TaxReminderSettingsResponse>> getReminderSettings(Principal principal) {
        TaxReminderSettingsResponse result = taxReminderService.getReminderSettings(principal.getName());
        ApiResponse<TaxReminderSettingsResponse> response = ApiResponse.<TaxReminderSettingsResponse>builder()
                .code(1000)
                .message("Lấy cấu hình nhắc lịch nộp tờ khai thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/reminder-settings")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<TaxReminderSettingsResponse>> updateReminderSettings(
            Principal principal,
            @Valid @RequestBody UpdateTaxReminderSettingsRequest request) {
        TaxReminderSettingsResponse result = taxReminderService.updateReminderSettings(principal.getName(), request);
        ApiResponse<TaxReminderSettingsResponse> response = ApiResponse.<TaxReminderSettingsResponse>builder()
                .code(1000)
                .message("Cập nhật cấu hình nhắc lịch nộp tờ khai thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reminders")
    @PreAuthorize("hasRole('VT-01') or (hasRole('VT-03') and @accountantSecurityService.hasScope(authentication, 'TAX_DECLARATION'))")
    public ResponseEntity<ApiResponse<List<TaxPeriodReminderResponse>>> getActiveReminders(Principal principal) {
        List<TaxPeriodReminderResponse> result = taxReminderService.getActiveReminders(principal.getName());
        ApiResponse<List<TaxPeriodReminderResponse>> response = ApiResponse.<List<TaxPeriodReminderResponse>>builder()
                .code(1000)
                .message("Lấy danh sách nhắc lịch nộp tờ khai thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reminders/trigger-scan")
    @PreAuthorize("hasRole('VT-01') or (hasRole('VT-03') and @accountantSecurityService.hasScope(authentication, 'TAX_DECLARATION'))")
    public ResponseEntity<ApiResponse<TaxReminderScanResultResponse>> triggerScanReminders(Principal principal) {
        TaxReminderScanResultResponse result = taxReminderService.triggerScanReminders(principal.getName());
        ApiResponse<TaxReminderScanResultResponse> response = ApiResponse.<TaxReminderScanResultResponse>builder()
                .code(1000)
                .message("Quét và cập nhật nhắc lịch nộp tờ khai thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{periodId}/mark-exported")
    @PreAuthorize("hasRole('VT-01') or (hasRole('VT-03') and @accountantSecurityService.hasScope(authentication, 'TAX_DECLARATION'))")
    public ResponseEntity<ApiResponse<Void>> markDeclarationAsExported(
            Principal principal,
            @PathVariable String periodId) {
        taxReminderService.markDeclarationAsExported(principal.getName(), periodId);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Đánh dấu đã xuất tờ khai thuế thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
