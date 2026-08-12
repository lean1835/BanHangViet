package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.UpdateHouseholdRequest;
import com.sales.dto.response.HouseholdResponse;
import com.sales.service.interfaces.HouseholdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/households")
@RequiredArgsConstructor
public class HouseholdController {

    private final HouseholdService householdService;

    @GetMapping("/my-household")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<HouseholdResponse>> getMyHousehold(Principal principal) {
        HouseholdResponse result = householdService.getMyHousehold(principal.getName());
        ApiResponse<HouseholdResponse> response = ApiResponse.<HouseholdResponse>builder()
                .code(1000)
                .message("Lấy thông tin hộ kinh doanh thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/my-household")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<HouseholdResponse>> updateMyHousehold(
            Principal principal,
            @Valid @RequestBody UpdateHouseholdRequest request) {
        HouseholdResponse result = householdService.updateMyHousehold(principal.getName(), request);
        ApiResponse<HouseholdResponse> response = ApiResponse.<HouseholdResponse>builder()
                .code(1000)
                .message("Cập nhật thông tin hộ kinh doanh thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
