package com.sales.service.interfaces;

import com.sales.dto.request.CollectDebtRequest;
import com.sales.dto.response.CustomerDebtResponse;
import com.sales.dto.response.DebtSummaryResponse;

import java.util.List;

public interface CustomerDebtService {
    CustomerDebtResponse collectDebt(String currentUsername, CollectDebtRequest request);
    List<CustomerDebtResponse> getDebtHistory(String currentUsername, String customerId);
    List<CustomerDebtResponse> getDebtReminders(String currentUsername, String statusFilter);
    DebtSummaryResponse getDebtSummary(String currentUsername);
}
