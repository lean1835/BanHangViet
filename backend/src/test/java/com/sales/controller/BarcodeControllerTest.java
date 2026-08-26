package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.BarcodeScanRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Product;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.ProductRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
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
    private ProductRepository productRepository;

    @Autowired
    private com.sales.repository.TaxRateRepository taxRateRepository;

    private BusinessHousehold household;
    private User sellerUser;
    private Product product;

    @BeforeEach
    void setUp() {
        household = businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("MST-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Hộ Kinh Doanh Barcode Test")
                .address("123 Phố Quét Mã Vạch")
                .phoneNumber("0987654321")
                .build());

        Role sellerRole = roleRepository.findByCode("VT-02").orElseThrow();

        sellerUser = userRepository.save(User.builder()
                .username("seller_barcode_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("password_hash")
                .fullName("Nhân Viên Bán Hàng Mã Vạch")
                .household(household)
                .role(sellerRole)
                .isActive(true)
                .build());

        var taxRate = taxRateRepository.save(com.sales.entity.TaxRate.builder()
                .household(household)
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build());

        product = productRepository.save(Product.builder()
                .household(household)
                .taxRate(taxRate)
                .sku("8934567899999")
                .barcode("8934567899999")
                .name("Mì Hảo Hảo Tôm Chua Cay")
                .unit("Gói")
                .price(new BigDecimal("4500.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .status("ACTIVE")
                .build());
    }

    @Test
    @DisplayName("NCL-16-CN-001: Nhân viên VT-02 quét mã vạch thành công -> Trả về 200 OK")
    void scanBarcode_SellerRole_Success() throws Exception {
        BarcodeScanRequest request = BarcodeScanRequest.builder()
                .barcode("8934567899999")
                .build();

        mockMvc.perform(post("/api/v1/barcodes/scan")
                        .with(user(sellerUser.getUsername()).roles("VT-02"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.found").value(true))
                .andExpect(jsonPath("$.result.productName").value("Mì Hảo Hảo Tôm Chua Cay"));
    }

    @Test
    @DisplayName("NCL-16-CN-001-TC-02: Quét mã vạch không có trong DB -> Trả về 200 OK và found = false")
    void scanBarcode_NotFound_ReturnsFoundFalse() throws Exception {
        BarcodeScanRequest request = BarcodeScanRequest.builder()
                .barcode("0000000000000")
                .build();

        mockMvc.perform(post("/api/v1/barcodes/scan")
                        .with(user(sellerUser.getUsername()).roles("VT-02"))
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
}
