package com.sales.service.interfaces;

import com.sales.dto.request.TriggerVerificationRequest;
import com.sales.dto.response.BackupVerificationHistoryResponse;
import com.sales.dto.response.BackupVerificationStatusResponse;
import com.sales.dto.response.PageResponse;

public interface BackupVerificationService {

    BackupVerificationStatusResponse getVerificationStatus(String currentUsername);

    PageResponse<BackupVerificationHistoryResponse> getVerificationHistories(String currentUsername, int page, int size);

    BackupVerificationHistoryResponse triggerVerification(String currentUsername, TriggerVerificationRequest request);

    void runScheduledPeriodicVerification();
}
