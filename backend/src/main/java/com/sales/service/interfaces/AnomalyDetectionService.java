package com.sales.service.interfaces;

import com.sales.dto.request.AnomalyAlertFilterRequest;
import com.sales.dto.request.ReviewAnomalyAlertRequest;
import com.sales.dto.request.UpdateAnomalyRuleRequest;
import com.sales.dto.response.*;

import java.time.LocalDate;
import java.util.List;

public interface AnomalyDetectionService {

    PageResponse<AnomalyAlertResponse> getAnomalyAlerts(String currentUsername, AnomalyAlertFilterRequest filter, String clientIp, String userAgent);

    AnomalyAlertSummaryResponse getSummary(String currentUsername, LocalDate evaluatedDate);

    AnomalyAlertResponse getAlertById(String currentUsername, String alertId);

    ScanAnomalyResultResponse scanAnomalies(String currentUsername, LocalDate scanDate, String clientIp, String userAgent);

    AnomalyAlertResponse reviewAlert(String currentUsername, String alertId, ReviewAnomalyAlertRequest request, String clientIp, String userAgent);

    List<AnomalyRuleConfigResponse> getRuleConfigs(String currentUsername);

    AnomalyRuleConfigResponse updateRuleConfig(String currentUsername, String ruleConfigId, UpdateAnomalyRuleRequest request, String clientIp, String userAgent);

    void performScheduledScan();
}
