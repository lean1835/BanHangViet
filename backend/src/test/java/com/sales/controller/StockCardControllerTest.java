package com.sales.controller;

import com.sales.entity.*;
import com.sales.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class StockCardControllerTest {

    @Autowired
    private MockMvc mockMvc;

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

    @Autowired
    private GoodsReceiptRepository goodsReceiptRepository;

    @Autowired
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    private BusinessHousehold testHousehold;
    private User testOwner;
    private User testAccountant;
    private User testStaff;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testHousehold = businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("9998887771")
                .name("Hộ kinh doanh Thẻ Kho Test")
                .address("123 Phố Huế, Hà Nội")
                .phoneNumber("0912345678")
                .build());

        Role roleOwner = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ").build()));
        Role roleStaff = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Nhân viên bán hàng").build()));
        Role roleAccountant = roleRepository.findByCode("VT-03")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-03").name("Kế toán").build()));

        testOwner = userRepository.save(User.builder()
                .username("stock_owner")
                .passwordHash("hashed")
                .fullName("Chủ Hộ Kho")
                .household(testHousehold)
                .role(roleOwner)
                .isActive(true)
                .build());

        testAccountant = userRepository.save(User.builder()
                .username("stock_accountant")
                .passwordHash("hashed")
                .fullName("Kế Toán Kho")
                .household(testHousehold)
                .role(roleAccountant)
                .isActive(true)
                .build());

        testStaff = userRepository.save(User.builder()
                .username("stock_staff")
                .passwordHash("hashed")
                .fullName("Nhân Viên Quầy")
                .household(testHousehold)
                .role(roleStaff)
                .isActive(true)
                .build());

        TaxRate taxRate = taxRateRepository.save(TaxRate.builder()
                .household(testHousehold)
                .name("Thuế 10%")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(true)
                .build());

        testProduct = productRepository.save(Product.builder()
                .household(testHousehold)
                .sku("SKU-TK-01")
                .name("Nước khoáng Lavie 500ml")
                .unit("Chai")
                .price(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .taxRate(taxRate)
                .status("ACTIVE")
                .build());

        GoodsReceipt receipt = goodsReceiptRepository.save(GoodsReceipt.builder()
                .household(testHousehold)
                .createdByUser(testOwner)
                .receiptNumber("PN-TEST-001")
                .totalAmount(new BigDecimal("250000.00"))
                .receivedAt(LocalDateTime.now().minusDays(2))
                .notes("Nhập kho ban đầu")
                .build());

        goodsReceiptDetailRepository.save(GoodsReceiptDetail.builder()
                .receipt(receipt)
                .product(testProduct)
                .quantity(new BigDecimal("50.000"))
                .purchasePrice(new BigDecimal("5000.00"))
                .build());
    }

    @Test
    @DisplayName("Chủ hộ (VT-01) truy vấn thẻ kho thành công")
    @WithMockUser(username = "stock_owner", roles = {"VT-01"})
    void testOwnerCanGetStockCard() throws Exception {
        mockMvc.perform(get("/api/v1/products/{productId}/stock-card", testProduct.getId())
                        .param("fromDate", LocalDate.now().minusDays(10).toString())
                        .param("toDate", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.productId").value(testProduct.getId()))
                .andExpect(jsonPath("$.result.productSku").value("SKU-TK-01"))
                .andExpect(jsonPath("$.result.productName").value("Nước khoáng Lavie 500ml"))
                .andExpect(jsonPath("$.result.currentStock").value(50.0))
                .andExpect(jsonPath("$.result.movements.content", hasSize(1)))
                .andExpect(jsonPath("$.result.movements.content[0].documentType").value("GOODS_RECEIPT"))
                .andExpect(jsonPath("$.result.movements.content[0].documentNumber").value("PN-TEST-001"));
    }

    @Test
    @DisplayName("Kế toán (VT-03) truy vấn thẻ kho thành công")
    @WithMockUser(username = "stock_accountant", roles = {"VT-03"})
    void testAccountantCanGetStockCard() throws Exception {
        mockMvc.perform(get("/api/v1/products/{productId}/stock-card", testProduct.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.productId").value(testProduct.getId()));
    }

    @Test
    @DisplayName("Nhân viên bán hàng (VT-02) bị chặn truy cập (403 Forbidden)")
    @WithMockUser(username = "stock_staff", roles = {"VT-02"})
    void testStaffCannotAccessStockCard() throws Exception {
        mockMvc.perform(get("/api/v1/products/{productId}/stock-card", testProduct.getId()))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Khoảng ngày không hợp lệ trả về mã lỗi INVALID_DATE_RANGE (3060)")
    @WithMockUser(username = "stock_owner", roles = {"VT-01"})
    void testInvalidDateRangeReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/v1/products/{productId}/stock-card", testProduct.getId())
                        .param("fromDate", "2026-10-15")
                        .param("toDate", "2026-10-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3060));
    }
}
