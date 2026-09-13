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
    @DisplayName("NCL-01-CN-008 TC-01: Chủ hộ mời kế toán thành công (Pending invitation)")
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
    @DisplayName("NCL-01-CN-008: Nhân viên bán hàng không có quyền mời kế toán -> 403 Forbidden")
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
    @DisplayName("NCL-01-CN-008 TC-01: Kế toán chấp nhận lời mời qua token thành công")
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
    @DisplayName("NCL-01-CN-008 TC-02: Kế toán lấy danh sách các hộ được phân công (đa hộ)")
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
    @DisplayName("NCL-01-CN-008 TC-03: Chủ hộ thu hồi quyền kế toán và cắt phiên ngay lập tức")
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
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    @DisplayName("NCL-01-CN-008 & NCL-01-CN-009: Kế toán không thể chấp nhận lời mời hoặc chuyển vào hộ bị KHÓA")
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
}
