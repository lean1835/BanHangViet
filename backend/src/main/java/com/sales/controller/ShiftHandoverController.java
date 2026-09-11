package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.ShiftHandoverRequest;
import com.sales.dto.response.ShiftHandoverResponse;
import com.sales.dto.response.ShiftHandoverSummaryResponse;
import com.sales.dto.response.ShiftStagesSummaryResponse;
import com.sales.service.interfaces.ShiftHandoverService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/shifts")
@RequiredArgsConstructor
public class ShiftHandoverController {

    private final ShiftHandoverService shiftHandoverService;

    @GetMapping("/handover/summary")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<ShiftHandoverSummaryResponse>> getHandoverSummary(Principal principal) {
        ShiftHandoverSummaryResponse result = shiftHandoverService.getHandoverSummary(principal.getName());
        ApiResponse<ShiftHandoverSummaryResponse> response = ApiResponse.<ShiftHandoverSummaryResponse>builder()
                .code(1000)
                .message("Lấy thông tin tóm tắt bàn giao ca thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/handover")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<ShiftHandoverResponse>> performShiftHandover(
            Principal principal,
            @Valid @RequestBody ShiftHandoverRequest request) {
        ShiftHandoverResponse result = shiftHandoverService.performShiftHandover(principal.getName(), request);
        ApiResponse<ShiftHandoverResponse> response = ApiResponse.<ShiftHandoverResponse>builder()
                .code(1000)
                .message("Bàn giao ca thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/handovers")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<ShiftHandoverResponse>>> getHandoversByShiftId(
            Principal principal,
            @PathVariable("id") String id) {
        List<ShiftHandoverResponse> result = shiftHandoverService.getHandoversByShiftId(principal.getName(), id);
        ApiResponse<List<ShiftHandoverResponse>> response = ApiResponse.<List<ShiftHandoverResponse>>builder()
                .code(1000)
                .message("Lấy danh sách bàn giao ca thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/stages-summary")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<ShiftStagesSummaryResponse>> getShiftStagesSummary(
            Principal principal,
            @PathVariable("id") String id) {
        ShiftStagesSummaryResponse result = shiftHandoverService.getShiftStagesSummary(principal.getName(), id);
        ApiResponse<ShiftStagesSummaryResponse> response = ApiResponse.<ShiftStagesSummaryResponse>builder()
                .code(1000)
                .message("Lấy báo cáo chặng ca thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
