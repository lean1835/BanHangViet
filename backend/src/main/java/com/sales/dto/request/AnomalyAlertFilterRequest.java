package com.sales.dto.request;

import com.sales.constant.AnomalyAlertStatus;
import com.sales.constant.AnomalyAlertType;
import com.sales.constant.AnomalySeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyAlertFilterRequest {

    private AnomalyAlertType alertType;
    private AnomalySeverity severity;
    private AnomalyAlertStatus status;
    private String actorUsername;
    private String keyword;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime startDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
    private LocalDateTime endDate;

    @Builder.Default
    private int page = 0;

    @Builder.Default
    private int size = 20;

    public void setAlertType(AnomalyAlertType alertType) {
        this.alertType = alertType;
    }

    public void setAlertType(String alertTypeStr) {
        if (alertTypeStr != null && !alertTypeStr.trim().isEmpty()) {
            try {
                this.alertType = AnomalyAlertType.valueOf(alertTypeStr.trim().toUpperCase());
            } catch (Exception e) {
                this.alertType = null;
            }
        } else {
            this.alertType = null;
        }
    }

    public void setSeverity(AnomalySeverity severity) {
        this.severity = severity;
    }

    public void setSeverity(String severityStr) {
        if (severityStr != null && !severityStr.trim().isEmpty()) {
            try {
                this.severity = AnomalySeverity.valueOf(severityStr.trim().toUpperCase());
            } catch (Exception e) {
                this.severity = null;
            }
        } else {
            this.severity = null;
        }
    }

    public void setStatus(AnomalyAlertStatus status) {
        this.status = status;
    }

    public void setStatus(String statusStr) {
        if (statusStr != null && !statusStr.trim().isEmpty()) {
            try {
                this.status = AnomalyAlertStatus.valueOf(statusStr.trim().toUpperCase());
            } catch (Exception e) {
                this.status = null;
            }
        } else {
            this.status = null;
        }
    }

    public void setKeyword(String keyword) {
        this.keyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
    }

    public void setActorUsername(String actorUsername) {
        this.actorUsername = (actorUsername != null && !actorUsername.trim().isEmpty()) ? actorUsername.trim() : null;
    }
}
