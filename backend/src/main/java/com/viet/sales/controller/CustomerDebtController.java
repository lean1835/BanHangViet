package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.CollectDebtRequest;
import com.viet.sales.dto.response.CustomerDebtResponse;
import com.viet.sales.dto.response.DebtSummaryResponse;
import com.viet.sales.service.interfaces.CustomerDebtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/debts")
@RequiredArgsConstructor
public class CustomerDebtController {

    private final CustomerDebtService customerDebtService;

    @PostMapping("/collect")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<CustomerDebtResponse>> collectDebt(
            Principal principal,
            @Valid @RequestBody CollectDebtRequest request) {
        CustomerDebtResponse result = customerDebtService.collectDebt(principal.getName(), request);
        ApiResponse<CustomerDebtResponse> response = ApiResponse.<CustomerDebtResponse>builder()
                .code(1000)
                .message("Thu nợ khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{customerId}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<CustomerDebtResponse>>> getDebtHistory(
            Principal principal,
            @PathVariable String customerId) {
        List<CustomerDebtResponse> result = customerDebtService.getDebtHistory(principal.getName(), customerId);
        ApiResponse<List<CustomerDebtResponse>> response = ApiResponse.<List<CustomerDebtResponse>>builder()
                .code(1000)
                .message("Lấy lịch sử công nợ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reminders")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<CustomerDebtResponse>>> getDebtReminders(
            Principal principal,
            @RequestParam(required = false) String status) {
        List<CustomerDebtResponse> result = customerDebtService.getDebtReminders(principal.getName(), status);
        ApiResponse<List<CustomerDebtResponse>> response = ApiResponse.<List<CustomerDebtResponse>>builder()
                .code(1000)
                .message("Lấy danh sách nhắc công nợ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-03')")
    public ResponseEntity<ApiResponse<DebtSummaryResponse>> getDebtSummary(Principal principal) {
        DebtSummaryResponse result = customerDebtService.getDebtSummary(principal.getName());
        ApiResponse<DebtSummaryResponse> response = ApiResponse.<DebtSummaryResponse>builder()
                .code(1000)
                .message("Lấy tổng hợp công nợ thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }
}
