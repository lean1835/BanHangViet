package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.UpdateTaxReminderSettingsRequest;
import com.sales.dto.response.TaxPeriodChecklistResponse;
import com.sales.dto.response.TaxPeriodReminderResponse;
import com.sales.dto.response.TaxReminderScanResultResponse;
import com.sales.dto.response.TaxReminderSettingsResponse;
import com.sales.service.interfaces.TaxReminderService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class TaxPeriodReminderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TaxReminderService taxReminderService;

    @Test
    @DisplayName("GET /reminder-settings: Chủ hộ (VT-01) xem cấu hình thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getReminderSettings_Owner_Success() throws Exception {
        TaxReminderSettingsResponse mockResp = TaxReminderSettingsResponse.builder()
                .householdId("hh-1")
                .householdName("Tạp Hóa Việt")
                .taxPeriodType("QUARTERLY")
                .taxReminderDaysBefore(5)
                .taxReminderEnabled(true)
                .updatedAt(LocalDateTime.now())
                .build();

        when(taxReminderService.getReminderSettings("owner_test")).thenReturn(mockResp);

        mockMvc.perform(get("/api/v1/tax-periods/reminder-settings"))
                .andExpect(status().isOk())
                .andExpect(jsonExpect(1000, "Lấy cấu hình nhắc lịch nộp tờ khai thành công"))
                .andExpect(jsonPath("$.result.taxPeriodType").value("QUARTERLY"))
                .andExpect(jsonPath("$.result.taxReminderDaysBefore").value(5))
                .andExpect(jsonPath("$.result.taxReminderEnabled").value(true));
    }

    @Test
    @DisplayName("GET /reminder-settings: Kế toán (VT-03) xem cấu hình thành công")
    @WithMockUser(username = "acc_test", roles = {"VT-03"})
    void getReminderSettings_Accountant_Success() throws Exception {
        TaxReminderSettingsResponse mockResp = TaxReminderSettingsResponse.builder()
                .householdId("hh-1")
                .taxPeriodType("QUARTERLY")
                .taxReminderDaysBefore(5)
                .taxReminderEnabled(true)
                .build();

        when(taxReminderService.getReminderSettings("acc_test")).thenReturn(mockResp);

        mockMvc.perform(get("/api/v1/tax-periods/reminder-settings"))
                .andExpect(status().isOk())
                .andExpect(jsonExpect(1000, "Lấy cấu hình nhắc lịch nộp tờ khai thành công"));
    }

    @Test
    @DisplayName("GET /reminder-settings: Nhân viên bán hàng (VT-02) bị chặn 403 Forbidden")
    @WithMockUser(username = "cashier_test", roles = {"VT-02"})
    void getReminderSettings_Cashier_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/tax-periods/reminder-settings"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /reminder-settings: Quản trị nền tảng (VT-04) bị chặn 403 Forbidden theo HIGH-01")
    @WithMockUser(username = "admin_test", roles = {"VT-04"})
    void getReminderSettings_PlatformAdmin_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/tax-periods/reminder-settings"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /reminder-settings: Chủ hộ (VT-01) cập nhật thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void updateReminderSettings_Owner_Success() throws Exception {
        UpdateTaxReminderSettingsRequest request = UpdateTaxReminderSettingsRequest.builder()
                .taxPeriodType("MONTHLY")
                .taxReminderDaysBefore(7)
                .taxReminderEnabled(true)
                .build();

        TaxReminderSettingsResponse mockResp = TaxReminderSettingsResponse.builder()
                .householdId("hh-1")
                .taxPeriodType("MONTHLY")
                .taxReminderDaysBefore(7)
                .taxReminderEnabled(true)
                .build();

        when(taxReminderService.updateReminderSettings(eq("owner_test"), any(UpdateTaxReminderSettingsRequest.class)))
                .thenReturn(mockResp);

        mockMvc.perform(put("/api/v1/tax-periods/reminder-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonExpect(1000, "Cập nhật cấu hình nhắc lịch nộp tờ khai thành công"))
                .andExpect(jsonPath("$.result.taxPeriodType").value("MONTHLY"))
                .andExpect(jsonPath("$.result.taxReminderDaysBefore").value(7));
    }

    @Test
    @DisplayName("PUT /reminder-settings: Kế toán (VT-03) bị chặn 403 Forbidden")
    @WithMockUser(username = "acc_test", roles = {"VT-03"})
    void updateReminderSettings_Accountant_Forbidden() throws Exception {
        UpdateTaxReminderSettingsRequest request = UpdateTaxReminderSettingsRequest.builder()
                .taxPeriodType("MONTHLY")
                .taxReminderDaysBefore(7)
                .taxReminderEnabled(true)
                .build();

        mockMvc.perform(put("/api/v1/tax-periods/reminder-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /reminder-settings: Validation thất bại khi daysBefore < 1 -> 400 Bad Request")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void updateReminderSettings_Validation_MinDays() throws Exception {
        UpdateTaxReminderSettingsRequest request = UpdateTaxReminderSettingsRequest.builder()
                .taxPeriodType("QUARTERLY")
                .taxReminderDaysBefore(0)
                .taxReminderEnabled(true)
                .build();

        mockMvc.perform(put("/api/v1/tax-periods/reminder-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /reminder-settings: Validation thất bại khi periodType không hợp lệ -> 400 Bad Request")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void updateReminderSettings_Validation_InvalidPeriodType() throws Exception {
        UpdateTaxReminderSettingsRequest request = UpdateTaxReminderSettingsRequest.builder()
                .taxPeriodType("YEARLY")
                .taxReminderDaysBefore(5)
                .taxReminderEnabled(true)
                .build();

        mockMvc.perform(put("/api/v1/tax-periods/reminder-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /reminders: Xem danh sách nhắc nhở thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getActiveReminders_Success() throws Exception {
        TaxPeriodChecklistResponse checklist = TaxPeriodChecklistResponse.builder()
                .salesRegisterGenerated(true)
                .salesRegisterUrl("/reports/tax-sales-invoices?periodId=p1")
                .purchaseRegisterGenerated(false)
                .purchaseRegisterUrl("/reports/tax-declaration?tab=purchase-register&periodId=p1")
                .declarationExported(false)
                .declarationExportUrl("/reports/tax-declaration?tab=declaration&periodId=p1")
                .periodLocked(false)
                .periodLockUrl("/reports/tax-declaration")
                .build();

        TaxPeriodReminderResponse reminder = TaxPeriodReminderResponse.builder()
                .periodId("p1")
                .periodName("Bảng kê hóa đơn bán ra Quý 1 năm 2026")
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(1)
                .startDate(LocalDate.of(2026, 1, 1))
                .endDate(LocalDate.of(2026, 3, 31))
                .filingDeadline(LocalDate.of(2026, 4, 30))
                .daysRemaining(4)
                .isOverdue(false)
                .severity("WARNING")
                .status("GENERATED")
                .isClosed(false)
                .checklist(checklist)
                .title("Nhắc lịch nộp tờ khai Quý 1 năm 2026 (Còn 4 ngày)")
                .message("Hạn nộp là ngày 30/04/2026")
                .actionUrl("/reports/tax-declaration?periodId=p1")
                .build();

        when(taxReminderService.getActiveReminders("owner_test")).thenReturn(List.of(reminder));

        mockMvc.perform(get("/api/v1/tax-periods/reminders"))
                .andExpect(status().isOk())
                .andExpect(jsonExpect(1000, "Lấy danh sách nhắc lịch nộp tờ khai thành công"))
                .andExpect(jsonPath("$.result[0].periodId").value("p1"))
                .andExpect(jsonPath("$.result[0].severity").value("WARNING"))
                .andExpect(jsonPath("$.result[0].checklist.salesRegisterGenerated").value(true));
    }

    @Test
    @DisplayName("POST /reminders/trigger-scan: Kích hoạt quét thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void triggerScanReminders_Success() throws Exception {
        TaxReminderScanResultResponse scanResult = TaxReminderScanResultResponse.builder()
                .householdsScanned(1)
                .notificationsCreated(1)
                .notificationsUpdated(0)
                .notificationsClosed(0)
                .activeReminders(List.of())
                .build();

        when(taxReminderService.triggerScanReminders("owner_test")).thenReturn(scanResult);

        mockMvc.perform(post("/api/v1/tax-periods/reminders/trigger-scan"))
                .andExpect(status().isOk())
                .andExpect(jsonExpect(1000, "Quét và cập nhật nhắc lịch nộp tờ khai thành công"))
                .andExpect(jsonPath("$.result.householdsScanned").value(1))
                .andExpect(jsonPath("$.result.notificationsCreated").value(1));
    }

    private org.springframework.test.web.servlet.ResultMatcher jsonExpect(int code, String message) {
        return result -> {
            jsonPath("$.code").value(code).match(result);
            jsonPath("$.message").value(message).match(result);
        };
    }
}
