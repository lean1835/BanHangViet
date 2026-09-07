package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.RevokeAllSessionsRequest;
import com.sales.dto.request.RevokeSessionRequest;
import com.sales.dto.request.UpdateSessionSettingsRequest;
import com.sales.dto.response.SessionSettingsResponse;
import com.sales.dto.response.UserSessionResponse;
import com.sales.service.interfaces.UserSessionService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class UserSessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserSessionService userSessionService;

    @Test
    @DisplayName("GET /api/v1/sessions - Chưa đăng nhập trả về 401 UNAUTHORIZED")
    public void getSessions_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/sessions"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(2002));
    }

    @Test
    @WithMockUser(username = "chuho_viet", roles = {"VT-01"})
    @DisplayName("GET /api/v1/sessions - Đã đăng nhập lấy danh sách phiên thành công 200 OK")
    public void getSessions_Authenticated_Success() throws Exception {
        UserSessionResponse sessionResp = UserSessionResponse.builder()
                .id("sess-001")
                .userId("user-001")
                .username("chuho_viet")
                .fullName("Nguyễn Văn Chủ Hộ")
                .roleCode("VT-01")
                .roleName("Chủ hộ kinh doanh")
                .deviceType("DESKTOP")
                .deviceName("Chrome trên Windows")
                .ipAddress("127.0.0.1")
                .loginAt(LocalDateTime.now().minusHours(1))
                .lastActiveAt(LocalDateTime.now().minusMinutes(2))
                .expiresAt(LocalDateTime.now().plusDays(1))
                .isRevoked(false)
                .isCurrentSession(true)
                .build();

        when(userSessionService.getSessions("chuho_viet")).thenReturn(List.of(sessionResp));

        mockMvc.perform(get("/api/v1/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].id").value("sess-001"))
                .andExpect(jsonPath("$.result[0].username").value("chuho_viet"))
                .andExpect(jsonPath("$.result[0].deviceType").value("DESKTOP"))
                .andExpect(jsonPath("$.result[0].isCurrentSession").value(true));
    }

    @Test
    @WithMockUser(username = "chuho_viet", roles = {"VT-01"})
    @DisplayName("POST /api/v1/sessions/{sessionId}/revoke - Đăng xuất từ xa 1 phiên thành công 200 OK")
    public void revokeSession_Success() throws Exception {
        RevokeSessionRequest request = RevokeSessionRequest.builder()
                .reason("Thiết bị lạ")
                .build();

        doNothing().when(userSessionService).revokeSession(eq("sess-001"), eq("Thiết bị lạ"), eq("chuho_viet"));

        mockMvc.perform(post("/api/v1/sessions/sess-001/revoke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Đăng xuất phiên làm việc từ xa thành công"));
    }

    @Test
    @WithMockUser(username = "chuho_viet", roles = {"VT-01"})
    @DisplayName("POST /api/v1/sessions/users/{userId}/revoke-all - Đăng xuất toàn bộ phiên thành công 200 OK")
    public void revokeAllSessions_Success() throws Exception {
        RevokeAllSessionsRequest request = RevokeAllSessionsRequest.builder()
                .reason("Nhân viên thôi việc")
                .build();

        doNothing().when(userSessionService).revokeAllSessionsForUser(eq("user-999"), eq("Nhân viên thôi việc"), eq("chuho_viet"));

        mockMvc.perform(post("/api/v1/sessions/users/user-999/revoke-all")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Đăng xuất toàn bộ phiên làm việc của người dùng thành công"));
    }

    @Test
    @WithMockUser(username = "chuho_viet", roles = {"VT-01"})
    @DisplayName("GET /api/v1/sessions/settings - Lấy cấu hình phiên thành công 200 OK")
    public void getSessionSettings_Success() throws Exception {
        SessionSettingsResponse response = SessionSettingsResponse.builder()
                .householdId("hh-001")
                .sessionTimeoutMinutes(60)
                .build();

        when(userSessionService.getSessionSettings("chuho_viet")).thenReturn(response);

        mockMvc.perform(get("/api/v1/sessions/settings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.householdId").value("hh-001"))
                .andExpect(jsonPath("$.result.sessionTimeoutMinutes").value(60));
    }

    @Test
    @WithMockUser(username = "chuho_viet", roles = {"VT-01"})
    @DisplayName("PUT /api/v1/sessions/settings - Cập nhật cấu hình phiên thành công 200 OK")
    public void updateSessionSettings_Success() throws Exception {
        UpdateSessionSettingsRequest request = UpdateSessionSettingsRequest.builder()
                .sessionTimeoutMinutes(120)
                .build();

        SessionSettingsResponse response = SessionSettingsResponse.builder()
                .householdId("hh-001")
                .sessionTimeoutMinutes(120)
                .build();

        when(userSessionService.updateSessionSettings(eq("chuho_viet"), any())).thenReturn(response);

        mockMvc.perform(put("/api/v1/sessions/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.sessionTimeoutMinutes").value(120));
    }

    @Test
    @WithMockUser(username = "chuho_viet", roles = {"VT-01"})
    @DisplayName("PUT /api/v1/sessions/settings - Thời gian timeout < 5 phút trả về 400 BAD_REQUEST")
    public void updateSessionSettings_InvalidMinutes() throws Exception {
        UpdateSessionSettingsRequest request = UpdateSessionSettingsRequest.builder()
                .sessionTimeoutMinutes(2)
                .build();

        mockMvc.perform(put("/api/v1/sessions/settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "nhanvien_pos", roles = {"VT-02"})
    @DisplayName("GET /api/v1/sessions/settings - Nhân viên bán hàng (VT-02) bị chặn 403 FORBIDDEN")
    public void getSessionSettings_Staff_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/sessions/settings"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "nhanvien_pos", roles = {"VT-02"})
    @DisplayName("POST /api/v1/sessions/users/{userId}/revoke-all - Nhân viên (VT-02) bị chặn 403 FORBIDDEN")
    public void revokeAllSessions_Staff_Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/sessions/users/user-123/revoke-all"))
                .andExpect(status().isForbidden());
    }
}
