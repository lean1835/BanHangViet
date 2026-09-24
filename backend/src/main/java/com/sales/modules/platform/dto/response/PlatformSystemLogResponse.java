package com.sales.modules.platform.dto.response;
import com.sales.common.constant.PlatformLogSeverity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformSystemLogResponse {

    private String id;
    private String eventType;
    private PlatformLogSeverity severity;
    private String householdId;
    private String householdName;
    private String householdTaxCode;
    private String errorCode;
    private String technicalMessage;
    private String technicalMetadata; // Technical metrics JSON (latency, queue depth, etc.)
    private Boolean isWidespreadIncident;
    private String incidentId;
    private LocalDateTime createdAt;
}
