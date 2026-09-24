package com.sales.modules.customer.controller;
import com.sales.common.dto.PageResponse;
import com.sales.modules.customer.dto.response.CustomerLoyaltySummaryResponse;
import com.sales.modules.customer.dto.response.LoyaltyProgramConfigResponse;
import com.sales.modules.customer.dto.response.PointTransactionResponse;
import com.sales.modules.order.dto.response.OrderResponse;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.customer.dto.request.AdjustPointsRequest;
import com.sales.modules.customer.dto.request.ApplyLoyaltyPointsRequest;
import com.sales.modules.customer.dto.request.LoyaltyProgramConfigRequest;
import com.sales.modules.customer.service.LoyaltyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LoyaltyController {

    private final LoyaltyService loyaltyService;

    @GetMapping("/loyalty-program/config")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<LoyaltyProgramConfigResponse>> getProgramConfig(Principal principal) {
        LoyaltyProgramConfigResponse result = loyaltyService.getProgramConfig(principal.getName());
        return ResponseEntity.ok(ApiResponse.<LoyaltyProgramConfigResponse>builder()
                .code(1000)
                .message("Lấy cấu hình chương trình tích điểm thành công")
                .result(result)
                .build());
    }

    @PutMapping("/loyalty-program/config")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<LoyaltyProgramConfigResponse>> updateProgramConfig(
            Principal principal,
            @Valid @RequestBody LoyaltyProgramConfigRequest request) {
        LoyaltyProgramConfigResponse result = loyaltyService.updateProgramConfig(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.<LoyaltyProgramConfigResponse>builder()
                .code(1000)
                .message("Cập nhật cấu hình chương trình tích điểm thành công")
                .result(result)
                .build());
    }

    @PostMapping("/orders/{orderId}/apply-points")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> applyPointsToOrder(
            Principal principal,
            @PathVariable String orderId,
            @Valid @RequestBody ApplyLoyaltyPointsRequest request) {
        OrderResponse result = loyaltyService.applyPointsToOrder(principal.getName(), orderId, request);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Áp dụng đổi điểm tích lũy thành công")
                .result(result)
                .build());
    }

    @DeleteMapping("/orders/{orderId}/remove-points")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<OrderResponse>> removePointsFromOrder(
            Principal principal,
            @PathVariable String orderId) {
        OrderResponse result = loyaltyService.removePointsFromOrder(principal.getName(), orderId);
        return ResponseEntity.ok(ApiResponse.<OrderResponse>builder()
                .code(1000)
                .message("Hủy áp dụng đổi điểm tích lũy thành công")
                .result(result)
                .build());
    }

    @GetMapping("/customers/{customerId}/loyalty-summary")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<CustomerLoyaltySummaryResponse>> getCustomerLoyaltySummary(
            Principal principal,
            @PathVariable String customerId) {
        CustomerLoyaltySummaryResponse result = loyaltyService.getCustomerLoyaltySummary(principal.getName(), customerId);
        return ResponseEntity.ok(ApiResponse.<CustomerLoyaltySummaryResponse>builder()
                .code(1000)
                .message("Lấy tóm tắt điểm tích lũy khách hàng thành công")
                .result(result)
                .build());
    }

    @GetMapping("/customers/{customerId}/loyalty-transactions")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<PageResponse<PointTransactionResponse>>> getCustomerPointTransactions(
            Principal principal,
            @PathVariable String customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type) {
        PageResponse<PointTransactionResponse> result = loyaltyService.getCustomerPointTransactions(
                principal.getName(), customerId, page, size, type);
        return ResponseEntity.ok(ApiResponse.<PageResponse<PointTransactionResponse>>builder()
                .code(1000)
                .message("Lấy lịch sử biến động điểm thưởng thành công")
                .result(result)
                .build());
    }

    @PostMapping("/customers/{customerId}/adjust-points")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<PointTransactionResponse>> adjustPointsManually(
            Principal principal,
            @PathVariable String customerId,
            @Valid @RequestBody AdjustPointsRequest request) {
        PointTransactionResponse result = loyaltyService.adjustPointsManually(
                principal.getName(), customerId, request);
        return ResponseEntity.ok(ApiResponse.<PointTransactionResponse>builder()
                .code(1000)
                .message("Điều chỉnh điểm thưởng thủ công thành công")
                .result(result)
                .build());
    }
}
