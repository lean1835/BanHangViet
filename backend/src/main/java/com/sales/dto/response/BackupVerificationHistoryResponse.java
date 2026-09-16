package com.sales.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackupVerificationHistoryResponse {

    private String id;
    private String backupHistoryId;
    private String backupFileName;
    private LocalDateTime backupTime;
    private Long fileSize;
    private String status; // PASSED, FAILED
    private Long executionDurationMs;
    private LocalDateTime verifiedAt;
    private Boolean checkedFileReadable;
    private Boolean checkedRecordCountsMatched;
    private Boolean checkedAuditChainIntact;
    private Integer productCount;
    private Integer customerCount;
    private Integer supplierCount;
    private Integer userCount;
    private Integer auditLogCount;
    private String failureReason;
    private String triggerType;
    private String notes;
    private LocalDateTime createdAt;
}
