package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateSupplierRequest;
import com.sales.dto.request.UpdateSupplierRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.Supplier;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.SupplierRepository;
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

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SupplierControllerTest {

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

    private User ownerUser;
    private User employeeUser;
    private BusinessHousehold household;
    private Supplier supplier;

    @BeforeEach
    void setUp() {
        household = householdRepository.save(BusinessHousehold.builder()
                .taxCode("0109999888")
                .name("Hộ Kinh Doanh Supplier Test")
                .address("123 Lê Lợi")
                .phoneNumber("0901112223")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));

        Role employeeRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Nhân viên").build()));

        ownerUser = userRepository.save(User.builder()
                .username("chuho_supp_test")
                .passwordHash("password_hash")
                .fullName("Chủ Hộ Test")
                .household(household)
                .role(ownerRole)
                .isActive(true)
                .build());

        employeeUser = userRepository.save(User.builder()
                .username("nhanvien_supp_test")
                .passwordHash("password_hash")
                .fullName("Nhân Viên Test")
                .household(household)
                .role(employeeRole)
                .isActive(true)
                .build());

        supplier = supplierRepository.save(Supplier.builder()
                .household(household)
                .name("Công Ty Nước Giải Khát Việt")
                .phoneNumber("0912345678")
                .email("contact@viet.com")
                .address("100 Lê Duẩn")
                .taxCode("0301112223")
                .note("Nhà cung cấp chính")
                .build());
    }

    @Test
    @WithMockUser(username = "chuho_supp_test", roles = {"VT-01"})
    void ownerCanCreateSupplier_success() throws Exception {
        CreateSupplierRequest request = CreateSupplierRequest.builder()
                .name("Nhà Phân Phối Bánh Kẹo Hưng Thịnh")
                .phoneNumber("0988776655")
                .email("hungthinh@gmail.com")
                .address("456 CMT8")
                .taxCode("0388776655")
                .note("Bánh kẹo giá sỉ")
                .build();

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Nhà Phân Phối Bánh Kẹo Hưng Thịnh"))
                .andExpect(jsonPath("$.result.phoneNumber").value("0988776655"));
    }

    @Test
    @WithMockUser(username = "nhanvien_supp_test", roles = {"VT-02"})
    void employeeCannotCreateSupplier_forbidden() throws Exception {
        CreateSupplierRequest request = CreateSupplierRequest.builder()
                .name("Nhà Phân Phối Bánh Kẹo Hưng Thịnh")
                .phoneNumber("0988776655")
                .build();

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "chuho_supp_test", roles = {"VT-01"})
    void createSupplier_phoneDuplicate_badRequest() throws Exception {
        CreateSupplierRequest request = CreateSupplierRequest.builder()
                .name("Nhà Cung Cấp Trùng Số")
                .phoneNumber("0912345678") // Đã tồn tại trong setUp
                .build();

        mockMvc.perform(post("/api/v1/suppliers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3032));
    }

    @Test
    @WithMockUser(username = "chuho_supp_test", roles = {"VT-01"})
    void ownerCanUpdateSupplier_success() throws Exception {
        UpdateSupplierRequest request = UpdateSupplierRequest.builder()
                .name("Công Ty Nước Giải Khát Việt (Đã Đổi Tên)")
                .phoneNumber("0912345678")
                .email("newemail@viet.com")
                .address("200 Nguyễn Thị Minh Khai")
                .taxCode("0301112223")
                .note("Đã cập nhật hợp đồng")
                .build();

        mockMvc.perform(put("/api/v1/suppliers/" + supplier.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Công Ty Nước Giải Khát Việt (Đã Đổi Tên)"));
    }

    @Test
    @WithMockUser(username = "chuho_supp_test", roles = {"VT-01"})
    void ownerCanGetSupplier_success() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/" + supplier.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(supplier.getId()))
                .andExpect(jsonPath("$.result.name").value("Công Ty Nước Giải Khát Việt"));
    }

    @Test
    @WithMockUser(username = "nhanvien_supp_test", roles = {"VT-02"})
    void employeeCanGetSuppliers_success() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].id").value(supplier.getId()));
    }

    @Test
    @WithMockUser(username = "nhanvien_supp_test", roles = {"VT-02"})
    void employeeSearchSuppliers_success() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/search").param("query", "Giải Khát"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].name").value("Công Ty Nước Giải Khát Việt"));
    }

    @Test
    @WithMockUser(username = "nhanvien_supp_test", roles = {"VT-02"})
    void employeeSearchSuppliers_withoutQueryParam_success() throws Exception {
        mockMvc.perform(get("/api/v1/suppliers/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].name").value("Công Ty Nước Giải Khát Việt"));
    }

    @Test
    @WithMockUser(username = "chuho_supp_test", roles = {"VT-01"})
    void ownerCanDeleteSupplier_success() throws Exception {
        mockMvc.perform(delete("/api/v1/suppliers/" + supplier.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        Supplier deleted = supplierRepository.findById(supplier.getId()).orElse(null);
        assertNotNull(deleted);
        assertNotNull(deleted.getDeletedAt());
    }

    @Test
    @WithMockUser(username = "nhanvien_supp_test", roles = {"VT-02"})
    void employeeCannotDeleteSupplier_forbidden() throws Exception {
        mockMvc.perform(delete("/api/v1/suppliers/" + supplier.getId()))
                .andExpect(status().isForbidden());
    }
}
