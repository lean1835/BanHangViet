package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AdjustmentType;
import com.sales.constant.PriceRoundingMethod;
import com.sales.dto.request.ApplyPriceAdjustmentRequest;
import com.sales.dto.request.PreviewPriceAdjustmentRequest;
import com.sales.dto.request.RevertPriceAdjustmentRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Product;
import com.sales.entity.ProductGroup;
import com.sales.entity.Role;
import com.sales.entity.TaxRate;
import com.sales.entity.User;
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
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PriceAdjustmentControllerTest {

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
    private ProductGroupRepository productGroupRepository;

    @Autowired
    private TaxRateRepository taxRateRepository;

    @MockBean
    private ActivityLogHelper activityLogHelper;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;
    private ProductGroup group;
    private Product product;

    @BeforeEach
    void setUp() {
        household = householdRepository.save(BusinessHousehold.builder()
                .taxCode("TAX-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Hộ Kinh Doanh Test")
                .address("123 Phố Huế, Hà Nội")
                .phoneNumber("0912345678")
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
                .username("owner_test_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash("encoded_pass")
                .fullName("Chủ Hộ Test")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build());

        staffUser = userRepository.save(User.builder()
                .username("staff_test_" + UUID.randomUUID().toString().substring(0, 8))
                .passwordHash("encoded_pass")
                .fullName("Nhân Viên Test")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build());

        group = productGroupRepository.save(ProductGroup.builder()
                .name("Nhóm Test " + UUID.randomUUID().toString().substring(0, 6))
                .household(household)
                .build());

        TaxRate taxRate = taxRateRepository.save(TaxRate.builder()
                .household(household)
                .name("Thuế 0%")
                .ratePercentage(BigDecimal.ZERO)
                .isActive(true)
                .build());

        product = productRepository.save(Product.builder()
                .sku("SKU-TEST-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Sản phẩm Test Giá")
                .unit("Cái")
                .price(new BigDecimal("20000.00"))
                .costPrice(new BigDecimal("15000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .taxRate(taxRate)
                .group(group)
                .household(household)
                .status("ACTIVE")
                .build());
    }

    @Test
    @DisplayName("POST /api/v1/price-adjustments/preview - Chủ hộ xem trước tăng giá 10%")
    void previewPriceAdjustment_asOwner_success() throws Exception {
        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId(group.getId())
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("10.0"))
                .roundingMethod(PriceRoundingMethod.ROUND_TO_1000)
                .build();

        mockMvc.perform(post("/api/v1/price-adjustments/preview")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalItems").value(1))
                .andExpect(jsonPath("$.result.items[0].oldPrice").value(20000.0))
                .andExpect(jsonPath("$.result.items[0].newPrice").value(22000.0));
    }

    @Test
    @DisplayName("POST /api/v1/price-adjustments/apply - Chủ hộ áp dụng đợt đổi giá thành công")
    void applyPriceAdjustment_asOwner_success() throws Exception {
        ApplyPriceAdjustmentRequest request = ApplyPriceAdjustmentRequest.builder()
                .name("Đợt tăng giá kiểm thử")
                .targetGroupId(group.getId())
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("10.0"))
                .roundingMethod(PriceRoundingMethod.ROUND_TO_1000)
                .build();

        mockMvc.perform(post("/api/v1/price-adjustments/apply")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Đợt tăng giá kiểm thử"))
                .andExpect(jsonPath("$.result.status").value("APPLIED"))
                .andExpect(jsonPath("$.result.totalItems").value(1))
                .andExpect(jsonPath("$.result.canRevert").value(true));
    }

    @Test
    @DisplayName("POST /api/v1/price-adjustments/{batchId}/revert - Hoàn tác thành công trong 24h")
    void revertPriceAdjustment_asOwner_success() throws Exception {
        // 1. Áp dụng trước
        ApplyPriceAdjustmentRequest applyRequest = ApplyPriceAdjustmentRequest.builder()
                .name("Đợt đổi giá sắp bị hoàn tác")
                .targetGroupId(group.getId())
                .adjustmentType(AdjustmentType.FIXED_AMOUNT)
                .adjustmentValue(new BigDecimal("5000.0"))
                .roundingMethod(PriceRoundingMethod.NONE)
                .build();

        String applyResponseStr = mockMvc.perform(post("/api/v1/price-adjustments/apply")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(applyRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String batchId = objectMapper.readTree(applyResponseStr).path("result").path("id").asText();

        // 2. Gọi hoàn tác
        RevertPriceAdjustmentRequest revertRequest = RevertPriceAdjustmentRequest.builder()
                .revertReason("Hủy đợt tăng giá do NCC chưa điều chỉnh")
                .build();

        mockMvc.perform(post("/api/v1/price-adjustments/" + batchId + "/revert")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(revertRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("REVERTED"))
                .andExpect(jsonPath("$.result.revertReason").value("Hủy đợt tăng giá do NCC chưa điều chỉnh"))
                .andExpect(jsonPath("$.result.canRevert").value(false));
    }

    @Test
    @DisplayName("GET /api/v1/price-adjustments - Lấy danh sách lịch sử phân trang")
    void getBatches_asOwner_success() throws Exception {
        mockMvc.perform(get("/api/v1/price-adjustments")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(ownerUser.getUsername()).roles("VT-01")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray());
    }

    @Test
    @DisplayName("Bảo mật: Nhân viên VT-02 bị chặn không có quyền (403 Forbidden)")
    void accessDenied_forStaff() throws Exception {
        PreviewPriceAdjustmentRequest request = PreviewPriceAdjustmentRequest.builder()
                .targetGroupId(group.getId())
                .adjustmentType(AdjustmentType.PERCENTAGE)
                .adjustmentValue(new BigDecimal("5.0"))
                .build();

        mockMvc.perform(post("/api/v1/price-adjustments/preview")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user(staffUser.getUsername()).roles("VT-02"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
