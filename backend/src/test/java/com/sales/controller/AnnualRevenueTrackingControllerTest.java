package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.RevenueThresholdConstants;
import com.sales.constant.RevenueWarningStatus;
import com.sales.dto.request.UpdateWarningThresholdRequest;
import com.sales.dto.response.AnnualRevenueTrackingResponse;
import com.sales.dto.response.AppNotificationResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.UpdateWarningThresholdResponse;
import com.sales.service.interfaces.AnnualRevenueTrackingService;
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
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AnnualRevenueTrackingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AnnualRevenueTrackingService annualRevenueTrackingService;

    @Test
    @DisplayName("API GET /annual-revenue-tracking: Chủ hộ (VT-01) xem thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getAnnualRevenueTracking_Success() throws Exception {
        AnnualRevenueTrackingResponse mockResponse = AnnualRevenueTrackingResponse.builder()
                .year(2026)
                .householdId("hh-uuid-1")
                .householdName("Tạp Hóa An Bình")
                .taxCode("0312345678")
                .mandatoryThreshold(RevenueThresholdConstants.MANDATORY_REVENUE_THRESHOLD)
                .warningThresholdPercentage(new BigDecimal("80.00"))
                .warningRevenueAmount(new BigDecimal("800000000.00"))
                .cumulativeRevenue(new BigDecimal("450000000.00"))
                .cumulativeTaxAmount(new BigDecimal("6750000.00"))
                .validInvoiceCount(620)
                .thresholdPercentage(new BigDecimal("45.00"))
                .averageMonthlyRevenue(new BigDecimal("50000000.00"))
                .elapsedMonths(9)
                .warningStatus(RevenueWarningStatus.BELOW_WARNING)
                .isMandatory(false)
                .shouldShowWarning(false)
                .build();

        when(annualRevenueTrackingService.getAnnualRevenueTracking(eq("owner_test"), any()))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/tax-periods/annual-revenue-tracking")
                        .param("year", "2026")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.householdId").value("hh-uuid-1"))
                .andExpect(jsonPath("$.result.cumulativeRevenue").value(450000000.00))
                .andExpect(jsonPath("$.result.validInvoiceCount").value(620))
                .andExpect(jsonPath("$.result.mandatoryThreshold").value(1000000000.00));
    }

    @Test
    @DisplayName("API GET /annual-revenue-tracking: Nhân viên bán hàng (VT-02) bị chặn 403 Forbidden theo QTN-10")
    @WithMockUser(username = "staff_test", roles = {"VT-02"})
    void getAnnualRevenueTracking_Forbidden_VT02() throws Exception {
        mockMvc.perform(get("/api/v1/tax-periods/annual-revenue-tracking")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("API PUT /warning-threshold: Chủ hộ (VT-01) cập nhật thành công mức 85.0%")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void updateWarningThreshold_Success() throws Exception {
        UpdateWarningThresholdRequest request = UpdateWarningThresholdRequest.builder()
                .warningThresholdPercentage(new BigDecimal("85.00"))
                .build();

        UpdateWarningThresholdResponse mockResponse = UpdateWarningThresholdResponse.builder()
                .householdId("hh-uuid-1")
                .warningThresholdPercentage(new BigDecimal("85.00"))
                .warningRevenueAmount(new BigDecimal("850000000.00"))
                .updatedAt(LocalDateTime.now())
                .build();

        when(annualRevenueTrackingService.updateWarningThreshold(eq("owner_test"), any(UpdateWarningThresholdRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/tax-periods/annual-revenue-tracking/warning-threshold")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.warningThresholdPercentage").value(85.00))
                .andExpect(jsonPath("$.result.warningRevenueAmount").value(850000000.00));
    }

    @Test
    @DisplayName("API PUT /warning-threshold: Thất bại khi truyền tỷ lệ < 50.0% (Validation error)")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void updateWarningThreshold_ValidationError() throws Exception {
        UpdateWarningThresholdRequest request = UpdateWarningThresholdRequest.builder()
                .warningThresholdPercentage(new BigDecimal("35.00"))
                .build();

        mockMvc.perform(put("/api/v1/tax-periods/annual-revenue-tracking/warning-threshold")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}

