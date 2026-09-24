package com.sales.modules.backup.service;
import com.sales.modules.backup.dto.request.RestoreDataRequest;
import com.sales.modules.backup.dto.response.BackupHistoryResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.backup.dto.response.RestoreHistoryResponse;
import com.sales.modules.backup.dto.response.RestorePreviewResponse;
import com.sales.modules.backup.dto.response.RestoreResultResponse;

import java.util.List;

public interface RestoreService {

    List<BackupHistoryResponse> getAvailableBackupsForRestore(String currentUsername);

    RestorePreviewResponse previewBackupForRestore(String currentUsername, String backupHistoryId);

    RestoreResultResponse executeRestore(String currentUsername, RestoreDataRequest request, String clientIp, String userAgent);

    PageResponse<RestoreHistoryResponse> getRestoreHistories(String currentUsername, int page, int size);
}
