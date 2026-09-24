package com.sales.modules.tax.dto.response;
import com.sales.common.constant.AccountantAssignmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountantAssignmentResponse {

    private String id;
    private String householdId;
    private String householdName;
    private String householdTaxCode;
    private String accountantUserId;
    private String accountantUsername;
    private String accountantFullName;
    private String accountantPhone;
    private String accountantEmail;
    private List<String> scopePermissions;
    private AccountantAssignmentStatus status;
    private LocalDateTime accessExpiresAt;
    private LocalDateTime revokedAt;
    private String revokeReason;
    private LocalDateTime createdAt;
}
