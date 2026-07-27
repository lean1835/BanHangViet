package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.CloseShiftRequest;
import com.sales.dto.request.OpenShiftRequest;
import com.sales.dto.response.ShiftResponse;
import com.sales.service.interfaces.ShiftService;
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
public class ShiftController {

    private final ShiftService shiftService;

    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<ShiftResponse>> openShift(
            Principal principal,
            @Valid @RequestBody OpenShiftRequest request) {
        ShiftResponse result = shiftService.openShift(principal.getName(), request);
        ApiResponse<ShiftResponse> response = ApiResponse.<ShiftResponse>builder()
                .code(1000)
                .message("Mở ca bán hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<ShiftResponse>> getActiveShift(Principal principal) {
        ShiftResponse result = shiftService.getActiveShift(principal.getName());
        ApiResponse<ShiftResponse> response = ApiResponse.<ShiftResponse>builder()
                .code(1000)
                .message("Lấy ca bán hàng hoạt động thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<ShiftResponse>> closeShift(
            Principal principal,
            @PathVariable("id") String id,
            @Valid @RequestBody CloseShiftRequest request) {
        ShiftResponse result = shiftService.closeShift(principal.getName(), id, request);
        ApiResponse<ShiftResponse> response = ApiResponse.<ShiftResponse>builder()
                .code(1000)
                .message("Đóng ca bán hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<ShiftResponse>>> getShiftsHistory(Principal principal) {
        List<ShiftResponse> result = shiftService.getShiftsHistory(principal.getName());
        ApiResponse<List<ShiftResponse>> response = ApiResponse.<List<ShiftResponse>>builder()
                .code(1000)
                .message("Lấy lịch sử ca bán hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
