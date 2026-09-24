package com.sales.modules.platform.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.platform.dto.response.HouseholdUsageStatsResponse;
import com.sales.modules.platform.service.ServicePackageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1/households")
@RequiredArgsConstructor
public class HouseholdSubscriptionController {

    private final ServicePackageService servicePackageService;

    @GetMapping("/my-subscription-usage")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<HouseholdUsageStatsResponse>> getMySubscriptionUsage(Principal principal) {
        HouseholdUsageStatsResponse result = servicePackageService.getMySubscriptionUsage(principal.getName());
        return ResponseEntity.ok(ApiResponse.<HouseholdUsageStatsResponse>builder()
                .code(1000)
                .message("Lấy thông tin gói dịch vụ và mức sử dụng thành công")
                .result(result)
                .build());
    }
}
