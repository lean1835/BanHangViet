package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.dto.request.CloseShiftRequest;
import com.viet.sales.dto.request.OpenShiftRequest;
import com.viet.sales.entity.*;
import com.viet.sales.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
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
public class ShiftControllerTest {

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
    private OrderRepository orderRepository;

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private User testOwner;
    private User testEmployee;
    private User testOtherEmployee;

    @BeforeEach
    public void setUp() {
        // 1. Hộ kinh doanh
        testHousehold = businessHouseholdRepository.findByTaxCode("9999999999").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("9999999999")
                    .name("Hộ kinh doanh Test Shift")
                    .address("Địa chỉ Test Shift")
                    .phoneNumber("0999999999")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        // 2. Vai trò
        ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
            return roleRepository.save(r);
        });

        // 3. Người dùng
        testOwner = userRepository.findByUsername("test_owner_shift").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_shift")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Shift")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testEmployee = userRepository.findByUsername("test_employee_shift").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee_shift")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Test Shift")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testOtherEmployee = userRepository.findByUsername("test_other_shift").orElseGet(() -> {
            User u = User.builder()
                    .username("test_other_shift")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Khác Test Shift")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        // Đóng toàn bộ ca OPEN cũ của các user này trước khi chạy test
        shiftRepository.findAll().stream()
                .filter(s -> (s.getUser().getId().equals(testOwner.getId()) || 
                              s.getUser().getId().equals(testEmployee.getId()) || 
                              s.getUser().getId().equals(testOtherEmployee.getId()))
                        && s.getStatus() == ShiftStatus.OPEN)
                .forEach(s -> {
                    s.setStatus(ShiftStatus.CLOSED);
                    s.setClosedAt(LocalDateTime.now());
                    shiftRepository.save(s);
                });
    }

    private Shift openShiftForUser(User user, BigDecimal openingCash) {
        Shift shift = Shift.builder()
                .household(testHousehold)
                .user(user)
                .openedAt(LocalDateTime.now())
                .openingCash(openingCash)
                .status(ShiftStatus.OPEN)
                .build();
        return shiftRepository.save(shift);
    }

    // --- TESTS CHO OPEN SHIFT ---

    @Test
    @WithMockUser(username = "test_employee_shift", roles = {"VT-02"})
    public void openShift_success() throws Exception {
        OpenShiftRequest request = OpenShiftRequest.builder()
                .openingCash(new BigDecimal("150000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.openingCash").value(150000.00))
                .andExpect(jsonPath("$.result.status").value("OPEN"));
    }

    @Test
    @WithMockUser(username = "test_employee_shift", roles = {"VT-02"})
    public void openShift_alreadyOpen_fails() throws Exception {
        openShiftForUser(testEmployee, new BigDecimal("100000.00"));

        OpenShiftRequest request = OpenShiftRequest.builder()
                .openingCash(new BigDecimal("150000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3005)); // SHIFT_ALREADY_OPEN
    }

    @Test
    @WithMockUser(username = "test_employee_shift", roles = {"VT-02"})
    public void openShift_negativeOpeningCash_fails() throws Exception {
        OpenShiftRequest request = OpenShiftRequest.builder()
                .openingCash(new BigDecimal("-1000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006)); // INVALID_INPUT
    }

    // --- TESTS CHO GET ACTIVE SHIFT ---

    @Test
    @WithMockUser(username = "test_employee_shift", roles = {"VT-02"})
    public void getActiveShift_success() throws Exception {
        openShiftForUser(testEmployee, new BigDecimal("200000.00"));

        mockMvc.perform(get("/api/v1/shifts/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("OPEN"))
                .andExpect(jsonPath("$.result.openingCash").value(200000.00));
    }

    @Test
    @WithMockUser(username = "test_employee_shift", roles = {"VT-02"})
    public void getActiveShift_notFound_fails() throws Exception {
        mockMvc.perform(get("/api/v1/shifts/active"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(3006)); // ACTIVE_SHIFT_NOT_FOUND
    }

    // --- TESTS CHO CLOSE SHIFT ---

    @Test
    @WithMockUser(username = "test_employee_shift", roles = {"VT-02"})
    public void closeShift_success_noDifference() throws Exception {
        Shift shift = openShiftForUser(testEmployee, new BigDecimal("100000.00"));

        // Tạo đơn hàng CASH trị giá 50k đã chốt
        Order order = Order.builder()
                .household(testHousehold)
                .shift(shift)
                .createdByUser(testEmployee)
                .orderNumber("ORD-TEST-CS-1")
                .totalAmount(new BigDecimal("50000.00"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("50000.00"))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .status("COMPLETED")
                .build();
        orderRepository.save(order);

        // expectedCash = 100k + 50k = 150k. Đóng ca với actualCash = 150k.
        CloseShiftRequest request = CloseShiftRequest.builder()
                .closingCashActual(new BigDecimal("150000.00"))
                .differenceReason("")
                .build();

        mockMvc.perform(post("/api/v1/shifts/" + shift.getId() + "/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CLOSED"))
                .andExpect(jsonPath("$.result.closingCashExpected").value(150000.00))
                .andExpect(jsonPath("$.result.differenceAmount").value(0.00));
    }

    @Test
    @WithMockUser(username = "test_employee_shift", roles = {"VT-02"})
    public void closeShift_success_withDifferenceAndReason() throws Exception {
        Shift shift = openShiftForUser(testEmployee, new BigDecimal("100000.00"));

        // expectedCash = 100k. Đóng ca thực tế đếm 120k (lệch +20k) có giải trình lý do.
        CloseShiftRequest request = CloseShiftRequest.builder()
                .closingCashActual(new BigDecimal("120000.00"))
                .differenceReason("Khách đơn lẻ tặng tiền thừa")
                .build();

        mockMvc.perform(post("/api/v1/shifts/" + shift.getId() + "/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CLOSED"))
                .andExpect(jsonPath("$.result.differenceAmount").value(20000.00))
                .andExpect(jsonPath("$.result.differenceReason").value("Khách đơn lẻ tặng tiền thừa"));
    }

    @Test
    @WithMockUser(username = "test_employee_shift", roles = {"VT-02"})
    public void closeShift_fail_differenceNoReason() throws Exception {
        Shift shift = openShiftForUser(testEmployee, new BigDecimal("100000.00"));

        // Lệch két nhưng bỏ trống lý do
        CloseShiftRequest request = CloseShiftRequest.builder()
                .closingCashActual(new BigDecimal("80000.00")) // Hụt 20k
                .differenceReason("")
                .build();

        mockMvc.perform(post("/api/v1/shifts/" + shift.getId() + "/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3025)); // INVALID_ACTUAL_CASH
    }

    @Test
    @WithMockUser(username = "test_employee_shift", roles = {"VT-02"})
    public void closeShift_fail_pendingOrder() throws Exception {
        Shift shift = openShiftForUser(testEmployee, new BigDecimal("100000.00"));

        // Tạo đơn hàng chưa hoàn thành (CREATING) trong ca
        Order pendingOrder = Order.builder()
                .household(testHousehold)
                .shift(shift)
                .createdByUser(testEmployee)
                .orderNumber("ORD-PENDING-CS")
                .totalAmount(new BigDecimal("100000.00"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("100000.00"))
                .status("CREATING")
                .build();
        orderRepository.save(pendingOrder);

        CloseShiftRequest request = CloseShiftRequest.builder()
                .closingCashActual(new BigDecimal("100000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/" + shift.getId() + "/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3023)); // SHIFT_HAS_PENDING_ORDER
    }

    @Test
    @WithMockUser(username = "test_other_shift", roles = {"VT-02"})
    public void closeShift_fail_permissionDenied() throws Exception {
        // Ca của testEmployee
        Shift shift = openShiftForUser(testEmployee, new BigDecimal("100000.00"));

        // testOtherEmployee cố đóng ca của testEmployee
        CloseShiftRequest request = CloseShiftRequest.builder()
                .closingCashActual(new BigDecimal("100000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/" + shift.getId() + "/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(3024)); // SHIFT_PERMISSION_DENIED
    }

    @Test
    @WithMockUser(username = "test_owner_shift", roles = {"VT-01"})
    public void closeShift_byOwner_success() throws Exception {
        // Ca của testEmployee
        Shift shift = openShiftForUser(testEmployee, new BigDecimal("100000.00"));

        // Chủ hộ (testOwner) đóng hộ ca cho nhân viên
        CloseShiftRequest request = CloseShiftRequest.builder()
                .closingCashActual(new BigDecimal("100000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/" + shift.getId() + "/close")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CLOSED"));
    }
}
