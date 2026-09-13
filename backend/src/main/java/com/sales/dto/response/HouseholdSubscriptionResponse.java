package com.sales.dto.response;

import com.sales.constant.SubscriptionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdSubscriptionResponse {

    private String id;
    private String householdId;
    private String householdName;
    private String packageId;
    private String packageCode;
    private String packageName;
    private Integer maxUsers;
    private Integer maxPosPoints;
    private Integer maxInvoicesPerMonth;
    private Integer dataRetentionDays;
    private LocalDate startDate;
    private LocalDate endDate;
    private SubscriptionStatus status;
    private LocalDateTime createdAt;
}
