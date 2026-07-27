package com.sales.service.interfaces;

import com.sales.dto.request.CloseShiftRequest;
import com.sales.dto.request.OpenShiftRequest;
import com.sales.dto.response.ShiftResponse;
import java.util.List;


public interface ShiftService {
    ShiftResponse openShift(String currentUsername, OpenShiftRequest request);
    ShiftResponse getActiveShift(String currentUsername);
    ShiftResponse closeShift(String currentUsername, String shiftId, CloseShiftRequest request);
    List<ShiftResponse> getShiftsHistory(String currentUsername);
}
