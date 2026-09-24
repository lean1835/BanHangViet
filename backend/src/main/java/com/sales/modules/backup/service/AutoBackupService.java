package com.sales.modules.backup.service;
import com.sales.modules.backup.dto.request.UpdateBackupConfigRequest;
import com.sales.modules.backup.dto.response.BackupConfigResponse;
import com.sales.modules.backup.dto.response.BackupHistoryResponse;
import com.sales.modules.backup.dto.response.BackupStatusOverviewResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.auth.entity.BusinessHousehold;

public interface AutoBackupService {
    BackupConfigResponse getBackupConfig(String currentUsername);
    BackupConfigResponse updateBackupConfig(String currentUsername, UpdateBackupConfigRequest request);
    PageResponse<BackupHistoryResponse> getBackupHistories(String currentUsername, int page, int size);
    BackupStatusOverviewResponse getBackupOverview(String currentUsername);
    BackupHistoryResponse triggerManualBackup(String currentUsername);
    void runDailyAutoBackupForHousehold(BusinessHousehold household);
}
