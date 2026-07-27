package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.CreateCustomerRequest;
import com.viet.sales.dto.request.UpdateCustomerRequest;
import com.viet.sales.dto.response.CustomerResponse;
import com.viet.sales.service.interfaces.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    @PostMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            Principal principal,
            @Valid @RequestBody CreateCustomerRequest request) {
        CustomerResponse result = customerService.createCustomer(principal.getName(), request);
        ApiResponse<CustomerResponse> response = ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Tạo khách hàng thân thiết thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateCustomerRequest request) {
        CustomerResponse result = customerService.updateCustomer(principal.getName(), id, request);
        ApiResponse<CustomerResponse> response = ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Cập nhật thông tin khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomer(
            Principal principal,
            @PathVariable String id) {
        CustomerResponse result = customerService.getCustomer(principal.getName(), id);
        ApiResponse<CustomerResponse> response = ApiResponse.<CustomerResponse>builder()
                .code(1000)
                .message("Lấy thông tin khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02', 'VT-03')")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> getCustomers(Principal principal) {
        List<CustomerResponse> result = customerService.getCustomers(principal.getName());
        ApiResponse<List<CustomerResponse>> response = ApiResponse.<List<CustomerResponse>>builder()
                .code(1000)
                .message("Lấy danh sách khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('VT-01', 'VT-02')")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> searchCustomers(
            Principal principal,
            @RequestParam String query) {
        List<CustomerResponse> result = customerService.searchCustomers(principal.getName(), query);
        ApiResponse<List<CustomerResponse>> response = ApiResponse.<List<CustomerResponse>>builder()
                .code(1000)
                .message("Tìm kiếm khách hàng thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('VT-01')")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(
            Principal principal,
            @PathVariable String id) {
        customerService.deleteCustomer(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa khách hàng thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
