package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateProductUnitConversionRequest;
import com.sales.dto.request.UpdateProductUnitConversionRequest;
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
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ProductUnitConversionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private ProductUnitConversionRepository productUnitConversionRepository;

    @Autowired
    private GoodsReceiptRepository goodsReceiptRepository;

    @Autowired
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    private BusinessHousehold testHousehold;
    private User testOwner;
    private User testCashier;
    private Product testProduct;
    private TaxRate testTaxRate;

    @BeforeEach
    void setUp() {
        testHousehold = businessHouseholdRepository.save(BusinessHousehold.builder()
                .name("Hộ kinh doanh Test Units")
                .taxCode("9998887771")
                .address("123 Test Street")
                .phoneNumber("0987654321")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));

        Role cashierRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Thu ngân").build()));

        testOwner = userRepository.save(User.builder()
                .username("unit_owner")
                .passwordHash("encoded_pass")
                .fullName("Unit Test Owner")
                .role(ownerRole)
                .household(testHousehold)
                .isActive(true)
                .build());

        testCashier = userRepository.save(User.builder()
                .username("unit_cashier")
                .passwordHash("encoded_pass")
                .fullName("Unit Test Cashier")
                .role(cashierRole)
                .household(testHousehold)
                .isActive(true)
                .build());

        testTaxRate = taxRateRepository.save(TaxRate.builder()
                .household(testHousehold)
                .name("VAT 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build());

        testProduct = productRepository.save(Product.builder()
                .household(testHousehold)
                .sku("BEER-01")
                .name("Bia Heineken")
                .unit("Lon")
                .price(new BigDecimal("20000.00"))
                .costPrice(new BigDecimal("15000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .taxRate(testTaxRate)
                .status("ACTIVE")
                .build());
    }

    @Test
    @DisplayName("GET /api/v1/products/{productId}/unit-conversions - Lấy danh sách thành công")
    @WithMockUser(username = "unit_owner", roles = {"VT-01"})
    void getUnitConversions_success() throws Exception {
        productUnitConversionRepository.save(ProductUnitConversion.builder()
                .product(testProduct)
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .price(new BigDecimal("450000.00"))
                .build());

        mockMvc.perform(get("/api/v1/products/" + testProduct.getId() + "/unit-conversions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result", hasSize(1)))
                .andExpect(jsonPath("$.result[0].unitName").value("Thùng"))
                .andExpect(jsonPath("$.result[0].conversionFactor").value(24.0))
                .andExpect(jsonPath("$.result[0].baseUnit").value("Lon"));
    }

    @Test
    @DisplayName("POST /api/v1/products/{productId}/unit-conversions - Chủ hộ tạo đơn vị quy đổi thành công")
    @WithMockUser(username = "unit_owner", roles = {"VT-01"})
    void createUnitConversion_asOwner_success() throws Exception {
        CreateProductUnitConversionRequest request = CreateProductUnitConversionRequest.builder()
                .unitName("Lốc 6 lon")
                .conversionFactor(new BigDecimal("6"))
                .price(new BigDecimal("115000.00"))
                .isDefaultImport(true)
                .build();

        mockMvc.perform(post("/api/v1/products/" + testProduct.getId() + "/unit-conversions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.unitName").value("Lốc 6 lon"))
                .andExpect(jsonPath("$.result.conversionFactor").value(6.0))
                .andExpect(jsonPath("$.result.isDefaultImport").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/products/{productId}/unit-conversions - Thu ngân (VT-02) không có quyền tạo (403 Forbidden)")
    @WithMockUser(username = "unit_cashier", roles = {"VT-02"})
    void createUnitConversion_asCashier_forbidden() throws Exception {
        CreateProductUnitConversionRequest request = CreateProductUnitConversionRequest.builder()
                .unitName("Lốc 6 lon")
                .conversionFactor(new BigDecimal("6"))
                .price(new BigDecimal("115000.00"))
                .build();

        mockMvc.perform(post("/api/v1/products/" + testProduct.getId() + "/unit-conversions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PUT /api/v1/products/{productId}/unit-conversions/{id} - TC-03: Chặn sửa tỷ lệ quy đổi khi đã có biến động tồn kho (Mã 3071)")
    @WithMockUser(username = "unit_owner", roles = {"VT-01"})
    void updateUnitConversion_tc03_stockMovementExists_blocked() throws Exception {
        ProductUnitConversion conversion = productUnitConversionRepository.save(ProductUnitConversion.builder()
                .product(testProduct)
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .price(new BigDecimal("450000.00"))
                .build());

        // Tạo 1 phiếu nhập kho cho sản phẩm này -> tạo biến động tồn kho
        GoodsReceipt gr = goodsReceiptRepository.save(GoodsReceipt.builder()
                .household(testHousehold)
                .createdByUser(testOwner)
                .receiptNumber("NK-TEST-001")
                .totalAmount(new BigDecimal("450000.00"))
                .receivedAt(LocalDateTime.now())
                .build());

        goodsReceiptDetailRepository.save(GoodsReceiptDetail.builder()
                .receipt(gr)
                .product(testProduct)
                .quantity(new BigDecimal("1"))
                .purchasePrice(new BigDecimal("450000.00"))
                .build());

        // Cố tình sửa conversionFactor từ 24 thành 30
        UpdateProductUnitConversionRequest request = UpdateProductUnitConversionRequest.builder()
                .unitName("Thùng 30 lon")
                .conversionFactor(new BigDecimal("30"))
                .price(new BigDecimal("550000.00"))
                .build();

        mockMvc.perform(put("/api/v1/products/" + testProduct.getId() + "/unit-conversions/" + conversion.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3071))
                .andExpect(jsonPath("$.message").value(containsString("TC-03")));
    }

    @Test
    @DisplayName("DELETE /api/v1/products/{productId}/unit-conversions/{id} - Xóa đơn vị quy đổi thành công")
    @WithMockUser(username = "unit_owner", roles = {"VT-01"})
    void deleteUnitConversion_success() throws Exception {
        ProductUnitConversion conversion = productUnitConversionRepository.save(ProductUnitConversion.builder()
                .product(testProduct)
                .unitName("Két 12 lon")
                .conversionFactor(new BigDecimal("12"))
                .price(new BigDecimal("230000.00"))
                .build());

        mockMvc.perform(delete("/api/v1/products/" + testProduct.getId() + "/unit-conversions/" + conversion.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }
}
