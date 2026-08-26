package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.AssignBarcodeRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Product;
import com.sales.entity.Role;
import com.sales.entity.TaxRate;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.ProductRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.TaxRateRepository;
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

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class BarcodeControllerTest {

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
    private ProductRepository productRepository;

    private BusinessHousehold testHousehold;
    private User testOwner;
    private User testStaff;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testHousehold = businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("0109998881")
                .name("Cửa Hàng Thử Nghiệm Mã Vạch")
                .phoneNumber("0912345678")
                .address("79 Đường 3/2")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));
        Role staffRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Nhân viên").build()));

        testOwner = userRepository.save(User.builder()
                .username("barcode_owner")
                .passwordHash("$2a$10$xyz")
                .fullName("Chủ Hộ Barcode")
                .phoneNumber("0901112233")
                .isActive(true)
                .role(ownerRole)
                .household(testHousehold)
                .build());

        testStaff = userRepository.save(User.builder()
                .username("barcode_staff")
                .passwordHash("$2a$10$xyz")
                .fullName("Nhân Viên Barcode")
                .phoneNumber("0901112244")
                .isActive(true)
                .role(staffRole)
                .household(testHousehold)
                .build());

        TaxRate taxRate = taxRateRepository.save(TaxRate.builder()
                .name("Thuế 8%")
                .ratePercentage(new BigDecimal("8.00"))
                .household(testHousehold)
                .isActive(true)
                .build());

        testProduct = productRepository.save(Product.builder()
                .sku("SP-BARCODE-01")
                .name("Rau muống hữu cơ 500g")
                .unit("Bó")
                .price(new BigDecimal("15000.00"))
                .costPrice(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("20.000"))
                .minStockQuantity(new BigDecimal("5.000"))
                .status("ACTIVE")
                .household(testHousehold)
                .taxRate(taxRate)
                .build());
    }

    @Test
    @WithMockUser(username = "barcode_owner", roles = {"VT-01"})
    void testGenerateInternalBarcode_Owner_Success() throws Exception {
        mockMvc.perform(post("/api/v1/products/" + testProduct.getId() + "/barcode/generate")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.productId").value(testProduct.getId()))
                .andExpect(jsonPath("$.result.barcode").exists())
                .andExpect(jsonPath("$.result.barcodeBase64Image").exists());
    }

    @Test
    @WithMockUser(username = "barcode_staff", roles = {"VT-02"})
    void testGenerateInternalBarcode_Staff_Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/products/" + testProduct.getId() + "/barcode/generate")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "barcode_owner", roles = {"VT-01"})
    void testAssignBarcode_Owner_Success() throws Exception {
        AssignBarcodeRequest request = AssignBarcodeRequest.builder()
                .barcode("8930001112223")
                .build();

        mockMvc.perform(post("/api/v1/products/" + testProduct.getId() + "/barcode/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.barcode").value("8930001112223"));
    }

    @Test
    @WithMockUser(username = "barcode_owner", roles = {"VT-01"})
    void testGetBarcodePrintData_Success() throws Exception {
        mockMvc.perform(get("/api/v1/products/" + testProduct.getId() + "/barcode/print")
                        .param("paperSize", "58mm")
                        .param("quantity", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.paperSize").value("58mm"))
                .andExpect(jsonPath("$.result.quantity").value(3))
                .andExpect(jsonPath("$.result.barcodeBase64Image").exists());
    }
}
