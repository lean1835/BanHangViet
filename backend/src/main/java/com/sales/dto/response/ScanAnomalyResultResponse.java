package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScanAnomalyResultResponse {

    private LocalDate scannedDate;
    private int newAlertsDetected;
    private boolean isCleanDay;
    private String summaryMessage;
    private List<AnomalyAlertResponse> newAlerts;
    private LocalDateTime completedAt;
}
