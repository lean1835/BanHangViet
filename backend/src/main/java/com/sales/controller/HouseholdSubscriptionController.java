package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.response.HouseholdUsageStatsResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.ServicePackageService;
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
    private final UserRepository userRepository;

    @GetMapping("/my-subscription-usage")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<HouseholdUsageStatsResponse>> getMySubscriptionUsage(Principal principal) {
        User currentUser = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        HouseholdUsageStatsResponse result = servicePackageService.getUsageStats(household.getId());
        return ResponseEntity.ok(ApiResponse.<HouseholdUsageStatsResponse>builder()
                .code(1000)
                .message("Lấy thông tin gói dịch vụ và mức sử dụng thành công")
                .result(result)
                .build());
    }
}
