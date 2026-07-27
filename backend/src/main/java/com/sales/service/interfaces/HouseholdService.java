package com.sales.service.interfaces;

import com.sales.dto.request.UpdateHouseholdRequest;
import com.sales.dto.response.HouseholdResponse;

public interface HouseholdService {
    HouseholdResponse getMyHousehold(String currentUsername);
    HouseholdResponse updateMyHousehold(String currentUsername, UpdateHouseholdRequest request);
}
