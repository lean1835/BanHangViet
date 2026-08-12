package com.sales.service.classes;

import com.sales.entity.ActivityLog;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;
import com.sales.repository.ActivityLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityLogHelper {

    private final ActivityLogRepository activityLogRepository;

    @Transactional
    public void logActivityInNewTransaction(BusinessHousehold household, User actor, String action, String targetTable, String targetId, String oldValue, String newValue, String clientIp, String userAgent) {
        try {
            ActivityLog logRecord = ActivityLog.builder()
                    .household(household)
                    .user(actor)
                    .action(action)
                    .targetTable(targetTable)
                    .targetId(targetId)
                    .oldValue(toJsonString(oldValue))
                    .newValue(toJsonString(newValue))
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.saveAndFlush(logRecord);
        } catch (Exception e) {
            log.error("Lỗi khi ghi activity log (REQUIRES_NEW transaction)", e);
        }
    }

    private String toJsonString(String val) {
        if (val == null) return null;
        String trimmed = val.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
            (trimmed.startsWith("\"") && trimmed.endsWith("\""))) {
            return trimmed;
        }
        return "\"" + trimmed.replace("\"", "\\\"") + "\"";
    }
}
