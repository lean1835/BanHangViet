package com.sales.service.interfaces;

import com.sales.dto.request.CreateCustomerRequest;
import com.sales.dto.request.UpdateCustomerRequest;
import com.sales.dto.response.CustomerResponse;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(String currentUsername, CreateCustomerRequest request);
    CustomerResponse updateCustomer(String currentUsername, String customerId, UpdateCustomerRequest request);
    CustomerResponse getCustomer(String currentUsername, String customerId);
    List<CustomerResponse> getCustomers(String currentUsername);
    List<CustomerResponse> searchCustomers(String currentUsername, String query);
    void deleteCustomer(String currentUsername, String customerId);
}
