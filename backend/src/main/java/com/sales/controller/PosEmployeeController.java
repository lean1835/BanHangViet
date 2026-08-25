package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.AssignPosEmployeeRequest;
import com.sales.dto.response.PosEmployeeResponse;
import com.sales.service.interfaces.PosEmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/points-of-sale/{posId}/employees")
@RequiredArgsConstructor
public class PosEmployeeController {

    private final PosEmployeeService posEmployeeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<PosEmployeeResponse>>> getEmployeesByPos(
            Principal principal,
            @PathVariable String posId) {

        List<PosEmployeeResponse> result = posEmployeeService.getEmployeesByPos(principal.getName(), posId);
        ApiResponse<List<PosEmployeeResponse>> response = ApiResponse.<List<PosEmployeeResponse>>builder()
                .code(1000)
                .message("Lấy danh sách nhân viên thuộc điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/assign")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<List<PosEmployeeResponse>>> assignEmployeesToPos(
            Principal principal,
            @PathVariable String posId,
            @Valid @RequestBody AssignPosEmployeeRequest request) {

        List<PosEmployeeResponse> result = posEmployeeService.assignEmployeesToPos(principal.getName(), posId, request);
        ApiResponse<List<PosEmployeeResponse>> response = ApiResponse.<List<PosEmployeeResponse>>builder()
                .code(1000)
                .message("Gán nhân viên vào điểm bán thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> unassignEmployeeFromPos(
            Principal principal,
            @PathVariable String posId,
            @PathVariable String userId) {

        posEmployeeService.unassignEmployeeFromPos(principal.getName(), posId, userId);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Gỡ nhân viên khỏi điểm bán thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
