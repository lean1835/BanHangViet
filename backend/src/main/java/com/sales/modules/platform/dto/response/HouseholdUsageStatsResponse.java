package com.sales.modules.platform.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdUsageStatsResponse {
    private String householdId;
    private String householdName;
    private String monthYear;

    private String packageCode;
    private String packageName;
    private LocalDate packageEndDate;

    private Integer currentUsers;
    private Integer maxUsers;
    private Boolean isUserQuotaReached;

    private Integer currentPosPoints;
    private Integer maxPosPoints;
    private Boolean isPosQuotaReached;

    private Integer invoicesIssuedThisMonth;
    private Integer maxInvoicesPerMonth;
    private Boolean isInvoiceOverQuota;
    private Integer overQuotaInvoiceCount;
    private String warningMessage;
}
