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
    private String monthYear; // e.g. '2026-09'

    // Subscription Package Info
    private String packageCode;
    private String packageName;
    private LocalDate packageEndDate;

    // User quota
    private Integer currentUsers;
    private Integer maxUsers;
    private Boolean isUserQuotaReached;

    // POS points quota
    private Integer currentPosPoints;
    private Integer maxPosPoints;
    private Boolean isPosQuotaReached;

    // Invoices quota
    private Integer invoicesIssuedThisMonth;
    private Integer maxInvoicesPerMonth;
    private Boolean isInvoiceOverQuota;
    private Integer overQuotaInvoiceCount;
    private String warningMessage;
}
