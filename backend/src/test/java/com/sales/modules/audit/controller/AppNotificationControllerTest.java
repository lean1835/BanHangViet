package com.sales.modules.audit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.common.constant.NotificationTypeConstant;
import com.sales.modules.audit.dto.request.BatchUpdateNotificationSettingsRequest;
import com.sales.modules.audit.dto.request.UpdateNotificationSettingRequest;
import com.sales.modules.audit.dto.response.AppNotificationResponse;
import com.sales.modules.audit.dto.response.NotificationBadgeCountResponse;
import com.sales.modules.audit.dto.response.NotificationSettingItemResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.audit.service.AppNotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AppNotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AppNotificationService appNotificationService;

    @Test
    @DisplayName("API GET /notifications: Xem danh sách thông báo thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getNotifications_Success() throws Exception {
        AppNotificationResponse notif = AppNotificationResponse.builder()
                .id("notif-1")
                .notificationType(NotificationTypeConstant.INVOICE_ERROR)
                .notificationCategory("HÓA ĐƠN ĐIỆN TỬ")
                .severity("DANGER")
                .title("Cảnh báo: Hóa đơn lỗi")
                .message("Lỗi gửi CQT")
                .actionUrl("/e-invoices?id=inv-1")
                .isRead(false)
                .isClosed(false)
                .createdAt(LocalDateTime.now())
                .build();

        PageResponse<AppNotificationResponse> pageResponse = PageResponse.<AppNotificationResponse>builder()
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .content(List.of(notif))
                .build();

        when(appNotificationService.getNotifications(eq("owner_test"), any(), eq(0), eq(10)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/notifications")
                        .param("page", "0")
                        .param("size", "10")
                        .param("severity", "DANGER")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray())
                .andExpect(jsonPath("$.result.content[0].notificationType").value(NotificationTypeConstant.INVOICE_ERROR));
    }

    @Test
    @DisplayName("API GET /notifications/badge-count: Lấy số lượng việc chưa xử lý trên Header Bar")
    @WithMockUser(username = "cashier_test", roles = {"VT-02"})
    void getBadgeCount_Success() throws Exception {
        NotificationBadgeCountResponse badge = NotificationBadgeCountResponse.builder()
                .unreadCount(2)
                .unclosedCount(3)
                .dangerCount(1)
                .warningCount(2)
                .build();

        when(appNotificationService.getBadgeCount(eq("cashier_test"))).thenReturn(badge);

        mockMvc.perform(get("/api/v1/notifications/badge-count")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.unreadCount").value(2))
                .andExpect(jsonPath("$.result.unclosedCount").value(3))
                .andExpect(jsonPath("$.result.dangerCount").value(1));
    }

    @Test
    @DisplayName("API PUT /notifications/{id}/mark-as-read: Đánh dấu đã đọc thông báo")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void markAsRead_Success() throws Exception {
        doNothing().when(appNotificationService).markNotificationAsRead("owner_test", "notif-1");

        mockMvc.perform(put("/api/v1/notifications/notif-1/mark-as-read")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @DisplayName("API PUT /notifications/mark-all-as-read: Đánh dấu tất cả đã đọc")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void markAllAsRead_Success() throws Exception {
        when(appNotificationService.markAllAsRead("owner_test")).thenReturn(4);

        mockMvc.perform(put("/api/v1/notifications/mark-all-as-read")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.updatedCount").value(4));
    }

    @Test
    @DisplayName("API GET /notifications/settings: Lấy danh sách cấu hình bật/tắt nhận tin")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getNotificationSettings_Success() throws Exception {
        NotificationSettingItemResponse item = NotificationSettingItemResponse.builder()
                .notificationType(NotificationTypeConstant.INVOICE_ERROR)
                .title("Hóa đơn gửi lỗi")
                .category("HÓA ĐƠN ĐIỆN TỬ")
                .isEnabled(true)
                .isMandatory(true)
                .build();

        when(appNotificationService.getNotificationSettings("owner_test")).thenReturn(List.of(item));

        mockMvc.perform(get("/api/v1/notifications/settings")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].notificationType").value(NotificationTypeConstant.INVOICE_ERROR));
    }

    @Test
    @DisplayName("API PUT /notifications/settings: Cập nhật cấu hình nhận tin thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void updateNotificationSettings_Success() throws Exception {
        BatchUpdateNotificationSettingsRequest request = BatchUpdateNotificationSettingsRequest.builder()
                .settings(List.of(
                        UpdateNotificationSettingRequest.builder()
                                .notificationType(NotificationTypeConstant.LOW_STOCK_WARNING)
                                .isEnabled(false)
                                .build()
                ))
                .build();

        doNothing().when(appNotificationService).updateNotificationSettingsBatch(eq("owner_test"), any());

        mockMvc.perform(put("/api/v1/notifications/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @DisplayName("API POST /notifications/sync-reminders: Đồng bộ và quét cảnh báo thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void syncReminders_Success() throws Exception {
        when(appNotificationService.syncReminders("owner_test")).thenReturn(3);

        mockMvc.perform(post("/api/v1/notifications/sync-reminders")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.syncedCount").value(3));
    }
}
