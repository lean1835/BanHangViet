package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.PrintSettingRequest;
import com.viet.sales.dto.response.PrintSettingResponse;
import com.viet.sales.service.interfaces.PrintSettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/print-settings")
@RequiredArgsConstructor
public class PrintSettingController {

    private final PrintSettingService printSettingService;

    @GetMapping("/my-setting")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'OWNER', 'STAFF', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PrintSettingResponse>> getMyPrintSetting(Principal principal) {
        PrintSettingResponse result = printSettingService.getMyPrintSetting(principal.getName());
        ApiResponse<PrintSettingResponse> response = ApiResponse.<PrintSettingResponse>builder()
                .code(1000)
                .message("Lấy cấu hình máy in thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/my-setting")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03', 'OWNER', 'STAFF', 'ACCOUNTANT')")
    public ResponseEntity<ApiResponse<PrintSettingResponse>> updateMyPrintSetting(
            Principal principal,
            @Valid @RequestBody PrintSettingRequest request) {
        PrintSettingResponse result = printSettingService.updateMyPrintSetting(principal.getName(), request);
        ApiResponse<PrintSettingResponse> response = ApiResponse.<PrintSettingResponse>builder()
                .code(1000)
                .message("Lưu cấu hình máy in thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
