package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateScreenGuideRequest;
import com.sales.dto.request.CreateScreenGuideStepRequest;
import com.sales.dto.request.TrackScreenGuideViewRequest;
import com.sales.dto.request.UpdateScreenGuideRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.ScreenGuide;
import com.sales.entity.ScreenGuideStep;
import com.sales.entity.User;
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

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class ScreenGuideControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ScreenGuideRepository screenGuideRepository;

    @Autowired
    private ScreenGuideStepRepository screenGuideStepRepository;

    @Autowired
    private ScreenGuideViewLogRepository screenGuideViewLogRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    private ScreenGuide testGuide;

    @BeforeEach
    void setUp() {
        BusinessHousehold household = businessHouseholdRepository.save(BusinessHousehold.builder()
                .name("Hộ kinh doanh kiểm thử hướng dẫn")
                .representativeName("Nguyễn Chủ Hộ")
                .phoneNumber("0988776655")
                .address("123 Hoàn Kiếm, Hà Nội")
                .taxCode("0109998887-001")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build()));
        Role cashierRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Thu ngân").build()));
        Role adminRole = roleRepository.findByCode("VT-04")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-04").name("Quản trị nền tảng").build()));

        userRepository.findByUsername("test_owner_guide")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("test_owner_guide")
                        .fullName("Chủ Hộ Test")
                        .passwordHash("$2a$10$dummyHash")
                        .household(household)
                        .role(ownerRole)
                        .isActive(true)
                        .build()));

        userRepository.findByUsername("test_cashier_guide")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("test_cashier_guide")
                        .fullName("Thu Ngân Test")
                        .passwordHash("$2a$10$dummyHash")
                        .household(household)
                        .role(cashierRole)
                        .isActive(true)
                        .build()));

        userRepository.findByUsername("test_admin_guide")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("test_admin_guide")
                        .fullName("Platform Admin Test")
                        .passwordHash("$2a$10$dummyHash")
                        .role(adminRole)
                        .isActive(true)
                        .build()));

        testGuide = screenGuideRepository.findByScreenCode("SCREEN_TEST_POS")
                .orElseGet(() -> {
                    ScreenGuide g = screenGuideRepository.save(ScreenGuide.builder()
                            .screenCode("SCREEN_TEST_POS")
                            .screenName("Màn hình POS Kiểm Thử")
                            .description("Hướng dẫn thu ngân bán hàng test")
                            .actionUrl("/pos")
                            .targetRole("ALL")
                            .viewCount(5L)
                            .isActive(true)
                            .build());

                    screenGuideStepRepository.save(ScreenGuideStep.builder()
                            .guide(g).stepNumber(1).title("Tìm hàng").content("Quét mã vạch sản phẩm")
                            .targetElementSelector("#search-input").buttonLabel("Tìm kiếm").imageUrl("/images/step1.png").build());
                    screenGuideStepRepository.save(ScreenGuideStep.builder()
                            .guide(g).stepNumber(2).title("Sửa số lượng").content("Bấm nút cộng trừ")
                            .targetElementSelector("#cart-table").buttonLabel("Sửa").imageUrl("/images/step2.png").build());
                    screenGuideStepRepository.save(ScreenGuideStep.builder()
                            .guide(g).stepNumber(3).title("Bấm thanh toán").content("Bấm nút thanh toán to màu xanh")
                            .targetElementSelector("#btn-checkout").buttonLabel("Thanh toán").imageUrl("/images/step3.png").build());
                    return g;
                });
    }

    @Test
    @WithMockUser(username = "test_cashier_guide", roles = {"VT-02"})
    @DisplayName("TC-01: Lấy nội dung hướng dẫn tại chỗ thành công (GET /api/v1/screen-guides/{screenCode})")
    void testGetGuideByScreenCode_Success() throws Exception {
        mockMvc.perform(get("/api/v1/screen-guides/SCREEN_TEST_POS")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.screenCode").value("SCREEN_TEST_POS"))
                .andExpect(jsonPath("$.result.screenName").value("Màn hình POS Kiểm Thử"))
                .andExpect(jsonPath("$.result.totalSteps").value(3))
                .andExpect(jsonPath("$.result.steps", hasSize(3)))
                .andExpect(jsonPath("$.result.steps[0].stepNumber").value(1))
                .andExpect(jsonPath("$.result.steps[0].title").value("Tìm hàng"))
                .andExpect(jsonPath("$.result.steps[0].buttonLabel").value("Tìm kiếm"))
                .andExpect(jsonPath("$.result.steps[0].imageUrl").value("/images/step1.png"));
    }

    @Test
    @WithMockUser(username = "test_cashier_guide", roles = {"VT-02"})
    @DisplayName("TC-01: Truy vấn mã màn hình không tồn tại -> 404 Not Found (Code 8020)")
    void testGetGuideByScreenCode_NotFound() throws Exception {
        mockMvc.perform(get("/api/v1/screen-guides/SCREEN_UNKNOWN_999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(8020))
                .andExpect(jsonPath("$.message").value("Không tìm thấy nội dung hướng dẫn cho màn hình này"));
    }

    @Test
    @WithMockUser(username = "test_cashier_guide", roles = {"VT-02"})
    @DisplayName("TC-03: Ghi nhận lịch sử mở xem trợ giúp (POST /api/v1/screen-guides/{screenCode}/track-view)")
    void testTrackGuideView_Success() throws Exception {
        TrackScreenGuideViewRequest request = TrackScreenGuideViewRequest.builder()
                .durationSeconds(25)
                .completed(true)
                .build();

        long initialViewCount = screenGuideRepository.findById(testGuide.getId()).orElseThrow().getViewCount();

        mockMvc.perform(post("/api/v1/screen-guides/SCREEN_TEST_POS/track-view")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Ghi nhận lượt xem trợ giúp thành công"));

        ScreenGuide refreshed = screenGuideRepository.findById(testGuide.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(initialViewCount + 1, refreshed.getViewCount());
    }

    @Test
    @WithMockUser(username = "test_owner_guide", roles = {"VT-01"})
    @DisplayName("TC-03: Báo cáo Top màn hình mở trợ giúp nhiều nhất (GET /api/v1/screen-guides/statistics/top-viewed)")
    void testGetTopViewedGuides_Success() throws Exception {
        mockMvc.perform(get("/api/v1/screen-guides/statistics/top-viewed")
                        .param("limit", "5")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray())
                .andExpect(jsonPath("$.result", not(empty())));
    }

    @Test
    @WithMockUser(username = "test_owner_guide", roles = {"VT-01"})
    @DisplayName("TC-02: Tra cứu liên kết hỗ trợ ngữ cảnh khi gặp lỗi (GET /api/v1/screen-guides/contextual-help)")
    void testGetContextualHelp_Success() throws Exception {
        mockMvc.perform(get("/api/v1/screen-guides/contextual-help")
                        .param("errorCode", "4001")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.errorCode").value(4001))
                .andExpect(jsonPath("$.result.actionUrl").value("/settings/invoice-template"))
                .andExpect(jsonPath("$.result.guideScreenCode").value("SCREEN_INVOICE_CONFIG"));
    }

    @Test
    @WithMockUser(username = "test_owner_guide", roles = {"VT-01"})
    @DisplayName("Lấy danh sách tất cả hướng dẫn màn hình (GET /api/v1/screen-guides)")
    void testGetAllGuides_Success() throws Exception {
        mockMvc.perform(get("/api/v1/screen-guides")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray())
                .andExpect(jsonPath("$.result.totalElements", greaterThan(0)));
    }

    @Test
    @WithMockUser(username = "test_cashier_guide", roles = {"VT-02"})
    @DisplayName("Nhân viên bán hàng VT-02 xem danh mục hướng dẫn màn hình thành công")
    void testGetAllGuides_CashierVT02_Success() throws Exception {
        mockMvc.perform(get("/api/v1/screen-guides")
                        .param("page", "0")
                        .param("size", "10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content").isArray());
    }

    @Test
    @WithMockUser(username = "test_admin_guide", roles = {"VT-04"})
    @DisplayName("Admin VT-04 tạo mới hướng dẫn màn hình thành công (POST /api/v1/screen-guides)")
    void testCreateGuide_AdminSuccess() throws Exception {
        List<CreateScreenGuideStepRequest> steps = Arrays.asList(
                CreateScreenGuideStepRequest.builder().stepNumber(1).title("B1").content("Mở màn hình").buttonLabel("Mở").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(2).title("B2").content("Nhập dữ liệu").buttonLabel("Nhập").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(3).title("B3").content("Bấm lưu").buttonLabel("Lưu").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(4).title("B4").content("Hoàn thành").buttonLabel("Đóng").build()
        );

        CreateScreenGuideRequest request = CreateScreenGuideRequest.builder()
                .screenCode("SCREEN_NEW_DEMO")
                .screenName("Màn hình Demo Mới")
                .description("Mô tả hướng dẫn demo")
                .actionUrl("/demo")
                .targetRole("ALL")
                .steps(steps)
                .build();

        mockMvc.perform(post("/api/v1/screen-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.screenCode").value("SCREEN_NEW_DEMO"))
                .andExpect(jsonPath("$.result.totalSteps").value(4));
    }

    @Test
    @WithMockUser(username = "test_owner_guide", roles = {"VT-01"})
    @DisplayName("Chủ hộ VT-01 không có quyền tạo hướng dẫn -> 403 Forbidden")
    void testCreateGuide_OwnerForbidden() throws Exception {
        List<CreateScreenGuideStepRequest> steps = Arrays.asList(
                CreateScreenGuideStepRequest.builder().stepNumber(1).title("B1").content("C1").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(2).title("B2").content("C2").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(3).title("B3").content("C3").build()
        );

        CreateScreenGuideRequest request = CreateScreenGuideRequest.builder()
                .screenCode("SCREEN_FORBIDDEN_TEST")
                .screenName("Demo")
                .steps(steps)
                .build();

        mockMvc.perform(post("/api/v1/screen-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_admin_guide", roles = {"VT-04"})
    @DisplayName("Ràng buộc: Tạo hướng dẫn dưới 3 bước -> 400 Bad Request")
    void testCreateGuide_InvalidStepCount_BadRequest() throws Exception {
        List<CreateScreenGuideStepRequest> steps = Arrays.asList(
                CreateScreenGuideStepRequest.builder().stepNumber(1).title("B1").content("C1").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(2).title("B2").content("C2").build()
        );

        CreateScreenGuideRequest request = CreateScreenGuideRequest.builder()
                .screenCode("SCREEN_TOO_SHORT")
                .screenName("Ít bước")
                .steps(steps)
                .build();

        mockMvc.perform(post("/api/v1/screen-guides")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "test_admin_guide", roles = {"VT-04"})
    @DisplayName("Admin VT-04 cập nhật nội dung hướng dẫn (PUT /api/v1/screen-guides/{id})")
    void testUpdateGuide_AdminSuccess() throws Exception {
        List<CreateScreenGuideStepRequest> steps = Arrays.asList(
                CreateScreenGuideStepRequest.builder().stepNumber(1).title("Bước 1 sửa").content("Nội dung mới").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(2).title("Bước 2 sửa").content("Nội dung mới").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(3).title("Bước 3 sửa").content("Nội dung mới").build()
        );

        UpdateScreenGuideRequest request = UpdateScreenGuideRequest.builder()
                .screenName("Tên màn hình đã cập nhật")
                .actionUrl("/pos-updated")
                .targetRole("ALL")
                .steps(steps)
                .build();

        mockMvc.perform(put("/api/v1/screen-guides/" + testGuide.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.screenName").value("Tên màn hình đã cập nhật"))
                .andExpect(jsonPath("$.result.actionUrl").value("/pos-updated"))
                .andExpect(jsonPath("$.result.totalSteps").value(3));
    }

    @Test
    @WithMockUser(username = "test_admin_guide", roles = {"VT-04"})
    @DisplayName("Admin VT-04 vô hiệu hóa hướng dẫn (DELETE /api/v1/screen-guides/{id})")
    void testDeleteGuide_AdminSuccess() throws Exception {
        mockMvc.perform(delete("/api/v1/screen-guides/" + testGuide.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        ScreenGuide refreshed = screenGuideRepository.findById(testGuide.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertFalse(refreshed.getIsActive());
    }
}
