package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.DebtStatus;
import com.sales.constant.DebtType;
import com.sales.dto.request.PaySupplierDebtRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SupplierDebtControllerTest {

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
    private SupplierRepository supplierRepository;

    @Autowired
    private SupplierDebtRepository supplierDebtRepository;

    private User ownerUser;
    private User employeeUser;
    private BusinessHousehold household;
    private Supplier supplier;

    @BeforeEach
    void setUp() {
        household = householdRepository.save(BusinessHousehold.builder()
                .name("Hộ kinh doanh Test Controller")
                .taxCode("0108888777")
                .address("123 Test Street")
                .phoneNumber("0900000111")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));

        Role employeeRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Nhân viên").build()));

        ownerUser = userRepository.save(User.builder()
                .username("chuho_debt_ctrl")
                .passwordHash("hashed")
                .fullName("Nguyễn Chủ Hộ")
                .phoneNumber("0911111111")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build());

        employeeUser = userRepository.save(User.builder()
                .username("nhanvien_debt_ctrl")
                .passwordHash("hashed")
                .fullName("Trần Nhân Viên")
                .phoneNumber("0922222222")
                .role(employeeRole)
                .household(household)
                .isActive(true)
                .build());

        supplier = supplierRepository.save(Supplier.builder()
                .name("Nhà cung cấp Sữa Việt")
                .phoneNumber("0933333333")
                .household(household)
                .currentDebt(new BigDecimal("1000000.00"))
                .build());

        supplierDebtRepository.save(SupplierDebt.builder()
                .household(household)
                .supplier(supplier)
                .amount(new BigDecimal("1000000.00"))
                .remainingAmount(new BigDecimal("1000000.00"))
                .type(DebtType.DEBT_CREATED)
                .status(DebtStatus.PENDING)
                .createdByUser(ownerUser)
                .build());
    }

    @Test
    @WithMockUser(username = "chuho_debt_ctrl", roles = {"VT-01"})
    @DisplayName("VT-01 trả nợ nhà cung cấp thành công")
    void paySupplierDebt_Owner_Success() throws Exception {
        PaySupplierDebtRequest request = PaySupplierDebtRequest.builder()
                .supplierId(supplier.getId())
                .amount(new BigDecimal("400000.00"))
                .paymentMethod("BANK_TRANSFER")
                .notes("Trả nợ đợt 1")
                .build();

        mockMvc.perform(post("/api/v1/supplier-debts/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.amount").value(400000.00))
                .andExpect(jsonPath("$.result.type").value("DEBT_PAID"));
    }

    @Test
    @WithMockUser(username = "nhanvien_debt_ctrl", roles = {"VT-02"})
    @DisplayName("VT-02 bị chặn (403 Forbidden) khi cố thực hiện trả nợ nhà cung cấp")
    void paySupplierDebt_Employee_Forbidden() throws Exception {
        PaySupplierDebtRequest request = PaySupplierDebtRequest.builder()
                .supplierId(supplier.getId())
                .amount(new BigDecimal("200000.00"))
                .build();

        mockMvc.perform(post("/api/v1/supplier-debts/pay")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "chuho_debt_ctrl", roles = {"VT-01"})
    @DisplayName("Lấy tổng quan công nợ nhà cung cấp thành công")
    void getSupplierDebtSummary_Owner_Success() throws Exception {
        mockMvc.perform(get("/api/v1/supplier-debts/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalOutstandingDebt").value(1000000.00))
                .andExpect(jsonPath("$.result.totalSuppliersWithDebt").value(1));
    }

    @Test
    @WithMockUser(username = "nhanvien_debt_ctrl", roles = {"VT-02"})
    @DisplayName("VT-02 bị chặn (403 Forbidden) khi xem tổng quan công nợ nhà cung cấp")
    void getSupplierDebtSummary_Employee_Forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/supplier-debts/summary"))
                .andExpect(status().isForbidden());
    }
}
