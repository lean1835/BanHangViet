package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.UpdateAutoRetrySettingsRequest;
import com.sales.dto.response.AutoRetrySettingsResponse;
import com.sales.service.interfaces.BusinessHouseholdSettingsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class HouseholdSettingsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BusinessHouseholdSettingsService settingsService;

    @Test
    @DisplayName("GET /api/v1/household/settings - Chưa đăng nhập trả về 401 UNAUTHORIZED")
    void getSettings_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/household/settings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("GET /api/v1/household/settings - VT-02 có quyền xem cài đặt -> 200 OK")
    void getSettings_SuccessForVT02() throws Exception {
        AutoRetrySettingsResponse response = AutoRetrySettingsResponse.builder()
                .id("set-1")
                .householdId("hh-1")
                .autoRetryEnabled(true)
                .maxRetryAttempts(3)
                .retryIntervalMinutes(15)
                .maxRetryHoursDeadline(24)
                .build();

        when(settingsService.getSettings("nhanvien_test")).thenReturn(response);

        mockMvc.perform(get("/api/v1/household/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.maxRetryAttempts").value(3));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("PUT /api/v1/household/settings - VT-02 không có quyền cập nhật -> 403 FORBIDDEN")
    void updateSettings_ForbiddenForVT02() throws Exception {
        UpdateAutoRetrySettingsRequest request = new UpdateAutoRetrySettingsRequest();
        request.setAutoRetryEnabled(true);
        request.setMaxRetryAttempts(5);
        request.setRetryIntervalMinutes(30);
        request.setMaxRetryHoursDeadline(48);

        mockMvc.perform(put("/api/v1/household/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "chuho_test", roles = {"VT-01"})
    @DisplayName("PUT /api/v1/household/settings - VT-01 cập nhật thành công -> 200 OK")
    void updateSettings_SuccessForVT01() throws Exception {
        UpdateAutoRetrySettingsRequest request = new UpdateAutoRetrySettingsRequest();
        request.setAutoRetryEnabled(true);
        request.setMaxRetryAttempts(5);
        request.setRetryIntervalMinutes(30);
        request.setMaxRetryHoursDeadline(48);

        AutoRetrySettingsResponse response = AutoRetrySettingsResponse.builder()
                .id("set-1")
                .householdId("hh-1")
                .autoRetryEnabled(true)
                .maxRetryAttempts(5)
                .retryIntervalMinutes(30)
                .maxRetryHoursDeadline(48)
                .build();

        when(settingsService.updateSettings(eq("chuho_test"), any(UpdateAutoRetrySettingsRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/household/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.maxRetryAttempts").value(5))
                .andExpect(jsonPath("$.result.retryIntervalMinutes").value(30));
    }
}
