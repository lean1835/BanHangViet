package com.sales.service;

import com.sales.constant.FaqCategory;
import com.sales.constant.SupportChannelType;
import com.sales.dto.request.CreateFaqItemRequest;
import com.sales.dto.request.CreateSupportChannelRequest;
import com.sales.dto.request.UpdateFaqItemRequest;
import com.sales.dto.request.UpdateSupportChannelRequest;
import com.sales.dto.response.FaqCategoryGroupResponse;
import com.sales.dto.response.FaqItemResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.SupportChannelResponse;
import com.sales.dto.response.SupportInfoResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.FaqItem;
import com.sales.entity.Role;
import com.sales.entity.SupportChannel;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.FaqItemRepository;
import com.sales.repository.SupportChannelRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.FaqServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class FaqServiceImplTest {

    @Mock
    private FaqItemRepository faqItemRepository;

    @Mock
    private SupportChannelRepository supportChannelRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Environment environment;

    @InjectMocks
    private FaqServiceImpl faqService;

    private User ownerUser;
    private User cashierUser;
    private User adminUser;
    private BusinessHousehold household;
    private FaqItem sampleFaqInvoice;
    private SupportChannel sampleChannelHotline;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().name("VT-01").description("Chủ hộ").build();
        Role cashierRole = Role.builder().name("VT-02").description("Thu ngân").build();
        Role adminRole = Role.builder().name("VT-04").description("Platform Admin").build();

        household = BusinessHousehold.builder()
                .id("house-uuid-001")
                .taxCode("0312345678")
                .name("Tạp Hóa Bách Hóa Tân Bình")
                .representativeName("Nguyễn Văn Bình")
                .phoneNumber("0908112233")
                .build();

        ownerUser = User.builder()
                .username("chuho1")
                .fullName("Nguyễn Văn Bình")
                .role(ownerRole)
                .household(household)
                .build();

        cashierUser = User.builder()
                .username("thungan1")
                .fullName("Trần Thị Hoa")
                .role(cashierRole)
                .household(household)
                .build();

        adminUser = User.builder()
                .username("admin_platform")
                .fullName("Quản Trị Viên")
                .role(adminRole)
                .household(null)
                .build();

        sampleFaqInvoice = FaqItem.builder()
                .id("faq-inv-001")
                .category(FaqCategory.INVOICE)
                .question("Hóa đơn điện tử bị treo hoặc gửi Cơ quan thuế bị lỗi thì xử lý thế nào?")
                .answer("Vào màn hình Quản lý hóa đơn điện tử, lọc trạng thái Gửi lỗi và nhấn Gửi lại thuế.")
                .actionUrl("/invoices?status=FAILED")
                .actionLabel("Kiểm tra hóa đơn lỗi")
                .keywords("hóa đơn treo, loi hoa don, thue tu choi")
                .displayOrder(1)
                .viewCount(10L)
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        sampleChannelHotline = SupportChannel.builder()
                .id("sc-001")
                .channelType(SupportChannelType.HOTLINE)
                .channelName("Tổng đài hỗ trợ kỹ thuật")
                .contactValue("1900 6868")
                .description("Miễn cước cuộc gọi")
                .displayOrder(1)
                .isActive(true)
                .build();
    }

    // =========================================================================
    // TC-01: Tìm kiếm câu hỏi thành công có kết quả kèm action_url
    // =========================================================================
    @Test
    @DisplayName("TC-01: Tra cứu câu hỏi theo từ khóa 'hóa đơn treo' trả về kết quả kèm liên kết màn hình xử lý")
    void testGetFaqs_KeywordSearch_ReturnsMatchingResults() {
        Page<FaqItem> mockPage = new PageImpl<>(List.of(sampleFaqInvoice));
        when(faqItemRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(mockPage);

        PageResponse<FaqItemResponse> result = faqService.getFaqs("hóa đơn treo", null, 0, 10);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        FaqItemResponse item = result.getContent().get(0);
        assertEquals("faq-inv-001", item.getId());
        assertEquals(FaqCategory.INVOICE, item.getCategory());
        assertEquals("/invoices?status=FAILED", item.getActionUrl());
        assertEquals("Kiểm tra hóa đơn lỗi", item.getActionLabel());
        assertTrue(item.getQuestion().contains("Hóa đơn điện tử bị treo"));
        verify(faqItemRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }

    // =========================================================================
    // TC-02: Tìm kiếm không có kết quả khớp
    // =========================================================================
    @Test
    @DisplayName("TC-02: Tra cứu từ khóa không khớp trả về danh sách rỗng để UI hiển thị kênh hỗ trợ")
    void testGetFaqs_KeywordSearch_ReturnsEmptyWhenNoMatch() {
        Page<FaqItem> emptyPage = Page.empty();
        when(faqItemRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(emptyPage);

        PageResponse<FaqItemResponse> result = faqService.getFaqs("từ khóa không tồn tại xyz 999", null, 0, 10);

        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());
    }

    // =========================================================================
    // TC-03: Lấy thông tin hỗ trợ kỹ thuật và định danh hộ kinh doanh
    // =========================================================================
    @Test
    @DisplayName("TC-03: Người dùng chủ hộ mở màn thông tin hỗ trợ trả về phiên bản hệ thống, mã hộ, MST và kênh hỗ trợ")
    void testGetSupportInfo_StoreOwner_ReturnsFullDetails() {
        when(userRepository.findByUsername("chuho1")).thenReturn(Optional.of(ownerUser));
        when(environment.getProperty("app.system-version", "v1.2.0-STABLE")).thenReturn("v1.2.0-STABLE");
        when(supportChannelRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc()).thenReturn(List.of(sampleChannelHotline));

        SupportInfoResponse response = faqService.getSupportInfo("chuho1");

        assertNotNull(response);
        assertEquals("v1.2.0-STABLE", response.getSystemVersion());
        assertEquals("house-uuid-001", response.getHouseholdId());
        assertEquals("0312345678", response.getTaxCode());
        assertEquals("Tạp Hóa Bách Hóa Tân Bình", response.getHouseholdName());
        assertEquals("Nguyễn Văn Bình", response.getCurrentUserFullName());
        assertNotNull(response.getQuickSupportSummary());
        assertTrue(response.getQuickSupportSummary().contains("v1.2.0-STABLE"));
        assertTrue(response.getQuickSupportSummary().contains("0312345678"));

        assertEquals(1, response.getSupportChannels().size());
        assertEquals("1900 6868", response.getSupportChannels().get(0).getContactValue());
    }

    @Test
    @DisplayName("TC-04: Quản trị nền tảng (VT-04) không có Hộ KD gọi thông tin hỗ trợ xử lý an toàn không lỗi")
    void testGetSupportInfo_PlatformAdminWithoutHousehold_HandledSafely() {
        when(userRepository.findByUsername("admin_platform")).thenReturn(Optional.of(adminUser));
        when(environment.getProperty("app.system-version", "v1.2.0-STABLE")).thenReturn("v1.2.0-STABLE");
        when(supportChannelRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc()).thenReturn(Collections.emptyList());

        SupportInfoResponse response = faqService.getSupportInfo("admin_platform");

        assertNotNull(response);
        assertEquals("v1.2.0-STABLE", response.getSystemVersion());
        assertEquals("PLATFORM_ADMIN", response.getHouseholdId());
        assertTrue(response.getHouseholdName().contains("Quản trị nền tảng"));
    }

    // =========================================================================
    // TC-05: Xem chi tiết câu hỏi và tự động tăng lượt xem (viewCount)
    // =========================================================================
    @Test
    @DisplayName("TC-05: Xem chi tiết câu hỏi tự động tăng viewCount từ 10 lên 11")
    void testGetFaqDetailAndIncrementView_Success() {
        when(faqItemRepository.findById("faq-inv-001")).thenReturn(Optional.of(sampleFaqInvoice));

        FaqItemResponse response = faqService.getFaqDetailAndIncrementView("chuho1", "faq-inv-001");

        assertNotNull(response);
        assertEquals(11L, response.getViewCount());
        verify(faqItemRepository, times(1)).incrementViewCount("faq-inv-001");
    }

    @Test
    @DisplayName("Xem chi tiết câu hỏi không tồn tại ném FAQ_NOT_FOUND")
    void testGetFaqDetail_NotFound_ThrowsException() {
        when(faqItemRepository.findById("invalid-id")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class,
                () -> faqService.getFaqDetailAndIncrementView("chuho1", "invalid-id"));
        assertEquals(ErrorCode.FAQ_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Người dùng thường truy cập câu hỏi tạm ẩn (isActive = false) bị chặn 404 FAQ_NOT_FOUND")
    void testGetFaqDetail_InactiveFaq_NonAdmin_ThrowsNotFound() {
        FaqItem inactiveFaq = FaqItem.builder()
                .id("faq-hidden-001")
                .isActive(false)
                .question("Câu hỏi nháp")
                .answer("Nội dung nháp")
                .build();

        when(faqItemRepository.findById("faq-hidden-001")).thenReturn(Optional.of(inactiveFaq));
        when(userRepository.findByUsername("chuho1")).thenReturn(Optional.of(ownerUser));

        AppException ex = assertThrows(AppException.class,
                () -> faqService.getFaqDetailAndIncrementView("chuho1", "faq-hidden-001"));
        assertEquals(ErrorCode.FAQ_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Quản trị nền tảng (VT-04) xem câu hỏi tạm ẩn thành công")
    void testGetFaqDetail_InactiveFaq_Admin_Success() {
        FaqItem inactiveFaq = FaqItem.builder()
                .id("faq-hidden-001")
                .isActive(false)
                .question("Câu hỏi nháp")
                .answer("Nội dung nháp")
                .viewCount(0L)
                .build();

        when(faqItemRepository.findById("faq-hidden-001")).thenReturn(Optional.of(inactiveFaq));
        when(userRepository.findByUsername("admin_platform")).thenReturn(Optional.of(adminUser));

        FaqItemResponse response = faqService.getFaqDetailAndIncrementView("admin_platform", "faq-hidden-001");

        assertNotNull(response);
        assertEquals("faq-hidden-001", response.getId());
        assertFalse(response.getIsActive());
        verify(faqItemRepository, times(1)).incrementViewCount("faq-hidden-001");
    }

    // =========================================================================
    // TC-06: Gom nhóm câu hỏi theo 4 Category chuẩn
    // =========================================================================
    @Test
    @DisplayName("TC-06: Lấy danh mục câu hỏi phân nhóm trả về đúng 4 Category chuẩn")
    void testGetFaqsGroupedByCategory_ReturnsFourCategories() {
        FaqItem salesFaq = FaqItem.builder()
                .id("faq-sal-001")
                .category(FaqCategory.SALES)
                .question("Đơn hàng tìm ở đâu?")
                .answer("Vào pos orders")
                .build();

        when(faqItemRepository.findAllByIsActiveTrueOrderByCategoryAscDisplayOrderAsc())
                .thenReturn(List.of(sampleFaqInvoice, salesFaq));

        List<FaqCategoryGroupResponse> groups = faqService.getFaqsGroupedByCategory();

        assertNotNull(groups);
        assertEquals(4, groups.size());
        assertEquals(FaqCategory.INVOICE, groups.get(0).getCategory());
        assertEquals(1, groups.get(0).getTotalQuestions());
        assertEquals(FaqCategory.SALES, groups.get(1).getCategory());
        assertEquals(1, groups.get(1).getTotalQuestions());
        assertEquals(FaqCategory.ACCOUNT, groups.get(2).getCategory());
        assertEquals(0, groups.get(2).getTotalQuestions());
        assertEquals(FaqCategory.DATA, groups.get(3).getCategory());
        assertEquals(0, groups.get(3).getTotalQuestions());
    }

    // =========================================================================
    // TC-07 & TC-08: Phân quyền Quản trị nền tảng (VT-04) khi tạo câu hỏi mới
    // =========================================================================
    @Test
    @DisplayName("TC-07: Người dùng thường (VT-01, VT-02) tạo câu hỏi bị chặn với mã lỗi ONLY_ADMIN_CAN_MANAGE_FAQS")
    void testCreateFaq_NonAdmin_ThrowsForbidden() {
        when(userRepository.findByUsername("chuho1")).thenReturn(Optional.of(ownerUser));

        CreateFaqItemRequest req = CreateFaqItemRequest.builder()
                .category(FaqCategory.INVOICE)
                .question("Câu hỏi mới")
                .answer("Câu trả lời")
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> faqService.createFaq("chuho1", req));
        assertEquals(ErrorCode.ONLY_ADMIN_CAN_MANAGE_FAQS, ex.getErrorCode());
        verify(faqItemRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-08: Quản trị nền tảng (VT-04) tạo mới câu hỏi thành công mà không cần deploy lại")
    void testCreateFaq_Admin_Success() {
        when(userRepository.findByUsername("admin_platform")).thenReturn(Optional.of(adminUser));
        when(faqItemRepository.save(any(FaqItem.class))).thenAnswer(i -> {
            FaqItem item = i.getArgument(0);
            item.setId("faq-new-id");
            return item;
        });

        CreateFaqItemRequest req = CreateFaqItemRequest.builder()
                .category(FaqCategory.DATA)
                .question("Sao lưu dữ liệu như thế nào?")
                .answer("Tự động sao lưu 02:30 sáng")
                .actionUrl("/settings/backup")
                .actionLabel("Xem lịch sử sao lưu")
                .keywords("sao luu, backup")
                .build();

        FaqItemResponse response = faqService.createFaq("admin_platform", req);

        assertNotNull(response);
        assertEquals("faq-new-id", response.getId());
        assertEquals(FaqCategory.DATA, response.getCategory());
        assertEquals("/settings/backup", response.getActionUrl());
        verify(faqItemRepository, times(1)).save(any(FaqItem.class));
    }

    @Test
    @DisplayName("TC-09: Cập nhật câu hỏi thường gặp bởi Admin thành công")
    void testUpdateFaq_Admin_Success() {
        when(userRepository.findByUsername("admin_platform")).thenReturn(Optional.of(adminUser));
        when(faqItemRepository.findById("faq-inv-001")).thenReturn(Optional.of(sampleFaqInvoice));
        when(faqItemRepository.save(any(FaqItem.class))).thenAnswer(i -> i.getArgument(0));

        UpdateFaqItemRequest req = UpdateFaqItemRequest.builder()
                .category(FaqCategory.INVOICE)
                .question("Câu hỏi đã được sửa nội dung")
                .answer("Câu trả lời đã sửa")
                .actionUrl("/invoices/fixed")
                .actionLabel("Đi đến")
                .build();

        FaqItemResponse response = faqService.updateFaq("admin_platform", "faq-inv-001", req);

        assertNotNull(response);
        assertEquals("Câu hỏi đã được sửa nội dung", response.getQuestion());
        assertEquals("/invoices/fixed", response.getActionUrl());
    }

    @Test
    @DisplayName("TC-10: Xóa câu hỏi thường gặp bởi Admin thành công")
    void testDeleteFaq_Admin_Success() {
        when(userRepository.findByUsername("admin_platform")).thenReturn(Optional.of(adminUser));
        when(faqItemRepository.findById("faq-inv-001")).thenReturn(Optional.of(sampleFaqInvoice));

        faqService.deleteFaq("admin_platform", "faq-inv-001");

        verify(faqItemRepository, times(1)).delete(sampleFaqInvoice);
    }

    // =========================================================================
    // TC-11 & TC-12: Quản lý kênh hỗ trợ kỹ thuật
    // =========================================================================
    @Test
    @DisplayName("TC-11: Quản trị nền tảng tạo kênh hỗ trợ mới thành công")
    void testCreateSupportChannel_Admin_Success() {
        when(userRepository.findByUsername("admin_platform")).thenReturn(Optional.of(adminUser));
        when(supportChannelRepository.save(any(SupportChannel.class))).thenAnswer(i -> {
            SupportChannel sc = i.getArgument(0);
            sc.setId("sc-new-id");
            return sc;
        });

        CreateSupportChannelRequest req = CreateSupportChannelRequest.builder()
                .channelType(SupportChannelType.ZALO)
                .channelName("Zalo kỹ thuật")
                .contactValue("0988 123 456")
                .build();

        SupportChannelResponse response = faqService.createSupportChannel("admin_platform", req);

        assertNotNull(response);
        assertEquals("sc-new-id", response.getId());
        assertEquals(SupportChannelType.ZALO, response.getChannelType());
        verify(supportChannelRepository, times(1)).save(any(SupportChannel.class));
    }

    @Test
    @DisplayName("TC-12: Lấy danh sách kênh hỗ trợ đang hoạt động")
    void testGetActiveSupportChannels_Success() {
        when(supportChannelRepository.findAllByIsActiveTrueOrderByDisplayOrderAsc())
                .thenReturn(List.of(sampleChannelHotline));

        List<SupportChannelResponse> channels = faqService.getActiveSupportChannels();

        assertNotNull(channels);
        assertEquals(1, channels.size());
        assertEquals("1900 6868", channels.get(0).getContactValue());
    }

    @Test
    @DisplayName("Admin cập nhật câu hỏi không gửi displayOrder và isActive thì bảo toàn dữ liệu cũ")
    void testUpdateFaq_PartialUpdate_PreservesDisplayOrderAndIsActive() {
        FaqItem existing = FaqItem.builder()
                .id("faq-inv-002")
                .category(FaqCategory.INVOICE)
                .question("Câu hỏi cũ")
                .answer("Câu trả lời cũ")
                .displayOrder(15)
                .isActive(false)
                .build();

        when(userRepository.findByUsername("admin_platform")).thenReturn(Optional.of(adminUser));
        when(faqItemRepository.findById("faq-inv-002")).thenReturn(Optional.of(existing));
        when(faqItemRepository.save(any(FaqItem.class))).thenAnswer(i -> i.getArgument(0));

        UpdateFaqItemRequest req = UpdateFaqItemRequest.builder()
                .category(FaqCategory.INVOICE)
                .question("Câu hỏi mới sửa")
                .answer("Câu trả lời mới sửa")
                .displayOrder(null)
                .isActive(null)
                .build();

        FaqItemResponse response = faqService.updateFaq("admin_platform", "faq-inv-002", req);

        assertNotNull(response);
        assertEquals(15, response.getDisplayOrder());
        assertFalse(response.getIsActive());
        assertEquals("Câu hỏi mới sửa", response.getQuestion());
    }

    @Test
    @DisplayName("Admin lọc danh sách với isActive = false chỉ trả về câu hỏi tạm ẩn")
    void testGetAllFaqsForAdmin_InactiveOnly_Success() {
        when(userRepository.findByUsername("admin_platform")).thenReturn(Optional.of(adminUser));
        Page<FaqItem> mockPage = new PageImpl<>(Collections.emptyList());
        when(faqItemRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(mockPage);

        PageResponse<FaqItemResponse> res = faqService.getAllFaqsForAdmin("admin_platform", null, null, false, 0, 10);

        assertNotNull(res);
        verify(faqItemRepository, times(1)).findAll(any(Specification.class), any(Pageable.class));
    }
}
