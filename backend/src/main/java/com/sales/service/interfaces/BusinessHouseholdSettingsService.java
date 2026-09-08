package com.sales.service.interfaces;

import com.sales.dto.request.UpdateAutoRetrySettingsRequest;
import com.sales.dto.response.AutoRetrySettingsResponse;
import com.sales.entity.BusinessHouseholdSettings;

public interface BusinessHouseholdSettingsService {

    AutoRetrySettingsResponse getSettings(String currentUsername);

    AutoRetrySettingsResponse updateSettings(String currentUsername, UpdateAutoRetrySettingsRequest request);

    BusinessHouseholdSettings getEntityByHouseholdId(String householdId);
}
