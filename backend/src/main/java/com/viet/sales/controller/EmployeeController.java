package com.viet.sales.controller;

import com.viet.sales.dto.ApiResponse;
import com.viet.sales.dto.request.CreateEmployeeRequest;
import com.viet.sales.dto.request.UpdateEmployeeRequest;
import com.viet.sales.dto.response.EmployeeResponse;
import com.viet.sales.service.interfaces.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VT-01')")
public class EmployeeController {

    private final EmployeeService employeeService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAllEmployees(Principal principal) {
        List<EmployeeResponse> result = employeeService.getAllEmployees(principal.getName());
        ApiResponse<List<EmployeeResponse>> response = ApiResponse.<List<EmployeeResponse>>builder()
                .code(1000)
                .message("Lấy danh sách nhân viên thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            Principal principal,
            @Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeResponse result = employeeService.createEmployee(principal.getName(), request);
        ApiResponse<EmployeeResponse> response = ApiResponse.<EmployeeResponse>builder()
                .code(1000)
                .message("Thêm nhân viên thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            Principal principal,
            @PathVariable String id,
            @Valid @RequestBody UpdateEmployeeRequest request) {
        EmployeeResponse result = employeeService.updateEmployee(principal.getName(), id, request);
        ApiResponse<EmployeeResponse> response = ApiResponse.<EmployeeResponse>builder()
                .code(1000)
                .message("Cập nhật nhân viên thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            Principal principal,
            @PathVariable String id) {
        employeeService.deleteEmployee(principal.getName(), id);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Xóa nhân viên thành công")
                .build();
        return ResponseEntity.ok(response);
    }
}
