package com.sales.service.interfaces;

import com.sales.dto.request.UpdateBackupConfigRequest;
import com.sales.dto.response.BackupConfigResponse;
import com.sales.dto.response.BackupHistoryResponse;
import com.sales.dto.response.BackupStatusOverviewResponse;
import com.sales.dto.response.PageResponse;
import com.sales.entity.BusinessHousehold;

public interface AutoBackupService {
    BackupConfigResponse getBackupConfig(String currentUsername);
    BackupConfigResponse updateBackupConfig(String currentUsername, UpdateBackupConfigRequest request);
    PageResponse<BackupHistoryResponse> getBackupHistories(String currentUsername, int page, int size);
    BackupStatusOverviewResponse getBackupOverview(String currentUsername);
    BackupHistoryResponse triggerManualBackup(String currentUsername);
    void runDailyAutoBackupForHousehold(BusinessHousehold household);
}
