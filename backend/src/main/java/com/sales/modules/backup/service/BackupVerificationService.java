package com.sales.modules.backup.service;
import com.sales.modules.backup.dto.request.TriggerVerificationRequest;
import com.sales.modules.backup.dto.response.BackupVerificationHistoryResponse;
import com.sales.modules.backup.dto.response.BackupVerificationStatusResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.backup.entity.BackupHistory;
import com.sales.modules.backup.entity.BackupVerificationHistory;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;

public interface BackupVerificationService {

    BackupVerificationStatusResponse getVerificationStatus(String currentUsername);

    PageResponse<BackupVerificationHistoryResponse> getVerificationHistories(String currentUsername, int page, int size);

    BackupVerificationHistoryResponse triggerVerification(String currentUsername, TriggerVerificationRequest request);

    void runScheduledPeriodicVerification();

    void verifyHouseholdPeriodicAsync(BusinessHousehold household);

    BackupVerificationHistory executeSandboxVerification(
            BusinessHousehold household,
            BackupHistory backup,
            String triggerType,
            String notes,
            User actor);
}
