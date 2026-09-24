package com.sales.modules.platform.dto.response;
import com.sales.common.constant.HouseholdStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformHouseholdSummaryResponse {

    private String id;
    private String taxCode;
    private String name;
    private String address;
    private String phoneNumber;
    private String representativeName;
    private HouseholdStatus status;
    private String lockReason;
    private LocalDateTime lockedAt;
    private Long userCount;
    private LocalDateTime lastActiveAt;
    private String currentPackageCode;
    private String currentPackageName;
    private java.time.LocalDate packageEndDate;
    private Integer maxUsers;
    private Integer maxInvoicesMonth;
    private Integer invoiceCountMonth;
    private LocalDateTime createdAt;
}
