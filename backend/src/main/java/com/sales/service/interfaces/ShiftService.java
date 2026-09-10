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

    // NCL-03-CN-012 & QTN-16 Đối soát giao dịch chuyển khoản đóng ca
    com.sales.dto.response.BankTransferReconciliationResponse getBankTransferReconciliation(String currentUsername, String shiftId);
}

