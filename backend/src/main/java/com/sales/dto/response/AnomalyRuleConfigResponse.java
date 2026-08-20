package com.sales.dto.response;

import com.sales.constant.AnomalyAlertType;
import com.sales.constant.AnomalySeverity;
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
public class AnomalyRuleConfigResponse {

    private String id;
    private String householdId;
    private AnomalyAlertType ruleType;
    private String ruleName;
    private BigDecimal thresholdValue;
    private Integer timeWindowMinutes;
    private AnomalySeverity severity;
    private Boolean isEnabled;
    private LocalDateTime updatedAt;
}
