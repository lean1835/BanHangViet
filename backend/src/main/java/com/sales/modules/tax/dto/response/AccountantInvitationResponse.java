package com.sales.modules.tax.dto.response;
import com.sales.common.constant.AccountantInvitationStatus;
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
public class AccountantInvitationResponse {

    private String id;
    private String householdId;
    private String householdName;
    private String householdTaxCode;
    private String invitationToken;
    private String accountantName;
    private String accountantPhone;
    private String accountantEmail;
    private String invitedByUsername;
    private Integer accessDurationDays;
    private List<String> scopePermissions;
    private AccountantInvitationStatus status;
    private LocalDateTime invitationExpiresAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime rejectedAt;
    private LocalDateTime createdAt;
    private Boolean isNewAccountCreated;
    private String accountantUsername;
    private String temporaryPassword;
}
