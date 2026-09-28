package com.sales.modules.customer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerLoyaltySummaryResponse {
    private String customerId;
    private String customerName;
    private String phoneNumber;
    private Integer availablePoints;
    private BigDecimal monetaryEquivalent;
    private Boolean isEligibleToRedeem;
    private Integer minPointsToRedeem;
    private Integer totalPointsEarned;
    private Integer totalPointsRedeemed;
    private Integer totalPointsDeductedOnReturn;
    private LocalDate nearestExpiringDate;
    private Integer pointsExpiringSoon;
}
