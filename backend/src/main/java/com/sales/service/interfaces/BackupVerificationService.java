package com.sales.service.interfaces;

import com.sales.dto.request.TriggerVerificationRequest;
import com.sales.dto.response.BackupVerificationHistoryResponse;
import com.sales.dto.response.BackupVerificationStatusResponse;
import com.sales.dto.response.PageResponse;

import com.sales.entity.BackupHistory;
import com.sales.entity.BackupVerificationHistory;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;

public interface BackupVerificationService {

    BackupVerificationStatusResponse getVerificationStatus(String currentUsername);

    PageResponse<BackupVerificationHistoryResponse> getVerificationHistories(String currentUsername, int page, int size);

    BackupVerificationHistoryResponse triggerVerification(String currentUsername, TriggerVerificationRequest request);

    void runScheduledPeriodicVerification();

    BackupVerificationHistory executeSandboxVerification(
            BusinessHousehold household,
            BackupHistory backup,
            String triggerType,
            String notes,
            User actor);
}
