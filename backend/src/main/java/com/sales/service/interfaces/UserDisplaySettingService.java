package com.sales.service.interfaces;

import com.sales.dto.request.ToggleSimpleModeRequest;
import com.sales.dto.request.UpdateUserDisplaySettingRequest;
import com.sales.dto.response.PosSimplifiedLayoutResponse;
import com.sales.dto.response.UserDisplaySettingResponse;
import com.sales.entity.User;

public interface UserDisplaySettingService {

    UserDisplaySettingResponse getDisplaySetting(String username);

    UserDisplaySettingResponse getDisplaySettingForUser(User user);

    UserDisplaySettingResponse updateDisplaySetting(String username, UpdateUserDisplaySettingRequest request);

    UserDisplaySettingResponse toggleSimpleMode(String username, ToggleSimpleModeRequest request);

    PosSimplifiedLayoutResponse getSimplifiedPosLayout(String username);
}
