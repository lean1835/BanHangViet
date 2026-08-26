package com.sales.controller;

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
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class SalesAnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PointOfSaleRepository pointOfSaleRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductGroupRepository productGroupRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

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

    private BusinessHousehold testHousehold;
    private Role ownerRole;
    private Role employeeRole;
    private Role accountantRole;
    private PointOfSale testPos;
    private TaxRate testTaxRate;
    private Supplier testSupplier;


    @BeforeEach
    public void setUp() {
        testHousehold = businessHouseholdRepository.findByTaxCode("9999888877").orElseGet(() -> {
            BusinessHousehold household = BusinessHousehold.builder()
                    .taxCode("9999888877")
                    .name("Hộ kinh doanh Test Analytics")
                    .address("Địa chỉ Test Analytics")
                    .phoneNumber("0999888877")
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

        accountantRole = roleRepository.findByCode("VT-03").orElseGet(() -> {
            Role r = Role.builder().code("VT-03").name("Kế toán").build();
            return roleRepository.save(r);
        });

        userRepository.findByUsername("test_owner_analytics").orElseGet(() -> {
            User u = User.builder()
                    .username("test_owner_analytics")
                    .passwordHash("password_hash")
                    .fullName("Chủ Hộ Test Analytics")
                    .role(ownerRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        userRepository.findByUsername("test_employee_analytics").orElseGet(() -> {
            User u = User.builder()
                    .username("test_employee_analytics")
                    .passwordHash("password_hash")
                    .fullName("Nhân Viên Test Analytics")
                    .role(employeeRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        userRepository.findByUsername("test_accountant_analytics").orElseGet(() -> {
            User u = User.builder()
                    .username("test_accountant_analytics")
                    .passwordHash("password_hash")
                    .fullName("Kế Toán Test Analytics")
                    .role(accountantRole)
                    .household(testHousehold)
                    .isActive(true)
                    .build();
            return userRepository.save(u);
        });

        testPos = pointOfSaleRepository.findAllByHouseholdIdAndDeletedAtIsNull(testHousehold.getId()).stream()
                .filter(p -> "POS-TEST-01".equals(p.getPosCode()))
                .findFirst()
                .orElseGet(() -> {
                    PointOfSale p = PointOfSale.builder()
                            .household(testHousehold)
                            .posCode("POS-TEST-01")
                            .name("Điểm bán Test Analytics")
                            .address("Quầy 1 Test Analytics")
                            .isDefault(true)
                            .isActive(true)
                            .build();
                    return pointOfSaleRepository.save(p);
                });

        testTaxRate = taxRateRepository.findAll().stream()
                .filter(t -> t.getHousehold().getId().equals(testHousehold.getId()) && Boolean.TRUE.equals(t.getIsActive()))
                .findFirst()
                .orElseGet(() -> {
                    TaxRate t = TaxRate.builder()
                            .household(testHousehold)
                            .name("VAT 10% Test Analytics")
                            .ratePercentage(new BigDecimal("10.00"))
                            .isActive(true)
                            .build();
                    return taxRateRepository.save(t);
                });

        testSupplier = supplierRepository.findAll().stream()
                .filter(s -> s.getHousehold().getId().equals(testHousehold.getId()) && s.getDeletedAt() == null)
                .findFirst()
                .orElseGet(() -> supplierRepository.save(Supplier.builder()
                        .household(testHousehold)
                        .name("Nhà Cung Cấp Nước Giải Khát Việt Analytics")
                        .phoneNumber("0901234567")
                        .email("ncc_analytics@test.com")
                        .build()));
    }


    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_asOwner_success() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Lấy phân tích giờ cao điểm và ngày bán chạy thành công"))
                .andExpect(jsonPath("$.result.filterInfo.posName").value("Tất cả điểm bán"))
                .andExpect(jsonPath("$.result.hourlyStats", hasSize(24)))
                .andExpect(jsonPath("$.result.dayOfWeekStats", hasSize(7)))
                .andExpect(jsonPath("$.result.heatmap", hasSize(168)))
                .andExpect(jsonPath("$.result.insights").exists());
    }

    @Test
    @WithMockUser(username = "test_accountant_analytics", roles = {"VT-03"})
    public void getPeakAnalysis_asAccountant_success() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.hourlyStats", hasSize(24)))
                .andExpect(jsonPath("$.result.dayOfWeekStats", hasSize(7)));
    }

    @Test
    @WithMockUser(username = "test_employee_analytics", roles = {"VT-02"})
    public void getPeakAnalysis_asEmployee_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_invalidDateRange_badRequest() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .param("fromDate", "2026-08-25")
                        .param("toDate", "2026-08-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_customDateRange_success() throws Exception {
        LocalDate today = LocalDate.now();
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .param("fromDate", today.minusDays(15).toString())
                        .param("toDate", today.toString())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.filterInfo.fromDate").value(today.minusDays(15).toString()))
                .andExpect(jsonPath("$.result.filterInfo.toDate").value(today.toString()));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_filterByPos_success() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .param("posId", testPos.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.filterInfo.posId").value(testPos.getId()))
                .andExpect(jsonPath("$.result.filterInfo.posName").value(testPos.getName()));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_filterByNonExistentPos_badRequest() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .param("posId", "non-existent-pos-id")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2006));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPeakAnalysis_verifyStructureAndCompleteness() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/peak-hours-and-days")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.hourlyStats[0].hour").value(0))
                .andExpect(jsonPath("$.result.hourlyStats[0].label").value("00:00 - 01:00"))
                .andExpect(jsonPath("$.result.hourlyStats[23].hour").value(23))
                .andExpect(jsonPath("$.result.hourlyStats[23].label").value("23:00 - 00:00"))
                .andExpect(jsonPath("$.result.dayOfWeekStats[0].dayName").value("Thứ Hai"))
                .andExpect(jsonPath("$.result.dayOfWeekStats[6].dayName").value("Chủ Nhật"))
                .andExpect(jsonPath("$.result.heatmap[0].dayName").value("Thứ Hai"))
                .andExpect(jsonPath("$.result.heatmap[0].hourOfDay").value(0));
    }

    // ==========================================
    // NCL-18-CN-002: DỰ BÁO LƯỢNG HÀNG CẦN NHẬP
    // ==========================================

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPurchaseForecast_owner_success() throws Exception {
        Product p = productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-FORECAST-001")
                .name("Nước mắm Nam Ngư 500ml Analytics")
                .unit("Chai")
                .price(new BigDecimal("40000.00"))
                .costPrice(new BigDecimal("30000.00"))
                .stockQuantity(new BigDecimal("5.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        GoodsReceipt receipt = goodsReceiptRepository.save(GoodsReceipt.builder()
                .household(testHousehold)
                .supplier(testSupplier)
                .createdByUser(userRepository.findByUsername("test_owner_analytics").orElseThrow())
                .receiptNumber("PNK-FORECAST-001")
                .totalAmount(new BigDecimal("300000.00"))
                .receivedAt(LocalDateTime.now().minusDays(3))
                .build());

        goodsReceiptDetailRepository.save(GoodsReceiptDetail.builder()
                .receipt(receipt)
                .product(p)
                .quantity(new BigDecimal("10.000"))
                .purchasePrice(new BigDecimal("30000.00"))
                .build());

        Order order = orderRepository.save(Order.builder()
                .household(testHousehold)
                .createdByUser(userRepository.findByUsername("test_owner_analytics").orElseThrow())
                .orderNumber("ORD-FORECAST-001")
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

        // Test with both /purchase-forecast and /purchase-suggestions endpoints
        mockMvc.perform(get("/api/v1/sales-analytics/purchase-forecast?periodDays=28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Lấy danh sách gợi ý nhập hàng thành công"))
                .andExpect(jsonPath("$.result.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.content[0].productId").value(p.getId()))
                .andExpect(jsonPath("$.result.content[0].averageWeeklySales").value(20.0))
                .andExpect(jsonPath("$.result.content[0].suggestedQuantity").value(15.0))
                .andExpect(jsonPath("$.result.content[0].hasPromotion").value(false))
                .andExpect(jsonPath("$.result.content[0].lastSupplierName").value(testSupplier.getName()))
                .andExpect(jsonPath("$.result.content[0].calculationRationale", containsString("Bán trung bình 20 Chai/tuần, tồn hiện có 5 Chai -> Gợi ý nhập 15 Chai")));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPurchaseForecast_withPromotion_hasWarning() throws Exception {
        Product p = productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-FORECAST-PROMO")
                .name("Sữa tắm dê White Care 1200ml")
                .unit("Chai")
                .price(new BigDecimal("95000.00"))
                .costPrice(new BigDecimal("70000.00"))
                .stockQuantity(new BigDecimal("2.000"))
                .minStockQuantity(new BigDecimal("5.000"))
                .status("ACTIVE")
                .build());

        Order promoOrder = orderRepository.save(Order.builder()
                .household(testHousehold)
                .createdByUser(userRepository.findByUsername("test_owner_analytics").orElseThrow())
                .orderNumber("ORD-FORECAST-PROMO")
                .totalAmount(new BigDecimal("3800000.00"))
                .discountAmount(new BigDecimal("380000.00")) // Đợt khuyến mại giảm 10%
                .promotionDiscountAmount(new BigDecimal("380000.00"))
                .finalAmount(new BigDecimal("3420000.00"))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .status("COMPLETED")
                .createdAt(LocalDateTime.now().minusDays(5))
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(promoOrder)
                .product(p)
                .productName(p.getName())
                .quantity(new BigDecimal("40.000"))
                .unitPrice(new BigDecimal("95000.00"))
                .discountAmount(new BigDecimal("380000.00"))
                .subtotal(new BigDecimal("3420000.00"))
                .build());

        mockMvc.perform(get("/api/v1/sales-analytics/purchase-forecast?periodDays=28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.content[0].hasPromotion").value(true))
                .andExpect(jsonPath("$.result.content[0].promotionWarning", containsString("Dữ liệu có đợt khuyến mại trong kỳ, số lượng gợi ý có thể cao hơn nhu cầu thực tế")));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPurchaseForecast_newProductWithoutSales_excluded() throws Exception {
        productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-FORECAST-NEW")
                .name("Sản phẩm mới chưa có lịch sử bán")
                .unit("Cái")
                .price(new BigDecimal("100000.00"))
                .stockQuantity(new BigDecimal("2.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        mockMvc.perform(get("/api/v1/sales-analytics/purchase-forecast?periodDays=28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content", hasSize(0)));
    }

    @Test
    @WithMockUser(username = "test_employee_analytics", roles = {"VT-02"})
    public void getPurchaseForecast_employee_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/purchase-forecast"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_accountant_analytics", roles = {"VT-03"})
    public void getPurchaseForecast_accountant_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/purchase-forecast"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPurchaseForecast_filterByGroup_success() throws Exception {
        ProductGroup groupA = productGroupRepository.save(ProductGroup.builder()
                .household(testHousehold)
                .name("Nhóm Hóa Phẩm Analytics")
                .build());

        ProductGroup groupB = productGroupRepository.save(ProductGroup.builder()
                .household(testHousehold)
                .name("Nhóm Gia Vị Analytics")
                .build());

        Product pA = productRepository.save(Product.builder()
                .household(testHousehold)
                .group(groupA)
                .taxRate(testTaxRate)
                .sku("SP-GRP-A")
                .name("Nước rửa chén Sunlight 750ml")
                .unit("Chai")
                .price(new BigDecimal("30000.00"))
                .costPrice(new BigDecimal("22000.00"))
                .stockQuantity(new BigDecimal("2.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        Product pB = productRepository.save(Product.builder()
                .household(testHousehold)
                .group(groupB)
                .taxRate(testTaxRate)
                .sku("SP-GRP-B")
                .name("Hạt nêm Knorr 400g")
                .unit("Gói")
                .price(new BigDecimal("35000.00"))
                .costPrice(new BigDecimal("28000.00"))
                .stockQuantity(new BigDecimal("2.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        Order order = orderRepository.save(Order.builder()
                .household(testHousehold)
                .createdByUser(userRepository.findByUsername("test_owner_analytics").orElseThrow())
                .orderNumber("ORD-GRP-001")
                .totalAmount(new BigDecimal("650000.00"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("650000.00"))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .status("COMPLETED")
                .createdAt(LocalDateTime.now().minusDays(2))
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(pA)
                .productName(pA.getName())
                .quantity(new BigDecimal("28.000"))
                .unitPrice(new BigDecimal("30000.00"))
                .subtotal(new BigDecimal("840000.00"))
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(order)
                .product(pB)
                .productName(pB.getName())
                .quantity(new BigDecimal("28.000"))
                .unitPrice(new BigDecimal("35000.00"))
                .subtotal(new BigDecimal("980000.00"))
                .build());

        mockMvc.perform(get("/api/v1/sales-analytics/purchase-forecast")
                        .param("groupId", groupA.getId())
                        .param("periodDays", "28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content", hasSize(1)))
                .andExpect(jsonPath("$.result.content[0].productId").value(pA.getId()))
                .andExpect(jsonPath("$.result.content[0].groupId").value(groupA.getId()));
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPurchaseForecast_invalidPeriodDays_badRequest() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/purchase-forecast")
                        .param("periodDays", "0"))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void getPurchaseForecast_unauthenticated_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/sales-analytics/purchase-forecast"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "test_owner_analytics", roles = {"VT-01"})
    public void getPurchaseForecast_withVipDiscountOnly_hasNoPromotionWarning() throws Exception {
        Product p = productRepository.save(Product.builder()
                .household(testHousehold)
                .taxRate(testTaxRate)
                .sku("SP-FORECAST-VIP-ONLY")
                .name("Dầu đậu nành Simply 1L")
                .unit("Chai")
                .price(new BigDecimal("60000.00"))
                .costPrice(new BigDecimal("45000.00"))
                .stockQuantity(new BigDecimal("2.000"))
                .minStockQuantity(new BigDecimal("10.000"))
                .status("ACTIVE")
                .build());

        // Đơn hàng chỉ có chiết khấu VIP của khách hàng, không có khuyến mại
        Order vipOrder = orderRepository.save(Order.builder()
                .household(testHousehold)
                .createdByUser(userRepository.findByUsername("test_owner_analytics").orElseThrow())
                .orderNumber("ORD-FORECAST-VIP-ONLY")
                .totalAmount(new BigDecimal("1680000.00"))
                .discountAmount(new BigDecimal("84000.00")) // Tổng chiết khấu
                .customerDiscountAmount(new BigDecimal("84000.00")) // 100% là chiết khấu VIP
                .promotionDiscountAmount(BigDecimal.ZERO) // 0đ khuyến mại
                .finalAmount(new BigDecimal("1596000.00"))
                .paymentMethod("CASH")
                .paymentStatus("PAID")
                .status("COMPLETED")
                .createdAt(LocalDateTime.now().minusDays(3))
                .build());

        orderItemRepository.save(OrderItem.builder()
                .order(vipOrder)
                .product(p)
                .productName(p.getName())
                .quantity(new BigDecimal("28.000"))
                .unitPrice(new BigDecimal("60000.00"))
                .discountAmount(BigDecimal.ZERO)
                .subtotal(new BigDecimal("1680000.00"))
                .build());

        mockMvc.perform(get("/api/v1/sales-analytics/purchase-forecast?periodDays=28"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.content[?(@.productId == '" + p.getId() + "')].hasPromotion").value(contains(false)))
                .andExpect(jsonPath("$.result.content[?(@.productId == '" + p.getId() + "')].promotionWarning").value(contains((Object) null)));
    }
}


