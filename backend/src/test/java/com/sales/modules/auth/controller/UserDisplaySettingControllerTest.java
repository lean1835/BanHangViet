package com.sales.modules.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.common.constant.ButtonSizeLevel;
import com.sales.common.constant.FontSizeLevel;
import com.sales.modules.pos.dto.request.ToggleSimpleModeRequest;
import com.sales.modules.auth.dto.request.UpdateUserDisplaySettingRequest;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.order.entity.Order;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.order.repository.OrderRepository;
import com.sales.modules.auth.repository.RoleRepository;
import com.sales.modules.auth.repository.UserRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser(username = "test_display_user", roles = {"VT-01"})
public class UserDisplaySettingControllerTest {

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
    private OrderRepository orderRepository;

    private User testUser;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        BusinessHousehold household = businessHouseholdRepository.save(BusinessHousehold.builder()
                .name("Hộ Kinh Doanh Kiểm Thử Display")
                .representativeName("Nguyễn Chủ Hộ")
                .phoneNumber("0912345678")
                .address("123 Phố Huế, Hà Nội")
                .taxCode("0101234567-999")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build()));

        testUser = userRepository.findByUsername("test_display_user")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("test_display_user")
                        .fullName("Bác Chủ Hộ Lớn Tuổi")
                        .passwordHash("$2a$10$dummyHash1234567890123456789012345678901234567890123456")
                        .household(household)
                        .role(ownerRole)
                        .isActive(true)
                        .build()));

        testOrder = orderRepository.save(Order.builder()
                .orderNumber("HD-TEST-" + UUID.randomUUID().toString().substring(0, 6))
                .household(household)
                .createdByUser(testUser)
                .status("CREATING")
                .finalAmount(new BigDecimal("250000.00"))
                .build());
    }

    @Test
    @DisplayName("TC-01: Lấy cấu hình hiển thị cá nhân (GET /api/v1/profile/display-settings)")
    void testGetDisplaySettings() throws Exception {
        mockMvc.perform(get("/api/v1/profile/display-settings")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.username").value("test_display_user"))
                .andExpect(jsonPath("$.result.fontSizeLevel").value("STANDARD"))
                .andExpect(jsonPath("$.result.simpleModeEnabled").value(false));
    }

    @Test
    @DisplayName("TC-02: Bật nhanh chế độ đơn giản (PATCH /api/v1/profile/display-settings/toggle-simple-mode)")
    void testToggleSimpleMode() throws Exception {
        ToggleSimpleModeRequest request = ToggleSimpleModeRequest.builder()
                .enabled(true)
                .build();

        mockMvc.perform(patch("/api/v1/profile/display-settings/toggle-simple-mode")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.simpleModeEnabled").value(true))
                .andExpect(jsonPath("$.result.fontSizeLevel").value("LARGE"))
                .andExpect(jsonPath("$.result.buttonSizeLevel").value("LARGE"))
                .andExpect(jsonPath("$.result.fontScalePercentage").value(125))
                .andExpect(jsonPath("$.result.minTouchHeight").value("52px"));
    }

    @Test
    @DisplayName("TC-03: Cập nhật cấu hình chi tiết (PUT /api/v1/profile/display-settings)")
    void testUpdateDisplaySettings() throws Exception {
        UpdateUserDisplaySettingRequest request = UpdateUserDisplaySettingRequest.builder()
                .simpleModeEnabled(true)
                .fontSizeLevel(FontSizeLevel.EXTRA_LARGE)
                .buttonSizeLevel(ButtonSizeLevel.EXTRA_LARGE)
                .showTextLabels(true)
                .requireConfirmationDialog(true)
                .highContrastEnabled(true)
                .simplifiedPosLayout(true)
                .build();

        mockMvc.perform(put("/api/v1/profile/display-settings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.simpleModeEnabled").value(true))
                .andExpect(jsonPath("$.result.fontSizeLevel").value("EXTRA_LARGE"))
                .andExpect(jsonPath("$.result.fontScalePercentage").value(150))
                .andExpect(jsonPath("$.result.minTouchHeight").value("64px"))
                .andExpect(jsonPath("$.result.highContrastEnabled").value(true));
    }

    @Test
    @DisplayName("TC-04: Lấy bố cục rút gọn màn hình POS (GET /api/v1/profile/display-settings/pos-layout)")
    void testGetPosLayout() throws Exception {
        mockMvc.perform(get("/api/v1/profile/display-settings/pos-layout")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.primaryActions", hasSize(4)))
                .andExpect(jsonPath("$.result.primaryActions[0].code").value("SEARCH_PRODUCT"))
                .andExpect(jsonPath("$.result.moreActions", hasSize(greaterThanOrEqualTo(3))));
    }

    @Test
    @DisplayName("TC-05: Phân tích trước hậu quả thao tác hủy đơn hàng (GET /api/v1/action-confirmations/consequences)")
    void testGetActionConsequences_CancelOrder() throws Exception {
        mockMvc.perform(get("/api/v1/action-confirmations/consequences")
                        .param("actionType", "CANCEL_ORDER")
                        .param("targetId", testOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.actionType").value("CANCEL_ORDER"))
                .andExpect(jsonPath("$.result.targetCode").value(testOrder.getOrderNumber()))
                .andExpect(jsonPath("$.result.severity").value("DANGER"))
                .andExpect(jsonPath("$.result.isIrreversible").value(true))
                .andExpect(jsonPath("$.result.consequences", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("TC-06: Tải hồ sơ người dùng có tích hợp cấu hình hiển thị (GET /api/v1/profile)")
    void testGetProfile_ContainsDisplaySettings() throws Exception {
        mockMvc.perform(get("/api/v1/profile")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value(testUser.getId()))
                .andExpect(jsonPath("$.result.displaySettings").isMap())
                .andExpect(jsonPath("$.result.displaySettings.fontSizeLevel").value("STANDARD"));
    }
}
