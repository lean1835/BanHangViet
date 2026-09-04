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
