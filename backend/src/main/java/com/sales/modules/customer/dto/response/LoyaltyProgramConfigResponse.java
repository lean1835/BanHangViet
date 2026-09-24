package com.sales.modules.customer.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoyaltyProgramConfigResponse {
    private String id;
    private String householdId;
    private Boolean isEnabled;
    private BigDecimal spendAmountPerPoint;
    private BigDecimal pointValue;
    private Integer minPointsToRedeem;
    private BigDecimal maxRedeemRatePerOrder;
    private Integer pointExpiryDays;
    private LocalDateTime updatedAt;
}
