package com.sales.modules.backup.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackupVerificationStatusResponse {
    private BackupVerificationHistoryResponse latestVerification;
    private BackupVerificationHistoryResponse latestSuccessfulVerification;
    private Long daysSinceLastSuccess;
    private Integer maxAllowedDaysWithoutVerification;
    private Boolean isOverdue;
    private Boolean hasFailedRecent;
    private String overallHealthStatus;
    private String warningMessage;
    private Long totalVerificationsRun;
    private Long passedVerificationsCount;
    private Long failedVerificationsCount;
}
