package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AccountantAssignmentStatus;
import com.sales.constant.AccountantInvitationStatus;
import com.sales.dto.request.AcceptInvitationRequest;
import com.sales.dto.request.InviteAccountantRequest;
import com.sales.dto.request.RevokeAccountantAssignmentRequest;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.AccountantService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AccountantAccessIntegrationTest {

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
    private AccountantInvitationRepository invitationRepository;

    @Autowired
    private HouseholdAccountantAssignmentRepository assignmentRepository;

    @Autowired
    private AccountantService accountantService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private BusinessHousehold householdA;
    private BusinessHousehold householdB;
    private User ownerA;
    private User ownerB;
    private User accountant;
    private User regularEmployee;

    @BeforeEach
    public void setUp() {
        Role ownerRole = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build()));
        Role empRole = roleRepository.findByCode("VT-02").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-02").name("Nhân viên bán hàng").build()));
        Role accountantRole = roleRepository.findByCode("VT-03").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-03").name("Kế toán").build()));

        householdA = businessHouseholdRepository.findByTaxCode("1111111111").orElseGet(() ->
                businessHouseholdRepository.save(BusinessHousehold.builder()
                        .taxCode("1111111111")
                        .name("Hộ Kinh Doanh A")
                        .address("123 Phố Huế, Hà Nội")
                        .phoneNumber("0901111111")
                        .build()));

        householdB = businessHouseholdRepository.findByTaxCode("2222222222").orElseGet(() ->
                businessHouseholdRepository.save(BusinessHousehold.builder()
                        .taxCode("2222222222")
                        .name("Hộ Kinh Doanh B")
                        .address("456 Hai Bà Trưng, Hà Nội")
                        .phoneNumber("0902222222")
                        .build()));

        ownerA = userRepository.findByUsername("owner_a").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("owner_a")
                        .passwordHash("hashed")
                        .fullName("Nguyễn Văn Chủ Hộ A")
                        .role(ownerRole)
                        .household(householdA)
                        .isActive(true)
                        .build()));

        ownerB = userRepository.findByUsername("owner_b").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("owner_b")
                        .passwordHash("hashed")
                        .fullName("Trần Thị Chủ Hộ B")
                        .role(ownerRole)
                        .household(householdB)
                        .isActive(true)
                        .build()));

        accountant = userRepository.findByUsername("accountant_test").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("accountant_test")
                        .passwordHash("hashed")
                        .fullName("Lê Văn Kế Toán")
                        .email("ketoan@gmail.com")
                        .phoneNumber("0988776655")
                        .role(accountantRole)
                        .household(householdA)
                        .isActive(true)
                        .build()));

        regularEmployee = userRepository.findByUsername("emp_test").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("emp_test")
                        .passwordHash("hashed")
                        .fullName("Nhân Viên A")
                        .role(empRole)
                        .household(householdA)
                        .isActive(true)
                        .build()));
    }

    @Test
    @WithMockUser(username = "owner_a", roles = {"VT-01"})
    @DisplayName("TC-01: Chủ hộ mời kế toán thành công (Pending invitation)")
    public void inviteAccountant_Success() throws Exception {
        InviteAccountantRequest request = InviteAccountantRequest.builder()
                .accountantPhone("0988776655")
                .accountantEmail("ketoan@gmail.com")
                .accessDurationDays(30)
                .scopePermissions(List.of("INVOICE", "REPORT"))
                .build();

        mockMvc.perform(post("/api/v1/accountant/invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("PENDING"))
                .andExpect(jsonPath("$.result.invitationToken").isNotEmpty());
    }

    @Test
    @WithMockUser(username = "emp_test", roles = {"VT-02"})
    @DisplayName("Nhân viên bán hàng không có quyền mời kế toán -> 403 Forbidden")
    public void inviteAccountant_ForbiddenForEmployee() throws Exception {
        InviteAccountantRequest request = InviteAccountantRequest.builder()
                .accountantPhone("0988776655")
                .accessDurationDays(30)
                .scopePermissions(List.of("INVOICE"))
                .build();

        mockMvc.perform(post("/api/v1/accountant/invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    @DisplayName("TC-01: Kế toán chấp nhận lời mời qua token thành công")
    public void acceptInvitation_Success() throws Exception {
        AccountantInvitation invitation = invitationRepository.save(AccountantInvitation.builder()
                .household(householdA)
                .invitedByUser(ownerA)
                .accountantPhone("0988776655")
                .accountantEmail("ketoan@gmail.com")
                .invitationToken("token-test-123456")
                .scopePermissions("[\"INVOICE\"]")
                .status(AccountantInvitationStatus.PENDING)
                .invitationExpiresAt(LocalDateTime.now().plusDays(7))
                .build());

        AcceptInvitationRequest request = AcceptInvitationRequest.builder()
                .notes("Tôi đồng ý nhận làm kế toán")
                .build();

        mockMvc.perform(post("/api/v1/accountant/invitations/token-test-123456/accept")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("ACTIVE"))
                .andExpect(jsonPath("$.result.householdName").value("Hộ Kinh Doanh A"));

        AccountantInvitation updatedInv = invitationRepository.findById(invitation.getId()).orElseThrow();
        assertEquals(AccountantInvitationStatus.ACCEPTED, updatedInv.getStatus());
    }

    @Test
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    @DisplayName("TC-02: Kế toán lấy danh sách các hộ được phân công (đa hộ)")
    public void getAssignedHouseholds_Success() throws Exception {
        assignmentRepository.save(HouseholdAccountantAssignment.builder()
                .household(householdA)
                .accountantUser(accountant)
                .scopePermissions("[\"INVOICE\",\"REPORT\"]")
                .accessExpiresAt(LocalDateTime.now().plusDays(30))
                .status(AccountantAssignmentStatus.ACTIVE)
                .build());

        assignmentRepository.save(HouseholdAccountantAssignment.builder()
                .household(householdB)
                .accountantUser(accountant)
                .scopePermissions("[\"INVOICE\"]")
                .accessExpiresAt(LocalDateTime.now().plusDays(30))
                .status(AccountantAssignmentStatus.ACTIVE)
                .build());

        mockMvc.perform(get("/api/v1/accountant/assigned-households"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray())
                .andExpect(jsonPath("$.result.length()").value(2));
    }

    @Test
    @WithMockUser(username = "owner_a", roles = {"VT-01"})
    @DisplayName("TC-03: Chủ hộ thu hồi quyền kế toán và cắt phiên ngay lập tức")
    public void revokeAccountantAssignment_Success() throws Exception {
        HouseholdAccountantAssignment assignment = assignmentRepository.save(HouseholdAccountantAssignment.builder()
                .household(householdA)
                .accountantUser(accountant)
                .scopePermissions("[\"INVOICE\"]")
                .accessExpiresAt(LocalDateTime.now().plusDays(30))
                .status(AccountantAssignmentStatus.ACTIVE)
                .build());

        RevokeAccountantAssignmentRequest request = RevokeAccountantAssignmentRequest.builder()
                .reason("Hết hạn hợp đồng dịch vụ kế toán")
                .build();

        mockMvc.perform(post("/api/v1/accountant/assignments/" + assignment.getId() + "/revoke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        HouseholdAccountantAssignment updated = assignmentRepository.findById(assignment.getId()).orElseThrow();
        assertEquals(AccountantAssignmentStatus.REVOKED, updated.getStatus());
        assertNotNull(updated.getRevokedAt());
    }

    @Test
    @WithMockUser(username = "owner_a", roles = {"VT-01"})
    @DisplayName("Chủ hộ hủy/thu hồi lời mời đang chờ thành công")
    public void revokeAccountantInvitation_Success() throws Exception {
        AccountantInvitation invitation = invitationRepository.save(AccountantInvitation.builder()
                .household(householdA)
                .invitedByUser(ownerA)
                .accountantPhone("0988776655")
                .accountantEmail("ketoan@gmail.com")
                .invitationToken("token-to-revoke")
                .scopePermissions("[\"INVOICE\"]")
                .status(AccountantInvitationStatus.PENDING)
                .invitationExpiresAt(LocalDateTime.now().plusDays(7))
                .build());

        RevokeAccountantAssignmentRequest request = RevokeAccountantAssignmentRequest.builder()
                .reason("Chủ hộ hủy lời mời")
                .build();

        mockMvc.perform(post("/api/v1/accountant/assignments/" + invitation.getId() + "/revoke")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        AccountantInvitation updated = invitationRepository.findById(invitation.getId()).orElseThrow();
        assertEquals(AccountantInvitationStatus.REVOKED, updated.getStatus());
    }

    @Test
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    @DisplayName("Kế toán không thể chấp nhận lời mời hoặc chuyển vào hộ bị KHÓA")
    public void accountant_CannotAccessLockedHousehold() {
        householdA.setStatus(com.sales.constant.HouseholdStatus.LOCKED);
        householdA.setLockReason("Hộ bị đóng băng");
        businessHouseholdRepository.save(householdA);

        AccountantInvitation invitation = invitationRepository.save(AccountantInvitation.builder()
                .household(householdA)
                .invitedByUser(ownerA)
                .accountantPhone("0988776655")
                .accountantEmail("ketoan@gmail.com")
                .invitationToken("token-locked-test")
                .scopePermissions("[\"INVOICE\"]")
                .status(AccountantInvitationStatus.PENDING)
                .invitationExpiresAt(LocalDateTime.now().plusDays(7))
                .build());

        // Accepting invitation for locked household must throw HOUSEHOLD_LOCKED
        AppException exception = assertThrows(AppException.class, () ->
                accountantService.acceptInvitation("accountant_test", "token-locked-test", null));
        assertEquals(ErrorCode.HOUSEHOLD_LOCKED, exception.getErrorCode());
    }

    @Test
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    @DisplayName("ISSUE-03 (P1): Kế toán chỉ có scope INVOICE bị chặn 403 khi truy cập báo cáo doanh thu")
    public void accountant_ScopeEnforcement_ForbiddenWhenLacksScope() throws Exception {
        assignmentRepository.save(HouseholdAccountantAssignment.builder()
                .household(householdA)
                .accountantUser(accountant)
                .scopePermissions("[\"INVOICE\"]")
                .accessExpiresAt(LocalDateTime.now().plusDays(30))
                .status(AccountantAssignmentStatus.ACTIVE)
                .build());

        mockMvc.perform(get("/api/v1/reports/daily"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    @DisplayName("ISSUE-03 (P1): Kế toán có scope REPORT được phép truy cập báo cáo doanh thu")
    public void accountant_ScopeEnforcement_AllowedWhenHasScope() throws Exception {
        assignmentRepository.save(HouseholdAccountantAssignment.builder()
                .household(householdA)
                .accountantUser(accountant)
                .scopePermissions("[\"REPORT\"]")
                .accessExpiresAt(LocalDateTime.now().plusDays(30))
                .status(AccountantAssignmentStatus.ACTIVE)
                .build());

        mockMvc.perform(get("/api/v1/reports/daily"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    @DisplayName("ISSUE-04 (P1): Kế toán đổi context hộ độc lập qua header X-Household-Context")
    public void accountant_MultiTenancyContext_HeaderSupport() throws Exception {
        assignmentRepository.save(HouseholdAccountantAssignment.builder()
                .household(householdA)
                .accountantUser(accountant)
                .scopePermissions("[\"INVOICE\"]")
                .accessExpiresAt(LocalDateTime.now().plusDays(30))
                .status(AccountantAssignmentStatus.ACTIVE)
                .build());

        assignmentRepository.save(HouseholdAccountantAssignment.builder()
                .household(householdB)
                .accountantUser(accountant)
                .scopePermissions("[\"REPORT\"]")
                .accessExpiresAt(LocalDateTime.now().plusDays(30))
                .status(AccountantAssignmentStatus.ACTIVE)
                .build());

        // Gọi với context hộ B (có quyền REPORT) -> 200 OK
        mockMvc.perform(get("/api/v1/reports/daily")
                        .header("X-Household-Context", householdB.getId()))
                .andExpect(status().isOk());

        // Gọi với context hộ A (chỉ có quyền INVOICE) -> 403 Forbidden
        mockMvc.perform(get("/api/v1/reports/daily")
                        .header("X-Household-Context", householdA.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner_a", roles = {"VT-01"})
    @DisplayName("Chủ hộ mời kế toán mới chưa có tài khoản: Hệ thống tự sinh tài khoản và mật khẩu tạm")
    public void inviteAccountant_AutoProvisionNewAccount_Success() throws Exception {
        InviteAccountantRequest request = InviteAccountantRequest.builder()
                .accountantName("Đỗ Kế Toán Mới")
                .accountantPhone("0911223344")
                .accountantEmail("ketoan_moi@banhangviet.vn")
                .accessDurationDays(30)
                .scopePermissions(List.of("INVOICE", "REPORT"))
                .createAccountMode("AUTO_GENERATE")
                .build();

        mockMvc.perform(post("/api/v1/accountant/invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("PENDING"))
                .andExpect(jsonPath("$.result.isNewAccountCreated").value(true))
                .andExpect(jsonPath("$.result.accountantUsername").isNotEmpty())
                .andExpect(jsonPath("$.result.temporaryPassword").isNotEmpty());

        User newUser = userRepository.findByPhoneNumberAndDeletedAtIsNull("0911223344")
                .orElse(null);
        assertNotNull(newUser, "User mới phải được tạo trong CSDL");
        assertEquals("VT-03", newUser.getRole().getCode());
        assertTrue(newUser.getMustChangePassword());
        assertTrue(newUser.getIsActive());
        assertEquals("Đỗ Kế Toán Mới", newUser.getFullName());
    }

    @Test
    @WithMockUser(username = "owner_a", roles = {"VT-01"})
    @DisplayName("Chủ hộ mời kế toán mới chưa có tài khoản: Chủ hộ tự đặt mật khẩu ban đầu")
    public void inviteAccountant_ManualPassword_Success() throws Exception {
        InviteAccountantRequest request = InviteAccountantRequest.builder()
                .accountantName("Phạm Kế Toán Pass")
                .accountantPhone("0922334455")
                .accountantEmail("ketoan_pass@banhangviet.vn")
                .accessDurationDays(30)
                .scopePermissions(List.of("INVOICE", "REPORT"))
                .createAccountMode("MANUAL_PASSWORD")
                .initialPassword("Secret@123456")
                .build();

        mockMvc.perform(post("/api/v1/accountant/invitations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.isNewAccountCreated").value(true))
                .andExpect(jsonPath("$.result.temporaryPassword").value("Secret@123456"));

        User newUser = userRepository.findByPhoneNumberAndDeletedAtIsNull("0922334455")
                .orElse(null);
        assertNotNull(newUser);
        assertTrue(passwordEncoder.matches("Secret@123456", newUser.getPasswordHash()));
    }
}
