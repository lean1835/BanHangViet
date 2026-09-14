package com.sales.service.interfaces;

import com.sales.dto.request.LockHouseholdRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PlatformHouseholdSummaryResponse;

public interface PlatformHouseholdService {

    PageResponse<PlatformHouseholdSummaryResponse> getHouseholds(String currentUsername, String search, String status, int page, int size);

    PlatformHouseholdSummaryResponse getHouseholdDetail(String currentUsername, String householdId);

    PlatformHouseholdSummaryResponse lockHousehold(String currentUsername, String householdId, LockHouseholdRequest request);

    PlatformHouseholdSummaryResponse unlockHousehold(String currentUsername, String householdId);
}
