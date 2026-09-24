package com.sales.modules.audit.service;
import com.sales.modules.audit.dto.request.ActivityLogFilterRequest;
import com.sales.modules.audit.dto.response.ActivityLogResponse;
import com.sales.modules.audit.dto.response.AuditIntegrityResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;

public interface AuditLogService {

    PageResponse<ActivityLogResponse> getAuditLogs(String currentUsername, ActivityLogFilterRequest filter, String clientIp, String userAgent);

    AuditIntegrityResponse verifyIntegrity(String currentUsername);

    AuditIntegrityResponse verifyIntegrityForHousehold(String householdId);

    byte[] exportAuditLogsToExcel(String currentUsername, ActivityLogFilterRequest filter, String clientIp, String userAgent);

    void recordLog(BusinessHousehold household, User actor, String action, String targetTable, String targetId, String oldValue, String newValue, String clientIp, String userAgent);
 
    void repairLegacyHashChain();
}
