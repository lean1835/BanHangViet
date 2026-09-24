package com.sales.modules.platform.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.platform.dto.request.AssignSubscriptionRequest;
import com.sales.modules.platform.dto.request.CreateServicePackageRequest;
import com.sales.modules.platform.dto.request.UpdateServicePackageRequest;
import com.sales.modules.platform.dto.response.HouseholdSubscriptionResponse;
import com.sales.modules.platform.dto.response.HouseholdUsageStatsResponse;
import com.sales.modules.platform.dto.response.ServicePackageResponse;
import com.sales.modules.platform.service.ServicePackageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/platform")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VT-04')")
public class PlatformPackageController {

    private final ServicePackageService servicePackageService;

    @GetMapping("/packages")
    public ResponseEntity<ApiResponse<List<ServicePackageResponse>>> getAllPackages() {
        List<ServicePackageResponse> result = servicePackageService.getAllPackages();
        return ResponseEntity.ok(ApiResponse.<List<ServicePackageResponse>>builder()
                .code(1000)
                .message("Lấy danh sách gói dịch vụ thành công")
                .result(result)
                .build());
    }

    @GetMapping("/packages/{id}")
    public ResponseEntity<ApiResponse<ServicePackageResponse>> getPackageById(@PathVariable String id) {
        ServicePackageResponse result = servicePackageService.getPackageById(id);
        return ResponseEntity.ok(ApiResponse.<ServicePackageResponse>builder()
                .code(1000)
                .message("Lấy thông tin gói dịch vụ thành công")
                .result(result)
                .build());
    }

    @PostMapping("/packages")
    public ResponseEntity<ApiResponse<ServicePackageResponse>> createPackage(
            Principal principal,
            @Valid @RequestBody CreateServicePackageRequest request) {

        ServicePackageResponse result = servicePackageService.createPackage(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<ServicePackageResponse>builder()
                .code(1000)
                .message("Tạo gói dịch vụ mới thành công")
                .result(result)
                .build());
    }

    @PutMapping("/packages/{id}")
    public ResponseEntity<ApiResponse<ServicePackageResponse>> updatePackage(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateServicePackageRequest request) {

        ServicePackageResponse result = servicePackageService.updatePackage(principal.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.<ServicePackageResponse>builder()
                .code(1000)
                .message("Cập nhật gói dịch vụ thành công")
                .result(result)
                .build());
    }

    @DeleteMapping("/packages/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePackage(
            Principal principal,
            @PathVariable String id) {

        servicePackageService.deletePackage(principal.getName(), id);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa hoặc ngưng hoạt động gói dịch vụ thành công")
                .build());
    }

    @PostMapping("/households/{householdId}/subscriptions")
    public ResponseEntity<ApiResponse<HouseholdSubscriptionResponse>> assignSubscription(
            Principal principal,
            @PathVariable String householdId,
            @Valid @RequestBody AssignSubscriptionRequest request) {

        HouseholdSubscriptionResponse result = servicePackageService.assignSubscription(
                principal.getName(), householdId, request);

        return ResponseEntity.ok(ApiResponse.<HouseholdSubscriptionResponse>builder()
                .code(1000)
                .message("Gán gói dịch vụ cho hộ kinh doanh thành công")
                .result(result)
                .build());
    }

    @GetMapping("/households/{householdId}/subscription-usage")
    public ResponseEntity<ApiResponse<HouseholdUsageStatsResponse>> getHouseholdUsageStats(
            @PathVariable String householdId) {

        HouseholdUsageStatsResponse result = servicePackageService.getUsageStats(householdId);
        return ResponseEntity.ok(ApiResponse.<HouseholdUsageStatsResponse>builder()
                .code(1000)
                .message("Lấy mức sử dụng và hạn mức của hộ thành công")
                .result(result)
                .build());
    }
}
