package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CreateGoodsReceiptDetailRequest;
import com.viet.sales.dto.request.CreateGoodsReceiptRequest;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class GoodsReceiptControllerTest {

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
    private ProductRepository productRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @Autowired
    private GoodsReceiptRepository goodsReceiptRepository;

    private User ownerUser;
    private User employeeUser;
    private User accountingUser;
    private BusinessHousehold household;
    private Product product1;

    @BeforeEach
    public void setUp() {
        Role ownerRole = getOrCreateRole("VT-01", "Chủ hộ kinh doanh");
        Role employeeRole = getOrCreateRole("VT-02", "Nhân viên bán hàng");
        Role accountingRole = getOrCreateRole("VT-03", "Kế toán");

        household = BusinessHousehold.builder()
                .name("Siêu Thị Mini Test")
                .taxCode("2222333344")
                .address("TP HCM")
                .phoneNumber("0123456789")
                .build();
        household = householdRepository.save(household);

        ownerUser = User.builder()
                .username("owner_test_inv")
                .passwordHash("hash")
                .fullName("Nguyễn Chủ Tiệm")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();
        userRepository.save(ownerUser);

        employeeUser = User.builder()
                .username("employee_test_inv")
                .passwordHash("hash")
                .fullName("Lê Nhân Viên")
                .role(employeeRole)
                .household(household)
                .isActive(true)
                .build();
        userRepository.save(employeeUser);

        accountingUser = User.builder()
                .username("accounting_test_inv")
                .passwordHash("hash")
                .fullName("Trần Kế Toán")
                .role(accountingRole)
                .household(household)
                .isActive(true)
                .build();
        userRepository.save(accountingUser);

        TaxRate taxRate = TaxRate.builder()
                .household(household)
                .name("VAT 5%")
                .ratePercentage(new BigDecimal("5.00"))
                .isActive(true)
                .build();
        taxRate = taxRateRepository.save(taxRate);

        product1 = Product.builder()
                .household(household)
                .sku("SP-001")
                .name("Sữa Tươi")
                .unit("Hộp")
                .price(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("10.000"))
                .taxRate(taxRate)
                .status("ACTIVE")
                .build();
        product1 = productRepository.save(product1);
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
    @WithMockUser(username = "owner_test_inv", roles = "VT-01")
    public void createGoodsReceipt_success() throws Exception {
        CreateGoodsReceiptDetailRequest detail = CreateGoodsReceiptDetailRequest.builder()
                .productId(product1.getId())
                .quantity(new BigDecimal("20.500"))
                .purchasePrice(new BigDecimal("8000.00"))
                .build();

        CreateGoodsReceiptRequest request = CreateGoodsReceiptRequest.builder()
                .receiptNumber("GR-001")
                .notes("Nhập sữa tháng 7")
                .details(Collections.singletonList(detail))
                .build();

        mockMvc.perform(post("/api/v1/goods-receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.receiptNumber").value("GR-001"));

        // Verify stock added
        Product updatedProduct = productRepository.findById(product1.getId()).orElseThrow();
        assertEquals(new BigDecimal("30.500"), updatedProduct.getStockQuantity());
    }

    @Test
    @WithMockUser(username = "owner_test_inv", roles = "VT-01")
    public void createGoodsReceipt_duplicateNumber_fails() throws Exception {
        // Save an existing receipt
        GoodsReceipt existing = GoodsReceipt.builder()
                .household(household)
                .createdByUser(ownerUser)
                .receiptNumber("GR-DUP")
                .receivedAt(java.time.LocalDateTime.now())
                .build();
        goodsReceiptRepository.save(existing);

        CreateGoodsReceiptDetailRequest detail = CreateGoodsReceiptDetailRequest.builder()
                .productId(product1.getId())
                .quantity(new BigDecimal("5.000"))
                .purchasePrice(new BigDecimal("9000.00"))
                .build();

        CreateGoodsReceiptRequest request = CreateGoodsReceiptRequest.builder()
                .receiptNumber("GR-DUP")
                .details(Collections.singletonList(detail))
                .build();

        mockMvc.perform(post("/api/v1/goods-receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3019))
                .andExpect(jsonPath("$.message").value("Số phiếu nhập kho đã tồn tại trên hệ thống"));
    }

    @Test
    @WithMockUser(username = "owner_test_inv", roles = "VT-01")
    public void createGoodsReceipt_invalidQuantity_fails() throws Exception {
        CreateGoodsReceiptDetailRequest detail = CreateGoodsReceiptDetailRequest.builder()
                .productId(product1.getId())
                .quantity(new BigDecimal("-2.000")) // negative
                .purchasePrice(new BigDecimal("8000.00"))
                .build();

        CreateGoodsReceiptRequest request = CreateGoodsReceiptRequest.builder()
                .receiptNumber("GR-NEG")
                .details(Collections.singletonList(detail))
                .build();

        mockMvc.perform(post("/api/v1/goods-receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "owner_test_inv", roles = "VT-01")
    public void createGoodsReceipt_futureReceivedAt_fails() throws Exception {
        CreateGoodsReceiptDetailRequest detail = CreateGoodsReceiptDetailRequest.builder()
                .productId(product1.getId())
                .quantity(new BigDecimal("5.000"))
                .purchasePrice(new BigDecimal("9000.00"))
                .build();

        CreateGoodsReceiptRequest request = CreateGoodsReceiptRequest.builder()
                .receiptNumber("GR-FUTURE")
                .receivedAt(java.time.LocalDateTime.now().plusDays(1)) // future date
                .details(Collections.singletonList(detail))
                .build();

        mockMvc.perform(post("/api/v1/goods-receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "owner_test_inv", roles = "VT-01")
    public void createGoodsReceipt_emptyDetails_fails() throws Exception {
        CreateGoodsReceiptRequest request = CreateGoodsReceiptRequest.builder()
                .receiptNumber("GR-EMPTY")
                .details(Collections.emptyList())
                .build();

        mockMvc.perform(post("/api/v1/goods-receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "owner_test_inv", roles = "VT-01")
    public void getGoodsReceipts_success() throws Exception {
        GoodsReceipt existing = GoodsReceipt.builder()
                .household(household)
                .createdByUser(ownerUser)
                .receiptNumber("GR-LIST")
                .receivedAt(java.time.LocalDateTime.now())
                .build();
        goodsReceiptRepository.save(existing);

        mockMvc.perform(get("/api/v1/goods-receipts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].receiptNumber").value("GR-LIST"));
    }

    @Test
    @WithMockUser(username = "employee_test_inv", roles = "VT-02")
    public void createGoodsReceipt_employeeRole_forbidden() throws Exception {
        CreateGoodsReceiptDetailRequest detail = CreateGoodsReceiptDetailRequest.builder()
                .productId(product1.getId())
                .quantity(new BigDecimal("10.000"))
                .purchasePrice(new BigDecimal("8000.00"))
                .build();

        CreateGoodsReceiptRequest request = CreateGoodsReceiptRequest.builder()
                .receiptNumber("GR-EMP")
                .details(Collections.singletonList(detail))
                .build();

        mockMvc.perform(post("/api/v1/goods-receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "accounting_test_inv", roles = "VT-03")
    public void getGoodsReceipts_accountingRole_success() throws Exception {
        GoodsReceipt existing = GoodsReceipt.builder()
                .household(household)
                .createdByUser(ownerUser)
                .receiptNumber("GR-ACCT")
                .receivedAt(java.time.LocalDateTime.now())
                .build();
        goodsReceiptRepository.save(existing);

        mockMvc.perform(get("/api/v1/goods-receipts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].receiptNumber").value("GR-ACCT"));
    }

    @Test
    @WithMockUser(username = "accounting_test_inv", roles = "VT-03")
    public void createGoodsReceipt_accountingRole_forbidden() throws Exception {
        CreateGoodsReceiptDetailRequest detail = CreateGoodsReceiptDetailRequest.builder()
                .productId(product1.getId())
                .quantity(new BigDecimal("10.000"))
                .purchasePrice(new BigDecimal("8000.00"))
                .build();

        CreateGoodsReceiptRequest request = CreateGoodsReceiptRequest.builder()
                .receiptNumber("GR-ACCT-FORBID")
                .details(Collections.singletonList(detail))
                .build();

        mockMvc.perform(post("/api/v1/goods-receipts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
