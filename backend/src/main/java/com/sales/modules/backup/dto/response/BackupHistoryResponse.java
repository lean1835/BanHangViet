package com.sales.modules.backup.dto.response;
import com.sales.common.constant.BackupTriggerType;
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
public class BackupHistoryResponse {

    private String id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private BackupType backupType;
    private BackupTriggerType triggerType;
    private String status;
    private String notes;
    private String createdByUserId;
    private String createdByUserName;
    private LocalDateTime backupTime;
    private LocalDateTime createdAt;
}
