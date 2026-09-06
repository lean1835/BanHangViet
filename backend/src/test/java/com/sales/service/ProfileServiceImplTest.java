package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.ChangePasswordRequest;
import com.sales.dto.request.UpdatePhoneSendOtpRequest;
import com.sales.dto.request.UpdatePhoneVerifyOtpRequest;
import com.sales.dto.request.UpdateProfileRequest;
import com.sales.dto.response.ChangePasswordResponse;
import com.sales.dto.response.UpdatePhoneSendOtpResponse;
import com.sales.dto.response.UserProfileResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PasswordResetOtp;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PasswordResetOtpRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.ProfileServiceImpl;
import com.sales.service.interfaces.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProfileServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetOtpRepository otpRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache userCache;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private ProfileServiceImpl profileService;

    private User user;
    private BusinessHousehold household;
    private Role role;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ kinh doanh Test")
                .build();

        role = Role.builder()
                .id(2)
                .code("VT-02")
                .name("Nhân viên bán hàng")
                .build();

        user = User.builder()
                .id("user-123")
                .username("nhanvien1")
                .fullName("Trần Thị B")
                .phoneNumber("0901234567")
                .passwordHash("hashed_old_pwd")
                .role(role)
                .household(household)
                .isActive(true)
                .mustChangePassword(true)
                .build();
    }

    // ==========================================
    // 1. Xem thông tin hồ sơ (getProfile)
    // ==========================================

    @Test
    @DisplayName("Lấy thông tin hồ sơ cá nhân thành công")
    void testGetProfile_Success() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));

        UserProfileResponse response = profileService.getProfile("nhanvien1");

        assertNotNull(response);
        assertEquals("user-123", response.getId());
        assertEquals("nhanvien1", response.getUsername());
        assertEquals("Trần Thị B", response.getFullName());
        assertEquals("0901234567", response.getPhoneNumber());
        assertEquals("VT-02", response.getRoleCode());
        assertEquals("Hộ kinh doanh Test", response.getHouseholdName());
    }

    @Test
    @DisplayName("Lấy hồ sơ cá nhân - Người dùng không tồn tại ném USER_NOT_FOUND")
    void testGetProfile_UserNotFound() {
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> profileService.getProfile("nonexistent"));
        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
    }

    // ==========================================
    // 2. Cập nhật họ tên hồ sơ (updateProfile)
    // ==========================================

    @Test
    @DisplayName("Cập nhật họ tên hồ sơ cá nhân thành công")
    void testUpdateProfile_Success() {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Trần Thị Mai")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(cacheManager.getCache("users")).thenReturn(userCache);

        UserProfileResponse response = profileService.updateProfile("nhanvien1", request);

        assertNotNull(response);
        assertEquals("Trần Thị Mai", response.getFullName());
        verify(userRepository, times(1)).save(user);
        verify(userCache, times(1)).evict("nhanvien1");
    }

    @Test
    @DisplayName("Cập nhật hồ sơ - Tài khoản bị khóa ném USER_BLOCKED")
    void testUpdateProfile_UserBlocked() {
        user.setIsActive(false);
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Trần Thị Mai")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));

        AppException ex = assertThrows(AppException.class, () -> profileService.updateProfile("nhanvien1", request));
        assertEquals(ErrorCode.USER_BLOCKED, ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    // ==========================================
    // 3. Đổi mật khẩu cá nhân (changePassword)
    // ==========================================

    @Test
    @DisplayName("NCL-01-CN-006-TC-01: Đổi mật khẩu thành công và vô hiệu hóa các phiên khác")
    void testChangePassword_Success() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPass@123")
                .newPassword("NewPass@456")
                .confirmPassword("NewPass@456")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPass@123", "hashed_old_pwd")).thenReturn(true);
        when(passwordEncoder.matches("NewPass@456", "hashed_old_pwd")).thenReturn(false);
        when(passwordEncoder.encode("NewPass@456")).thenReturn("hashed_new_pwd");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(User.class))).thenReturn("new-jwt-token-123");
        when(cacheManager.getCache("users")).thenReturn(userCache);

        ChangePasswordResponse response = profileService.changePassword("nhanvien1", request);

        assertNotNull(response);
        assertEquals("new-jwt-token-123", response.getToken());
        assertEquals("hashed_new_pwd", user.getPasswordHash());
        assertNotNull(user.getPasswordChangedAt());
        assertFalse(user.getMustChangePassword());
        verify(userRepository, times(1)).save(user);
        verify(userCache, times(1)).evict("nhanvien1");
        verify(jwtService, times(1)).generateToken(user);
    }

    @Test
    @DisplayName("NCL-01-CN-006-TC-02: Mật khẩu mới trùng mật khẩu cũ ném NEW_PASSWORD_SAME_AS_CURRENT")
    void testChangePassword_SameAsOldPassword() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPass@123")
                .newPassword("OldPass@123")
                .confirmPassword("OldPass@123")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPass@123", "hashed_old_pwd")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> profileService.changePassword("nhanvien1", request));
        assertEquals(ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT, ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đổi mật khẩu - Mật khẩu xác nhận không khớp ném PASSWORD_CONFIRMATION_MISMATCH")
    void testChangePassword_ConfirmMismatch() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPass@123")
                .newPassword("NewPass@456")
                .confirmPassword("DifferentPass@789")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));

        AppException ex = assertThrows(AppException.class, () -> profileService.changePassword("nhanvien1", request));
        assertEquals(ErrorCode.PASSWORD_CONFIRMATION_MISMATCH, ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Đổi mật khẩu - Mật khẩu hiện tại không chính xác ném WRONG_PASSWORD")
    void testChangePassword_WrongCurrentPassword() {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("IncorrectPass")
                .newPassword("NewPass@456")
                .confirmPassword("NewPass@456")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("IncorrectPass", "hashed_old_pwd")).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () -> profileService.changePassword("nhanvien1", request));
        assertEquals(ErrorCode.WRONG_PASSWORD, ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    // ==========================================
    // 4. Gửi mã OTP đổi số điện thoại (sendUpdatePhoneOtp)
    // ==========================================

    @Test
    @DisplayName("NCL-01-CN-006-TC-03: Gửi OTP đổi số điện thoại thành công")
    void testSendUpdatePhoneOtp_Success() {
        UpdatePhoneSendOtpRequest request = UpdatePhoneSendOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321")).thenReturn(Optional.empty());
        when(otpRepository.findTopByUserIdOrderByCreatedAtDesc("user-123")).thenReturn(Optional.empty());
        when(otpRepository.findTopByPhoneNumberOrderByCreatedAtDesc("0987654321")).thenReturn(Optional.empty());

        UpdatePhoneSendOtpResponse response = profileService.sendUpdatePhoneOtp("nhanvien1", request);

        assertNotNull(response);
        assertEquals("0987654321", response.getPhoneNumber());
        assertEquals(300, response.getExpiresInSeconds());
        verify(otpRepository, times(1)).invalidateAllPendingOtpsForUser("user-123");
        verify(otpRepository, times(1)).invalidateAllPendingOtps("0987654321");
        verify(otpRepository, times(1)).save(any(PasswordResetOtp.class));
    }

    @Test
    @DisplayName("Gửi OTP - Số điện thoại mới trùng số hiện tại ném PHONE_NUMBER_UNCHANGED")
    void testSendUpdatePhoneOtp_PhoneUnchanged() {
        UpdatePhoneSendOtpRequest request = UpdatePhoneSendOtpRequest.builder()
                .newPhoneNumber("0901234567")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));

        AppException ex = assertThrows(AppException.class, () -> profileService.sendUpdatePhoneOtp("nhanvien1", request));
        assertEquals(ErrorCode.PHONE_NUMBER_UNCHANGED, ex.getErrorCode());
        verify(otpRepository, never()).save(any());
    }

    @Test
    @DisplayName("Gửi OTP - Số điện thoại mới đã tồn tại trên tài khoản khác ném PHONE_NUMBER_ALREADY_EXISTS")
    void testSendUpdatePhoneOtp_PhoneAlreadyExists() {
        User otherUser = User.builder().id("other-user-999").phoneNumber("0987654321").build();

        UpdatePhoneSendOtpRequest request = UpdatePhoneSendOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321")).thenReturn(Optional.of(otherUser));

        AppException ex = assertThrows(AppException.class, () -> profileService.sendUpdatePhoneOtp("nhanvien1", request));
        assertEquals(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS, ex.getErrorCode());
        verify(otpRepository, never()).save(any());
    }

    @Test
    @DisplayName("Gửi OTP - Gửi liên tục trong 60s ném OTP_COOLDOWN_ACTIVE")
    void testSendUpdatePhoneOtp_CooldownActive() {
        PasswordResetOtp recentOtp = PasswordResetOtp.builder()
                .id("otp-recent")
                .createdAt(LocalDateTime.now().minusSeconds(30))
                .build();

        UpdatePhoneSendOtpRequest request = UpdatePhoneSendOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321")).thenReturn(Optional.empty());
        when(otpRepository.findTopByUserIdOrderByCreatedAtDesc("user-123")).thenReturn(Optional.of(recentOtp));

        AppException ex = assertThrows(AppException.class, () -> profileService.sendUpdatePhoneOtp("nhanvien1", request));
        assertEquals(ErrorCode.OTP_COOLDOWN_ACTIVE, ex.getErrorCode());
        verify(otpRepository, never()).save(any());
    }

    @Test
    @DisplayName("Gửi OTP - Số điện thoại đích đang trong Cooldown 60s ném OTP_COOLDOWN_ACTIVE")
    void testSendUpdatePhoneOtp_TargetPhoneCooldownActive() {
        PasswordResetOtp recentOtp = PasswordResetOtp.builder()
                .id("otp-recent-phone")
                .createdAt(LocalDateTime.now().minusSeconds(20))
                .build();

        UpdatePhoneSendOtpRequest request = UpdatePhoneSendOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321")).thenReturn(Optional.empty());
        when(otpRepository.findTopByUserIdOrderByCreatedAtDesc("user-123")).thenReturn(Optional.empty());
        when(otpRepository.findTopByPhoneNumberOrderByCreatedAtDesc("0987654321")).thenReturn(Optional.of(recentOtp));

        AppException ex = assertThrows(AppException.class, () -> profileService.sendUpdatePhoneOtp("nhanvien1", request));
        assertEquals(ErrorCode.OTP_COOLDOWN_ACTIVE, ex.getErrorCode());
        verify(otpRepository, never()).save(any());
    }

    // ==========================================
    // 5. Xác thực OTP & Cập nhật số điện thoại (verifyAndUpdatePhone)
    // ==========================================

    @Test
    @DisplayName("NCL-01-CN-006-TC-03: Xác thực OTP và cập nhật số điện thoại mới thành công")
    void testVerifyAndUpdatePhone_Success() {
        UpdatePhoneVerifyOtpRequest request = UpdatePhoneVerifyOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .otpCode("654321")
                .build();

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .id("otp-1")
                .user(user)
                .phoneNumber("0987654321")
                .otpCode("654321")
                .expiryTime(LocalDateTime.now().plusMinutes(4))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321")).thenReturn(Optional.empty());
        when(otpRepository.findTopByUserIdAndPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc("user-123", "0987654321"))
                .thenReturn(Optional.of(otp));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(cacheManager.getCache("users")).thenReturn(userCache);

        UserProfileResponse response = profileService.verifyAndUpdatePhone("nhanvien1", request);

        assertNotNull(response);
        assertEquals("0987654321", user.getPhoneNumber());
        assertTrue(otp.getIsUsed());
        verify(otpRepository, times(1)).save(otp);
        verify(userRepository, times(1)).save(user);
        verify(userCache, times(1)).evict("nhanvien1");
    }

    @Test
    @DisplayName("Xác thực OTP - Không tìm thấy OTP gắn với user hiện tại ném OTP_EXPIRED (không fallback)")
    void testVerifyAndUpdatePhone_OtpNotFoundForUser() {
        UpdatePhoneVerifyOtpRequest request = UpdatePhoneVerifyOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .otpCode("654321")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321")).thenReturn(Optional.empty());
        when(otpRepository.findTopByUserIdAndPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc("user-123", "0987654321"))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> profileService.verifyAndUpdatePhone("nhanvien1", request));
        assertEquals(ErrorCode.OTP_EXPIRED, ex.getErrorCode());
        verify(userRepository, never()).save(user);
    }

    @Test
    @DisplayName("Xác thực OTP - OTP đã hết hạn ném OTP_EXPIRED")
    void testVerifyAndUpdatePhone_OtpExpired() {
        UpdatePhoneVerifyOtpRequest request = UpdatePhoneVerifyOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .otpCode("654321")
                .build();

        PasswordResetOtp expiredOtp = PasswordResetOtp.builder()
                .id("otp-expired")
                .user(user)
                .phoneNumber("0987654321")
                .otpCode("654321")
                .expiryTime(LocalDateTime.now().minusMinutes(1))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321")).thenReturn(Optional.empty());
        when(otpRepository.findTopByUserIdAndPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc("user-123", "0987654321"))
                .thenReturn(Optional.of(expiredOtp));

        AppException ex = assertThrows(AppException.class, () -> profileService.verifyAndUpdatePhone("nhanvien1", request));
        assertEquals(ErrorCode.OTP_EXPIRED, ex.getErrorCode());
        assertTrue(expiredOtp.getIsUsed());
        verify(userRepository, never()).save(user);
    }

    @Test
    @DisplayName("Xác thực OTP - Nhập sai mã OTP ném INVALID_OTP và tăng attemptCount")
    void testVerifyAndUpdatePhone_InvalidOtp() {
        UpdatePhoneVerifyOtpRequest request = UpdatePhoneVerifyOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .otpCode("999999")
                .build();

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .id("otp-valid")
                .user(user)
                .phoneNumber("0987654321")
                .otpCode("654321")
                .expiryTime(LocalDateTime.now().plusMinutes(4))
                .isUsed(false)
                .attemptCount(2)
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321")).thenReturn(Optional.empty());
        when(otpRepository.findTopByUserIdAndPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc("user-123", "0987654321"))
                .thenReturn(Optional.of(otp));

        AppException ex = assertThrows(AppException.class, () -> profileService.verifyAndUpdatePhone("nhanvien1", request));
        assertEquals(ErrorCode.INVALID_OTP, ex.getErrorCode());
        assertEquals(3, otp.getAttemptCount());
        assertFalse(otp.getIsUsed());
        verify(otpRepository, times(1)).save(otp);
        verify(userRepository, never()).save(user);
    }

    @Test
    @DisplayName("Xác thực OTP - Nhập sai quá 5 lần ném OTP_MAX_ATTEMPTS_EXCEEDED")
    void testVerifyAndUpdatePhone_MaxAttemptsExceeded() {
        UpdatePhoneVerifyOtpRequest request = UpdatePhoneVerifyOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .otpCode("654321")
                .build();

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .id("otp-max-attempt")
                .user(user)
                .phoneNumber("0987654321")
                .otpCode("654321")
                .expiryTime(LocalDateTime.now().plusMinutes(4))
                .isUsed(false)
                .attemptCount(5)
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(user));
        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321")).thenReturn(Optional.empty());
        when(otpRepository.findTopByUserIdAndPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc("user-123", "0987654321"))
                .thenReturn(Optional.of(otp));

        AppException ex = assertThrows(AppException.class, () -> profileService.verifyAndUpdatePhone("nhanvien1", request));
        assertEquals(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED, ex.getErrorCode());
        assertTrue(otp.getIsUsed());
        verify(otpRepository, times(1)).save(otp);
        verify(userRepository, never()).save(user);
    }
}
