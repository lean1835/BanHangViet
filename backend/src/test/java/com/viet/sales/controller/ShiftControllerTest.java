package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.dto.request.OpenShiftRequest;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.repository.BusinessHouseholdRepository;
import com.viet.sales.repository.RoleRepository;
import com.viet.sales.repository.ShiftRepository;
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

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertTrue;
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
    private RoleRepository roleRepository;

    @Autowired
    private BusinessHouseholdRepository householdRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    private User employeeUser;
    private User ownerUser;
    private User accountantUser;

    @BeforeEach
    public void setUp() {
        Role ownerRole = getOrCreateRole("VT-01", "Chủ hộ kinh doanh");
        Role employeeRole = getOrCreateRole("VT-02", "Nhân viên bán hàng");
        Role accountantRole = getOrCreateRole("VT-03", "Kế toán");

        BusinessHousehold household = BusinessHousehold.builder()
                .name("Tạp Hóa Test")
                .taxCode("9999888877")
                .address("Địa chỉ Test")
                .phoneNumber("0999999999")
                .build();
        household = householdRepository.save(household);

        employeeUser = User.builder()
                .username("nhanvien_test")
                .passwordHash("password_hash")
                .fullName("Nguyễn Nhân Viên")
                .role(employeeRole)
                .household(household)
                .isActive(true)
                .build();
        userRepository.save(employeeUser);

        ownerUser = User.builder()
                .username("chuho_test")
                .passwordHash("password_hash")
                .fullName("Trần Chủ Hộ")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();
        userRepository.save(ownerUser);

        accountantUser = User.builder()
                .username("ketoan_test")
                .passwordHash("password_hash")
                .fullName("Lê Kế Toán")
                .role(accountantRole)
                .household(household)
                .isActive(true)
                .build();
        userRepository.save(accountantUser);
    }

    private Role getOrCreateRole(String code, String name) {
        return roleRepository.findByCode(code).orElseGet(() -> {
            Role newRole = Role.builder()
                    .code(code)
                    .name(name)
                    .build();
            return roleRepository.save(newRole);
        });
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = "VT-02")
    public void openShift_success() throws Exception {
        OpenShiftRequest request = OpenShiftRequest.builder()
                .openingCash(new BigDecimal("100000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Mở ca bán hàng thành công"))
                .andExpect(jsonPath("$.result.openingCash").value(100000.00))
                .andExpect(jsonPath("$.result.status").value("OPEN"))
                .andExpect(jsonPath("$.result.username").value("nhanvien_test"));

        assertTrue(shiftRepository.existsByUserIdAndStatus(employeeUser.getId(), ShiftStatus.OPEN));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = "VT-02")
    public void openShift_negativeOpeningCash_fails() throws Exception {
        OpenShiftRequest request = OpenShiftRequest.builder()
                .openingCash(new BigDecimal("-500.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Tiền đầu ca không được âm")));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = "VT-02")
    public void openShift_nullOpeningCash_fails() throws Exception {
        OpenShiftRequest request = OpenShiftRequest.builder()
                .openingCash(null)
                .build();

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Tiền đầu ca không được để trống")));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = "VT-02")
    public void openShift_alreadyOpen_fails() throws Exception {
        OpenShiftRequest request = OpenShiftRequest.builder()
                .openingCash(new BigDecimal("100000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3005))
                .andExpect(jsonPath("$.message").value("Nhân viên đã có một ca bán hàng đang mở chưa đóng"));
    }

    @Test
    @WithMockUser(username = "ketoan_test", roles = "VT-03")
    public void openShift_accountantRole_forbidden() throws Exception {
        OpenShiftRequest request = OpenShiftRequest.builder()
                .openingCash(new BigDecimal("100000.00"))
                .build();

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = "VT-02")
    public void getActiveShift_success() throws Exception {
        OpenShiftRequest request = OpenShiftRequest.builder()
                .openingCash(new BigDecimal("100000.00"))
                .build();

        mockMvc.perform(get("/api/v1/shifts/active"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(3006));

        mockMvc.perform(post("/api/v1/shifts/open")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/shifts/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("OPEN"))
                .andExpect(jsonPath("$.result.username").value("nhanvien_test"));
    }
}
