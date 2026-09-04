package com.sales.dto.response;

import com.sales.constant.AnomalyAlertStatus;
import com.sales.constant.AnomalyAlertType;
import com.sales.constant.AnomalySeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyAlertResponse {

    private String id;
    private String householdId;
    private AnomalyAlertType alertType;
    private AnomalySeverity severity;
    private String title;
    private String description;
    private String actorUserId;
    private String actorUsername;
    private String actorFullName;
    private AnomalyAlertStatus status;
    private String evidenceData;
    private LocalDateTime detectedAt;
    private String reviewedByUserId;
    private String reviewedByUsername;
    private String reviewedByFullName;
    private LocalDateTime reviewedAt;
    private String reviewNotes;
    private LocalDateTime createdAt;
}
