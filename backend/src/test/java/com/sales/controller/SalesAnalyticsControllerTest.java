package com.sales.controller;

import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SalesAnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PointOfSaleRepository pointOfSaleRepository;

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private Role accountantRole;
    private PointOfSale testPos;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("9999888877").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("9999888877")
                    .name("Hộ kinh doanh Test Analytics")
                    .address("Địa chỉ Test Analytics")
                    .phoneNumber("0999888877")
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

        userRepository.findByUsername("test_owner_analytics").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_analytics")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Analytics")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        userRepository.findByUsername("test_employee_analytics").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee_analytics")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Test Analytics")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        userRepository.findByUsername("test_accountant_analytics").orElseGet(() -> {
            User u = User.builder()
                    .username("test_accountant_analytics")
                    .passwordHash("password_hash")
                    .fullName("Kế Toán Test Analytics")
                    .role(accountantRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testPos = pointOfSaleRepository.findAllByHouseholdIdAndDeletedAtIsNull(testHousehold.getId()).stream()
                .filter(p -> "POS-TEST-01".equals(p.getPosCode()))
                .findFirst()
                .orElseGet(() -> {
                    PointOfSale p = PointOfSale.builder()
                            .household(testHousehold)
                            .posCode("POS-TEST-01")
                            .name("Điểm bán Test Analytics")
                            .address("Quầy 1 Test Analytics")
                            .isDefault(true)
                            .isActive(true)
                            .build();
                    return pointOfSaleRepository.save(p);
                });
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_asOwner_success() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Lấy phân tích giờ cao điểm và ngày bán chạy thành công"))
                .andExpect(jsonPath("$.result.filterInfo.posName").value("Tất cả điểm bán"))
                .andExpect(jsonPath("$.result.hourlyStats", hasSize(24)))
                .andExpect(jsonPath("$.result.dayOfWeekStats", hasSize(7)))
                .andExpect(jsonPath("$.result.heatmap", hasSize(168)))
                .andExpect(jsonPath("$.result.insights").exists());
    }

    @Test
    @WithMockUser(username = "test_accountant_analytics", roles = {"VT-03"})
    public void getPeakAnalysis_asAccountant_success() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.hourlyStats", hasSize(24)))
                .andExpect(jsonPath("$.result.dayOfWeekStats", hasSize(7)));
    }

    @Test
    @WithMockUser(username = "test_employee_analytics", roles = {"VT-02"})
    public void getPeakAnalysis_asEmployee_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_invalidDateRange_badRequest() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .param("fromDate", "2026-08-25")
                        .param("toDate", "2026-08-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_customDateRange_success() throws Exception {
        LocalDate today = LocalDate.now();
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .param("fromDate", today.minusDays(15).toString())
                        .param("toDate", today.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.filterInfo.fromDate").value(today.minusDays(15).toString()))
                .andExpect(jsonPath("$.result.filterInfo.toDate").value(today.toString()));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_filterByPos_success() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .param("posId", testPos.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.filterInfo.posId").value(testPos.getId()))
                .andExpect(jsonPath("$.result.filterInfo.posName").value(testPos.getName()));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_filterByNonExistentPos_badRequest() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .param("posId", "non-existent-pos-id")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_verifyStructureAndCompleteness() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.hourlyStats[0].hour").value(0))
                .andExpect(jsonPath("$.result.hourlyStats[0].label").value("00:00 - 01:00"))
                .andExpect(jsonPath("$.result.hourlyStats[23].hour").value(23))
                .andExpect(jsonPath("$.result.hourlyStats[23].label").value("23:00 - 00:00"))
                .andExpect(jsonPath("$.result.dayOfWeekStats[0].dayName").value("Thứ Hai"))
                .andExpect(jsonPath("$.result.dayOfWeekStats[6].dayName").value("Chủ Nhật"))
                .andExpect(jsonPath("$.result.heatmap[0].dayName").value("Thứ Hai"))
                .andExpect(jsonPath("$.result.heatmap[0].hourOfDay").value(0));
    }
}
