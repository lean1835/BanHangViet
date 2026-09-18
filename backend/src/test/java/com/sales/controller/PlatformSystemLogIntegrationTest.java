package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.IncidentStatus;
import com.sales.constant.PlatformLogSeverity;
import com.sales.dto.response.PlatformIncidentResponse;
import com.sales.entity.PlatformSystemLog;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.PlatformIncidentRepository;
import com.sales.repository.PlatformSystemLogRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.PlatformSystemLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PlatformSystemLogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PlatformSystemLogRepository logRepository;

    @Autowired
    private PlatformIncidentRepository incidentRepository;

    @Autowired
    private PlatformSystemLogService logService;

    private User platformAdmin;
    private User householdOwner;

    @BeforeEach
    public void setUp() {
        Role adminRole = roleRepository.findByCode("VT-04").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-04").name("Quản trị nền tảng").build()));
        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build()));

        platformAdmin = userRepository.findByUsername("admin_logs").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("admin_logs")
                        .passwordHash("hashed")
                        .fullName("Quản Trị Logs")
                        .role(adminRole)
                        .isActive(true)
                        .build()));

        householdOwner = userRepository.findByUsername("owner_nologs").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("owner_nologs")
                        .passwordHash("hashed")
                        .fullName("Chủ Hộ Không Quyền Xem Logs")
                        .role(ownerRole)
                        .isActive(true)
                        .build()));
    }

    @Test
    @WithMockUser(username = "admin_logs", roles = {"VT-04"})
    @DisplayName("TC-01: Quản trị nền tảng truy vấn nhật ký toàn hệ thống với bộ lọc")
    public void queryLogs_Success() throws Exception {
        logService.logSystemEvent("SECURITY_ALERT", PlatformLogSeverity.INFO, null, "SEC_001", "Service started", "{\"version\":\"1.0\"}");
        logService.logSystemEvent("TAX_SERVICE_OFFLINE", PlatformLogSeverity.WARNING, null, "TAX_001", "Gateway slow response", "{\"latencyMs\":4500}");

        mockMvc.perform(get("/api/v1/platform/system-logs?severity=WARNING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray())
                .andExpect(jsonPath("$.result.content[0].severity").value("WARNING"))
                .andExpect(jsonPath("$.result.content[0].eventType").value("TAX_SERVICE_OFFLINE"));
    }

    @Test
    @WithMockUser(username = "admin_logs", roles = {"VT-04"})
    @DisplayName("TC-03: Xem chi tiết nhật ký hệ thống kỹ thuật (chỉ chứa metadata kỹ thuật)")
    public void getLogDetail_Success() throws Exception {
        PlatformSystemLog saved = logService.logSystemEvent("TECHNICAL_ERROR", PlatformLogSeverity.ERROR, null, "DB_001", "Deadlock detected in transaction", "{\"table\":\"orders\",\"lockMode\":\"X\"}");

        mockMvc.perform(get("/api/v1/platform/system-logs/" + saved.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(saved.getId()))
                .andExpect(jsonPath("$.result.technicalMessage").value("Deadlock detected in transaction"))
                .andExpect(jsonPath("$.result.technicalMetadata").isNotEmpty());
    }

    @Test
    @WithMockUser(username = "admin_logs", roles = {"VT-04"})
    @DisplayName("TC-02: Tự động gom nhóm và tạo sự cố diện rộng khi vượt ngưỡng CRITICAL errors (5 lỗi trong 10 phút)")
    public void recordLog_TriggersIncidentOnThreshold() {
        // Record 5 CRITICAL errors on tax gateway
        for (int i = 0; i < 5; i++) {
            logService.logSystemEvent(
                    "TAX_SERVICE_OFFLINE",
                    PlatformLogSeverity.CRITICAL,
                    null,
                    "TAX_CRIT_00" + (i + 1),
                    "Cổng Thuế TCT mất kết nối lần " + (i + 1),
                    "{\"error\":\"Connection timeout after 30s\"}"
            );
        }

        List<PlatformIncidentResponse> incidents = logService.getIncidents("admin_logs");
        assertFalse(incidents.isEmpty(), "Hệ thống phải tự động tạo ít nhất 1 incident khi có 5 lỗi CRITICAL liên tiếp");
        PlatformIncidentResponse incident = incidents.get(0);
        assertEquals(IncidentStatus.INVESTIGATING, incident.getStatus());
        assertTrue(incident.getTitle().contains("Sự cố diện rộng"));
        assertEquals(5, incident.getErrorThresholdCount());
    }

    @Test
    @WithMockUser(username = "owner_nologs", roles = {"VT-01"})
    @DisplayName("Người dùng không phải quản trị nền tảng không có quyền xem nhật ký -> 403 Forbidden")
    public void nonPlatformAdmin_CannotAccessLogs() throws Exception {
        mockMvc.perform(get("/api/v1/platform/system-logs"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("ISSUE-09 (P3): Cắt chuỗi an toàn không lỗi DataTruncation khi technicalMessage dài hơn 500 ký tự")
    public void logSystemEvent_SafeTruncate_Success() {
        String longMessage = "A".repeat(1200); // 1200 characters > 500
        PlatformSystemLog log = logService.logSystemEvent(
                "TEST_OVERLENGTH",
                PlatformLogSeverity.INFO,
                null,
                "ERR_LEN",
                longMessage,
                "{}"
        );

        assertNotNull(log);
        assertNotNull(log.getId());
        assertEquals(500, log.getMessage().length(), "Tin nhắn phải được cắt ngắn về tối đa 500 ký tự");
    }
}
