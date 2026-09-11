package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateOrderItemRequest;
import com.sales.dto.request.CreateOrderRequest;
import com.sales.dto.request.CreatePriceTierRequest;
import com.sales.dto.request.ResolveTierPriceRequest;
import com.sales.dto.request.UpdateOrderItemRequest;
import com.sales.entity.*;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ProductPriceTierControllerTest {

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
    private ProductPriceTierRepository productPriceTierRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @MockBean
    private ActivityLogHelper activityLogHelper;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;
    private Product product;
    private Shift shift;

    @BeforeEach
    void setUp() {
        household = householdRepository.save(BusinessHousehold.builder()
                .taxCode("TAX-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Hộ Bán Lẻ Test")
                .address("100 Đường Giải Phóng, Hà Nội")
                .phoneNumber("0987654321")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("VT-01")
                        .name("Chủ hộ kinh doanh")
                        .description("Toàn quyền")
                        .build()));

        Role staffRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .code("VT-02")
                        .name("Nhân viên thu ngân")
                        .description("Bán hàng")
                        .build()));

        ownerUser = userRepository.save(User.builder()
                .username("owner_tier_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash("hashed")
                .fullName("Chủ Hộ")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build());

        staffUser = userRepository.save(User.builder()
                .username("staff_tier_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash("hashed")
                .fullName("Thu Ngân")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build());

        TaxRate taxRate = taxRateRepository.save(TaxRate.builder()
                .household(household)
                .name("Thuế 0%")
                .ratePercentage(BigDecimal.ZERO)
                .isActive(true)
                .build());

        product = productRepository.save(Product.builder()
                .sku("SKU-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Redbull lon 250ml")
                .unit("lon")
                .price(new BigDecimal("12000.00"))
                .costPrice(new BigDecimal("9500.00"))
                .stockQuantity(new BigDecimal("200.000"))
                .household(household)
                .taxRate(taxRate)
                .status("ACTIVE")
                .build());

        shift = shiftRepository.save(Shift.builder()
                .household(household)
                .user(staffUser)
                .status(com.sales.constant.ShiftStatus.OPEN)
                .openedAt(java.time.LocalDateTime.now())
                .openingCash(new BigDecimal("1000000.00"))
                .build());

    }

    @Test
    @DisplayName("GET /price-tiers: Chủ hộ và nhân viên lấy danh sách bậc giá thành công")
    void testGetPriceTiers_Success() throws Exception {
        productPriceTierRepository.save(ProductPriceTier.builder()
                .household(household)
                .product(product)
                .tierName("Giá sỉ (≥ 10)")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("10500.00"))
                .isActive(true)
                .build());

        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/price-tiers")
                        .header("Authorization", "Bearer mock-token")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].tierName").value("Giá sỉ (≥ 10)"))
                .andExpect(jsonPath("$.result[0].price").value(10500.00));
    }

    @Test
    @DisplayName("POST /price-tiers: Chủ hộ VT-01 tạo bậc giá thành công")
    void testCreatePriceTier_Owner_Success() throws Exception {
        CreatePriceTierRequest request = CreatePriceTierRequest.builder()
                .tierName("Giá sỉ (≥ 10)")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("10500.00"))
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/price-tiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.tierName").value("Giá sỉ (≥ 10)"))
                .andExpect(jsonPath("$.result.price").value(10500.00));
    }

    @Test
    @DisplayName("POST /price-tiers: Nhân viên VT-02 bị chặn tạo bậc giá (403 Forbidden)")
    void testCreatePriceTier_Staff_Forbidden() throws Exception {
        CreatePriceTierRequest request = CreatePriceTierRequest.builder()
                .tierName("Giá sỉ lậu")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("10500.00"))
                .build();

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/price-tiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(staffUser.getUsername()).roles("VT-02")))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /price-tiers: Cảnh báo bán dưới giá vốn khi chưa xác nhận (AC-03)")
    void testCreatePriceTier_BelowCost_WithoutConfirmation_ThrowsWarning() throws Exception {
        // Giá vốn là 9.500đ, khai báo giá bậc 8.000đ
        CreatePriceTierRequest request = CreatePriceTierRequest.builder()
                .tierName("Giá bán lỗ xả hàng")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("8000.00"))
                .confirmBelowCost(false)
                .build();

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/price-tiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3101));
    }

    @Test
    @DisplayName("POST /price-tiers: Cho phép lưu giá dưới giá vốn khi có xác nhận (AC-03)")
    void testCreatePriceTier_BelowCost_WithConfirmation_Success() throws Exception {
        CreatePriceTierRequest request = CreatePriceTierRequest.builder()
                .tierName("Giá bán lỗ xả hàng")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("8000.00"))
                .confirmBelowCost(true)
                .build();

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/price-tiers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.isBelowCost").value(true))
                .andExpect(jsonPath("$.result.price").value(8000.00));
    }

    @Test
    @DisplayName("POST /price-tiers/resolve: Thu ngân kiểm tra trước bậc giá theo số lượng")
    void testResolveTierPrice_Success() throws Exception {
        productPriceTierRepository.save(ProductPriceTier.builder()
                .household(household)
                .product(product)
                .tierName("Giá sỉ (≥ 10)")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("10500.00"))
                .isActive(true)
                .build());

        ResolveTierPriceRequest request = ResolveTierPriceRequest.builder()
                .quantity(new BigDecimal("12.000"))
                .build();

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/price-tiers/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(staffUser.getUsername()).roles("VT-02")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.matchedTierName").value("Giá sỉ (≥ 10)"))
                .andExpect(jsonPath("$.result.appliedUnitPrice").value(10500.00))
                .andExpect(jsonPath("$.result.totalSavingAmount").value(18000.00));
    }

    @Test
    @DisplayName("End-to-End POS: Thêm 12 cái tự áp giá sỉ (AC-01), giảm xuống 5 cái tự về giá lẻ (AC-02), khớp QTN-07")
    void testPosOrderFlow_PriceTierAutoApplyAndRecalculate() throws Exception {
        // Cấu hình bậc giá sỉ >= 10 giá 10.500đ (giá lẻ gốc là 12.000đ)
        ProductPriceTier wholesaleTier = productPriceTierRepository.save(ProductPriceTier.builder()
                .household(household)
                .product(product)
                .tierName("Giá sỉ (≥ 10)")
                .minQuantity(new BigDecimal("10.000"))
                .price(new BigDecimal("10500.00"))
                .isActive(true)
                .build());

        // 1. Tạo đơn hàng mới
        Order order = orderRepository.save(Order.builder()
                .household(household)
                .shift(shift)
                .createdByUser(staffUser)
                .orderNumber("OD-TEST-TIER-" + UUID.randomUUID().toString().substring(0, 6))
                .status("CREATING")
                .paymentMethod("CASH")
                .paymentStatus("PENDING")
                .totalAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .build());

        // 2. Thêm mặt hàng với số lượng 12 -> AC-01: Hệ thống tự động áp giá sỉ 10.500đ và hiển thị tên bậc
        CreateOrderItemRequest addRequest = CreateOrderItemRequest.builder()
                .productId(product.getId())
                .quantity(new BigDecimal("12.000"))
                .build();

        String addResultJson = mockMvc.perform(post("/api/v1/orders/" + order.getId() + "/items")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addRequest))
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(staffUser.getUsername()).roles("VT-02")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.items[0].quantity").value(12.000))
                .andExpect(jsonPath("$.result.items[0].unitPrice").value(10500.00)) // Đã áp giá sỉ!
                .andExpect(jsonPath("$.result.items[0].priceTierName").value("Giá sỉ (≥ 10)")) // Tên bậc hiển thị rõ!
                .andExpect(jsonPath("$.result.items[0].subtotal").value(126000.00)) // 12 * 10.500
                .andExpect(jsonPath("$.result.totalAmount").value(126000.00))
                .andReturn().getResponse().getContentAsString();

        String itemId = objectMapper.readTree(addResultJson).get("result").get("items").get(0).get("id").asText();

        // 3. Khách giảm số lượng xuống còn 5 -> AC-02: Hệ thống tự động nhảy về giá bán lẻ 12.000đ và xóa tên bậc
        UpdateOrderItemRequest updateRequest = UpdateOrderItemRequest.builder()
                .quantity(new BigDecimal("5.000"))
                .build();

        mockMvc.perform(put("/api/v1/orders/" + order.getId() + "/items/" + itemId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest))
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(staffUser.getUsername()).roles("VT-02")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.items[0].quantity").value(5.000))
                .andExpect(jsonPath("$.result.items[0].unitPrice").value(12000.00)) // Tự nhảy về giá bán lẻ!
                .andExpect(jsonPath("$.result.items[0].priceTierName").doesNotExist()) // Không còn tên bậc sỉ
                .andExpect(jsonPath("$.result.items[0].subtotal").value(60000.00)) // 5 * 12.000
                .andExpect(jsonPath("$.result.totalAmount").value(60000.00)); // QTN-07: Khớp tổng tiền!
    }
}
