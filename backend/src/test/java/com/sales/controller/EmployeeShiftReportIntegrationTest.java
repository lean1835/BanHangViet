package com.sales.controller;

import com.sales.constant.CashTransactionStatus;
import com.sales.constant.CashTransactionType;
import com.sales.constant.ShiftStatus;
import com.sales.entity.*;
import com.sales.repository.*;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class EmployeeShiftReportIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CashTransactionRepository cashTransactionRepository;

    @Autowired
    private CashTransactionCategoryRepository cashTransactionCategoryRepository;

    @Autowired
    private BusinessHouseholdSettingsRepository householdSettingsRepository;

    private BusinessHousehold testHousehold;
    private User ownerUser;
    private User employeeUser1;
    private User employeeUser2;
    private User accountantUser;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("9999988888").orElseGet(() -> {
            BusinessHousehold h = BusinessHousehold.builder()
                    .taxCode("9999988888")
                    .name("Hộ kinh doanh Báo Cáo Ca Test")
                    .address("123 Test Street")
                    .phoneNumber("0999998888")
                    .build();
            return businessHouseholdRepository.save(h);
        });

        Role roleOwner = roleRepository.findByCode("VT-01").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));
        Role roleEmployee = roleRepository.findByCode("VT-02").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-02").name("Nhân viên bán hàng").build()));
        Role roleAccountant = roleRepository.findByCode("VT-03").orElseGet(() ->
                roleRepository.save(Role.builder().code("VT-03").name("Kế toán").build()));

        ownerUser = userRepository.findByUsername("owner_shift_report").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("owner_shift_report")
                        .passwordHash("password")
                        .fullName("Chủ Hộ Báo Cáo")
                        .role(roleOwner)
                        .household(testHousehold)
                        .isActive(true)
                        .build()));

        employeeUser1 = userRepository.findByUsername("emp1_shift_report").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("emp1_shift_report")
                        .passwordHash("password")
                        .fullName("Nhân Viên 1")
                        .role(roleEmployee)
                        .household(testHousehold)
                        .isActive(true)
                        .build()));

        employeeUser2 = userRepository.findByUsername("emp2_shift_report").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("emp2_shift_report")
                        .passwordHash("password")
                        .fullName("Nhân Viên 2")
                        .role(roleEmployee)
                        .household(testHousehold)
                        .isActive(true)
                        .build()));

        accountantUser = userRepository.findByUsername("accountant_shift_report").orElseGet(() ->
                userRepository.save(User.builder()
                        .username("accountant_shift_report")
                        .passwordHash("password")
                        .fullName("Kế Toán Báo Cáo")
                        .role(roleAccountant)
                        .household(testHousehold)
                        .isActive(true)
                        .build()));

        // Ensure settings exist with threshold 50,000 VND
        BusinessHouseholdSettings settings = householdSettingsRepository.findByHouseholdId(testHousehold.getId())
                .orElseGet(() -> BusinessHouseholdSettings.builder().household(testHousehold).build());
        settings.setShiftDifferenceThreshold(new BigDecimal("50000.00"));
        householdSettingsRepository.save(settings);
    }

    private Shift createClosedShift(User user, LocalDateTime openedAt, LocalDateTime closedAt,
                                   BigDecimal openingCash, BigDecimal actualCash,
                                   BigDecimal diffAmount, String diffReason) {
        BigDecimal expectedCash = actualCash.subtract(diffAmount);
        Shift shift = Shift.builder()
                .household(testHousehold)
                .user(user)
                .openedAt(openedAt)
                .closedAt(closedAt)
                .openingCash(openingCash)
                .closingCashExpected(expectedCash)
                .closingCashActual(actualCash)
                .differenceAmount(diffAmount)
                .differenceReason(diffReason)
                .status(ShiftStatus.CLOSED)
                .build();
        return shiftRepository.save(shift);
    }

    private Order createOrder(Shift shift, User user, String orderNumber,
                              BigDecimal finalAmount, String paymentMethod, String status) {
        Order order = Order.builder()
                .household(testHousehold)
                .shift(shift)
                .createdByUser(user)
                .orderNumber(orderNumber)
                .totalAmount(finalAmount)
                .finalAmount(finalAmount)
                .paymentMethod(paymentMethod)
                .status(status)
                .build();
        return orderRepository.save(order);
    }

    @Test
    @DisplayName("NCL-07-CN-010-TC-01: Trong kỳ có ca đã đóng, mở báo cáo trả về danh sách ca kèm doanh thu, số đơn, chênh lệch")
    @WithMockUser(username = "owner_shift_report", roles = {"VT-01"})
    public void test_TC01_getEmployeeShiftReport_success() throws Exception {
        LocalDateTime now = LocalDateTime.now();

        // Shift 1: Employee 1, 1 cash order (200k), 1 transfer order (300k), diff = 0
        Shift shift1 = createClosedShift(employeeUser1, now.minusDays(2).withHour(8), now.minusDays(2).withHour(16),
                new BigDecimal("1000000.00"), new BigDecimal("1200000.00"), BigDecimal.ZERO, null);
        createOrder(shift1, employeeUser1, "ORD-REP-01", new BigDecimal("200000.00"), "CASH", "COMPLETED");
        createOrder(shift1, employeeUser1, "ORD-REP-02", new BigDecimal("300000.00"), "BANK_TRANSFER", "COMPLETED");

        // Shift 2: Employee 1, 1 cash order (150k), 1 canceled order, diff = 20k
        Shift shift2 = createClosedShift(employeeUser1, now.minusDays(1).withHour(8), now.minusDays(1).withHour(16),
                new BigDecimal("1000000.00"), new BigDecimal("1170000.00"), new BigDecimal("20000.00"), "Khách boa tiền thối");
        createOrder(shift2, employeeUser1, "ORD-REP-03", new BigDecimal("150000.00"), "CASH", "COMPLETED");
        createOrder(shift2, employeeUser1, "ORD-REP-04", new BigDecimal("100000.00"), "CASH", "CANCELED");

        // Shift 3: Employee 2, 1 transfer order (500k), diff = 0
        Shift shift3 = createClosedShift(employeeUser2, now.minusDays(1).withHour(16), now.minusDays(1).withHour(22),
                new BigDecimal("1000000.00"), new BigDecimal("1000000.00"), BigDecimal.ZERO, null);
        createOrder(shift3, employeeUser2, "ORD-REP-05", new BigDecimal("500000.00"), "BANK_TRANSFER", "COMPLETED");

        mockMvc.perform(get("/api/v1/reports/employee-shifts")
                        .param("fromDate", now.minusDays(3).toLocalDate().toString())
                        .param("toDate", now.toLocalDate().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Lấy báo cáo doanh thu theo nhân viên và theo ca thành công"))
                .andExpect(jsonPath("$.result.totalShiftsCount").value(3))
                .andExpect(jsonPath("$.result.totalRevenue").value(1150000.00))
                .andExpect(jsonPath("$.result.totalCashRevenue").value(350000.00))
                .andExpect(jsonPath("$.result.totalBankTransferRevenue").value(800000.00))
                .andExpect(jsonPath("$.result.totalOrdersCount").value(4))
                .andExpect(jsonPath("$.result.totalCanceledOrdersCount").value(1))
                .andExpect(jsonPath("$.result.shifts", hasSize(3)))
                .andExpect(jsonPath("$.result.employeeSummaries", hasSize(2)));
    }

    @Test
    @DisplayName("NCL-07-CN-010-TC-02: Ca có chênh lệch vượt ngưỡng được đánh dấu riêng kèm lý do đã ghi khi đóng ca")
    @WithMockUser(username = "owner_shift_report", roles = {"VT-01"})
    public void test_TC02_getEmployeeShiftReport_exceededThreshold_marked() throws Exception {
        LocalDateTime now = LocalDateTime.now();

        // Shift with discrepancy 100k > threshold 50k
        Shift shiftWithDiff = createClosedShift(employeeUser1, now.minusHours(10), now.minusHours(2),
                new BigDecimal("1000000.00"), new BigDecimal("900000.00"), new BigDecimal("-100000.00"), "Thối nhầm tiền cho khách");

        // Shift with discrepancy 10k <= threshold 50k
        Shift normalShift = createClosedShift(employeeUser2, now.minusHours(8), now.minusHours(1),
                new BigDecimal("1000000.00"), new BigDecimal("1010000.00"), new BigDecimal("10000.00"), "Khách không lấy tiền lẻ");

        // Query with default configured threshold (50k)
        mockMvc.perform(get("/api/v1/reports/employee-shifts")
                        .param("fromDate", now.toLocalDate().toString())
                        .param("toDate", now.toLocalDate().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalExceededShiftsCount").value(1))
                .andExpect(jsonPath("$.result.shifts[?(@.shiftId == '" + shiftWithDiff.getId() + "')].differenceExceeded").value(hasItem(true)))
                .andExpect(jsonPath("$.result.shifts[?(@.shiftId == '" + shiftWithDiff.getId() + "')].differenceReason").value(hasItem("Thối nhầm tiền cho khách")))
                .andExpect(jsonPath("$.result.shifts[?(@.shiftId == '" + normalShift.getId() + "')].differenceExceeded").value(hasItem(false)));

        // Query with custom parameter threshold = 5,000đ -> both shifts exceed threshold
        mockMvc.perform(get("/api/v1/reports/employee-shifts")
                        .param("fromDate", now.toLocalDate().toString())
                        .param("toDate", now.toLocalDate().toString())
                        .param("threshold", "5000.00")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.appliedThreshold").value(5000.00))
                .andExpect(jsonPath("$.result.totalExceededShiftsCount").value(2));
    }

    @Test
    @DisplayName("NCL-07-CN-010-TC-03: Nhân viên bán hàng (VT-02) bị chặn theo phân quyền QTN-10 (HTTP 403)")
    @WithMockUser(username = "emp1_shift_report", roles = {"VT-02"})
    public void test_TC03_getEmployeeShiftReport_asEmployee_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/reports/employee-shifts")
                        .param("fromDate", LocalDate.now().toString())
                        .param("toDate", LocalDate.now().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Kế toán (VT-03) có quyền mở báo cáo doanh thu theo ca và nhân viên")
    @WithMockUser(username = "accountant_shift_report", roles = {"VT-03"})
    public void test_getEmployeeShiftReport_asAccountant_success() throws Exception {
        mockMvc.perform(get("/api/v1/reports/employee-shifts")
                        .param("fromDate", LocalDate.now().toString())
                        .param("toDate", LocalDate.now().toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }
}
