package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.CreateCustomerRequest;
import com.viet.sales.dto.request.UpdateCustomerRequest;
import com.viet.sales.dto.response.CustomerResponse;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(String currentUsername, CreateCustomerRequest request);
    CustomerResponse updateCustomer(String currentUsername, String customerId, UpdateCustomerRequest request);
    CustomerResponse getCustomer(String currentUsername, String customerId);
    List<CustomerResponse> getCustomers(String currentUsername);
    List<CustomerResponse> searchCustomers(String currentUsername, String query);
    void deleteCustomer(String currentUsername, String customerId);
}
