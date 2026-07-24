package com.viet.sales.service.classes;

import com.viet.sales.entity.ActivityLog;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.User;
import com.viet.sales.repository.ActivityLogRepository;
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logActivityInNewTransaction(BusinessHousehold household, User actor, String action, String targetTable, String targetId, String oldValue, String newValue, String clientIp, String userAgent) {
        try {
            ActivityLog logRecord = ActivityLog.builder()
                    .household(household)
                    .user(actor)
                    .action(action)
                    .targetTable(targetTable)
                    .targetId(targetId)
                    .oldValue(oldValue)
                    .newValue(newValue)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Lỗi khi ghi activity log (REQUIRES_NEW transaction)", e);
        }
    }
}
