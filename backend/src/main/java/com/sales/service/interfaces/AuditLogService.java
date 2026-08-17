package com.sales.service.interfaces;

import com.sales.dto.request.ActivityLogFilterRequest;
import com.sales.dto.response.ActivityLogResponse;
import com.sales.dto.response.AuditIntegrityResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;

public interface AuditLogService {

    PageResponse<ActivityLogResponse> getAuditLogs(String currentUsername, ActivityLogFilterRequest filter, String clientIp, String userAgent);

    AuditIntegrityResponse verifyIntegrity(String currentUsername);

    byte[] exportAuditLogsToExcel(String currentUsername, ActivityLogFilterRequest filter, String clientIp, String userAgent);

    void recordLog(BusinessHousehold household, User actor, String action, String targetTable, String targetId, String oldValue, String newValue, String clientIp, String userAgent);
}
