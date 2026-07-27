package com.sales.service.interfaces;

import com.sales.dto.request.CreateEmployeeRequest;
import com.sales.dto.request.UpdateEmployeeRequest;
import com.sales.dto.response.EmployeeResponse;

import java.util.List;

public interface EmployeeService {
    List<EmployeeResponse> getAllEmployees(String currentUsername);
    EmployeeResponse createEmployee(String currentUsername, CreateEmployeeRequest request);
    EmployeeResponse updateEmployee(String currentUsername, String employeeId, UpdateEmployeeRequest request);
    void deleteEmployee(String currentUsername, String employeeId);
}
