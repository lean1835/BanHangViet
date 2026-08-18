package com.sales.dto.response;

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
public class BackupConfigResponse {

    private String id;
    private String householdId;
    private Boolean isAutoBackupEnabled;
    private String scheduledTime;
    private Integer retentionCount;
    private BackupType backupType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
