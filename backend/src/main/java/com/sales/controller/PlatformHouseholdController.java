package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.LockHouseholdRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PlatformHouseholdSummaryResponse;
import com.sales.service.interfaces.PlatformHouseholdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/platform/households")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VT-04')")
public class PlatformHouseholdController {

    private final PlatformHouseholdService platformHouseholdService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PlatformHouseholdSummaryResponse>>> getHouseholds(
            Principal principal,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {

        PageResponse<PlatformHouseholdSummaryResponse> result = platformHouseholdService.getHouseholds(
                principal.getName(), search, status, page, size);

        return ResponseEntity.ok(ApiResponse.<PageResponse<PlatformHouseholdSummaryResponse>>builder()
                .code(1000)
                .message("Lấy danh sách hộ kinh doanh thành công")
                .result(result)
                .build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlatformHouseholdSummaryResponse>> getHouseholdDetail(
            Principal principal,
            @PathVariable String id) {

        PlatformHouseholdSummaryResponse result = platformHouseholdService.getHouseholdDetail(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<PlatformHouseholdSummaryResponse>builder()
                .code(1000)
                .message("Lấy thông tin chi tiết hộ kinh doanh thành công")
                .result(result)
                .build());
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<PlatformHouseholdSummaryResponse>> lockHousehold(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody LockHouseholdRequest request) {

        PlatformHouseholdSummaryResponse result = platformHouseholdService.lockHousehold(
                principal.getName(), id, request);

        return ResponseEntity.ok(ApiResponse.<PlatformHouseholdSummaryResponse>builder()
                .code(1000)
                .message("Khóa tài khoản hộ kinh doanh thành công")
                .result(result)
                .build());
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<PlatformHouseholdSummaryResponse>> unlockHousehold(
            Principal principal,
            @PathVariable String id) {

        PlatformHouseholdSummaryResponse result = platformHouseholdService.unlockHousehold(
                principal.getName(), id);

        return ResponseEntity.ok(ApiResponse.<PlatformHouseholdSummaryResponse>builder()
                .code(1000)
                .message("Mở khóa tài khoản hộ kinh doanh thành công")
                .result(result)
                .build());
    }
}
