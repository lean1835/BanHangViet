package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.BackupType;
import com.sales.dto.request.UpdateBackupConfigRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AutoBackupControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BusinessHouseholdRepository householdRepository;

    @MockBean
    private ActivityLogHelper activityLogHelper;

    private User ownerUser;
    private User staffUser;

    @BeforeEach
    void setUp() {
        BusinessHousehold household = householdRepository.save(BusinessHousehold.builder()
                .taxCode("TAX-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Hộ Kinh Doanh AutoBackup Test")
                .address("456 Nguyễn Huệ, Q1")
                .phoneNumber("091" + (int)(Math.random() * 10000000))
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));
        Role staffRole = roleRepository.findByCode("VT-02").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-02").name("Nhân viên").build()));

        ownerUser = userRepository.save(User.builder()
                .username("owner_autobackup_user")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuu")
                .fullName("Chủ Hộ Auto Backup")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build());

        staffUser = userRepository.save(User.builder()
                .username("staff_autobackup_user")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuu")
                .fullName("Nhân Viên Bán Hàng Test")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build());
    }

    @Test
    @WithMockUser(username = "owner_autobackup_user", roles = "VT-01")
    @DisplayName("API GET /api/v1/auto-backup/config - Lấy cấu hình sao lưu tự động thành công")
    void testGetBackupConfig_AsOwner_Success() throws Exception {
        mockMvc.perform(get("/api/v1/auto-backup/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.scheduledTime").value("01:00"))
                .andExpect(jsonPath("$.result.retentionCount").value(7));
    }

    @Test
    @WithMockUser(username = "owner_autobackup_user", roles = "VT-01")
    @DisplayName("API PUT /api/v1/auto-backup/config - Cập nhật cấu hình sao lưu tự động thành công")
    void testUpdateBackupConfig_AsOwner_Success() throws Exception {
        UpdateBackupConfigRequest request = UpdateBackupConfigRequest.builder()
                .isAutoBackupEnabled(true)
                .scheduledTime("03:30")
                .retentionCount(14)
                .backupType(BackupType.FULL)
                .build();

        mockMvc.perform(put("/api/v1/auto-backup/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.scheduledTime").value("03:30"))
                .andExpect(jsonPath("$.result.retentionCount").value(14));
    }

    @Test
    @WithMockUser(username = "owner_autobackup_user", roles = "VT-01")
    @DisplayName("API POST /api/v1/auto-backup/trigger - Kích hoạt sao lưu dữ liệu thủ công thành công")
    void testTriggerManualBackup_AsOwner_Success() throws Exception {
        mockMvc.perform(post("/api/v1/auto-backup/trigger"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("SUCCESS"))
                .andExpect(jsonPath("$.result.triggerType").value("MANUAL"));
    }

    @Test
    @WithMockUser(username = "owner_autobackup_user", roles = "VT-01")
    @DisplayName("API GET /api/v1/auto-backup/status - Xem trạng thái tổng quan sao lưu thành công")
    void testGetBackupStatusOverview_AsOwner_Success() throws Exception {
        mockMvc.perform(get("/api/v1/auto-backup/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.isAutoBackupEnabled").value(true));
    }

    @Test
    @WithMockUser(username = "staff_autobackup_user", roles = "VT-02")
    @DisplayName("API POST /api/v1/auto-backup/trigger - Vai trò Nhân viên (VT-02) -> 403 Forbidden")
    void testTriggerManualBackup_AsStaff_Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/auto-backup/trigger"))
                .andExpect(status().isForbidden());
    }
}
