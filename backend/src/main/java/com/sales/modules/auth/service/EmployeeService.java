package com.sales.modules.auth.service;
import com.sales.modules.auth.dto.request.CreateEmployeeRequest;
import com.sales.modules.auth.dto.request.UpdateEmployeeRequest;
import com.sales.modules.auth.dto.response.EmployeeResponse;

import java.util.List;

public interface EmployeeService {
    List<EmployeeResponse> getAllEmployees(String currentUsername);
    EmployeeResponse createEmployee(String currentUsername, CreateEmployeeRequest request);
    EmployeeResponse updateEmployee(String currentUsername, String employeeId, UpdateEmployeeRequest request);
    void deleteEmployee(String currentUsername, String employeeId);
    void resetEmployeePassword(String currentUsername, String employeeId, com.sales.modules.auth.dto.request.AdminResetEmployeePasswordRequest request);
}
