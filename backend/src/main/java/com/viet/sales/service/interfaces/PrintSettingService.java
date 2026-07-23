package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.PrintSettingRequest;
import com.viet.sales.dto.response.PrintSettingResponse;

public interface PrintSettingService {

    PrintSettingResponse getMyPrintSetting(String currentUsername);

    PrintSettingResponse updateMyPrintSetting(String currentUsername, PrintSettingRequest request);
}
