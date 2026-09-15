package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.BackupTriggerType;
import com.sales.constant.BackupType;
import com.sales.dto.request.TriggerVerificationRequest;
import com.sales.entity.BackupHistory;
import com.sales.entity.BackupVerificationHistory;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BackupHistoryRepository;
import com.sales.repository.BackupVerificationHistoryRepository;
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

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class BackupVerificationControllerTest {

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

    @Autowired
    private BackupVerificationHistoryRepository verificationHistoryRepository;

    @MockBean
    private ActivityLogHelper activityLogHelper;

    private User ownerUser;
    private User staffUser;
    private BackupHistory validBackup;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() throws Exception {
        household = householdRepository.save(BusinessHousehold.builder()
                .taxCode("TAX-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Hộ Kinh Doanh BVH Controller Test")
                .address("123 Lê Duẩn, Q1")
                .phoneNumber("093" + (int)(Math.random() * 10000000))
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));
        Role staffRole = roleRepository.findByCode("VT-02").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-02").name("Nhân viên").build()));

        ownerUser = userRepository.save(User.builder()
                .username("owner_bvh_user")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuvwx")
                .fullName("Chủ Hộ Kiểm Chứng")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build());

        staffUser = userRepository.save(User.builder()
                .username("staff_bvh_user")
                .passwordHash("$2a$10$abcdefghijklmnopqrstuvwx")
                .fullName("Nhân Viên Bán Hàng")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build());

        // Tạo tệp sao lưu snapshot JSON thật trên thư mục backups/{householdId}
        Path backupDir = Path.of("backups", household.getId());
        Files.createDirectories(backupDir);
        Path diskPath = backupDir.resolve("backup_full_test.json");
        Map<String, Object> snapshotData = Map.of(
                "householdId", household.getId(),
                "backupTime", LocalDateTime.now().toString(),
                "products", java.util.List.of(Map.of("id", "p1", "name", "Bia")),
                "customers", java.util.List.of(),
                "suppliers", java.util.List.of(),
                "users", java.util.List.of()
        );
        Files.writeString(diskPath, objectMapper.writeValueAsString(snapshotData), StandardCharsets.UTF_8);

        validBackup = backupHistoryRepository.save(BackupHistory.builder()
                .household(household)
                .createdByUser(ownerUser)
                .fileName("backup_full_test")
                .filePath(diskPath.toString().replace("\\", "/"))
                .fileSize(Files.size(diskPath))
                .backupType(BackupType.FULL)
                .triggerType(BackupTriggerType.AUTOMATIC)
                .status("SUCCESS")
                .backupTime(LocalDateTime.now())
                .build());
    }

    @Test
    @WithMockUser(username = "owner_bvh_user", roles = "VT-01")
    @DisplayName("GET /status: Chủ hộ lấy tổng quan trạng thái kiểm chứng thành công")
    void testGetVerificationStatus_Owner_Success() throws Exception {
        mockMvc.perform(get("/api/v1/backup-verification/status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").exists())
                .andExpect(jsonPath("$.result.maxAllowedDaysWithoutVerification").value(7))
                .andExpect(jsonPath("$.result.isOverdue").value(true)) // ban đầu chưa kiểm chứng nên isOverdue = true
                .andExpect(jsonPath("$.result.overallHealthStatus").value("WARNING"));
    }

    @Test
    @WithMockUser(username = "staff_bvh_user", roles = "VT-02")
    @DisplayName("GET /status: Nhân viên bán hàng bị cấm truy cập (403 Forbidden)")
    void testGetVerificationStatus_Staff_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/backup-verification/status"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner_bvh_user", roles = "VT-01")
    @DisplayName("POST /trigger: Chủ hộ kích hoạt thử phục hồi bản sao lưu vào môi trường tạm thành công")
    void testTriggerVerification_Owner_Success() throws Exception {
        TriggerVerificationRequest request = TriggerVerificationRequest.builder()
                .notes("Chủ hộ kiểm thử định kỳ trước báo cáo thuế")
                .build();

        mockMvc.perform(post("/api/v1/backup-verification/trigger")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("PASSED"))
                .andExpect(jsonPath("$.result.checkedFileReadable").value(true))
                .andExpect(jsonPath("$.result.checkedRecordCountsMatched").value(true))
                .andExpect(jsonPath("$.result.checkedAuditChainIntact").value(true))
                .andExpect(jsonPath("$.result.triggerType").value("MANUAL"));
    }

    @Test
    @WithMockUser(username = "staff_bvh_user", roles = "VT-02")
    @DisplayName("POST /trigger: Nhân viên bán hàng bị cấm kích hoạt (403 Forbidden)")
    void testTriggerVerification_Staff_Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/backup-verification/trigger")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner_bvh_user", roles = "VT-01")
    @DisplayName("POST /trigger: Ghi chú vượt quá 1000 ký tự bị từ chối 400 Bad Request")
    void testTriggerVerification_InvalidNotes_BadRequest() throws Exception {
        String longNotes = "a".repeat(1001);
        TriggerVerificationRequest request = TriggerVerificationRequest.builder()
                .notes(longNotes)
                .build();

        mockMvc.perform(post("/api/v1/backup-verification/trigger")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "owner_bvh_user", roles = "VT-01")
    @DisplayName("GET /histories: Chủ hộ tra cứu danh sách lịch sử thử phục hồi phân trang thành công")
    void testGetVerificationHistories_Owner_Success() throws Exception {
        // Tạo sẵn một bản ghi lịch sử kiểm chứng
        verificationHistoryRepository.save(BackupVerificationHistory.builder()
                .household(household)
                .backupHistory(validBackup)
                .backupFileName(validBackup.getFileName())
                .backupTime(LocalDateTime.now())
                .fileSize(1024L)
                .status("PASSED")
                .executionDurationMs(350L)
                .verifiedAt(LocalDateTime.now())
                .checkedFileReadable(true)
                .checkedRecordCountsMatched(true)
                .checkedAuditChainIntact(true)
                .triggerType("AUTOMATIC")
                .build());

        mockMvc.perform(get("/api/v1/backup-verification/histories?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray())
                .andExpect(jsonPath("$.result.content[0].status").value("PASSED"))
                .andExpect(jsonPath("$.result.totalElements").value(1));
    }

    @Test
    @WithMockUser(username = "staff_bvh_user", roles = "VT-02")
    @DisplayName("GET /histories: Nhân viên bán hàng bị cấm truy cập (403 Forbidden)")
    void testGetVerificationHistories_Staff_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/backup-verification/histories?page=0&size=10"))
                .andExpect(status().isForbidden());
    }
}
