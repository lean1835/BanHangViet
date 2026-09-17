package com.sales.service;

import com.sales.dto.request.CreateScreenGuideRequest;
import com.sales.dto.request.CreateScreenGuideStepRequest;
import com.sales.dto.request.TrackScreenGuideViewRequest;
import com.sales.dto.request.UpdateScreenGuideRequest;
import com.sales.dto.response.*;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.ScreenGuide;
import com.sales.entity.ScreenGuideStep;
import com.sales.entity.ScreenGuideViewLog;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ScreenGuideRepository;
import com.sales.repository.ScreenGuideStepRepository;
import com.sales.repository.ScreenGuideViewLogRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ScreenGuideServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ScreenGuideServiceImplTest {

    @Mock
    private ScreenGuideRepository screenGuideRepository;

    @Mock
    private ScreenGuideStepRepository screenGuideStepRepository;

    @Mock
    private ScreenGuideViewLogRepository screenGuideViewLogRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ScreenGuideServiceImpl screenGuideService;

    private User ownerUser;
    private User cashierUser;
    private User adminUser;
    private ScreenGuide posGuide;
    private List<ScreenGuideStep> posSteps;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().name("VT-01").description("Chủ hộ").build();
        Role cashierRole = Role.builder().name("VT-02").description("Thu ngân").build();
        Role adminRole = Role.builder().name("VT-04").description("Platform Admin").build();

        BusinessHousehold household = BusinessHousehold.builder()
                .id("house-1")
                .name("Hộ kinh doanh Test")
                .build();

        ownerUser = User.builder().username("owner1").role(ownerRole).household(household).build();
        cashierUser = User.builder().username("cashier1").role(cashierRole).household(household).build();
        adminUser = User.builder().username("admin1").role(adminRole).household(null).build();

        posGuide = ScreenGuide.builder()
                .id("guide-pos-1")
                .screenCode("SCREEN_POS_CHECKOUT")
                .screenName("Màn hình bán hàng POS")
                .description("Hướng dẫn thu ngân bán hàng")
                .actionUrl("/pos")
                .targetRole("ALL")
                .viewCount(10L)
                .isActive(true)
                .build();

        posSteps = Arrays.asList(
                ScreenGuideStep.builder().id("s1").guide(posGuide).stepNumber(1).title("Tìm hàng").content("Quét mã vạch").build(),
                ScreenGuideStep.builder().id("s2").guide(posGuide).stepNumber(2).title("Sửa số lượng").content("Bấm nút cộng trừ").build(),
                ScreenGuideStep.builder().id("s3").guide(posGuide).stepNumber(3).title("Bấm thanh toán").content("Bấm nút thanh toán màu xanh").build(),
                ScreenGuideStep.builder().id("s4").guide(posGuide).stepNumber(4).title("Hoàn tất").content("Nhập tiền khách đưa").build()
        );
    }

    @Test
    @DisplayName("TC-01: Lấy hướng dẫn tại chỗ thành công theo mã màn hình")
    void testGetGuideByScreenCode_Success() {
        when(screenGuideRepository.findByScreenCodeAndIsActiveTrue("SCREEN_POS_CHECKOUT"))
                .thenReturn(Optional.of(posGuide));
        when(screenGuideStepRepository.findByGuideIdOrderByStepNumberAsc("guide-pos-1"))
                .thenReturn(posSteps);

        ScreenGuideResponse response = screenGuideService.getGuideByScreenCode("cashier1", "SCREEN_POS_CHECKOUT");

        assertNotNull(response);
        assertEquals("SCREEN_POS_CHECKOUT", response.getScreenCode());
        assertEquals("Màn hình bán hàng POS", response.getScreenName());
        assertEquals(4, response.getTotalSteps());
        assertEquals(4, response.getSteps().size());
        assertEquals(1, response.getSteps().get(0).getStepNumber());
        assertEquals("Tìm hàng", response.getSteps().get(0).getTitle());
    }

    @Test
    @DisplayName("TC-01: Mã màn hình không tồn tại -> Ném SCREEN_GUIDE_NOT_FOUND (404)")
    void testGetGuideByScreenCode_NotFound() {
        when(screenGuideRepository.findByScreenCodeAndIsActiveTrue("NON_EXISTENT"))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                screenGuideService.getGuideByScreenCode("cashier1", "NON_EXISTENT"));

        assertEquals(ErrorCode.SCREEN_GUIDE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-01: Hướng dẫn chỉ dành cho Chủ hộ -> Thu ngân bị từ chối 403")
    void testGetGuideByScreenCode_RoleRestricted_Forbidden() {
        ScreenGuide taxGuide = ScreenGuide.builder()
                .id("guide-tax")
                .screenCode("SCREEN_TAX_PERIOD")
                .screenName("Kỳ kê khai thuế")
                .targetRole("VT-01")
                .isActive(true)
                .build();

        when(screenGuideRepository.findByScreenCodeAndIsActiveTrue("SCREEN_TAX_PERIOD"))
                .thenReturn(Optional.of(taxGuide));
        when(userRepository.findByUsername("cashier1")).thenReturn(Optional.of(cashierUser));

        AppException ex = assertThrows(AppException.class, () ->
                screenGuideService.getGuideByScreenCode("cashier1", "SCREEN_TAX_PERIOD"));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-01: Quản trị nền tảng (VT-04) được quyền xem mọi hướng dẫn")
    void testGetGuideByScreenCode_PlatformAdminAllowed() {
        ScreenGuide taxGuide = ScreenGuide.builder()
                .id("guide-tax")
                .screenCode("SCREEN_TAX_PERIOD")
                .screenName("Kỳ kê khai thuế")
                .targetRole("VT-01")
                .isActive(true)
                .build();

        when(screenGuideRepository.findByScreenCodeAndIsActiveTrue("SCREEN_TAX_PERIOD"))
                .thenReturn(Optional.of(taxGuide));
        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(adminUser));
        when(screenGuideStepRepository.findByGuideIdOrderByStepNumberAsc("guide-tax"))
                .thenReturn(posSteps);

        ScreenGuideResponse response = screenGuideService.getGuideByScreenCode("admin1", "SCREEN_TAX_PERIOD");
        assertNotNull(response);
        assertEquals("SCREEN_TAX_PERIOD", response.getScreenCode());
    }

    @Test
    @DisplayName("TC-03: Ghi nhận lịch sử mở xem trợ giúp và tăng viewCount")
    void testTrackGuideView_Success() {
        when(screenGuideRepository.existsByScreenCode("SCREEN_POS_CHECKOUT")).thenReturn(true);
        when(userRepository.findByUsername("cashier1")).thenReturn(Optional.of(cashierUser));

        TrackScreenGuideViewRequest req = TrackScreenGuideViewRequest.builder()
                .durationSeconds(25)
                .completed(true)
                .build();

        screenGuideService.trackGuideView("cashier1", "SCREEN_POS_CHECKOUT", req);

        verify(screenGuideRepository).incrementViewCount("SCREEN_POS_CHECKOUT");

        ArgumentCaptor<ScreenGuideViewLog> captor = ArgumentCaptor.forClass(ScreenGuideViewLog.class);
        verify(screenGuideViewLogRepository).save(captor.capture());

        ScreenGuideViewLog savedLog = captor.getValue();
        assertEquals("SCREEN_POS_CHECKOUT", savedLog.getScreenCode());
        assertEquals("cashier1", savedLog.getUser().getUsername());
        assertEquals(25, savedLog.getDurationSeconds());
        assertTrue(savedLog.getCompleted());
    }

    @Test
    @DisplayName("TC-03: Ghi nhận lịch sử ném lỗi khi màn hình không tồn tại")
    void testTrackGuideView_NotFound_ThrowsException() {
        when(screenGuideRepository.existsByScreenCode("UNKNOWN")).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () ->
                screenGuideService.trackGuideView("cashier1", "UNKNOWN", new TrackScreenGuideViewRequest()));

        assertEquals(ErrorCode.SCREEN_GUIDE_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-03: Thống kê Top màn hình mở trợ giúp nhiều nhất (Gom 1 batch query không N+1)")
    void testGetTopViewedGuides_Success() {
        when(screenGuideRepository.findAllByIsActiveTrueOrderByViewCountDesc(any(Pageable.class)))
                .thenReturn(Collections.singletonList(posGuide));

        ScreenGuideViewStatsProjection mockStats = mock(ScreenGuideViewStatsProjection.class);
        when(mockStats.getScreenCode()).thenReturn("SCREEN_POS_CHECKOUT");
        when(mockStats.getTotalLogged()).thenReturn(10L);
        when(mockStats.getTotalCompleted()).thenReturn(8L);
        when(mockStats.getAvgDuration()).thenReturn(32.4);
        when(mockStats.getRecentViews()).thenReturn(15L);

        when(screenGuideViewLogRepository.getAggregatedStatsByScreenCodes(anyList(), any(LocalDateTime.class)))
                .thenReturn(Collections.singletonList(mockStats));

        List<ScreenGuideTopViewedResponse> topGuides = screenGuideService.getTopViewedGuides(5);

        assertNotNull(topGuides);
        assertEquals(1, topGuides.size());
        ScreenGuideTopViewedResponse item = topGuides.get(0);
        assertEquals("SCREEN_POS_CHECKOUT", item.getScreenCode());
        assertEquals(10L, item.getTotalViews());
        assertEquals(15L, item.getRecent7DaysViews());
        assertEquals(32.4, item.getAverageDurationSeconds());
        assertEquals(80.0, item.getCompletionRatePercentage());

        verify(screenGuideViewLogRepository, times(1))
                .getAggregatedStatsByScreenCodes(anyList(), any(LocalDateTime.class));
    }

    @Test
    @DisplayName("TC-02: Tra cứu liên kết hỗ trợ ngữ cảnh khi gặp lỗi thiếu mẫu hóa đơn 4001")
    void testGetContextualHelpByErrorCode_InvoiceTemplateNotFound() {
        ContextualGuideResponse help = screenGuideService.getContextualHelpByErrorCode(4001);

        assertNotNull(help);
        assertEquals(4001, help.getErrorCode());
        assertEquals("/settings/invoice-template", help.getActionUrl());
        assertEquals("SCREEN_INVOICE_CONFIG", help.getGuideScreenCode());
        assertNotNull(help.getSuggestedAction());
    }

    @Test
    @DisplayName("Admin tạo mới hướng dẫn màn hình thành công với 3-5 bước")
    void testCreateGuide_Success() {
        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(adminUser));
        when(screenGuideRepository.existsByScreenCode("SCREEN_CUSTOM")).thenReturn(false);

        List<CreateScreenGuideStepRequest> steps = Arrays.asList(
                CreateScreenGuideStepRequest.builder().stepNumber(1).title("B1").content("C1").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(2).title("B2").content("C2").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(3).title("B3").content("C3").build()
        );

        CreateScreenGuideRequest req = CreateScreenGuideRequest.builder()
                .screenCode("SCREEN_CUSTOM")
                .screenName("Màn hình Custom")
                .targetRole("ALL")
                .steps(steps)
                .build();

        when(screenGuideRepository.save(any(ScreenGuide.class))).thenAnswer(inv -> {
            ScreenGuide g = inv.getArgument(0);
            g.setId("new-id");
            return g;
        });

        when(screenGuideStepRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ScreenGuideResponse response = screenGuideService.createGuide("admin1", req);

        assertNotNull(response);
        assertEquals("SCREEN_CUSTOM", response.getScreenCode());
        assertEquals(3, response.getTotalSteps());
    }

    @Test
    @DisplayName("Ràng buộc: Tạo hướng dẫn dưới 3 bước -> Ném INVALID_SCREEN_GUIDE_STEPS")
    void testCreateGuide_LessThan3Steps_ThrowsException() {
        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(adminUser));

        List<CreateScreenGuideStepRequest> steps = Arrays.asList(
                CreateScreenGuideStepRequest.builder().stepNumber(1).title("B1").content("C1").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(2).title("B2").content("C2").build()
        );

        CreateScreenGuideRequest req = CreateScreenGuideRequest.builder()
                .screenCode("SCREEN_FEW")
                .screenName("Ít bước")
                .steps(steps)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                screenGuideService.createGuide("admin1", req));

        assertEquals(ErrorCode.INVALID_SCREEN_GUIDE_STEPS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ràng buộc: Tạo hướng dẫn trên 5 bước -> Ném INVALID_SCREEN_GUIDE_STEPS")
    void testCreateGuide_MoreThan5Steps_ThrowsException() {
        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(adminUser));

        List<CreateScreenGuideStepRequest> steps = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            steps.add(CreateScreenGuideStepRequest.builder().stepNumber(i).title("B" + i).content("C" + i).build());
        }

        CreateScreenGuideRequest req = CreateScreenGuideRequest.builder()
                .screenCode("SCREEN_MANY")
                .screenName("Nhiều bước")
                .steps(steps)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                screenGuideService.createGuide("admin1", req));

        assertEquals(ErrorCode.INVALID_SCREEN_GUIDE_STEPS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ràng buộc: Trùng mã màn hình -> Ném SCREEN_GUIDE_CODE_EXISTS")
    void testCreateGuide_DuplicateScreenCode_ThrowsException() {
        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(adminUser));

        List<CreateScreenGuideStepRequest> steps = Arrays.asList(
                CreateScreenGuideStepRequest.builder().stepNumber(1).title("B1").content("C1").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(2).title("B2").content("C2").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(3).title("B3").content("C3").build()
        );

        CreateScreenGuideRequest req = CreateScreenGuideRequest.builder()
                .screenCode("SCREEN_POS_CHECKOUT")
                .screenName("POS")
                .steps(steps)
                .build();

        when(screenGuideRepository.existsByScreenCode("SCREEN_POS_CHECKOUT")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () ->
                screenGuideService.createGuide("admin1", req));

        assertEquals(ErrorCode.SCREEN_GUIDE_CODE_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Phân quyền: Người dùng không phải VT-04 tạo hướng dẫn -> Ném ONLY_ADMIN_CAN_MANAGE_GUIDES")
    void testCreateGuide_NonAdmin_Forbidden() {
        when(userRepository.findByUsername("owner1")).thenReturn(Optional.of(ownerUser));

        CreateScreenGuideRequest req = CreateScreenGuideRequest.builder()
                .screenCode("SCREEN_TEST")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                screenGuideService.createGuide("owner1", req));

        assertEquals(ErrorCode.ONLY_ADMIN_CAN_MANAGE_GUIDES, ex.getErrorCode());
    }

    @Test
    @DisplayName("Admin cập nhật hướng dẫn màn hình không cần sửa mã nguồn")
    void testUpdateGuide_Success() {
        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(adminUser));
        when(screenGuideRepository.findById("guide-pos-1")).thenReturn(Optional.of(posGuide));

        List<CreateScreenGuideStepRequest> newSteps = Arrays.asList(
                CreateScreenGuideStepRequest.builder().stepNumber(1).title("Bước 1 mới").content("Nội dung mới 1").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(2).title("Bước 2 mới").content("Nội dung mới 2").build(),
                CreateScreenGuideStepRequest.builder().stepNumber(3).title("Bước 3 mới").content("Nội dung mới 3").build()
        );

        UpdateScreenGuideRequest req = UpdateScreenGuideRequest.builder()
                .screenName("Màn hình bán hàng POS (Cải tiến)")
                .actionUrl("/pos-v2")
                .targetRole("ALL")
                .steps(newSteps)
                .build();

        when(screenGuideRepository.save(any(ScreenGuide.class))).thenAnswer(inv -> inv.getArgument(0));
        when(screenGuideStepRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        ScreenGuideResponse response = screenGuideService.updateGuide("admin1", "guide-pos-1", req);

        assertNotNull(response);
        assertEquals("Màn hình bán hàng POS (Cải tiến)", response.getScreenName());
        assertEquals("/pos-v2", response.getActionUrl());
        assertEquals(3, response.getTotalSteps());
        verify(screenGuideStepRepository).deleteByGuideId("guide-pos-1");
    }

    @Test
    @DisplayName("Admin vô hiệu hóa hướng dẫn màn hình")
    void testDeleteGuide_Success() {
        when(userRepository.findByUsername("admin1")).thenReturn(Optional.of(adminUser));
        when(screenGuideRepository.findById("guide-pos-1")).thenReturn(Optional.of(posGuide));

        screenGuideService.deleteGuide("admin1", "guide-pos-1");

        assertFalse(posGuide.getIsActive());
        verify(screenGuideRepository).save(posGuide);
    }

    @Test
    @DisplayName("Lấy danh sách hướng dẫn gom batch đếm số bước (không N+1)")
    void testGetAllGuides_OptimizedBatchStepCount() {
        org.springframework.data.domain.Page<ScreenGuide> mockPage = new org.springframework.data.domain.PageImpl<>(
                Collections.singletonList(posGuide),
                org.springframework.data.domain.PageRequest.of(0, 20),
                1
        );

        when(screenGuideRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(Pageable.class)))
                .thenReturn(mockPage);

        GuideStepCountProjection mockCount = mock(GuideStepCountProjection.class);
        when(mockCount.getGuideId()).thenReturn("guide-pos-1");
        when(mockCount.getStepCount()).thenReturn(4L);

        when(screenGuideStepRepository.countStepsByGuideIds(Collections.singletonList("guide-pos-1")))
                .thenReturn(Collections.singletonList(mockCount));

        PageResponse<ScreenGuideSummaryResponse> pageResult = screenGuideService.getAllGuides(
                "admin1", null, null, 0, 20);

        assertNotNull(pageResult);
        assertEquals(1, pageResult.getTotalElements());
        assertEquals(4, pageResult.getContent().get(0).getStepCount());

        verify(screenGuideStepRepository, times(1)).countStepsByGuideIds(anyList());
    }
}
