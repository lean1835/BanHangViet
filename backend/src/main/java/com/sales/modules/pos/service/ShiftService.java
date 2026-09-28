package com.sales.modules.pos.service;
import com.sales.modules.pos.dto.request.CloseShiftRequest;
import com.sales.modules.pos.dto.request.OpenShiftRequest;
import com.sales.modules.pos.dto.response.ShiftResponse;
import java.util.List;
import com.sales.modules.order.dto.response.BankTransferReconciliationResponse;

public interface ShiftService {
    ShiftResponse openShift(String currentUsername, OpenShiftRequest request);
    ShiftResponse getActiveShift(String currentUsername);
    ShiftResponse closeShift(String currentUsername, String shiftId, CloseShiftRequest request);
    List<ShiftResponse> getShiftsHistory(String currentUsername);

    BankTransferReconciliationResponse getBankTransferReconciliation(String currentUsername, String shiftId);
}
