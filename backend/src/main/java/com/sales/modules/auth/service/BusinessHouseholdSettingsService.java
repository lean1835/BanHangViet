package com.sales.modules.auth.service;
import com.sales.modules.invoice.dto.request.UpdateAutoRetrySettingsRequest;
import com.sales.modules.invoice.dto.response.AutoRetrySettingsResponse;
import com.sales.modules.auth.entity.BusinessHouseholdSettings;

public interface BusinessHouseholdSettingsService {

    AutoRetrySettingsResponse getSettings(String currentUsername);

    AutoRetrySettingsResponse updateSettings(String currentUsername, UpdateAutoRetrySettingsRequest request);

    BusinessHouseholdSettings getEntityByHouseholdId(String householdId);
}
