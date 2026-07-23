package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.repository.BusinessHouseholdRepository;
import com.viet.sales.repository.RoleRepository;
import com.viet.sales.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private Role accountantRole;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("8888888888").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("8888888888")
                    .name("Hộ kinh doanh Test Report")
                    .address("Địa chỉ Test Report")
                    .phoneNumber("0888888888")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
            return roleRepository.save(r);
        });

        accountantRole = roleRepository.findByCode("VT-03").orElseGet(() -> {
            Role r = Role.builder().code("VT-03").name("Kế toán").build();
            return roleRepository.save(r);
        });

        userRepository.findByUsername("test_owner_report").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_report")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Report")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        userRepository.findByUsername("test_employee_report").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee_report")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Test Report")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        userRepository.findByUsername("test_accountant_report").orElseGet(() -> {
            User u = User.builder()
                    .username("test_accountant_report")
                    .passwordHash("password_hash")
                    .fullName("Kế Toán Test Report")
                    .role(accountantRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });
    }

    @Test
    @WithMockUser(username = "test_owner_report", roles = {"VT-01"})
    public void getDailyRevenue_asOwner_success() throws Exception {
        mockMvc.perform(get("/api/v1/reports/daily")
                        .param("fromDate", "2026-07-01")
                        .param("toDate", "2026-07-22")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_employee_report", roles = {"VT-02"})
    public void getDailyRevenue_asEmployee_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/reports/daily")
                        .param("fromDate", "2026-07-01")
                        .param("toDate", "2026-07-22")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_accountant_report", roles = {"VT-03"})
    public void getProductRevenue_asAccountant_success() throws Exception {
        mockMvc.perform(get("/api/v1/reports/products")
                        .param("fromDate", "2026-07-01")
                        .param("toDate", "2026-07-22")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_owner_report", roles = {"VT-01"})
    public void getDailyRevenue_invalidDates_badRequest() throws Exception {
        mockMvc.perform(get("/api/v1/reports/daily")
                        .param("fromDate", "2026-07-22")
                        .param("toDate", "2026-07-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test_owner_report", roles = {"VT-01"})
    public void compareRevenue_overlappingPeriods_badRequest() throws Exception {
        mockMvc.perform(get("/api/v1/reports/comparison")
                        .param("period1Start", "2026-07-01")
                        .param("period1End", "2026-07-15")
                        .param("period2Start", "2026-07-10")
                        .param("period2End", "2026-07-20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test_owner_report", roles = {"VT-01"})
    public void getReconciliation_success() throws Exception {
        mockMvc.perform(get("/api/v1/reports/reconciliation")
                        .param("date", "2026-07-22")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_owner_report", roles = {"VT-01"})
    public void lockReconciliation_success() throws Exception {
        mockMvc.perform(post("/api/v1/reports/reconciliation/lock")
                        .param("date", "2026-07-22")
                        .param("notes", "Chốt ca test")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }
}
