package com.sales.modules.customer.service;
import com.sales.modules.customer.dto.request.CollectDebtRequest;
import com.sales.modules.customer.dto.request.RemindDebtRequest;
import com.sales.modules.customer.dto.response.CustomerDebtResponse;
import com.sales.modules.customer.dto.response.DebtSummaryResponse;

import java.util.List;

public interface CustomerDebtService {
    CustomerDebtResponse collectDebt(String currentUsername, CollectDebtRequest request);
    List<CustomerDebtResponse> getDebtHistory(String currentUsername, String customerId);
    List<CustomerDebtResponse> getDebtReminders(String currentUsername, String statusFilter);
    DebtSummaryResponse getDebtSummary(String currentUsername);
    void remindCustomerDebt(String currentUsername, RemindDebtRequest request);
}

