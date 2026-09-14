package com.sales.dto.response;

import com.sales.constant.IncidentStatus;
import com.sales.constant.PlatformLogSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformIncidentResponse {

    private String id;
    private String title;
    private String eventType;
    private PlatformLogSeverity severity;
    private IncidentStatus status;
    private Integer affectedHouseholdsCount;
    private Integer errorThresholdCount;
    private String description;
    private LocalDateTime startedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
