package com.sales.modules.backup.dto.response;
import com.sales.common.constant.BackupType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestoreResultResponse {

    private String restoreHistoryId;
    private String backupHistoryId;
    private String backupFileName;
    private BackupType backupType;
    private String status;
    private String message;
    private LocalDateTime restoredAt;
    private String restoredByUserName;
}
