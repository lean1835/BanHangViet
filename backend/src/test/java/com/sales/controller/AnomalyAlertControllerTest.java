package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AnomalyAlertStatus;
import com.sales.constant.AnomalyAlertType;
import com.sales.constant.AnomalySeverity;
import com.sales.dto.request.ReviewAnomalyAlertRequest;
import com.sales.dto.request.UpdateAnomalyRuleRequest;
import com.sales.dto.response.*;
import com.sales.service.interfaces.AnomalyDetectionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AnomalyAlertControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AnomalyDetectionService anomalyDetectionService;

    @Test
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    @DisplayName("GET /api/v1/anomaly-alerts - Chủ hộ lấy danh sách cảnh báo thành công 200 OK")
    void testGetAnomalyAlerts_OwnerRole_Success() throws Exception {
        AnomalyAlertResponse alert = AnomalyAlertResponse.builder()
                .id("alert-1")
                .alertType(AnomalyAlertType.MASS_INVOICE_CANCEL)
                .severity(AnomalySeverity.CRITICAL)
                .title("Cảnh báo hủy 5 hóa đơn")
                .status(AnomalyAlertStatus.PENDING)
                .build();

        PageResponse<AnomalyAlertResponse> pageResponse = PageResponse.<AnomalyAlertResponse>builder()
                .content(List.of(alert))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1L)
                .totalPages(1)
                .last(true)
                .build();

        when(anomalyDetectionService.getAnomalyAlerts(eq("owner_test"), any(), any(), any()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/anomaly-alerts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].id").value("alert-1"))
                .andExpect(jsonPath("$.result.content[0].alertType").value("MASS_INVOICE_CANCEL"));
    }

    @Test
    @WithMockUser(username = "staff_test", roles = {"VT-02"})
    @DisplayName("GET /api/v1/anomaly-alerts - Nhân viên bán hàng (VT-02) bị chặn truy cập 403 Forbidden")
    void testGetAnomalyAlerts_StaffRole_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/anomaly-alerts")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    @DisplayName("GET /api/v1/anomaly-alerts/summary - Lấy tổng quan cảnh báo và trạng thái ngày sạch 200 OK")
    void testGetSummary_Success() throws Exception {
        AnomalyAlertSummaryResponse summary = AnomalyAlertSummaryResponse.builder()
                .totalAlerts(5L)
                .pendingAlerts(2L)
                .criticalAlerts(1L)
                .isCleanDay(false)
                .evaluatedDate(LocalDate.now())
                .build();

        when(anomalyDetectionService.getSummary(eq("owner_test"), any())).thenReturn(summary);

        mockMvc.perform(get("/api/v1/anomaly-alerts/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalAlerts").value(5))
                .andExpect(jsonPath("$.result.pendingAlerts").value(2))
                .andExpect(jsonPath("$.result.cleanDay").value(false));
    }

    @Test
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    @DisplayName("POST /api/v1/anomaly-alerts/scan - Kích hoạt quét rà soát tức thời 200 OK")
    void testScanAnomalies_Success() throws Exception {
        ScanAnomalyResultResponse scanResult = ScanAnomalyResultResponse.builder()
                .scannedDate(LocalDate.now())
                .newAlertsDetected(1)
                .isCleanDay(false)
                .summaryMessage("Phát hiện 1 thao tác bất thường mới")
                .newAlerts(List.of(
                        AnomalyAlertResponse.builder()
                                .id("alert-new")
                                .alertType(AnomalyAlertType.MASS_INVOICE_CANCEL)
                                .severity(AnomalySeverity.CRITICAL)
                                .build()
                ))
                .completedAt(LocalDateTime.now())
                .build();

        when(anomalyDetectionService.scanAnomalies(eq("owner_test"), any(), any(), any()))
                .thenReturn(scanResult);

        mockMvc.perform(post("/api/v1/anomaly-alerts/scan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"scanDate\":\"2026-09-15\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.newAlertsDetected").value(1))
                .andExpect(jsonPath("$.result.newAlerts[0].id").value("alert-new"));
    }

    @Test
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    @DisplayName("PUT /api/v1/anomaly-alerts/{id}/review - Đánh dấu xử lý cảnh báo 200 OK")
    void testReviewAlert_Success() throws Exception {
        ReviewAnomalyAlertRequest request = ReviewAnomalyAlertRequest.builder()
                .status(AnomalyAlertStatus.REVIEWED)
                .reviewNotes("Đã đối soát xong")
                .build();

        AnomalyAlertResponse response = AnomalyAlertResponse.builder()
                .id("alert-1")
                .status(AnomalyAlertStatus.REVIEWED)
                .reviewNotes("Đã đối soát xong")
                .build();

        when(anomalyDetectionService.reviewAlert(eq("owner_test"), eq("alert-1"), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/anomaly-alerts/alert-1/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("REVIEWED"))
                .andExpect(jsonPath("$.result.reviewNotes").value("Đã đối soát xong"));
    }

    @Test
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    @DisplayName("GET /api/v1/anomaly-alerts/rules - Lấy cấu hình quy tắc cảnh báo 200 OK")
    void testGetRuleConfigs_Success() throws Exception {
        AnomalyRuleConfigResponse rule = AnomalyRuleConfigResponse.builder()
                .id("rule-1")
                .ruleType(AnomalyAlertType.MASS_INVOICE_CANCEL)
                .thresholdValue(BigDecimal.valueOf(5))
                .timeWindowMinutes(10)
                .isEnabled(true)
                .build();

        when(anomalyDetectionService.getRuleConfigs("owner_test")).thenReturn(List.of(rule));

        mockMvc.perform(get("/api/v1/anomaly-alerts/rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].ruleType").value("MASS_INVOICE_CANCEL"));
    }

    @Test
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    @DisplayName("PUT /api/v1/anomaly-alerts/rules/{id} - Cập nhật quy tắc cảnh báo 200 OK")
    void testUpdateRuleConfig_Success() throws Exception {
        UpdateAnomalyRuleRequest request = UpdateAnomalyRuleRequest.builder()
                .thresholdValue(BigDecimal.valueOf(10))
                .timeWindowMinutes(20)
                .severity(AnomalySeverity.CRITICAL)
                .isEnabled(true)
                .build();

        AnomalyRuleConfigResponse response = AnomalyRuleConfigResponse.builder()
                .id("rule-1")
                .thresholdValue(BigDecimal.valueOf(10))
                .timeWindowMinutes(20)
                .severity(AnomalySeverity.CRITICAL)
                .isEnabled(true)
                .build();

        when(anomalyDetectionService.updateRuleConfig(eq("owner_test"), eq("rule-1"), any(), any(), any()))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/anomaly-alerts/rules/rule-1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.thresholdValue").value(10));
    }
}
