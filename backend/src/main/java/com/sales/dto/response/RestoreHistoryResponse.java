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
public class RestoreHistoryResponse {

    private String id;
    private String backupHistoryId;
    private String backupFileName;
    private BackupType backupType;
    private String status;
    private String notes;
    private String restoredByUserId;
    private String restoredByUserName;
    private LocalDateTime restoredAt;
    private LocalDateTime createdAt;
}
