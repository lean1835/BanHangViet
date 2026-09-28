package com.sales.modules.auth.service;
import com.sales.modules.auth.dto.request.CreateEmployeeRequest;
import com.sales.modules.auth.dto.request.UpdateEmployeeRequest;
import com.sales.modules.auth.dto.response.EmployeeResponse;

import java.util.List;
import com.sales.modules.auth.dto.request.AdminResetEmployeePasswordRequest;

public interface EmployeeService {
    List<EmployeeResponse> getAllEmployees(String currentUsername);
    EmployeeResponse createEmployee(String currentUsername, CreateEmployeeRequest request);
    EmployeeResponse updateEmployee(String currentUsername, String employeeId, UpdateEmployeeRequest request);
    void deleteEmployee(String currentUsername, String employeeId);
    void resetEmployeePassword(String currentUsername, String employeeId, AdminResetEmployeePasswordRequest request);
}
