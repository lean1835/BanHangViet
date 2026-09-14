package com.sales.service.interfaces;

import com.sales.constant.PlatformLogSeverity;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PlatformIncidentResponse;
import com.sales.dto.response.PlatformSystemLogResponse;
import com.sales.entity.PlatformSystemLog;

import java.time.LocalDate;
import java.util.List;

public interface PlatformSystemLogService {

    PlatformSystemLog logSystemEvent(
            String eventType,
            PlatformLogSeverity severity,
            String householdId,
            String errorCode,
            String technicalMessage,
            String metadataJson);

    void logSystemEventAsync(
            String eventType,
            PlatformLogSeverity severity,
            String householdId,
            String errorCode,
            String technicalMessage,
            String metadataJson);

    PageResponse<PlatformSystemLogResponse> getPlatformLogs(
            String currentUsername,
            String severity,
            LocalDate fromDate,
            LocalDate toDate,
            String householdId,
            String eventType,
            int page,
            int size);

    PlatformSystemLogResponse getLogDetail(String currentUsername, String logId);

    List<PlatformIncidentResponse> getIncidents(String currentUsername);

    PlatformIncidentResponse resolveIncident(String currentUsername, String incidentId);
}
