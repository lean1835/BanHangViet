package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.OpenShiftRequest;
import com.viet.sales.dto.response.ShiftResponse;

public interface ShiftService {
    ShiftResponse openShift(String currentUsername, OpenShiftRequest request);
    ShiftResponse getActiveShift(String currentUsername);
}
