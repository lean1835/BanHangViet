package com.sales.modules.audit.service.impl;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;
import com.sales.modules.audit.service.AuditLogService;
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

    /**
     * Ghi activity log tham gia vao transaction hien tai.
     * Can thiet cho cac thao tac cap nhat truc tiep bang business_households (nhu khoa/mo khoa ho)
     * de tranh deadlock / lock wait timeout (delay 50s) tren MySQL InnoDB do foreign key check toi business_households.
     */
    public void logActivity(BusinessHousehold household, User actor, String action, String targetTable, String targetId, String oldValue, String newValue, String clientIp, String userAgent) {
        try {
            auditLogService.recordLog(household, actor, action, targetTable, targetId, oldValue, newValue, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Lỗi khi ghi activity log với Hash Chain", e);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logActivityInNewTransaction(BusinessHousehold household, User actor, String action, String targetTable, String targetId, String oldValue, String newValue, String clientIp, String userAgent) {
        try {
            auditLogService.recordLog(household, actor, action, targetTable, targetId, oldValue, newValue, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Lỗi khi ghi activity log với Hash Chain", e);
        }
    }
}
