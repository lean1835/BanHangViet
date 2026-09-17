package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ButtonSizeLevel;
import com.sales.constant.FontSizeLevel;
import com.sales.dto.request.ToggleSimpleModeRequest;
import com.sales.dto.request.UpdateUserDisplaySettingRequest;
import com.sales.dto.response.PosSimplifiedLayoutResponse;
import com.sales.dto.response.UserDisplaySettingResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.entity.UserDisplaySetting;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.UserDisplaySettingRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.UserDisplaySettingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDisplaySettingServiceTest {

    @Mock
    private UserDisplaySettingRepository displaySettingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private UserDisplaySettingServiceImpl displaySettingService;

    private User sampleUser;
    private BusinessHousehold sampleHousehold;
    private UserDisplaySetting sampleSetting;

    @BeforeEach
    void setUp() {
        sampleHousehold = BusinessHousehold.builder()
                .id("household-001")
                .name("Hộ Kinh Doanh Mẫu")
                .build();

        sampleUser = User.builder()
                .id("user-001")
                .username("chuholontuoi")
                .fullName("Nguyễn Văn A")
                .household(sampleHousehold)
                .role(Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build())
                .isActive(true)
                .build();

        sampleSetting = UserDisplaySetting.builder()
                .id("uds-001")
                .user(sampleUser)
                .simpleModeEnabled(false)
                .fontSizeLevel(FontSizeLevel.STANDARD)
                .buttonSizeLevel(ButtonSizeLevel.STANDARD)
                .showTextLabels(true)
                .requireConfirmationDialog(true)
                .highContrastEnabled(false)
                .simplifiedPosLayout(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("TC-01: Lấy cấu hình hiển thị đã tồn tại")
    void testGetDisplaySetting_Existing() {
        when(userRepository.findByUsername("chuholontuoi")).thenReturn(Optional.of(sampleUser));
        when(displaySettingRepository.findByUserId("user-001")).thenReturn(Optional.of(sampleSetting));

        UserDisplaySettingResponse response = displaySettingService.getDisplaySetting("chuholontuoi");

        assertNotNull(response);
        assertEquals("user-001", response.getUserId());
        assertEquals("chuholontuoi", response.getUsername());
        assertFalse(response.getSimpleModeEnabled());
        assertEquals(FontSizeLevel.STANDARD, response.getFontSizeLevel());
        assertEquals(100, response.getFontScalePercentage());
        assertEquals("40px", response.getMinTouchHeight());
    }

    @Test
    @DisplayName("TC-02: Tự động khởi tạo cấu hình mặc định nếu tài khoản chưa có bản ghi (Lazy Init)")
    void testGetDisplaySetting_LazyInit() {
        when(userRepository.findByUsername("chuholontuoi")).thenReturn(Optional.of(sampleUser));
        when(displaySettingRepository.findByUserId("user-001")).thenReturn(Optional.empty());
        when(displaySettingRepository.save(any(UserDisplaySetting.class))).thenAnswer(invocation -> {
            UserDisplaySetting s = invocation.getArgument(0);
            s.setId("uds-new-001");
            return s;
        });

        UserDisplaySettingResponse response = displaySettingService.getDisplaySetting("chuholontuoi");

        assertNotNull(response);
        assertEquals("uds-new-001", response.getId());
        assertFalse(response.getSimpleModeEnabled());
        assertEquals(FontSizeLevel.STANDARD, response.getFontSizeLevel());
        verify(displaySettingRepository, times(1)).save(any(UserDisplaySetting.class));
    }

    @Test
    @DisplayName("TC-03: Bật nhanh chế độ đơn giản - Tự động nâng cỡ chữ & nút bấm lên LARGE")
    void testToggleSimpleMode_Enable() {
        when(userRepository.findByUsername("chuholontuoi")).thenReturn(Optional.of(sampleUser));
        when(displaySettingRepository.findByUserId("user-001")).thenReturn(Optional.of(sampleSetting));
        when(displaySettingRepository.save(any(UserDisplaySetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ToggleSimpleModeRequest request = ToggleSimpleModeRequest.builder()
                .enabled(true)
                .build();

        UserDisplaySettingResponse response = displaySettingService.toggleSimpleMode("chuholontuoi", request);

        assertNotNull(response);
        assertTrue(response.getSimpleModeEnabled());
        assertEquals(FontSizeLevel.LARGE, response.getFontSizeLevel());
        assertEquals(ButtonSizeLevel.LARGE, response.getButtonSizeLevel());
        assertEquals(125, response.getFontScalePercentage());
        assertEquals("52px", response.getMinTouchHeight());
        assertTrue(response.getShowTextLabels());
    }

    @Test
    @DisplayName("TC-04: Tắt chế độ đơn giản - Giữ nguyên trạng thái tùy chỉnh")
    void testToggleSimpleMode_Disable() {
        sampleSetting.setSimpleModeEnabled(true);
        sampleSetting.setFontSizeLevel(FontSizeLevel.LARGE);

        when(userRepository.findByUsername("chuholontuoi")).thenReturn(Optional.of(sampleUser));
        when(displaySettingRepository.findByUserId("user-001")).thenReturn(Optional.of(sampleSetting));
        when(displaySettingRepository.save(any(UserDisplaySetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ToggleSimpleModeRequest request = ToggleSimpleModeRequest.builder()
                .enabled(false)
                .build();

        UserDisplaySettingResponse response = displaySettingService.toggleSimpleMode("chuholontuoi", request);

        assertNotNull(response);
        assertFalse(response.getSimpleModeEnabled());
    }

    @Test
    @DisplayName("TC-05: Cập nhật cấu hình chi tiết (EXTRA_LARGE, High Contrast)")
    void testUpdateDisplaySetting_Full() {
        when(userRepository.findByUsername("chuholontuoi")).thenReturn(Optional.of(sampleUser));
        when(displaySettingRepository.findByUserId("user-001")).thenReturn(Optional.of(sampleSetting));
        when(displaySettingRepository.save(any(UserDisplaySetting.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateUserDisplaySettingRequest request = UpdateUserDisplaySettingRequest.builder()
                .simpleModeEnabled(true)
                .fontSizeLevel(FontSizeLevel.EXTRA_LARGE)
                .buttonSizeLevel(ButtonSizeLevel.EXTRA_LARGE)
                .showTextLabels(true)
                .requireConfirmationDialog(true)
                .highContrastEnabled(true)
                .simplifiedPosLayout(true)
                .build();

        UserDisplaySettingResponse response = displaySettingService.updateDisplaySetting("chuholontuoi", request);

        assertNotNull(response);
        assertTrue(response.getSimpleModeEnabled());
        assertEquals(FontSizeLevel.EXTRA_LARGE, response.getFontSizeLevel());
        assertEquals(150, response.getFontScalePercentage());
        assertEquals("64px", response.getMinTouchHeight());
        assertTrue(response.getHighContrastEnabled());
    }

    @Test
    @DisplayName("TC-06: Lấy bố cục rút gọn màn hình POS")
    void testGetSimplifiedPosLayout() {
        sampleSetting.setSimpleModeEnabled(true);
        sampleSetting.setFontSizeLevel(FontSizeLevel.LARGE);
        sampleSetting.setButtonSizeLevel(ButtonSizeLevel.LARGE);

        when(userRepository.findByUsername("chuholontuoi")).thenReturn(Optional.of(sampleUser));
        when(displaySettingRepository.findByUserId("user-001")).thenReturn(Optional.of(sampleSetting));

        PosSimplifiedLayoutResponse response = displaySettingService.getSimplifiedPosLayout("chuholontuoi");

        assertNotNull(response);
        assertTrue(response.getIsSimpleMode());
        assertEquals(4, response.getPrimaryActions().size());
        assertTrue(response.getPrimaryActions().stream().anyMatch(a -> "SEARCH_PRODUCT".equals(a.getCode())));
        assertTrue(response.getPrimaryActions().stream().anyMatch(a -> "CHECKOUT".equals(a.getCode())));
        assertTrue(response.getMoreActions().size() >= 3);
        assertEquals("18px", response.getFontScaleStyle());
        assertEquals("52px", response.getButtonMinHeightStyle());
    }

    @Test
    @DisplayName("TC-07: Người dùng không tồn tại ném lỗi USER_NOT_FOUND")
    void testUserNotFound() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> displaySettingService.getDisplaySetting("unknown"));
        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-08: Người dùng bị khóa ném lỗi USER_BLOCKED")
    void testUserBlocked() {
        sampleUser.setIsActive(false);
        when(userRepository.findByUsername("chuholontuoi")).thenReturn(Optional.of(sampleUser));

        AppException ex = assertThrows(AppException.class, () -> displaySettingService.getDisplaySetting("chuholontuoi"));
        assertEquals(ErrorCode.USER_BLOCKED, ex.getErrorCode());
    }
}
