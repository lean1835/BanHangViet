package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.DiscountType;
import com.sales.constant.PromotionApplyScope;
import com.sales.dto.request.PromotionCreateRequest;
import com.sales.dto.request.PromotionUpdateRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Promotion;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.PromotionRepository;
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
import java.time.LocalDateTime;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class PromotionControllerTest {

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
    private PromotionRepository promotionRepository;

    private BusinessHousehold household;
    private User ownerUser;
    private User sellerUser;
    private User accountantUser;
    private Promotion existingPromotion;

    @BeforeEach
    void setUp() {
        household = businessHouseholdRepository.save(BusinessHousehold.builder()
                .taxCode("MST-" + UUID.randomUUID().toString().substring(0, 8))
                .name("Hộ Kinh Doanh Test Khuyến Mại")
                .address("123 Phố Khuyến Mại, Hà Nội")
                .phoneNumber("0987654321")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01").orElseThrow();
        Role sellerRole = roleRepository.findByCode("VT-02").orElseThrow();
        Role accountantRole = roleRepository.findByCode("VT-03").orElseThrow();

        ownerUser = userRepository.save(User.builder()
                .username("owner_promo_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("password_hash")
                .fullName("Chủ Hộ Promotion")
                .household(household)
                .role(ownerRole)
                .isActive(true)
                .build());

        sellerUser = userRepository.save(User.builder()
                .username("seller_promo_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("password_hash")
                .fullName("Nhân Viên Bán Hàng")
                .household(household)
                .role(sellerRole)
                .isActive(true)
                .build());

        accountantUser = userRepository.save(User.builder()
                .username("accountant_promo_" + UUID.randomUUID().toString().substring(0, 6))
                .passwordHash("password_hash")
                .fullName("Kế Toán Promotion")
                .household(household)
                .role(accountantRole)
                .isActive(true)
                .build());

        existingPromotion = promotionRepository.save(Promotion.builder()
                .household(household)
                .name("Khuyến mại mẫu")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .createdByUser(ownerUser)
                .build());
    }

    @Test
    @DisplayName("NCL-15-CN-001-TC-03: Nhân viên bán hàng VT-02 tạo khuyến mại -> Bị chặn 403 Forbidden")
    void createPromotion_SellerRole_Returns403Forbidden() throws Exception {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại của NV")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(10))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();

        mockMvc.perform(post("/api/v1/promotions")
                        .with(user(sellerUser.getUsername()).roles("VT-02"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Chủ hộ VT-01 tạo khuyến mại -> Thành công 200 OK")
    void createPromotion_OwnerRole_Success() throws Exception {
        PromotionCreateRequest request = PromotionCreateRequest.builder()
                .name("Khuyến mại của Chủ Hộ")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(15))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();

        mockMvc.perform(post("/api/v1/promotions")
                        .with(user(ownerUser.getUsername()).roles("VT-01"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Khuyến mại của Chủ Hộ"));
    }

    @Test
    @DisplayName("Nhân viên bán hàng VT-02 sửa khuyến mại -> Bị chặn 403 Forbidden")
    void updatePromotion_SellerRole_Returns403Forbidden() throws Exception {
        PromotionUpdateRequest request = PromotionUpdateRequest.builder()
                .name("Khuyến mại sửa bởi NV")
                .discountType(DiscountType.PERCENTAGE)
                .discountValue(BigDecimal.valueOf(20))
                .applyScope(PromotionApplyScope.ALL)
                .startDate(LocalDateTime.now().plusDays(2))
                .endDate(LocalDateTime.now().plusDays(12))
                .build();

        mockMvc.perform(put("/api/v1/promotions/{id}", existingPromotion.getId())
                        .with(user(sellerUser.getUsername()).roles("VT-02"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Kế toán VT-03 xem danh sách khuyến mại -> Thành công 200 OK")
    void getPromotions_AccountantRole_Success() throws Exception {
        mockMvc.perform(get("/api/v1/promotions")
                        .with(user(accountantUser.getUsername()).roles("VT-03")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @DisplayName("Kế toán VT-03 xem chi tiết khuyến mại -> Thành công 200 OK")
    void getPromotionById_AccountantRole_Success() throws Exception {
        mockMvc.perform(get("/api/v1/promotions/{id}", existingPromotion.getId())
                        .with(user(accountantUser.getUsername()).roles("VT-03")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(existingPromotion.getId()));
    }
}
