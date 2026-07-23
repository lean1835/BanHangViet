package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.UpdateHouseholdRequest;
import com.viet.sales.dto.response.HouseholdResponse;

public interface HouseholdService {
    HouseholdResponse getMyHousehold(String currentUsername);
    HouseholdResponse updateMyHousehold(String currentUsername, UpdateHouseholdRequest request);
}
