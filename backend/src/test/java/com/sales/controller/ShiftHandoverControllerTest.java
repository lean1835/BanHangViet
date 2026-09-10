package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.ShiftHandoverRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.Shift;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.ShiftHandoverRepository;
import com.sales.repository.ShiftRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ShiftHandoverControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private ShiftHandoverRepository shiftHandoverRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.sales.repository.OrderRepository orderRepository;

    private BusinessHousehold testHousehold;
    private Role employeeRole;
    private User employeeA;
    private User employeeB;
    private Shift shiftA;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("8888888888").orElseGet(() -> {
            BusinessHousehold h = BusinessHousehold.builder()
                    .taxCode("8888888888")
                    .name("Hộ Kinh Doanh Handover Test")
                    .address("123 Phố Test")
                    .phoneNumber("0888888888")
                    .build();
            return businessHouseholdRepository.save(h);
        });

        employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
            return roleRepository.save(r);
        });

        employeeA = userRepository.findByUsername("employee_handover_a").orElseGet(() -> {
            User u = User.builder()
                    .username("employee_handover_a")
                    .passwordHash(passwordEncoder.encode("PasswordA@123"))
                    .fullName("Nhân Viên A")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        employeeB = userRepository.findByUsername("employee_handover_b").orElseGet(() -> {
            User u = User.builder()
                    .username("employee_handover_b")
                    .passwordHash(passwordEncoder.encode("PasswordB@123"))
                    .fullName("Nhân Viên B")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        shiftA = Shift.builder()
                .household(testHousehold)
                .user(employeeA)
                .openedAt(LocalDateTime.now().minusHours(2))
                .openingCash(new BigDecimal("1000000.00"))
                .status(ShiftStatus.OPEN)
                .build();
        shiftA = shiftRepository.save(shiftA);
    }

    @Test
    @DisplayName("GET /api/v1/shifts/handover/summary - Lấy tóm tắt chốt tạm thành công")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void getHandoverSummary_Success() throws Exception {
        mockMvc.perform(get("/api/v1/shifts/handover/summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.shiftId").value(shiftA.getId()))
                .andExpect(jsonPath("$.result.currentStage").value(1))
                .andExpect(jsonPath("$.result.senderUsername").value("employee_handover_a"))
                .andExpect(jsonPath("$.result.openingCash").value(1000000.00))
                .andExpect(jsonPath("$.result.expectedCash").value(1000000.00));
    }

    @Test
    @DisplayName("POST /api/v1/shifts/handover - Bàn giao ca thành công không lệch tiền (TC-01)")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void performShiftHandover_Success_NoDifference() throws Exception {
        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .shiftId(shiftA.getId())
                .recipientUserId(employeeB.getId())
                .recipientPassword("PasswordB@123")
                .actualCash(new BigDecimal("1000000.00"))
                .notes("Bàn giao ca thành công")
                .build();

        mockMvc.perform(post("/api/v1/shifts/handover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.stageNumber").value(1))
                .andExpect(jsonPath("$.result.senderUserId").value(employeeA.getId()))
                .andExpect(jsonPath("$.result.receiverUserId").value(employeeB.getId()))
                .andExpect(jsonPath("$.result.actualCash").value(1000000.00))
                .andExpect(jsonPath("$.result.differenceAmount").value(0.00));

        // Kiểm tra ca bán hàng đã đổi chủ sở hữu sang employeeB
        Shift updatedShift = shiftRepository.findById(shiftA.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(employeeB.getId(), updatedShift.getUser().getId());
    }

    @Test
    @DisplayName("POST /api/v1/shifts/handover - Chặn khi người nhận đang có ca khác mở (TC-02 & QTN-15)")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void performShiftHandover_RecipientHasOpenShift_ThrowsError() throws Exception {
        // Mở 1 ca cho employeeB trước
        Shift shiftB = Shift.builder()
                .household(testHousehold)
                .user(employeeB)
                .openedAt(LocalDateTime.now().minusHours(1))
                .openingCash(new BigDecimal("500000.00"))
                .status(ShiftStatus.OPEN)
                .build();
        shiftRepository.save(shiftB);

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .shiftId(shiftA.getId())
                .recipientUserId(employeeB.getId())
                .recipientPassword("PasswordB@123")
                .actualCash(new BigDecimal("1000000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/handover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3061));
    }

    @Test
    @DisplayName("POST /api/v1/shifts/handover - Lệch tiền nhưng thiếu lý do -> Chặn (TC-03)")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void performShiftHandover_DifferenceMissingReason_ThrowsError() throws Exception {
        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .shiftId(shiftA.getId())
                .recipientUserId(employeeB.getId())
                .recipientPassword("PasswordB@123")
                .actualCash(new BigDecimal("950000.00")) // Thiếu 50k
                .differenceReason("") // Rỗng
                .build();

        mockMvc.perform(post("/api/v1/shifts/handover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3065));
    }

    @Test
    @DisplayName("POST /api/v1/shifts/handover - Lệch tiền có lý do hợp lệ -> Thành công (TC-03)")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void performShiftHandover_DifferenceWithReason_Success() throws Exception {
        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .shiftId(shiftA.getId())
                .recipientUserId(employeeB.getId())
                .recipientPassword("PasswordB@123")
                .actualCash(new BigDecimal("950000.00")) // Thiếu 50k
                .differenceReason("Làm mất 50k tiền thối")
                .build();

        mockMvc.perform(post("/api/v1/shifts/handover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.differenceAmount").value(-50000.00))
                .andExpect(jsonPath("$.result.differenceReason").value("Làm mất 50k tiền thối"));
    }

    @Test
    @DisplayName("POST /api/v1/shifts/handover - Sai mật khẩu người nhận -> Bị chặn (401)")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void performShiftHandover_WrongPassword_ThrowsError() throws Exception {
        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .shiftId(shiftA.getId())
                .recipientUserId(employeeB.getId())
                .recipientPassword("WrongPassword123")
                .actualCash(new BigDecimal("1000000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/handover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(3064));
    }

    @Test
    @DisplayName("GET /api/v1/shifts/{id}/stages-summary - Báo cáo chặng ca")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void getShiftStagesSummary_Success() throws Exception {
        mockMvc.perform(get("/api/v1/shifts/" + shiftA.getId() + "/stages-summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.shiftId").value(shiftA.getId()));
    }

    @Test
    @DisplayName("POST /api/v1/shifts/handover - Chặn khi tài khoản người nhận bị khóa (400)")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void performShiftHandover_RecipientLocked_ThrowsError() throws Exception {
        employeeB.setIsActive(false);
        userRepository.save(employeeB);

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .shiftId(shiftA.getId())
                .recipientUserId(employeeB.getId())
                .recipientPassword("PasswordB@123")
                .actualCash(new BigDecimal("1000000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/handover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(2008)); // USER_BLOCKED

        employeeB.setIsActive(true);
        userRepository.save(employeeB);
    }

    @Test
    @DisplayName("POST /api/v1/shifts/handover - Chặn khi vai trò người nhận không phải bán hàng/chủ hộ (400)")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void performShiftHandover_RecipientInvalidRole_ThrowsError() throws Exception {
        Role accountantRole = roleRepository.findByCode("VT-03").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-03").name("Kế toán").build()));

        employeeB.setRole(accountantRole);
        userRepository.save(employeeB);

        ShiftHandoverRequest request = ShiftHandoverRequest.builder()
                .shiftId(shiftA.getId())
                .recipientUserId(employeeB.getId())
                .recipientPassword("PasswordB@123")
                .actualCash(new BigDecimal("1000000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/handover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3067)); // RECIPIENT_NOT_AUTHORIZED_FOR_POS

        employeeB.setRole(employeeRole);
        userRepository.save(employeeB);
    }

    @Test
    @DisplayName("P0 Regression Test: Người nhận bàn giao (employeeB) thao tác thành công đơn hàng treo của người cũ (employeeA)")
    @WithMockUser(username = "employee_handover_a", roles = {"VT-02"})
    void performShiftHandover_RecipientCanOperateHandedOverPendingOrder_Success() throws Exception {
        // 1. Tạo đơn hàng treo bởi employeeA trong shiftA
        com.sales.entity.Order pendingOrder = com.sales.entity.Order.builder()
                .household(testHousehold)
                .shift(shiftA)
                .createdByUser(employeeA)
                .orderNumber("OD-HANDOVER-" + System.currentTimeMillis())
                .orderLabel("Bàn số 5 - Khách gọi thêm")
                .totalAmount(new BigDecimal("200000.00"))
                .finalAmount(new BigDecimal("200000.00"))
                .paymentMethod("CASH")
                .paymentStatus("PENDING")
                .status("CREATING")
                .build();
        pendingOrder = orderRepository.save(pendingOrder);

        // 2. Bàn giao ca từ employeeA sang employeeB
        ShiftHandoverRequest handoverRequest = ShiftHandoverRequest.builder()
                .shiftId(shiftA.getId())
                .recipientUserId(employeeB.getId())
                .recipientPassword("PasswordB@123")
                .actualCash(new BigDecimal("1000000.00"))
                .notes("Bàn giao kèm đơn treo bàn số 5")
                .build();

        mockMvc.perform(post("/api/v1/shifts/handover")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(handoverRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        // 3. employeeB (người nhận ca) truy cập chi tiết đơn hàng treo do employeeA tạo
        // Thao tác GET /api/v1/orders/{id} từ employeeB (trước khi fix P0, thao tác này bị chặn 403 Forbidden)
        mockMvc.perform(get("/api/v1/orders/" + pendingOrder.getId())
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("employee_handover_b").roles("VT-02"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(pendingOrder.getId()))
                .andExpect(jsonPath("$.result.status").value("CREATING"));
    }
}
