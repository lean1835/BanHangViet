package com.sales.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BackupVerificationStatusResponse {

    private BackupVerificationHistoryResponse latestVerification;
    private BackupVerificationHistoryResponse latestSuccessfulVerification;
    private Long daysSinceLastSuccess;
    private Integer maxAllowedDaysWithoutVerification; // Mặc định: 7 ngày
    private Boolean isOverdue; // true nếu daysSinceLastSuccess > 7 hoặc chưa từng có lần thành công
    private Boolean hasFailedRecent; // true nếu lần thử gần nhất bị FAILED
    private String overallHealthStatus; // NORMAL, WARNING, DANGER
    private String warningMessage; // Thông điệp cảnh báo rõ ràng cho chủ hộ
    private Long totalVerificationsRun;
    private Long passedVerificationsCount;
    private Long failedVerificationsCount;
}
