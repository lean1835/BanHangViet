package com.sales.modules.pos.service;
import com.sales.modules.pos.dto.request.AssignPosEmployeeRequest;
import com.sales.modules.pos.dto.response.PosEmployeeResponse;

import java.util.List;

public interface PosEmployeeService {

    List<PosEmployeeResponse> getEmployeesByPos(String currentUsername, String posId);

    List<PosEmployeeResponse> assignEmployeesToPos(String currentUsername, String posId, AssignPosEmployeeRequest request);

    void unassignEmployeeFromPos(String currentUsername, String posId, String userId);

    PosEmployeeResponse getEmployeePos(String currentUsername, String userId);
}
