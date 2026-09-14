package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.HouseholdStatus;
import com.sales.dto.request.LockHouseholdRequest;
import com.sales.dto.request.LoginRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PlatformHouseholdLockIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private BusinessHousehold testHousehold;
    private User platformAdmin;
    private User householdOwner;

    @BeforeEach
    public void setUp() {
        Role adminRole = roleRepository.findByCode("VT-04").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-04").name("Quản trị nền tảng").build()));
        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build()));

        testHousehold = businessHouseholdRepository.findByTaxCode("8888888888").orElseGet(() ->
                businessHouseholdRepository.save(BusinessHousehold.builder()
                        .taxCode("8888888888")
                        .name("Hộ Kinh Doanh Khóa Test")
                        .address("999 Cầu Giấy, Hà Nội")
                        .phoneNumber("0988888888")
                        .status(HouseholdStatus.ACTIVE)
                        .build()));

        platformAdmin = userRepository.findByUsername("admin_sys").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("admin_sys")
                        .passwordHash(passwordEncoder.encode("admin123"))
                        .fullName("Quản Trị Nền Tảng")
                        .role(adminRole)
                        .isActive(true)
                        .build()));

        householdOwner = userRepository.findByUsername("owner_lock_test").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("owner_lock_test")
                        .passwordHash(passwordEncoder.encode("owner123"))
                        .fullName("Chủ Hộ Bị Khóa")
                        .role(ownerRole)
                        .household(testHousehold)
                        .isActive(true)
                        .build()));
    }

    @Test
    @WithMockUser(username = "admin_sys", roles = {"VT-04"})
    @DisplayName("NCL-01-CN-009 TC-01: Quản trị nền tảng lấy danh sách hộ kinh doanh")
    public void listHouseholds_Success() throws Exception {
        mockMvc.perform(get("/api/v1/platform/households"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray());
    }

    @Test
    @WithMockUser(username = "admin_sys", roles = {"VT-04"})
    @DisplayName("NCL-01-CN-009 TC-01: Quản trị nền tảng khóa hộ kinh doanh kèm lý do -> Cắt phiên & Đổi trạng thái LOCKED")
    public void lockHousehold_Success() throws Exception {
        LockHouseholdRequest request = LockHouseholdRequest.builder()
                .reason("Vi phạm chính sách thanh toán dịch vụ nền tảng")
                .build();

        mockMvc.perform(post("/api/v1/platform/households/" + testHousehold.getId() + "/lock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("LOCKED"))
                .andExpect(jsonPath("$.result.lockReason").value("Vi phạm chính sách thanh toán dịch vụ nền tảng"));

        BusinessHousehold updated = businessHouseholdRepository.findById(testHousehold.getId()).orElseThrow();
        assertEquals(HouseholdStatus.LOCKED, updated.getStatus());
        assertNotNull(updated.getLockedAt());
        assertEquals(platformAdmin.getId(), updated.getLockedByUserId());
    }

    @Test
    @WithMockUser(username = "admin_sys", roles = {"VT-04"})
    @DisplayName("NCL-01-CN-009 TC-01: Khóa hộ không có lý do -> Bị từ chối Bad Request")
    public void lockHousehold_WithoutReason_ThrowsError() throws Exception {
        LockHouseholdRequest request = LockHouseholdRequest.builder()
                .reason("")
                .build();

        mockMvc.perform(post("/api/v1/platform/households/" + testHousehold.getId() + "/lock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin_sys", roles = {"VT-04"})
    @DisplayName("NCL-01-CN-009 TC-02: Quản trị nền tảng mở khóa hộ kinh doanh -> Khôi phục trạng thái ACTIVE")
    public void unlockHousehold_Success() throws Exception {
        testHousehold.setStatus(HouseholdStatus.LOCKED);
        testHousehold.setLockReason("Tạm khóa để kiểm tra");
        businessHouseholdRepository.save(testHousehold);

        mockMvc.perform(post("/api/v1/platform/households/" + testHousehold.getId() + "/unlock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("ACTIVE"))
                .andExpect(jsonPath("$.result.lockReason").doesNotExist());

        BusinessHousehold updated = businessHouseholdRepository.findById(testHousehold.getId()).orElseThrow();
        assertEquals(HouseholdStatus.ACTIVE, updated.getStatus());
        assertNull(updated.getLockReason());
    }

    @Test
    @WithMockUser(username = "owner_lock_test", roles = {"VT-01"})
    @DisplayName("NCL-01-CN-009: Chủ hộ không có quyền khóa hộ -> 403 Forbidden")
    public void nonPlatformAdmin_CannotLock() throws Exception {
        LockHouseholdRequest request = LockHouseholdRequest.builder()
                .reason("Tự khóa")
                .build();

        mockMvc.perform(post("/api/v1/platform/households/" + testHousehold.getId() + "/lock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin_sys", roles = {"VT-04"})
    @DisplayName("QTN-10: Quản trị nền tảng (VT-04) tuyệt đối không được xem báo cáo doanh thu của hộ -> 403 Forbidden")
    public void platformAdmin_ForbiddenFromRevenueReports() throws Exception {
        mockMvc.perform(get("/api/v1/reports/daily"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("NCL-01-CN-009 TC-01: Tài khoản thuộc hộ bị khóa khi đăng nhập sẽ bị chặn (HOUSEHOLD_LOCKED - 2050)")
    public void login_WhenHouseholdLocked_ThrowsHouseholdLockedException() throws Exception {
        testHousehold.setStatus(HouseholdStatus.LOCKED);
        testHousehold.setLockReason("Hộ bị đóng băng");
        businessHouseholdRepository.save(testHousehold);

        LoginRequest authRequest = LoginRequest.builder()
                .username("owner_lock_test")
                .password("owner123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(2050));
    }

    @Test
    @WithMockUser(username = "admin_sys", roles = {"VT-04"})
    @DisplayName("ISSUE-01 (P1): Tìm kiếm theo từ khóa và trạng thái LOCKED không bị trả về hộ ACTIVE")
    public void searchHouseholds_FilterByStatusAndKeyword_CorrectPrecedence() throws Exception {
        // Tạo hộ ACTIVE có tên chứa "Tạp hóa"
        businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("9999999991")
                .name("Tạp hóa Miền Nam")
                .address("TP.HCM")
                .phoneNumber("0919999991")
                .status(HouseholdStatus.ACTIVE)
                .build());

        // Tạo hộ LOCKED có tên chứa "Tạp hóa"
        businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("9999999992")
                .name("Tạp hóa Miền Bắc")
                .address("Hà Nội")
                .phoneNumber("0919999992")
                .status(HouseholdStatus.LOCKED)
                .lockReason("Vi phạm")
                .build());

        // Lọc keyword="Tạp hóa" và status=LOCKED
        mockMvc.perform(get("/api/v1/platform/households")
                        .param("search", "Tạp hóa")
                        .param("status", "LOCKED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray())
                // Tất cả kết quả trả về bắt buộc phải có status = LOCKED
                .andExpect(jsonPath("$.result.content[*].status").value(org.hamcrest.Matchers.everyItem(org.hamcrest.Matchers.is("LOCKED"))));
    }
}
