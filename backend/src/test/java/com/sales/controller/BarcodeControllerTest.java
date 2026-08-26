package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.AssignBarcodeRequest;
import com.sales.dto.request.BarcodeScanRequest;
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
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
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
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private ProductRepository productRepository;

    private BusinessHousehold testHousehold;
    private User testOwner;
    private User testStaff;
    private User accountantUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testHousehold = businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("MST-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Cửa Hàng Thử Nghiệm Mã Vạch")
                .phoneNumber("0912345678")
                .address("79 Đường 3/2")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));
        Role staffRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Nhân viên").build()));
        Role accountantRole = roleRepository.findByCode("VT-03")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-03").name("Kế toán").build()));

        testOwner = userRepository.save(User.builder()
                .username("barcode_owner_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("$2a$10$xyz")
                .fullName("Chủ Hộ Barcode")
                .phoneNumber("0901112233")
                .isActive(true)
                .role(ownerRole)
                .household(testHousehold)
                .build());

        testStaff = userRepository.save(User.builder()
                .username("barcode_staff_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("$2a$10$xyz")
                .fullName("Nhân Viên Barcode")
                .phoneNumber("0901112244")
                .isActive(true)
                .role(staffRole)
                .household(testHousehold)
                .build());

        accountantUser = userRepository.save(User.builder()
                .username("accountant_barcode_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("$2a$10$xyz")
                .fullName("Kế Toán Viên")
                .phoneNumber("0901112255")
                .isActive(true)
                .role(accountantRole)
                .household(testHousehold)
                .build());

        TaxRate taxRate = taxRateRepository.save(TaxRate.builder()
                .name("Thuế 8%")
                .ratePercentage(new BigDecimal("8.00"))
                .household(testHousehold)
                .isActive(true)
                .build());

        testProduct = productRepository.save(Product.builder()
                .sku("8934567899999")
                .barcode("8934567899999")
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
    @DisplayName("NCL-16-CN-001: Nhân viên VT-02 quét mã vạch thành công -> Trả về 200 OK")
    void scanBarcode_SellerRole_Success() throws Exception {
        BarcodeScanRequest request = BarcodeScanRequest.builder()
                .barcode("8934567899999")
                .build();

        mockMvc.perform(post("/api/v1/barcodes/scan")
                        .with(user(testStaff.getUsername()).roles("VT-02"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.found").value(true))
                .andExpect(jsonPath("$.result.productName").value("Rau muống hữu cơ 500g"));
    }

    @Test
    @DisplayName("NCL-16-CN-001-TC-02: Quét mã vạch không có trong DB -> Trả về 200 OK và found = false")
    void scanBarcode_NotFound_ReturnsFoundFalse() throws Exception {
        BarcodeScanRequest request = BarcodeScanRequest.builder()
                .barcode("0000000000000")
                .build();

        mockMvc.perform(post("/api/v1/barcodes/scan")
                        .with(user(testStaff.getUsername()).roles("VT-02"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.found").value(false))
                .andExpect(jsonPath("$.result.suggestedBarcode").value("0000000000000"));
    }

    @Test
    @DisplayName("NCL-16-CN-001-TC-04: Người dùng chưa đăng nhập quét mã vạch -> Trả về 401 Unauthorized")
    void scanBarcode_Unauthenticated_Returns401() throws Exception {
        BarcodeScanRequest request = BarcodeScanRequest.builder()
                .barcode("8934567899999")
                .build();

        mockMvc.perform(post("/api/v1/barcodes/scan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("RBAC: Vai trò VT-03 (Kế toán) bị cấm quét mã vạch sửa đơn hàng -> Trả về 403 Forbidden")
    void scanBarcode_AccountantRole_Returns403Forbidden() throws Exception {
        BarcodeScanRequest request = BarcodeScanRequest.builder()
                .barcode("8934567899999")
                .build();

        mockMvc.perform(post("/api/v1/barcodes/scan")
                        .with(user(accountantUser.getUsername()).roles("VT-03"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGenerateInternalBarcode_Owner_Success() throws Exception {
        mockMvc.perform(post("/api/v1/barcodes/products/" + testProduct.getId() + "/generate")
                        .with(user(testOwner.getUsername()).roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.productId").value(testProduct.getId()))
                .andExpect(jsonPath("$.result.barcode").exists())
                .andExpect(jsonPath("$.result.barcodeBase64Image").exists());
    }

    @Test
    void testGenerateInternalBarcode_Staff_Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/barcodes/products/" + testProduct.getId() + "/generate")
                        .with(user(testStaff.getUsername()).roles("VT-02"))
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    void testAssignBarcode_Owner_Success() throws Exception {
        AssignBarcodeRequest request = AssignBarcodeRequest.builder()
                .barcode("8930001112223")
                .build();

        mockMvc.perform(post("/api/v1/barcodes/products/" + testProduct.getId() + "/assign")
                        .with(user(testOwner.getUsername()).roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.barcode").value("8930001112223"));
    }

    @Test
    void testGetBarcodePrintData_Success() throws Exception {
        mockMvc.perform(get("/api/v1/barcodes/products/" + testProduct.getId() + "/print")
                        .with(user(testOwner.getUsername()).roles("VT-01"))
                        .param("paperSize", "58mm")
                        .param("quantity", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.paperSize").value("58mm"))
                .andExpect(jsonPath("$.result.quantity").value(3))
                .andExpect(jsonPath("$.result.barcodeBase64Image").exists());
    }
}
