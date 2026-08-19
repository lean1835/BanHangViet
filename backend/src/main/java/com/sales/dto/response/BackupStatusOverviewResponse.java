package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackupStatusOverviewResponse {

    private Boolean isAutoBackupEnabled;
    private String scheduledTime;
    private Integer retentionCount;
    private LocalDateTime lastBackupTime;
    private String lastBackupStatus;
    private String lastBackupFileName;
    private Long activeBackupCount;
    private Long totalStorageSizeBytes;
}
