package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.BackupTriggerType;
import com.sales.constant.BackupType;
import com.sales.dto.request.RestoreDataRequest;
import com.sales.entity.BackupHistory;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BackupHistoryRepository;
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

import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class RestoreControllerTest {

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

    @Autowired
    private BackupHistoryRepository backupHistoryRepository;

    @MockBean
    private ActivityLogHelper activityLogHelper;

    private User ownerUser;
    private User staffUser;
    private BackupHistory validBackup;
    private BackupHistory purgedBackup;

    @BeforeEach
    void setUp() {
        BusinessHousehold household = householdRepository.save(BusinessHousehold.builder()
                .taxCode("TAX-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Hộ Kinh Doanh Restore Controller Test")
                .address("789 Hai Bà Trưng, Q1")
                .phoneNumber("092" + (int)(Math.random() * 10000000))
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));
        Role staffRole = roleRepository.findByCode("VT-02").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-02").name("Nhân viên").build()));

        ownerUser = userRepository.save(User.builder()
                .username("owner_restore_user")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuu")
                .fullName("Chủ Hộ Restore Test")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build());

        staffUser = userRepository.save(User.builder()
                .username("staff_restore_user")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuu")
                .fullName("Nhân Viên Restore Test")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build());

        validBackup = backupHistoryRepository.save(BackupHistory.builder()
                .household(household)
                .createdByUser(ownerUser)
                .fileName("backup_full_test_20260915.zip")
                .filePath("/backups/test.zip")
                .fileSize(1024L * 100L)
                .backupType(BackupType.FULL)
                .triggerType(BackupTriggerType.MANUAL)
                .status("SUCCESS")
                .backupTime(LocalDateTime.now().minusDays(1))
                .build());

        purgedBackup = backupHistoryRepository.save(BackupHistory.builder()
                .household(household)
                .createdByUser(ownerUser)
                .fileName("backup_full_purged.zip")
                .filePath("/backups/purged.zip")
                .fileSize(1024L * 100L)
                .backupType(BackupType.FULL)
                .triggerType(BackupTriggerType.AUTOMATIC)
                .status("PURGED")
                .backupTime(LocalDateTime.now().minusMonths(1))
                .build());
    }

    @Test
    @WithMockUser(username = "owner_restore_user", roles = "VT-01")
    @DisplayName("API GET /api/v1/restore/backups - Lấy danh sách bản sao lưu khả dụng thành công")
    void testGetAvailableBackups_AsOwner_Success() throws Exception {
        mockMvc.perform(get("/api/v1/restore/backups"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray());
    }

    @Test
    @WithMockUser(username = "owner_restore_user", roles = "VT-01")
    @DisplayName("API GET /api/v1/restore/preview/{id} - Xem trước thông tin bản sao lưu thành công")
    void testPreviewBackup_AsOwner_Success() throws Exception {
        mockMvc.perform(get("/api/v1/restore/preview/" + validBackup.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.backupHistoryId").value(validBackup.getId()))
                .andExpect(jsonPath("$.result.isEligibleForRestore").value(true));
    }

    @Test
    @WithMockUser(username = "owner_restore_user", roles = "VT-01")
    @DisplayName("API POST /api/v1/restore/execute - Thực hiện phục hồi dữ liệu thành công (TC-01)")
    void testExecuteRestore_AsOwner_Success() throws Exception {
        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(validBackup.getId())
                .confirm(true)
                .notes("Phục hồi thử nghiệm kịch bản TC-01")
                .build();

        mockMvc.perform(post("/api/v1/restore/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("SUCCESS"))
                .andExpect(jsonPath("$.result.backupFileName").value(validBackup.getFileName()));
    }

    @Test
    @WithMockUser(username = "owner_restore_user", roles = "VT-01")
    @DisplayName("API POST /api/v1/restore/execute - Bản sao lưu PURGED -> 400 Bad Request (TC-02)")
    void testExecuteRestore_PurgedBackup_BadRequest() throws Exception {
        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(purgedBackup.getId())
                .confirm(true)
                .build();

        mockMvc.perform(post("/api/v1/restore/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(5031));
    }

    @Test
    @WithMockUser(username = "owner_restore_user", roles = "VT-01")
    @DisplayName("API POST /api/v1/restore/execute - Chưa xác nhận (confirm=false) -> 400 Validation Error")
    void testExecuteRestore_NotConfirmed_BadRequest() throws Exception {
        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(validBackup.getId())
                .confirm(false)
                .build();

        mockMvc.perform(post("/api/v1/restore/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "staff_restore_user", roles = "VT-02")
    @DisplayName("API POST /api/v1/restore/execute - Vai trò Nhân viên (VT-02) -> 403 Forbidden (TC-03)")
    void testExecuteRestore_AsStaff_Forbidden() throws Exception {
        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(validBackup.getId())
                .confirm(true)
                .build();

        mockMvc.perform(post("/api/v1/restore/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "accountant_restore_user", roles = "VT-03")
    @DisplayName("API POST /api/v1/restore/execute - Vai trò Kế toán (VT-03) -> 403 Forbidden (TC-03)")
    void testExecuteRestore_AsAccountant_Forbidden() throws Exception {
        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(validBackup.getId())
                .confirm(true)
                .build();

        mockMvc.perform(post("/api/v1/restore/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin_restore_user", roles = "VT-04")
    @DisplayName("API POST /api/v1/restore/execute - Vai trò Quản trị nền tảng (VT-04) -> 403 Forbidden (TC-03)")
    void testExecuteRestore_AsPlatformAdmin_Forbidden() throws Exception {
        RestoreDataRequest request = RestoreDataRequest.builder()
                .backupHistoryId(validBackup.getId())
                .confirm(true)
                .build();

        mockMvc.perform(post("/api/v1/restore/execute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }


    @Test
    @WithMockUser(username = "owner_restore_user", roles = "VT-01")
    @DisplayName("API GET /api/v1/restore/histories - Lấy danh sách lịch sử phục hồi thành công")
    void testGetRestoreHistories_AsOwner_Success() throws Exception {
        mockMvc.perform(get("/api/v1/restore/histories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray());
    }
}
