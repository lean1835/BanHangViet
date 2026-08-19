package com.sales.dto.response;

import com.sales.constant.BackupTriggerType;
import com.sales.constant.BackupType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestorePreviewResponse {

    private String backupHistoryId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private BackupType backupType;
    private BackupTriggerType triggerType;
    private String status;
    private LocalDateTime backupTime;
    private String createdByUserName;
    private Boolean isEligibleForRestore;
    private String summaryDescription;
    private String warningMessage;
}
