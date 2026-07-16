package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateProductGroupRequest;
import com.viet.sales.dto.request.UpdateProductGroupRequest;
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
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ProductGroupControllerTest {

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
    private ProductGroupRepository productGroupRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    private User ownerUser;
    private User employeeUser;
    private BusinessHousehold household;
    private TaxRate taxRate;
    private Product product1;
    private Product product2;

    @BeforeEach
    public void setUp() {
        Role ownerRole = getOrCreateRole("VT-01", "Chủ hộ kinh doanh");
        Role employeeRole = getOrCreateRole("VT-02", "Nhân viên bán hàng");

        household = BusinessHousehold.builder()
                .name("Cửa Hàng Thực Phẩm Sạch")
                .taxCode("1234567890")
                .address("Hà Nội")
                .phoneNumber("0987654321")
                .build();
        household = householdRepository.save(household);

        ownerUser = User.builder()
                .username("owner_user_test")
                .passwordHash("password_hash")
                .fullName("Trần Chủ Hộ")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();
        userRepository.save(ownerUser);

        employeeUser = User.builder()
                .username("employee_user_test")
                .passwordHash("password_hash")
                .fullName("Nguyễn Nhân Viên")
                .role(employeeRole)
                .household(household)
                .isActive(true)
                .build();
        userRepository.save(employeeUser);

        taxRate = TaxRate.builder()
                .household(household)
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build();
        taxRate = taxRateRepository.save(taxRate);

        product1 = Product.builder()
                .household(household)
                .sku("PROD-001")
                .name("Táo Mỹ")
                .unit("kg")
                .price(new BigDecimal("80000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .taxRate(taxRate)
                .status("ACTIVE")
                .build();
        product1 = productRepository.save(product1);

        product2 = Product.builder()
                .household(household)
                .sku("PROD-002")
                .name("Nho Úc")
                .unit("kg")
                .price(new BigDecimal("150000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .taxRate(taxRate)
                .status("ACTIVE")
                .build();
        product2 = productRepository.save(product2);
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
    @WithMockUser(username = "owner_user_test", roles = "VT-01")
    public void createProductGroup_success() throws Exception {
        CreateProductGroupRequest request = CreateProductGroupRequest.builder()
                .name("Trái cây nhập khẩu")
                .productIds(Arrays.asList(product1.getId(), product2.getId()))
                .build();

        mockMvc.perform(post("/api/v1/product-groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Tạo nhóm hàng thành công"))
                .andExpect(jsonPath("$.result.name").value("Trái cây nhập khẩu"));

        // Verify product relation
        Product updatedP1 = productRepository.findById(product1.getId()).orElseThrow();
        Product updatedP2 = productRepository.findById(product2.getId()).orElseThrow();

        assertNotNull(updatedP1.getGroup());
        assertEquals("Trái cây nhập khẩu", updatedP1.getGroup().getName());
        assertNotNull(updatedP2.getGroup());
    }

    @Test
    @WithMockUser(username = "owner_user_test", roles = "VT-01")
    public void createProductGroup_emptyProducts_success() throws Exception {
        CreateProductGroupRequest request = CreateProductGroupRequest.builder()
                .name("Nhóm rỗng")
                .productIds(Collections.emptyList())
                .build();

        mockMvc.perform(post("/api/v1/product-groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "owner_user_test", roles = "VT-01")
    public void createProductGroup_duplicateName_fails() throws Exception {
        ProductGroup group = ProductGroup.builder()
                .household(household)
                .name("Rau củ quả")
                .build();
        productGroupRepository.save(group);

        CreateProductGroupRequest request = CreateProductGroupRequest.builder()
                .name("Rau củ quả")
                .build();

        mockMvc.perform(post("/api/v1/product-groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3010))
                .andExpect(jsonPath("$.message").value("Tên nhóm hàng đã tồn tại trên hệ thống"));
    }

    @Test
    @WithMockUser(username = "owner_user_test", roles = "VT-01")
    public void updateProductGroup_success() throws Exception {
        ProductGroup group = ProductGroup.builder()
                .household(household)
                .name("Hải sản")
                .build();
        group = productGroupRepository.save(group);

        product1.setGroup(group);
        productRepository.save(product1);

        UpdateProductGroupRequest request = UpdateProductGroupRequest.builder()
                .name("Hải sản tươi sống")
                .productIds(Collections.singletonList(product2.getId())) // Remove product1, add product2
                .build();

        mockMvc.perform(put("/api/v1/product-groups/" + group.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Hải sản tươi sống"));

        Product updatedP1 = productRepository.findById(product1.getId()).orElseThrow();
        Product updatedP2 = productRepository.findById(product2.getId()).orElseThrow();

        assertNull(updatedP1.getGroup());
        assertNotNull(updatedP2.getGroup());
        assertEquals("Hải sản tươi sống", updatedP2.getGroup().getName());
    }

    @Test
    @WithMockUser(username = "owner_user_test", roles = "VT-01")
    public void deleteProductGroup_success() throws Exception {
        ProductGroup group = ProductGroup.builder()
                .household(household)
                .name("Đồ uống")
                .build();
        group = productGroupRepository.save(group);

        product1.setGroup(group);
        productRepository.save(product1);

        mockMvc.perform(delete("/api/v1/product-groups/" + group.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Xóa nhóm hàng thành công"));

        ProductGroup deletedGroup = productGroupRepository.findById(group.getId()).orElseThrow();
        assertNotNull(deletedGroup.getDeletedAt());

        Product updatedP1 = productRepository.findById(product1.getId()).orElseThrow();
        assertNull(updatedP1.getGroup());
    }

    @Test
    @WithMockUser(username = "employee_user_test", roles = "VT-02")
    public void getProductGroups_success() throws Exception {
        ProductGroup group = ProductGroup.builder()
                .household(household)
                .name("Gia vị")
                .build();
        productGroupRepository.save(group);

        mockMvc.perform(get("/api/v1/product-groups"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].name").value("Gia vị"));
    }

    @Test
    @WithMockUser(username = "employee_user_test", roles = "VT-02")
    public void createProductGroup_employeeRole_forbidden() throws Exception {
        CreateProductGroupRequest request = CreateProductGroupRequest.builder()
                .name("Nhóm cấm")
                .build();

        mockMvc.perform(post("/api/v1/product-groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "owner_user_test", roles = "VT-01")
    public void createProductGroup_duplicateProductIds_success() throws Exception {
        CreateProductGroupRequest request = CreateProductGroupRequest.builder()
                .name("Nhóm sản phẩm trùng lặp")
                .productIds(Arrays.asList(product1.getId(), product1.getId(), product2.getId()))
                .build();

        mockMvc.perform(post("/api/v1/product-groups")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Nhóm sản phẩm trùng lặp"));

        Product updatedP1 = productRepository.findById(product1.getId()).orElseThrow();
        Product updatedP2 = productRepository.findById(product2.getId()).orElseThrow();

        assertNotNull(updatedP1.getGroup());
        assertEquals("Nhóm sản phẩm trùng lặp", updatedP1.getGroup().getName());
        assertNotNull(updatedP2.getGroup());
    }

    @Test
    @WithMockUser(username = "owner_user_test", roles = "VT-01")
    public void updateProductGroup_duplicateProductIds_success() throws Exception {
        ProductGroup group = ProductGroup.builder()
                .household(household)
                .name("Trái cây")
                .build();
        group = productGroupRepository.save(group);

        product1.setGroup(group);
        productRepository.save(product1);

        UpdateProductGroupRequest request = UpdateProductGroupRequest.builder()
                .name("Trái cây mới")
                .productIds(Arrays.asList(product2.getId(), product2.getId())) // duplicate product2
                .build();

        mockMvc.perform(put("/api/v1/product-groups/" + group.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Trái cây mới"));

        Product updatedP1 = productRepository.findById(product1.getId()).orElseThrow();
        Product updatedP2 = productRepository.findById(product2.getId()).orElseThrow();

        assertNull(updatedP1.getGroup());
        assertNotNull(updatedP2.getGroup());
        assertEquals("Trái cây mới", updatedP2.getGroup().getName());
    }
}
