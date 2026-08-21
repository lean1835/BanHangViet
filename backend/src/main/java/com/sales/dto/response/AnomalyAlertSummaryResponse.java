package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyAlertSummaryResponse {

    private long totalAlerts;
    private long pendingAlerts;
    private long reviewedAlerts;
    private long dismissedAlerts;
    private long criticalAlerts;
    private long warningAlerts;
    private long infoAlerts;
    private boolean isCleanDay;
    private LocalDate evaluatedDate;
    private Map<String, Long> alertsByType;
    private LocalDateTime lastScannedAt;
}
