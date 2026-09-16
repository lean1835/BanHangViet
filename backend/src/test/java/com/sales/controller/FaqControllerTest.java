package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.FaqCategory;
import com.sales.constant.SupportChannelType;
import com.sales.dto.request.CreateFaqItemRequest;
import com.sales.dto.request.CreateSupportChannelRequest;
import com.sales.dto.request.UpdateFaqItemRequest;
import com.sales.dto.request.UpdateSupportChannelRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.FaqItem;
import com.sales.entity.Role;
import com.sales.entity.SupportChannel;
import com.sales.entity.User;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.FaqItemRepository;
import com.sales.repository.RoleRepository;
import com.sales.repository.SupportChannelRepository;
import com.sales.repository.UserRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class FaqControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private FaqItemRepository faqItemRepository;

    @Autowired
    private SupportChannelRepository supportChannelRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    private FaqItem testFaqInvoice;
    private SupportChannel testChannel;

    @BeforeEach
    void setUp() {
        BusinessHousehold household = businessHouseholdRepository.save(BusinessHousehold.builder()
                .name("Hộ kinh doanh Test FAQ")
                .representativeName("Lê Văn Chủ Hộ")
                .phoneNumber("0912345678")
                .address("100 Đường Hoa Lan, Q. Phú Nhuận, TP.HCM")
                .taxCode("0318889999-001")
                .build());

        Role ownerRole = roleRepository.findByCode("VT-01")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build()));
        Role cashierRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Thu ngân").build()));
        Role adminRole = roleRepository.findByCode("VT-04")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-04").name("Quản trị nền tảng").build()));

        userRepository.findByUsername("test_owner_faq")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("test_owner_faq")
                        .fullName("Lê Văn Chủ Hộ")
                        .passwordHash("$2a$10$dummyHash")
                        .household(household)
                        .role(ownerRole)
                        .isActive(true)
                        .build()));

        userRepository.findByUsername("test_cashier_faq")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("test_cashier_faq")
                        .fullName("Nguyễn Thu Ngân")
                        .passwordHash("$2a$10$dummyHash")
                        .household(household)
                        .role(cashierRole)
                        .isActive(true)
                        .build()));

        userRepository.findByUsername("test_admin_faq")
                .orElseGet(() -> userRepository.save(User.builder()
                        .username("test_admin_faq")
                        .fullName("Platform Admin FAQ")
                        .passwordHash("$2a$10$dummyHash")
                        .role(adminRole)
                        .isActive(true)
                        .build()));

        testFaqInvoice = faqItemRepository.save(FaqItem.builder()
                .category(FaqCategory.INVOICE)
                .question("Hóa đơn điện tử bị treo hoặc gửi Cơ quan thuế bị lỗi thì xử lý thế nào?")
                .answer("Vào màn hình Quản lý hóa đơn điện tử, bấm Gửi lại thuế.")
                .actionUrl("/invoices?status=FAILED")
                .actionLabel("Kiểm tra hóa đơn lỗi")
                .keywords("hóa đơn treo, hoa don treo, gui thue loi")
                .displayOrder(1)
                .viewCount(5L)
                .isActive(true)
                .build());

        testChannel = supportChannelRepository.save(SupportChannel.builder()
                .channelType(SupportChannelType.HOTLINE)
                .channelName("Hotline kiểm thử")
                .contactValue("1900 6868")
                .description("Hỗ trợ kỹ thuật 24/7")
                .displayOrder(1)
                .isActive(true)
                .build());
    }

    @Test
    @WithMockUser(username = "test_owner_faq", roles = {"VT-01"})
    @DisplayName("TC-01: Gõ từ khóa 'hóa đơn treo' trả về kết quả kèm liên kết màn hình xử lý")
    void testGetFaqs_WithMatchingKeyword_Success() throws Exception {
        mockMvc.perform(get("/api/v1/faqs")
                        .param("keyword", "hóa đơn treo")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.content[0].actionUrl", is("/invoices?status=FAILED")))
                .andExpect(jsonPath("$.result.content[0].actionLabel", is("Kiểm tra hóa đơn lỗi")));
    }

    @Test
    @WithMockUser(username = "test_owner_faq", roles = {"VT-01"})
    @DisplayName("TC-02: Gõ từ khóa không khớp trả về danh sách rỗng (để hiển thị kênh hỗ trợ)")
    void testGetFaqs_WithNonMatchingKeyword_ReturnsEmpty() throws Exception {
        mockMvc.perform(get("/api/v1/faqs")
                        .param("keyword", "từ khóa không tồn tại ngẫu nhiên 999999")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.content", hasSize(0)))
                .andExpect(jsonPath("$.result.totalElements", is(0)));
    }

    @Test
    @WithMockUser(username = "test_owner_faq", roles = {"VT-01"})
    @DisplayName("TC-03: Mở màn thông tin hỗ trợ trả về phiên bản hệ thống, mã hộ, tên hộ, MST và kênh hỗ trợ")
    void testGetSupportInfo_Success() throws Exception {
        mockMvc.perform(get("/api/v1/faqs/support-info")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.systemVersion", notNullValue()))
                .andExpect(jsonPath("$.result.householdId", notNullValue()))
                .andExpect(jsonPath("$.result.taxCode", is("0318889999-001")))
                .andExpect(jsonPath("$.result.householdName", is("Hộ kinh doanh Test FAQ")))
                .andExpect(jsonPath("$.result.quickSupportSummary", containsString("0318889999-001")))
                .andExpect(jsonPath("$.result.supportChannels", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.supportChannels[0].contactValue", is("1900 6868")));
    }

    @Test
    @WithMockUser(username = "test_cashier_faq", roles = {"VT-02"})
    @DisplayName("Lấy danh mục câu hỏi phân nhóm theo 4 Category chuẩn")
    void testGetFaqsGrouped_Success() throws Exception {
        mockMvc.perform(get("/api/v1/faqs/grouped")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result", hasSize(4)))
                .andExpect(jsonPath("$.result[0].category", is("INVOICE")))
                .andExpect(jsonPath("$.result[1].category", is("SALES")))
                .andExpect(jsonPath("$.result[2].category", is("ACCOUNT")))
                .andExpect(jsonPath("$.result[3].category", is("DATA")));
    }

    @Test
    @WithMockUser(username = "test_cashier_faq", roles = {"VT-02"})
    @DisplayName("Xem chi tiết câu hỏi và tự động tăng lượt xem (viewCount)")
    void testGetFaqDetail_Success() throws Exception {
        mockMvc.perform(get("/api/v1/faqs/" + testFaqInvoice.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.id", is(testFaqInvoice.getId())))
                .andExpect(jsonPath("$.result.viewCount", is(6)));
    }

    @Test
    @WithMockUser(username = "test_owner_faq", roles = {"VT-01"})
    @DisplayName("Người dùng thường (VT-01) cố tình tạo câu hỏi bị chặn 403 Forbidden")
    void testCreateFaq_ForbiddenForNonAdmin() throws Exception {
        CreateFaqItemRequest req = CreateFaqItemRequest.builder()
                .category(FaqCategory.SALES)
                .question("Test question")
                .answer("Test answer")
                .build();

        mockMvc.perform(post("/api/v1/faqs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "test_admin_faq", roles = {"VT-04"})
    @DisplayName("Quản trị nền tảng (VT-04) tạo mới câu hỏi thường gặp thành công không cần deploy lại")
    void testCreateFaq_Admin_Success() throws Exception {
        CreateFaqItemRequest req = CreateFaqItemRequest.builder()
                .category(FaqCategory.ACCOUNT)
                .question("Cách lấy lại mật khẩu khi quên số điện thoại?")
                .answer("Vui lòng liên hệ tổng đài 1900 6868 để được hỗ trợ xác minh danh tính.")
                .actionUrl("/profile/support")
                .actionLabel("Liên hệ hỗ trợ")
                .keywords("quen sdt, mat so dien thoai")
                .displayOrder(5)
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/v1/faqs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.question", is("Cách lấy lại mật khẩu khi quên số điện thoại?")))
                .andExpect(jsonPath("$.result.category", is("ACCOUNT")));
    }

    @Test
    @WithMockUser(username = "test_admin_faq", roles = {"VT-04"})
    @DisplayName("Quản trị nền tảng (VT-04) cập nhật câu hỏi thường gặp")
    void testUpdateFaq_Admin_Success() throws Exception {
        UpdateFaqItemRequest req = UpdateFaqItemRequest.builder()
                .category(FaqCategory.INVOICE)
                .question("Hóa đơn điện tử bị treo xử lý thế nào? (Đã cập nhật)")
                .answer("Hướng dẫn mới cập nhật theo quy định thuế 2026.")
                .actionUrl("/invoices?status=FAILED")
                .actionLabel("Kiểm tra ngay")
                .build();

        mockMvc.perform(put("/api/v1/faqs/" + testFaqInvoice.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.question", is("Hóa đơn điện tử bị treo xử lý thế nào? (Đã cập nhật)")));
    }

    @Test
    @WithMockUser(username = "test_admin_faq", roles = {"VT-04"})
    @DisplayName("Quản trị nền tảng (VT-04) xóa câu hỏi thường gặp")
    void testDeleteFaq_Admin_Success() throws Exception {
        mockMvc.perform(delete("/api/v1/faqs/" + testFaqInvoice.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.message", containsString("thành công")));
    }

    @Test
    @WithMockUser(username = "test_admin_faq", roles = {"VT-04"})
    @DisplayName("Quản trị nền tảng thêm mới kênh hỗ trợ kỹ thuật")
    void testCreateSupportChannel_Admin_Success() throws Exception {
        CreateSupportChannelRequest req = CreateSupportChannelRequest.builder()
                .channelType(SupportChannelType.ZALO)
                .channelName("Zalo kỹ thuật thử nghiệm")
                .contactValue("0988 999 888")
                .description("Hỗ trợ kỹ thuật qua tin nhắn")
                .displayOrder(10)
                .isActive(true)
                .build();

        mockMvc.perform(post("/api/v1/faqs/support-channels")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.channelName", is("Zalo kỹ thuật thử nghiệm")));
    }

    @Test
    @WithMockUser(username = "test_owner_faq", roles = {"VT-01"})
    @DisplayName("Người dùng thường cố tình truy cập FAQ tạm ẩn nhận 404 NOT_FOUND")
    void testGetFaqDetail_Inactive_NormalUser_ReturnsNotFound() throws Exception {
        FaqItem hiddenFaq = faqItemRepository.save(FaqItem.builder()
                .category(FaqCategory.DATA)
                .question("Câu hỏi đang soạn thảo ẩn")
                .answer("Nội dung chưa công bố")
                .isActive(false)
                .build());

        mockMvc.perform(get("/api/v1/faqs/" + hiddenFaq.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is(8030)));
    }

    @Test
    @WithMockUser(username = "test_admin_faq", roles = {"VT-04"})
    @DisplayName("Quản trị nền tảng (VT-04) xem câu hỏi tạm ẩn thành công")
    void testGetFaqDetail_Inactive_Admin_Success() throws Exception {
        FaqItem hiddenFaq = faqItemRepository.save(FaqItem.builder()
                .category(FaqCategory.DATA)
                .question("Câu hỏi đang soạn thảo ẩn cho Admin")
                .answer("Nội dung chưa công bố")
                .isActive(false)
                .build());

        mockMvc.perform(get("/api/v1/faqs/" + hiddenFaq.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.id", is(hiddenFaq.getId())))
                .andExpect(jsonPath("$.result.isActive", is(false)));
    }

    @Test
    @WithMockUser(username = "test_admin_faq", roles = {"VT-04"})
    @DisplayName("Quản trị nền tảng lọc danh sách câu hỏi với isActive = false chỉ trả về câu hỏi ẩn")
    void testGetAllFaqsForAdmin_FilterInactive_Success() throws Exception {
        faqItemRepository.save(FaqItem.builder()
                .category(FaqCategory.ACCOUNT)
                .question("Câu hỏi đã ngừng hỗ trợ")
                .answer("Nội dung cũ")
                .isActive(false)
                .build());

        mockMvc.perform(get("/api/v1/faqs/admin/all")
                        .param("isActive", "false")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.result.content[0].isActive", is(false)));
    }

    @Test
    @WithMockUser(username = "test_admin_faq", roles = {"VT-04"})
    @DisplayName("Admin cập nhật một phần (không truyền displayOrder & isActive) không làm mất dữ liệu cũ")
    void testUpdateFaq_PartialUpdate_PreservesOldState() throws Exception {
        FaqItem faqWithOrder = faqItemRepository.save(FaqItem.builder()
                .category(FaqCategory.INVOICE)
                .question("Câu hỏi có thứ tự 99")
                .answer("Nội dung cũ")
                .displayOrder(99)
                .isActive(false)
                .build());

        String rawJson = "{\"category\":\"INVOICE\",\"question\":\"Câu hỏi 99 đã sửa\",\"answer\":\"Nội dung mới\"}";

        mockMvc.perform(put("/api/v1/faqs/" + faqWithOrder.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rawJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code", is(1000)))
                .andExpect(jsonPath("$.result.displayOrder", is(99)))
                .andExpect(jsonPath("$.result.isActive", is(false)))
                .andExpect(jsonPath("$.result.question", is("Câu hỏi 99 đã sửa")));
    }
}
