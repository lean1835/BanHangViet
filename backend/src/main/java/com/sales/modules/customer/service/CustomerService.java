package com.sales.modules.customer.service;
import com.sales.modules.customer.dto.request.CreateCustomerRequest;
import com.sales.modules.customer.dto.request.UpdateCustomerRequest;
import com.sales.modules.customer.dto.response.CustomerResponse;

import java.util.List;

public interface CustomerService {
    CustomerResponse createCustomer(String currentUsername, CreateCustomerRequest request);
    CustomerResponse updateCustomer(String currentUsername, String customerId, UpdateCustomerRequest request);
    CustomerResponse getCustomer(String currentUsername, String customerId);
    List<CustomerResponse> getCustomers(String currentUsername);
    List<CustomerResponse> searchCustomers(String currentUsername, String query);
    CustomerResponse updateDefaultDeliveryChannel(String currentUsername, String customerId, com.sales.modules.customer.dto.request.UpdateCustomerDeliveryChannelRequest request);
    void deleteCustomer(String currentUsername, String customerId);
}
