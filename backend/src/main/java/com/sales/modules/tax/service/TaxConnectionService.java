package com.sales.modules.tax.service;
import com.sales.modules.tax.dto.response.TaxConnectionHistoryResponse;
import com.sales.modules.tax.dto.response.TaxConnectionStatusResponse;

public interface TaxConnectionService {

    TaxConnectionStatusResponse getTaxConnectionStatus(String currentUsername);

    TaxConnectionHistoryResponse getTaxConnectionHistory(String currentUsername, int days);

    void recordConnectionEvent(String householdId, String status, Integer responseTimeMs, String errorMessage);

    TaxConnectionStatusResponse simulateConnection(String currentUsername, String status, Integer responseTimeMs, String errorMessage);
}

