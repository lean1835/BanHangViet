package com.sales.service.classes;

import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;
import com.sales.service.interfaces.AuditLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityLogHelper {

    private final AuditLogService auditLogService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logActivityInNewTransaction(BusinessHousehold household, User actor, String action, String targetTable, String targetId, String oldValue, String newValue, String clientIp, String userAgent) {
        try {
            auditLogService.recordLog(household, actor, action, targetTable, targetId, oldValue, newValue, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Lỗi khi ghi activity log với Hash Chain", e);
        }
    }
}
