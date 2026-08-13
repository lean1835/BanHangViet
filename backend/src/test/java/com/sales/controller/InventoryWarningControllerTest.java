package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.UpdateMinStockRequest;
import com.sales.entity.*;
import com.sales.repository.*;
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
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class InventoryWarningControllerTest {

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

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private GoodsReceiptRepository goodsReceiptRepository;

    @Autowired
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ProductGroupRepository productGroupRepository;

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private User testOwner;
    private User testEmployee;
    private TaxRate testTaxRate;
    private Supplier testSupplier;

    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findAll().stream().findFirst().orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("8888888888")
                    .name("Hộ Kinh Doanh Test Inventory Warning")
                    .address("123 Phố Test")
                    .phoneNumber("0888888888")
                    .build();
            return businessHouseholdRepository.save(household);
        });

        ownerRole = roleRepository.findByCode("VT-01").orElseGet(() -> {
            Role r = Role.builder().code("VT-01").name("Chủ hộ").build();
            return roleRepository.save(r);
        });

        employeeRole = roleRepository.findByCode("VT-02").orElseGet(() -> {
            Role r = Role.builder().code("VT-02").name("Nhân viên").build();
            return roleRepository.save(r);
        });

        testOwner = userRepository.findByUsername("test_owner_inv_warning").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_inv_warning")
                    .passwordHash("hashed_password")
                    .fullName("Chủ Hộ Inventory Warning Test")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testEmployee = userRepository.findByUsername("test_employee_inv_warning").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee_inv_warning")
                    .passwordHash("hashed_password")
                    .fullName("Nhân Viên Inventory Warning Test")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testTaxRate = taxRateRepository.findAll().stream()
                .filter(t -> t.getHousehold().getId().equals(testHousehold.getId()) && t.getIsActive())
                .findFirst().orElseGet(() -> {
                    TaxRate t = TaxRate.builder()
                            .household(testHousehold)
                            .name("VAT 10%")
                            .ratePercentage(new BigDecimal("10.00"))
                            .isActive(true)
                            .build();
                    return taxRateRepository.save(t);
                });

        testSupplier = supplierRepository.save(Supplier.builder()
                .household(testHousehold)
                .name("Nhà Cung Cấp Nước Giải Khát Việt")
                .phoneNumber("0901234567")
                .email("ncc@test.com")
                .build());
    }

    @Test
    @WithMockUser(username = "test_owner_inv_warning", roles = {"VT-01"})
    public void updateMinStock_owner_success() throws Exception {
        Product p = productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-MIN-001")
                .name("Sữa tươi tiệt trùng 1L")
                .unit("Hộp")
                .price(new BigDecimal("35000.00"))
                .costPrice(new BigDecimal("28000.00"))
                .stockQuantity(new BigDecimal("5.000"))
                .minStockQuantity(new BigDecimal("0.000"))
                .status("ACTIVE")
                .build());

        UpdateMinStockRequest request = UpdateMinStockRequest.builder()
                .minStockQuantity(new BigDecimal("12.000"))
                .build();

        mockMvc.perform(put("/api/v1/products/" + p.getId() + "/min-stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Cập nhật ngưỡng tồn tối thiểu thành công"))
                .andExpect(jsonPath("$.result.minStockQuantity").value(12.0));
    }

    @Test
    @WithMockUser(username = "test_employee_inv_warning", roles = {"VT-02"})
    public void updateMinStock_employee_forbidden() throws Exception {
        Product p = productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-MIN-002")
                .name("Nước khoáng thiên nhiên 500ml")
                .unit("Chai")
                .price(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("10.000"))
                .minStockQuantity(new BigDecimal("5.000"))
                .status("ACTIVE")
                .build());

        UpdateMinStockRequest request = UpdateMinStockRequest.builder()
                .minStockQuantity(new BigDecimal("20.000"))
                .build();

        mockMvc.perform(put("/api/v1/products/" + p.getId() + "/min-stock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_owner_inv_warning", roles = {"VT-01"})
    public void getLowStockWarnings_success() throws Exception {
        Product lowStockProduct = productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-LOW-001")
                .name("Mì tôm Hảo Hảo Tôm Chua Cay")
                .unit("Gói")
                .price(new BigDecimal("5000.00"))
                .costPrice(new BigDecimal("4000.00"))
                .stockQuantity(new BigDecimal("3.000"))
                .minStockQuantity(new BigDecimal("15.000"))
                .status("ACTIVE")
                .build());

        GoodsReceipt receipt = goodsReceiptRepository.save(GoodsReceipt.builder()
                .household(testHousehold)
                .supplier(testSupplier)
                .createdByUser(testOwner)
                .receiptNumber("PNK-WARN-001")
                .totalAmount(new BigDecimal("120000.00"))
                .receivedAt(LocalDateTime.now().minusDays(2))
                .build());

        goodsReceiptDetailRepository.save(GoodsReceiptDetail.builder()
                .receipt(receipt)
                .product(lowStockProduct)
                .quantity(new BigDecimal("30.000"))
                .purchasePrice(new BigDecimal("4000.00"))
                .build());

        mockMvc.perform(get("/api/v1/inventory/low-stock-warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.stockAdequate").value(false))
                .andExpect(jsonPath("$.result.page.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.page.content[0].productId").value(lowStockProduct.getId()))
                .andExpect(jsonPath("$.result.page.content[0].shortageQuantity").value(12.0))
                .andExpect(jsonPath("$.result.page.content[0].lastSupplierName").value(testSupplier.getName()));
    }

    @Test
    @WithMockUser(username = "test_employee_inv_warning", roles = {"VT-02"})
    public void getLowStockWarnings_employee_can_view() throws Exception {
        mockMvc.perform(get("/api/v1/inventory/low-stock-warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "test_owner_inv_warning", roles = {"VT-01"})
    public void getLowStockWarnings_emptyData_stockAdequate() throws Exception {
        productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-ADEQUATE-001")
                .name("Dầu ăn Tường An 1L")
                .unit("Chai")
                .price(new BigDecimal("50000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        mockMvc.perform(get("/api/v1/inventory/low-stock-warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.stockAdequate").value(true))
                .andExpect(jsonPath("$.result.message").value("Tồn kho đang đầy đủ"))
                .andExpect(jsonPath("$.result.page.content", hasSize(0)));
    }

    @Test
    @WithMockUser(username = "test_owner_inv_warning", roles = {"VT-01"})
    public void getLowStockWarnings_productWithoutMinStockSet_excluded() throws Exception {
        productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-NOMIN-001")
                .name("Sản phẩm chưa đặt ngưỡng tồn")
                .unit("Cái")
                .price(new BigDecimal("20000.00"))
                .stockQuantity(BigDecimal.ZERO)
                .minStockQuantity(BigDecimal.ZERO)
                .status("ACTIVE")
                .build());

        mockMvc.perform(get("/api/v1/inventory/low-stock-warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.stockAdequate").value(true))
                .andExpect(jsonPath("$.result.page.content", hasSize(0)));
    }

    @Test
    @WithMockUser(username = "test_owner_inv_warning", roles = {"VT-01"})
    public void getLowStockWarnings_productWithDeletedGroup_groupNameIsNull() throws Exception {
        ProductGroup deletedGroup = productGroupRepository.save(ProductGroup.builder()
                .household(testHousehold)
                .name("Nhóm đã xóa")
                .deletedAt(java.time.LocalDateTime.now())
                .build());

        productRepository.save(Product.builder()
                .household(testHousehold)
                .group(deletedGroup)
                .taxRate(testTaxRate)
                .sku("SP-DELGRP-001")
                .name("Sản phẩm thuộc nhóm đã xóa")
                .unit("Hộp")
                .price(new BigDecimal("15000.00"))
                .stockQuantity(new BigDecimal("2.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        mockMvc.perform(get("/api/v1/inventory/low-stock-warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.stockAdequate").value(false))
                .andExpect(jsonPath("$.result.page.content[0].groupName").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    @WithMockUser(username = "test_owner_inv_warning", roles = {"VT-01"})
    public void getLowStockWarnings_productWithDeletedSupplier_supplierIsNull() throws Exception {
        Supplier deletedSupplier = supplierRepository.save(Supplier.builder()
                .household(testHousehold)
                .name("Nhà cung cấp đã xóa")
                .phoneNumber("0988888888")
                .deletedAt(LocalDateTime.now())
                .build());

        Product p = productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-DELSUP-001")
                .name("Sản phẩm thuộc NCC đã xóa")
                .unit("Cái")
                .price(new BigDecimal("15000.00"))
                .stockQuantity(new BigDecimal("1.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        GoodsReceipt receipt = goodsReceiptRepository.save(GoodsReceipt.builder()
                .household(testHousehold)
                .supplier(deletedSupplier)
                .createdByUser(testOwner)
                .receiptNumber("GR-DELSUP-001")
                .receivedAt(LocalDateTime.now())
                .totalAmount(new BigDecimal("150000.00"))
                .build());

        goodsReceiptDetailRepository.save(GoodsReceiptDetail.builder()
                .receipt(receipt)
                .product(p)
                .quantity(new BigDecimal("10.000"))
                .purchasePrice(new BigDecimal("15000.00"))
                .build());

        mockMvc.perform(get("/api/v1/inventory/low-stock-warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.page.content[0].lastSupplierId").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    @WithMockUser(username = "test_owner_inv_warning", roles = {"VT-01"})
    public void getPurchaseSuggestions_owner_success() throws Exception {
        Product p = productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-SUGG-001")
                .name("Nước mắm Nam Ngư 500ml")
                .unit("Chai")
                .price(new BigDecimal("40000.00"))
                .costPrice(new BigDecimal("30000.00"))
                .stockQuantity(new BigDecimal("5.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        Order order = orderRepository.save(Order.builder()
                .household(testHousehold)
                .createdByUser(testOwner)
                .orderNumber("ORD-SUGG-001")
                .totalAmount(new BigDecimal("3200000.00"))
                .discountAmount(new BigDecimal("0.00"))
                .finalAmount(new BigDecimal("3200000.00"))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .status("COMPLETED")
                .createdAt(LocalDateTime.now().minusDays(7))
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(p)
                .productName(p.getName())
                .quantity(new BigDecimal("80.000"))
                .unitPrice(new BigDecimal("40000.00"))
                .discountAmount(new BigDecimal("0.00"))
                .subtotal(new BigDecimal("3200000.00"))
                .build());

        mockMvc.perform(get("/api/v1/inventory/purchase-suggestions?periodDays=28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.content[0].productId").value(p.getId()))
                .andExpect(jsonPath("$.result.content[0].averageWeeklySales").value(20.0))
                .andExpect(jsonPath("$.result.content[0].suggestedQuantity").value(15.0))
                .andExpect(jsonPath("$.result.content[0].calculationRationale", containsString("Bán trung bình 20 Chai/tuần, tồn hiện có 5 Chai -> Gợi ý nhập 15 Chai")));
    }

    @Test
    @WithMockUser(username = "test_owner_inv_warning", roles = {"VT-01"})
    public void getPurchaseSuggestions_newProductWithoutSales_skipped() throws Exception {
        productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-NEW-001")
                .name("Sản phẩm mới chưa có lịch sử bán")
                .unit("Cái")
                .price(new BigDecimal("100000.00"))
                .stockQuantity(new BigDecimal("2.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        mockMvc.perform(get("/api/v1/inventory/purchase-suggestions?periodDays=28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content", hasSize(0)));
    }

    @Test
    @WithMockUser(username = "test_employee_inv_warning", roles = {"VT-02"})
    public void getPurchaseSuggestions_employee_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/inventory/purchase-suggestions"))
                .andExpect(status().isForbidden());
    }
}
