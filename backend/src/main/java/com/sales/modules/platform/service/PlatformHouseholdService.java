package com.sales.modules.platform.service;
import com.sales.modules.auth.dto.request.LockHouseholdRequest;
import com.sales.common.dto.PageResponse;
import com.sales.modules.platform.dto.response.PlatformHouseholdSummaryResponse;

public interface PlatformHouseholdService {

    PageResponse<PlatformHouseholdSummaryResponse> getHouseholds(String currentUsername, String search, String status, int page, int size);

    PlatformHouseholdSummaryResponse getHouseholdDetail(String currentUsername, String householdId);

    PlatformHouseholdSummaryResponse lockHousehold(String currentUsername, String householdId, LockHouseholdRequest request);

    PlatformHouseholdSummaryResponse unlockHousehold(String currentUsername, String householdId);
}
