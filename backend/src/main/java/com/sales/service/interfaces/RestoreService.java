package com.sales.service.interfaces;

import com.sales.dto.request.RestoreDataRequest;
import com.sales.dto.response.BackupHistoryResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.RestoreHistoryResponse;
import com.sales.dto.response.RestorePreviewResponse;
import com.sales.dto.response.RestoreResultResponse;

import java.util.List;

public interface RestoreService {

    List<BackupHistoryResponse> getAvailableBackupsForRestore(String currentUsername);

    RestorePreviewResponse previewBackupForRestore(String currentUsername, String backupHistoryId);

    RestoreResultResponse executeRestore(String currentUsername, RestoreDataRequest request, String clientIp, String userAgent);

    PageResponse<RestoreHistoryResponse> getRestoreHistories(String currentUsername, int page, int size);
}
