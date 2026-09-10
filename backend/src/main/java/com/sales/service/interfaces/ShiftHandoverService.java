package com.sales.service.interfaces;

import com.sales.dto.request.ShiftHandoverRequest;
import com.sales.dto.response.ShiftHandoverResponse;
import com.sales.dto.response.ShiftHandoverSummaryResponse;
import com.sales.dto.response.ShiftStagesSummaryResponse;

import java.util.List;

public interface ShiftHandoverService {

    /**
     * Lấy dữ liệu chốt tạm của chặng hiện tại trước khi bàn giao ca (AC-01)
     */
    ShiftHandoverSummaryResponse getHandoverSummary(String currentUsername);

    /**
     * Thực hiện xác nhận bàn giao ca giữa hai nhân viên (AC-01, AC-02, AC-03, QTN-15, QTN-16)
     */
    ShiftHandoverResponse performShiftHandover(String currentUsername, ShiftHandoverRequest request);

    /**
     * Lấy danh sách lịch sử các lần bàn giao trong ca bán hàng
     */
    List<ShiftHandoverResponse> getHandoversByShiftId(String currentUsername, String shiftId);

    /**
     * Lấy báo cáo tổng hợp chi tiết theo từng chặng của ca bán hàng để phân định trách nhiệm
     */
    ShiftStagesSummaryResponse getShiftStagesSummary(String currentUsername, String shiftId);
}
