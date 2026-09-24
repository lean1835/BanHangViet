package com.sales.modules.auth.service;
import com.sales.modules.pos.dto.request.ToggleSimpleModeRequest;
import com.sales.modules.auth.dto.request.UpdateUserDisplaySettingRequest;
import com.sales.modules.pos.dto.response.PosSimplifiedLayoutResponse;
import com.sales.modules.auth.dto.response.UserDisplaySettingResponse;
import com.sales.modules.auth.entity.User;

public interface UserDisplaySettingService {

    UserDisplaySettingResponse getDisplaySetting(String username);

    UserDisplaySettingResponse getDisplaySettingForUser(User user);

    UserDisplaySettingResponse updateDisplaySetting(String username, UpdateUserDisplaySettingRequest request);

    UserDisplaySettingResponse toggleSimpleMode(String username, ToggleSimpleModeRequest request);

    PosSimplifiedLayoutResponse getSimplifiedPosLayout(String username);
}
