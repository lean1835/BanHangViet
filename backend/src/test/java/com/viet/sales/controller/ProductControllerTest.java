package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateProductRequest;
import com.viet.sales.dto.request.UpdateProductRequest;
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
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ProductControllerTest {

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
    private TaxRateRepository taxRateRepository;

    @Autowired
    private ProductGroupRepository productGroupRepository;

    @Autowired
    private ProductRepository productRepository;

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private User testOwner;
    private User testEmployee;
    private TaxRate testTaxRate;
    private ProductGroup testGroup;

    @BeforeEach
    public void setUp() {
        // 1. Tạo hoặc lấy hộ kinh doanh test
        testHousehold = businessHouseholdRepository.findAll().stream().findFirst().orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("9999999999")
                    .name("Hộ kinh doanh Test")
                    .address("Địa chỉ Test")
                    .phoneNumber("0999999999")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        // 2. Lấy hoặc tạo vai trò
        ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
            return roleRepository.save(r);
        });

        // 3. Tạo hoặc lấy người dùng test
        testOwner = userRepository.findByUsername("test_owner_product").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_product")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Product")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testEmployee = userRepository.findByUsername("test_employee_product").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee_product")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Test Product")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        // 4. Tạo thuế suất test
        testTaxRate = taxRateRepository.findAll().stream()
                .filter(t -> t.getHousehold().getId().equals(testHousehold.getId()) && t.getIsActive())
                .findFirst().orElseGet(() -> {
                    TaxRate t = TaxRate.builder()
                            .household(testHousehold)
                            .name("Thuế VAT 10%")
                            .ratePercentage(new BigDecimal("10.00"))
                            .isActive(true)
                            .build();
                    return taxRateRepository.save(t);
                });

        // 5. Tạo nhóm sản phẩm test
        testGroup = productGroupRepository.findAll().stream()
                .filter(g -> g.getHousehold().getId().equals(testHousehold.getId()) && g.getDeletedAt() == null)
                .findFirst().orElseGet(() -> {
                    ProductGroup g = ProductGroup.builder()
                            .household(testHousehold)
                            .name("Nhóm Test")
                            .build();
                    return productGroupRepository.save(g);
                });
    }

    @Test
    @WithMockUser(username = "test_owner_product", roles = {"VT-01"})
    public void createProduct_success() throws Exception {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("SKU-TEST-001")
                .name("Sản phẩm Test 001")
                .unit("Cái")
                .price(new BigDecimal("15000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .status("ACTIVE")
                .groupId(testGroup.getId())
                .taxRateId(testTaxRate.getId())
                .build();

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Thêm hàng hóa thành công"))
                .andExpect(jsonPath("$.result.sku").value("SKU-TEST-001"))
                .andExpect(jsonPath("$.result.name").value("Sản phẩm Test 001"))
                .andExpect(jsonPath("$.result.taxRatePercentage").value(testTaxRate.getRatePercentage().doubleValue()));
    }

    @Test
    @WithMockUser(username = "test_employee_product", roles = {"VT-02"})
    public void createProduct_forbiddenForEmployee() throws Exception {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("SKU-TEST-002")
                .name("Sản phẩm Test 002")
                .unit("Cái")
                .price(new BigDecimal("15000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .status("ACTIVE")
                .groupId(testGroup.getId())
                .taxRateId(testTaxRate.getId())
                .build();

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_owner_product", roles = {"VT-01"})
    public void createProduct_duplicateSku_fails() throws Exception {
        // Tạo sản phẩm trước
        Product p = Product.builder()
                .household(testHousehold)
                .group(testGroup)
                .taxRate(testTaxRate)
                .sku("SKU-DUPLICATE")
                .name("Sản phẩm gốc")
                .unit("Cái")
                .price(new BigDecimal("20000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .status("ACTIVE")
                .build();
        productRepository.saveAndFlush(p);

        // Thử tạo sản phẩm trùng SKU
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("SKU-DUPLICATE")
                .name("Sản phẩm trùng SKU")
                .unit("Cái")
                .price(new BigDecimal("15000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .status("ACTIVE")
                .taxRateId(testTaxRate.getId())
                .build();

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3002))
                .andExpect(jsonPath("$.message").value("Mã hàng (SKU) đã tồn tại trong hộ kinh doanh"));
    }

    @Test
    @WithMockUser(username = "test_owner_product", roles = {"VT-01"})
    public void createProduct_invalidPrice_fails() throws Exception {
        CreateProductRequest request = CreateProductRequest.builder()
                .sku("SKU-TEST-003")
                .name("Sản phẩm giá âm")
                .unit("Cái")
                .price(new BigDecimal("-1000.00")) // Giá âm
                .stockQuantity(new BigDecimal("100.000"))
                .status("ACTIVE")
                .taxRateId(testTaxRate.getId())
                .build();

        mockMvc.perform(post("/api/v1/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test_owner_product", roles = {"VT-01"})
    public void updateProduct_success() throws Exception {
        // Tạo sản phẩm trước
        Product p = Product.builder()
                .household(testHousehold)
                .group(testGroup)
                .taxRate(testTaxRate)
                .sku("SKU-TO-UPDATE")
                .name("Sản phẩm gốc")
                .unit("Cái")
                .price(new BigDecimal("20000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .status("ACTIVE")
                .build();
        p = productRepository.saveAndFlush(p);

        UpdateProductRequest request = UpdateProductRequest.builder()
                .sku("SKU-UPDATED")
                .name("Sản phẩm đã cập nhật")
                .unit("Hộp")
                .price(new BigDecimal("25000.00"))
                .stockQuantity(new BigDecimal("60.000"))
                .status("INACTIVE")
                .groupId(testGroup.getId())
                .taxRateId(testTaxRate.getId())
                .build();

        mockMvc.perform(put("/api/v1/products/" + p.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.sku").value("SKU-UPDATED"))
                .andExpect(jsonPath("$.result.name").value("Sản phẩm đã cập nhật"))
                .andExpect(jsonPath("$.result.status").value("INACTIVE"));
    }

    @Test
    @WithMockUser(username = "test_employee_product", roles = {"VT-02"})
    public void getProducts_success() throws Exception {
        // Tạo một số sản phẩm test
        Product p1 = Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SKU-SEARCH-01")
                .name("Nước ép Táo")
                .unit("Chai")
                .price(new BigDecimal("15000.00"))
                .stockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build();
        productRepository.save(p1);

        Product p2 = Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SKU-SEARCH-02")
                .name("Nước ép Cam")
                .unit("Chai")
                .price(new BigDecimal("18000.00"))
                .stockQuantity(new BigDecimal("15.000"))
                .status("ACTIVE")
                .build();
        productRepository.save(p2);
        productRepository.flush();

        mockMvc.perform(get("/api/v1/products")
                        .param("search", "Nước ép")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray())
                .andExpect(jsonPath("$.result.totalElements").value(2));
    }

    @Test
    @WithMockUser(username = "test_employee_product", roles = {"VT-02"})
    public void getProducts_excludeInactiveTrue_success() throws Exception {
        // Tạo sản phẩm active
        Product pActive = Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SKU-EX-ACTIVE")
                .name("Sữa tươi Ba Vì")
                .unit("Hộp")
                .price(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("20.000"))
                .status("ACTIVE")
                .build();
        productRepository.save(pActive);

        // Tạo sản phẩm inactive
        Product pInactive = Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SKU-EX-INACTIVE")
                .name("Sữa tươi Mộc Châu")
                .unit("Hộp")
                .price(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("20.000"))
                .status("INACTIVE")
                .build();
        productRepository.save(pInactive);
        productRepository.flush();

        // Tìm kiếm sữa tươi, lọc bỏ hàng ngừng bán (excludeInactive = true)
        mockMvc.perform(get("/api/v1/products")
                        .param("search", "Sữa tươi")
                        .param("excludeInactive", "true")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray())
                .andExpect(jsonPath("$.result.totalElements").value(1))
                .andExpect(jsonPath("$.result.content[0].sku").value("SKU-EX-ACTIVE"));
    }

    @Test
    @WithMockUser(username = "test_employee_product", roles = {"VT-02"})
    public void getProducts_excludeInactiveFalse_success() throws Exception {
        // Tạo sản phẩm active
        Product pActive = Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SKU-EX-ACTIVE2")
                .name("Sữa tươi Ba Vì 2")
                .unit("Hộp")
                .price(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("20.000"))
                .status("ACTIVE")
                .build();
        productRepository.save(pActive);

        // Tạo sản phẩm inactive
        Product pInactive = Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SKU-EX-INACTIVE2")
                .name("Sữa tươi Mộc Châu 2")
                .unit("Hộp")
                .price(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("20.000"))
                .status("INACTIVE")
                .build();
        productRepository.save(pInactive);
        productRepository.flush();

        // Tìm kiếm sữa tươi, không lọc bỏ hàng ngừng bán (excludeInactive = false)
        mockMvc.perform(get("/api/v1/products")
                        .param("search", "Sữa tươi")
                        .param("excludeInactive", "false")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray())
                .andExpect(jsonPath("$.result.totalElements").value(2));
    }

    @Test
    @WithMockUser(username = "test_owner_product", roles = {"VT-01"})
    public void deleteProduct_success() throws Exception {
        // Tạo sản phẩm trước
        Product p = Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SKU-TO-DELETE")
                .name("Sản phẩm xóa")
                .unit("Cái")
                .price(new BigDecimal("20000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .status("ACTIVE")
                .build();
        p = productRepository.saveAndFlush(p);

        mockMvc.perform(delete("/api/v1/products/" + p.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Xóa hàng hóa thành công"));

        // Lấy lại phải báo không tồn tại (do đã bị soft-deleted)
        mockMvc.perform(get("/api/v1/products/" + p.getId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(3001));
    }
}
