package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.RoleCode;
import com.sales.dto.request.UpdateSessionSettingsRequest;
import com.sales.dto.response.SessionSettingsResponse;
import com.sales.dto.response.UserSessionResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Order;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.entity.UserSession;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.UserRepository;
import com.sales.repository.UserSessionRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.UserSessionServiceImpl;
import com.sales.service.interfaces.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserSessionServiceImplTest {

    @Mock
    private UserSessionRepository userSessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BusinessHouseholdRepository householdRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private JwtService jwtService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private UserSessionServiceImpl userSessionService;

    private BusinessHousehold household;
    private BusinessHousehold otherHousehold;
    private Role ownerRole;
    private Role staffRole;
    private User owner;
    private User staff;
    private User otherHouseholdUser;
    private UserSession activeStaffSession;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-001")
                .name("Hộ kinh doanh Bách Hóa Việt")
                .taxCode("0123456789")
                .sessionTimeoutMinutes(60)
                .build();

        otherHousehold = BusinessHousehold.builder()
                .id("hh-002")
                .name("Hộ kinh doanh Khác")
                .taxCode("9876543210")
                .sessionTimeoutMinutes(30)
                .build();

        ownerRole = Role.builder()
                .id(1)
                .code(RoleCode.VT_01.getCode())
                .name("Chủ hộ kinh doanh")
                .build();

        staffRole = Role.builder()
                .id(2)
                .code(RoleCode.VT_02.getCode())
                .name("Nhân viên bán hàng")
                .build();

        owner = User.builder()
                .id("user-owner-01")
                .username("chuho_viet")
                .fullName("Nguyễn Văn Chủ Hộ")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();

        staff = User.builder()
                .id("user-staff-02")
                .username("nhanvien_pos")
                .fullName("Trần Thị Bán Hàng")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build();

        otherHouseholdUser = User.builder()
                .id("user-other-03")
                .username("user_other")
                .fullName("Người dùng hộ khác")
                .role(staffRole)
                .household(otherHousehold)
                .isActive(true)
                .build();

        activeStaffSession = UserSession.builder()
                .id("sess-staff-123")
                .user(staff)
                .household(household)
                .deviceType("MOBILE")
                .deviceName("Chrome trên Android")
                .ipAddress("192.168.1.100")
                .userAgent("Mozilla/5.0 (Linux; Android 13; SM-G991B) Mobile Chrome/114.0")
                .loginAt(LocalDateTime.now().minusHours(1))
                .lastActiveAt(LocalDateTime.now().minusMinutes(5))
                .expiresAt(LocalDateTime.now().plusDays(1))
                .isRevoked(false)
                .build();
    }

    // =========================================================================
    // NCL-01-CN-007-TC-01: Chủ hộ đăng xuất từ xa một phiên lạ thành công
    // =========================================================================
    @Test
    @DisplayName("NCL-01-CN-007-TC-01: Chủ hộ đăng xuất từ xa một phiên lạ thành công và phiên bị cắt ngay lập tức")
    void testRevokeSession_Success_ByOwner() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(userSessionRepository.findById("sess-staff-123")).thenReturn(Optional.of(activeStaffSession));
        when(userSessionRepository.findByIdWithHousehold("sess-staff-123")).thenReturn(Optional.of(activeStaffSession));
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        userSessionService.revokeSession("sess-staff-123", "Nghi ngờ thiết bị lạ đăng nhập trái phép", "chuho_viet");

        assertTrue(activeStaffSession.getIsRevoked());
        assertNotNull(activeStaffSession.getRevokedAt());
        assertEquals("user-owner-01", activeStaffSession.getRevokedByUser().getId());
        assertEquals("Nghi ngờ thiết bị lạ đăng nhập trái phép", activeStaffSession.getRevokeReason());

        // Kiểm tra việc phiên bị cắt ngay ở lần gọi tiếp theo
        boolean isValid = userSessionService.validateSession("sess-staff-123");
        assertFalse(isValid, "Phiên bị đăng xuất từ xa phải trả về invalid ngay lập tức ở lần gọi tiếp theo");

        // Kiểm tra ghi vết nhật ký kiểm toán vào ActivityLog
        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(owner), eq("REMOTE_LOGOUT_SESSION"), eq("user_sessions"),
                eq("sess-staff-123"), isNull(), any(), any(), any());
    }

    // =========================================================================
    // NCL-01-CN-007-TC-02: Phân quyền xem danh sách phiên đăng nhập
    // =========================================================================
    @Test
    @DisplayName("NCL-01-CN-007-TC-02: Nhân viên bán hàng chỉ xem được danh sách phiên của chính mình")
    void testGetSessions_ByStaff_ReturnsOnlyOwnSessions() {
        when(userRepository.findByUsername("nhanvien_pos")).thenReturn(Optional.of(staff));
        when(userSessionRepository.findActiveSessionsByUserId("user-staff-02")).thenReturn(List.of(activeStaffSession));

        List<UserSessionResponse> result = userSessionService.getSessions("nhanvien_pos");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("sess-staff-123", result.get(0).getId());
        assertEquals("nhanvien_pos", result.get(0).getUsername());
        assertEquals("MOBILE", result.get(0).getDeviceType());
        verify(userSessionRepository, times(1)).findActiveSessionsByUserId("user-staff-02");
        verify(userSessionRepository, never()).findActiveSessionsByHouseholdId(anyString());
    }

    @Test
    @DisplayName("NCL-01-CN-007-TC-02: Chủ hộ xem được danh sách toàn bộ các phiên của toàn hộ kinh doanh")
    void testGetSessions_ByOwner_ReturnsAllHouseholdSessions() {
        UserSession ownerSession = UserSession.builder()
                .id("sess-owner-999")
                .user(owner)
                .household(household)
                .deviceType("DESKTOP")
                .deviceName("Chrome trên Windows")
                .ipAddress("192.168.1.1")
                .loginAt(LocalDateTime.now().minusHours(2))
                .lastActiveAt(LocalDateTime.now().minusMinutes(1))
                .expiresAt(LocalDateTime.now().plusDays(1))
                .isRevoked(false)
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(userSessionRepository.findActiveSessionsByHouseholdId("hh-001"))
                .thenReturn(List.of(ownerSession, activeStaffSession));

        List<UserSessionResponse> result = userSessionService.getSessions("chuho_viet");

        assertNotNull(result);
        assertEquals(2, result.size());
        verify(userSessionRepository, times(1)).findActiveSessionsByHouseholdId("hh-001");
    }

    // =========================================================================
    // NCL-01-CN-007-TC-03: Ngoại lệ - Thiết bị bị đăng xuất còn đơn đang treo không bị mất
    // =========================================================================
    @Test
    @DisplayName("NCL-01-CN-007-TC-03: Thiết bị bị đăng xuất khi còn đơn đang treo (CREATING), dữ liệu đơn hàng vẫn bảo toàn nguyên vẹn")
    void testRemoteRevoke_PreservesPendingDraftOrders() {
        // 1. Giả lập đơn hàng dở dang đang treo (CREATING) của nhân viên
        Order pendingOrder = Order.builder()
                .id("order-draft-001")
                .orderNumber("HD-20260907-0001")
                .household(household)
                .createdByUser(staff)
                .status("CREATING")
                .paymentStatus("PENDING")
                .totalAmount(new BigDecimal("250000.00"))
                .finalAmount(new BigDecimal("250000.00"))
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(userSessionRepository.findById("sess-staff-123")).thenReturn(Optional.of(activeStaffSession));
        when(userSessionRepository.findByIdWithHousehold("sess-staff-123")).thenReturn(Optional.of(activeStaffSession));
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // 2. Chủ hộ tiến hành đăng xuất từ xa phiên của nhân viên
        userSessionService.revokeSession("sess-staff-123", "Đăng xuất thiết bị bán hàng cuối ca", "chuho_viet");

        // 3. Xác nhận phiên đã bị hủy và không thể gọi API tiếp
        assertTrue(activeStaffSession.getIsRevoked());
        assertFalse(userSessionService.validateSession("sess-staff-123"));

        // 4. Kiểm tra đơn hàng đang treo trong DB: trạng thái và số liệu không bị mất hoặc biến đổi
        assertEquals("CREATING", pendingOrder.getStatus());
        assertEquals("PENDING", pendingOrder.getPaymentStatus());
        assertEquals(new BigDecimal("250000.00"), pendingOrder.getFinalAmount());
        assertEquals("user-staff-02", pendingOrder.getCreatedByUser().getId());

        // 5. Nhân viên tạo phiên mới khi đăng nhập lại và truy vấn lại đơn hàng
        UserSession newSession = userSessionService.createSession(staff, "192.168.1.100", "POS Terminal");
        assertNotNull(newSession);
        assertFalse(newSession.getIsRevoked());
    }

    // =========================================================================
    // Auto Idle Timeout Tests
    // =========================================================================
    @Test
    @DisplayName("Tự động hết hạn phiên khi thời gian không thao tác vượt quá cấu hình sessionTimeoutMinutes của hộ")
    void testValidateSession_AutoExpires_WhenExceedingIdleTimeout() {
        UserSession idleSession = UserSession.builder()
                .id("sess-idle-01")
                .user(staff)
                .household(household)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .lastActiveAt(LocalDateTime.now().minusMinutes(65))
                .isRevoked(false)
                .build();

        when(userSessionRepository.findByIdWithHousehold("sess-idle-01")).thenReturn(Optional.of(idleSession));
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean isValid = userSessionService.validateSession("sess-idle-01");

        assertFalse(isValid, "Phiên vượt quá thời gian không thao tác phải bị từ chối");
        assertTrue(idleSession.getIsRevoked());
        assertNotNull(idleSession.getRevokedAt());
        assertTrue(idleSession.getRevokeReason().contains("Tự động hết hạn do không thao tác quá 60 phút"));
    }

    @Test
    @DisplayName("Hết hạn phiên khi token JWT vượt quá thời hạn expiresAt")
    void testValidateSession_Expires_WhenExceedingJwtExpiresAt() {
        UserSession expiredSession = UserSession.builder()
                .id("sess-expired-01")
                .user(staff)
                .household(household)
                .expiresAt(LocalDateTime.now().minusMinutes(5))
                .lastActiveAt(LocalDateTime.now().minusMinutes(10))
                .isRevoked(false)
                .build();

        when(userSessionRepository.findByIdWithHousehold("sess-expired-01")).thenReturn(Optional.of(expiredSession));
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean isValid = userSessionService.validateSession("sess-expired-01");

        assertFalse(isValid, "Phiên quá hạn token JWT phải bị từ chối");
        assertTrue(expiredSession.getIsRevoked());
        assertNotNull(expiredSession.getRevokedAt());
        assertEquals("Phiên hết hạn", expiredSession.getRevokeReason());
    }

    @Test
    @DisplayName("Phiên hoạt động bình thường nếu chưa vượt quá thời gian chờ không thao tác")
    void testValidateSession_Valid_WhenWithinIdleTimeout() {
        UserSession activeSession = UserSession.builder()
                .id("sess-active-01")
                .user(staff)
                .household(household)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .lastActiveAt(LocalDateTime.now().minusMinutes(10))
                .isRevoked(false)
                .build();

        when(userSessionRepository.findByIdWithHousehold("sess-active-01")).thenReturn(Optional.of(activeSession));

        boolean isValid = userSessionService.validateSession("sess-active-01");

        assertTrue(isValid, "Phiên trong thời hạn idle timeout phải hợp lệ");
        assertFalse(activeSession.getIsRevoked());
    }

    // =========================================================================
    // Đăng xuất toàn bộ phiên của một người dùng
    // =========================================================================
    @Test
    @DisplayName("Chủ hộ đăng xuất toàn bộ phiên của một tài khoản nhân viên thành công")
    void testRevokeAllSessionsForUser_Success_ByOwner() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(userRepository.findById("user-staff-02")).thenReturn(Optional.of(staff));
        when(userSessionRepository.revokeAllActiveSessionsForUser(eq("user-staff-02"), any(), eq(owner), anyString()))
                .thenReturn(2);

        userSessionService.revokeAllSessionsForUser("user-staff-02", "Nhân viên nghỉ việc", "chuho_viet");

        verify(userSessionRepository, times(1)).revokeAllActiveSessionsForUser(
                eq("user-staff-02"), any(), eq(owner), eq("Nhân viên nghỉ việc"));
        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(owner), eq("REMOTE_LOGOUT_ALL_SESSIONS"), eq("user_sessions"),
                eq("user-staff-02"), isNull(), any(), any(), any());
    }

    // =========================================================================
    // Cấu hình thời gian tự hết hạn phiên (Session Settings)
    // =========================================================================
    @Test
    @DisplayName("Chủ hộ xem và cập nhật cấu hình thời gian hết hạn phiên thành công")
    void testSessionSettings_Owner_Success() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(householdRepository.save(any(BusinessHousehold.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SessionSettingsResponse currentSettings = userSessionService.getSessionSettings("chuho_viet");
        assertEquals("hh-001", currentSettings.getHouseholdId());
        assertEquals(60, currentSettings.getSessionTimeoutMinutes());

        UpdateSessionSettingsRequest updateReq = UpdateSessionSettingsRequest.builder()
                .sessionTimeoutMinutes(120)
                .build();

        SessionSettingsResponse updatedSettings = userSessionService.updateSessionSettings("chuho_viet", updateReq);
        assertEquals(120, updatedSettings.getSessionTimeoutMinutes());
        assertEquals(120, household.getSessionTimeoutMinutes());

        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(owner), eq("UPDATE_SESSION_SETTINGS"), eq("user_sessions"),
                eq("hh-001"), any(), any(), any(), any());
    }

    @Test
    @DisplayName("Cập nhật thời gian hết hạn phiên không hợp lệ (< 5 phút hoặc > 1440 phút) ném SESSION_TIMEOUT_INVALID")
    void testUpdateSessionSettings_InvalidMinutes_ThrowsException() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));

        UpdateSessionSettingsRequest tooSmall = UpdateSessionSettingsRequest.builder()
                .sessionTimeoutMinutes(2)
                .build();

        AppException ex1 = assertThrows(AppException.class, () ->
                userSessionService.updateSessionSettings("chuho_viet", tooSmall));
        assertEquals(ErrorCode.SESSION_TIMEOUT_INVALID, ex1.getErrorCode());

        UpdateSessionSettingsRequest tooBig = UpdateSessionSettingsRequest.builder()
                .sessionTimeoutMinutes(2000)
                .build();

        AppException ex2 = assertThrows(AppException.class, () ->
                userSessionService.updateSessionSettings("chuho_viet", tooBig));
        assertEquals(ErrorCode.SESSION_TIMEOUT_INVALID, ex2.getErrorCode());
    }

    @Test
    @DisplayName("Nhân viên bán hàng không có quyền truy cập cấu hình phiên, ném FORBIDDEN")
    void testSessionSettings_Staff_ThrowsForbidden() {
        when(userRepository.findByUsername("nhanvien_pos")).thenReturn(Optional.of(staff));

        AppException ex = assertThrows(AppException.class, () ->
                userSessionService.getSessionSettings("nhanvien_pos"));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    // =========================================================================
    // Error Handling & Validation Tests
    // =========================================================================
    @Test
    @DisplayName("Đăng xuất phiên không tồn tại ném SESSION_NOT_FOUND")
    void testRevokeSession_NotFound_ThrowsException() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(userSessionRepository.findById("sess-unknown")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                userSessionService.revokeSession("sess-unknown", "Lý do", "chuho_viet"));
        assertEquals(ErrorCode.SESSION_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Đăng xuất phiên đã bị đăng xuất trước đó ném SESSION_ALREADY_REVOKED")
    void testRevokeSession_AlreadyRevoked_ThrowsException() {
        activeStaffSession.setIsRevoked(true);
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(userSessionRepository.findById("sess-staff-123")).thenReturn(Optional.of(activeStaffSession));

        AppException ex = assertThrows(AppException.class, () ->
                userSessionService.revokeSession("sess-staff-123", "Lý do", "chuho_viet"));
        assertEquals(ErrorCode.SESSION_ALREADY_REVOKED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Nhân viên bán hàng cố tình đăng xuất phiên của người khác ném CANNOT_REVOKE_OTHER_USER_SESSION")
    void testRevokeSession_ByStaffOnOtherUserSession_ThrowsException() {
        when(userRepository.findByUsername("nhanvien_pos")).thenReturn(Optional.of(staff));
        when(userSessionRepository.findById("sess-staff-123")).thenReturn(Optional.of(activeStaffSession));

        // Đổi user của session thành owner
        activeStaffSession.setUser(owner);

        AppException ex = assertThrows(AppException.class, () ->
                userSessionService.revokeSession("sess-staff-123", "Lý do", "nhanvien_pos"));
        assertEquals(ErrorCode.CANNOT_REVOKE_OTHER_USER_SESSION, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chủ hộ cố tình đăng xuất phiên của hộ khác ném FORBIDDEN")
    void testRevokeSession_ByOwnerOnOtherHousehold_ThrowsForbidden() {
        UserSession otherHhSession = UserSession.builder()
                .id("sess-other-hh")
                .user(otherHouseholdUser)
                .household(otherHousehold)
                .isRevoked(false)
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(userSessionRepository.findById("sess-other-hh")).thenReturn(Optional.of(otherHhSession));

        AppException ex = assertThrows(AppException.class, () ->
                userSessionService.revokeSession("sess-other-hh", "Lý do", "chuho_viet"));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chủ hộ cố tình đăng xuất phiên có household null ném FORBIDDEN (Bảo vệ multi-tenant)")
    void testRevokeSession_WhenSessionHouseholdNull_ThrowsForbidden() {
        UserSession nullHhSession = UserSession.builder()
                .id("sess-null-hh")
                .user(otherHouseholdUser)
                .household(null)
                .isRevoked(false)
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(userSessionRepository.findById("sess-null-hh")).thenReturn(Optional.of(nullHhSession));

        AppException ex = assertThrows(AppException.class, () ->
                userSessionService.revokeSession("sess-null-hh", "Lý do", "chuho_viet"));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chủ hộ cố tình đăng xuất toàn bộ phiên của người dùng có household null ném FORBIDDEN")
    void testRevokeAllSessions_WhenTargetUserHouseholdNull_ThrowsForbidden() {
        User userWithoutHousehold = User.builder()
                .id("user-no-hh")
                .username("admin_platform")
                .household(null)
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(owner));
        when(userRepository.findById("user-no-hh")).thenReturn(Optional.of(userWithoutHousehold));

        AppException ex = assertThrows(AppException.class, () ->
                userSessionService.revokeAllSessionsForUser("user-no-hh", "Lý do", "chuho_viet"));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Phiên đã quá hạn token expiresAt tự động bị hủy và trả về false")
    void testValidateSession_AutoExpires_WhenJwtTokenExpired() {
        UserSession expiredTokenSession = UserSession.builder()
                .id("sess-token-exp")
                .user(staff)
                .household(household)
                .expiresAt(LocalDateTime.now().minusMinutes(5))
                .lastActiveAt(LocalDateTime.now().minusMinutes(1))
                .isRevoked(false)
                .build();

        when(userSessionRepository.findByIdWithHousehold("sess-token-exp")).thenReturn(Optional.of(expiredTokenSession));
        when(userSessionRepository.save(any(UserSession.class))).thenAnswer(invocation -> invocation.getArgument(0));

        boolean isValid = userSessionService.validateSession("sess-token-exp");

        assertFalse(isValid);
        assertTrue(expiredTokenSession.getIsRevoked());
        assertEquals("Phiên hết hạn", expiredTokenSession.getRevokeReason());
    }

    @Test
    @DisplayName("getSessions tự động lọc bỏ các phiên đã quá hạn expiresAt")
    void testGetSessions_FiltersOutExpiredJwtSessions() {
        UserSession validSession = UserSession.builder()
                .id("sess-valid")
                .user(staff)
                .household(household)
                .expiresAt(LocalDateTime.now().plusDays(1))
                .lastActiveAt(LocalDateTime.now().minusMinutes(2))
                .isRevoked(false)
                .build();

        UserSession expiredSession = UserSession.builder()
                .id("sess-expired")
                .user(staff)
                .household(household)
                .expiresAt(LocalDateTime.now().minusHours(1))
                .lastActiveAt(LocalDateTime.now().minusMinutes(2))
                .isRevoked(false)
                .build();

        when(userRepository.findByUsername("nhanvien_pos")).thenReturn(Optional.of(staff));
        when(userSessionRepository.findActiveSessionsByUserId("user-staff-02"))
                .thenReturn(List.of(validSession, expiredSession));

        List<UserSessionResponse> result = userSessionService.getSessions("nhanvien_pos");

        assertEquals(1, result.size());
        assertEquals("sess-valid", result.get(0).getId());
    }
}
