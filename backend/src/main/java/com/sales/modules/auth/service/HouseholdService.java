package com.sales.modules.auth.service;
import com.sales.modules.auth.dto.request.UpdateHouseholdRequest;
import com.sales.modules.auth.dto.response.HouseholdResponse;

public interface HouseholdService {
    HouseholdResponse getMyHousehold(String currentUsername);
    HouseholdResponse updateMyHousehold(String currentUsername, UpdateHouseholdRequest request);
}
