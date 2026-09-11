package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.ForgotPasswordRequest;
import com.sales.dto.request.ResetPasswordRequest;
import com.sales.dto.request.VerifyOtpRequest;
import com.sales.dto.response.ForgotPasswordResponse;
import com.sales.dto.response.VerifyOtpResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PasswordResetOtp;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PasswordResetOtpRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.PasswordResetServiceImpl;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceImplTest {

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
    private com.sales.service.interfaces.EmailService emailService;

    @InjectMocks
    private PasswordResetServiceImpl passwordResetService;

    private User activeUser;
    private User blockedUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ kinh doanh Test")
                .taxCode("0123456789")
                .build();

        Role role = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();

        activeUser = User.builder()
                .id("u-1")
                .username("chuho_test")
                .phoneNumber("0912345678")
                .email("test@gmail.com")
                .passwordHash("old_hashed_password")
                .fullName("Nguyễn Văn A")
                .household(household)
                .role(role)
                .isActive(true)
                .build();

        blockedUser = User.builder()
                .id("u-2")
                .username("blocked_user")
                .phoneNumber("0987654321")
                .email("blocked@gmail.com")
                .passwordHash("old_hashed_password")
                .fullName("Trần Văn B")
                .household(household)
                .role(role)
                .isActive(false)
                .build();
    }

    @Test
    @DisplayName("NCL-01-CN-005-TC-01: Gửi yêu cầu OTP thành công cho số điện thoại hợp lệ")
    void testSendResetOtp_Success() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .phoneNumber("0912345678")
                .build();

        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0912345678"))
                .thenReturn(Optional.of(activeUser));
        when(otpRepository.findTopByPhoneNumberAndTypeOrderByCreatedAtDesc("0912345678", "PASSWORD_RESET"))
                .thenReturn(Optional.empty());
        doNothing().when(otpRepository).invalidateAllPendingOtps("0912345678", "PASSWORD_RESET");
        when(otpRepository.save(any(PasswordResetOtp.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ForgotPasswordResponse response = passwordResetService.sendResetOtp(request);

        assertNotNull(response);
        assertEquals("0912345678", response.getPhoneNumber());
        assertEquals(300L, response.getExpiresInSeconds());

        org.mockito.ArgumentCaptor<PasswordResetOtp> captor = org.mockito.ArgumentCaptor.forClass(PasswordResetOtp.class);
        verify(otpRepository, times(1)).save(captor.capture());
        assertEquals("0912345678", captor.getValue().getPhoneNumber());
        assertEquals("PASSWORD_RESET", captor.getValue().getType());
        assertNotNull(captor.getValue().getOtpCode());
        assertEquals(6, captor.getValue().getOtpCode().length());
    }

    @Test
    @DisplayName("Gửi OTP thất bại khi vi phạm thời gian chờ Cooldown 60s")
    void testSendResetOtp_CooldownActive_ThrowsBadRequest() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .phoneNumber("0912345678")
                .build();

        PasswordResetOtp recentOtp = PasswordResetOtp.builder()
                .type("PASSWORD_RESET")
                .createdAt(LocalDateTime.now().minusSeconds(30))
                .build();

        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0912345678"))
                .thenReturn(Optional.of(activeUser));
        when(otpRepository.findTopByPhoneNumberAndTypeOrderByCreatedAtDesc("0912345678", "PASSWORD_RESET"))
                .thenReturn(Optional.of(recentOtp));

        AppException exception = assertThrows(AppException.class, () -> passwordResetService.sendResetOtp(request));
        assertEquals(ErrorCode.OTP_COOLDOWN_ACTIVE, exception.getErrorCode());
    }

    @Test
    @DisplayName("NCL-01-CN-005-TC-03: Gửi OTP thất bại khi tài khoản đang bị khóa")
    void testSendResetOtp_UserBlocked_ThrowsForbidden() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .phoneNumber("0987654321")
                .build();

        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321"))
                .thenReturn(Optional.of(blockedUser));

        AppException exception = assertThrows(AppException.class, () -> passwordResetService.sendResetOtp(request));

        assertEquals(ErrorCode.USER_BLOCKED, exception.getErrorCode());
        verify(otpRepository, never()).save(any(PasswordResetOtp.class));
    }

    @Test
    @DisplayName("Gửi OTP thất bại khi số điện thoại chưa đăng ký")
    void testSendResetOtp_PhoneNotFound_ThrowsNotFound() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .phoneNumber("0999999999")
                .build();

        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0999999999"))
                .thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () -> passwordResetService.sendResetOtp(request));

        assertEquals(ErrorCode.PHONE_NUMBER_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    @DisplayName("Xác thực OTP thành công với mã đúng và còn hạn")
    void testVerifyOtp_Success() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .phoneNumber("0912345678")
                .otpCode("123456")
                .build();

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .id("otp-1")
                .phoneNumber("0912345678")
                .type("PASSWORD_RESET")
                .otpCode("123456")
                .expiryTime(LocalDateTime.now().plusMinutes(3))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(otpRepository.findTopByPhoneNumberAndTypeAndIsUsedFalseOrderByCreatedAtDesc("0912345678", "PASSWORD_RESET"))
                .thenReturn(Optional.of(otp));

        VerifyOtpResponse response = passwordResetService.verifyOtp(request);

        assertNotNull(response);
        assertTrue(response.getValid());
    }

    @Test
    @DisplayName("NCL-01-CN-005-TC-02: Xác thực OTP thất bại khi mã đã quá hạn")
    void testVerifyOtp_Expired_ThrowsBadRequest() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .phoneNumber("0912345678")
                .otpCode("123456")
                .build();

        PasswordResetOtp expiredOtp = PasswordResetOtp.builder()
                .id("otp-1")
                .phoneNumber("0912345678")
                .type("PASSWORD_RESET")
                .otpCode("123456")
                .expiryTime(LocalDateTime.now().minusMinutes(1))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(otpRepository.findTopByPhoneNumberAndTypeAndIsUsedFalseOrderByCreatedAtDesc("0912345678", "PASSWORD_RESET"))
                .thenReturn(Optional.of(expiredOtp));

        AppException exception = assertThrows(AppException.class, () -> passwordResetService.verifyOtp(request));

        assertEquals(ErrorCode.OTP_EXPIRED, exception.getErrorCode());
        assertTrue(expiredOtp.getIsUsed());
        verify(otpRepository, times(1)).save(expiredOtp);
    }

    @Test
    @DisplayName("Xác thực OTP thất bại khi nhập sai mã")
    void testVerifyOtp_InvalidCode_ThrowsBadRequest() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .phoneNumber("0912345678")
                .otpCode("999999")
                .build();

        PasswordResetOtp validOtp = PasswordResetOtp.builder()
                .id("otp-1")
                .phoneNumber("0912345678")
                .type("PASSWORD_RESET")
                .otpCode("123456")
                .expiryTime(LocalDateTime.now().plusMinutes(4))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(otpRepository.findTopByPhoneNumberAndTypeAndIsUsedFalseOrderByCreatedAtDesc("0912345678", "PASSWORD_RESET"))
                .thenReturn(Optional.of(validOtp));

        AppException exception = assertThrows(AppException.class, () -> passwordResetService.verifyOtp(request));

        assertEquals(ErrorCode.INVALID_OTP, exception.getErrorCode());
        assertEquals(1, validOtp.getAttemptCount());
        verify(otpRepository, times(1)).save(validOtp);
    }

    @Test
    @DisplayName("NCL-01-CN-005-TC-01: Đặt lại mật khẩu thành công")
    void testResetPassword_Success() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .phoneNumber("0912345678")
                .otpCode("123456")
                .newPassword("newSecretPassword123")
                .confirmPassword("newSecretPassword123")
                .build();

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .id("otp-1")
                .user(activeUser)
                .phoneNumber("0912345678")
                .type("PASSWORD_RESET")
                .otpCode("123456")
                .expiryTime(LocalDateTime.now().plusMinutes(3))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0912345678"))
                .thenReturn(Optional.of(activeUser));
        when(otpRepository.findTopByPhoneNumberAndTypeAndIsUsedFalseOrderByCreatedAtDesc("0912345678", "PASSWORD_RESET"))
                .thenReturn(Optional.of(otp));
        when(passwordEncoder.encode("newSecretPassword123")).thenReturn("encoded_newSecretPassword123");
        when(cacheManager.getCache("users")).thenReturn(userCache);

        passwordResetService.resetPassword(request);

        assertEquals("encoded_newSecretPassword123", activeUser.getPasswordHash());
        assertNotNull(activeUser.getPasswordChangedAt());
        assertFalse(activeUser.getMustChangePassword());
        assertTrue(otp.getIsUsed());

        verify(userRepository, times(1)).save(activeUser);
        verify(otpRepository, times(1)).save(otp);
        verify(userCache, times(1)).evict(activeUser.getUsername());
    }

    @Test
    @DisplayName("Đặt lại mật khẩu thất bại khi mật khẩu xác nhận không khớp")
    void testResetPassword_PasswordMismatch_ThrowsBadRequest() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .phoneNumber("0912345678")
                .otpCode("123456")
                .newPassword("password123")
                .confirmPassword("password456")
                .build();

        AppException exception = assertThrows(AppException.class, () -> passwordResetService.resetPassword(request));

        assertEquals(ErrorCode.PASSWORD_CONFIRMATION_MISMATCH, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("NCL-01-CN-005-TC-03: Đặt lại mật khẩu thất bại khi tài khoản bị khóa")
    void testResetPassword_UserBlocked_ThrowsForbidden() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .phoneNumber("0987654321")
                .otpCode("123456")
                .newPassword("newPassword123")
                .confirmPassword("newPassword123")
                .build();

        when(userRepository.findByPhoneNumberAndDeletedAtIsNull("0987654321"))
                .thenReturn(Optional.of(blockedUser));

        AppException exception = assertThrows(AppException.class, () -> passwordResetService.resetPassword(request));

        assertEquals(ErrorCode.USER_BLOCKED, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Gửi OTP đặt lại mật khẩu qua email thành công")
    void testSendResetOtp_ByEmail_Success() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("test@gmail.com")
                .build();

        when(userRepository.findByEmailAndDeletedAtIsNull("test@gmail.com"))
                .thenReturn(Optional.of(activeUser));
        when(otpRepository.findTopByEmailAndTypeOrderByCreatedAtDesc("test@gmail.com", "PASSWORD_RESET"))
                .thenReturn(Optional.empty());

        ForgotPasswordResponse response = passwordResetService.sendResetOtp(request);

        assertNotNull(response);
        assertEquals("test@gmail.com", response.getEmail());
        verify(otpRepository, times(1)).invalidateAllPendingOtpsForEmail("test@gmail.com", "PASSWORD_RESET");
        verify(otpRepository, times(1)).save(any(PasswordResetOtp.class));
        verify(emailService, times(1)).sendPasswordResetOtpEmail(eq("test@gmail.com"), anyString(), eq("Nguyễn Văn A"));
    }

    @Test
    @DisplayName("Gửi OTP đặt lại mật khẩu qua email thất bại khi email không tồn tại")
    void testSendResetOtp_ByEmail_NotFound() {
        ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                .email("unknown@gmail.com")
                .build();

        when(userRepository.findByEmailAndDeletedAtIsNull("unknown@gmail.com"))
                .thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () -> passwordResetService.sendResetOtp(request));
        assertEquals(ErrorCode.EMAIL_NOT_FOUND, exception.getErrorCode());
        verify(otpRepository, never()).save(any(PasswordResetOtp.class));
    }

    @Test
    @DisplayName("Xác thực OTP qua email thành công")
    void testVerifyOtp_ByEmail_Success() {
        VerifyOtpRequest request = VerifyOtpRequest.builder()
                .email("test@gmail.com")
                .otpCode("123456")
                .build();

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .id("otp-email-1")
                .email("test@gmail.com")
                .otpCode("123456")
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(otpRepository.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc("test@gmail.com", "PASSWORD_RESET"))
                .thenReturn(Optional.of(otp));

        VerifyOtpResponse response = passwordResetService.verifyOtp(request);

        assertNotNull(response);
        assertTrue(Boolean.TRUE.equals(response.getValid()));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu qua email thành công")
    void testResetPassword_ByEmail_Success() {
        ResetPasswordRequest request = ResetPasswordRequest.builder()
                .email("test@gmail.com")
                .otpCode("123456")
                .newPassword("newPassword456")
                .confirmPassword("newPassword456")
                .build();

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .id("otp-email-2")
                .email("test@gmail.com")
                .otpCode("123456")
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .isUsed(false)
                .attemptCount(0)
                .build();

        when(userRepository.findByEmailAndDeletedAtIsNull("test@gmail.com"))
                .thenReturn(Optional.of(activeUser));
        when(otpRepository.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc("test@gmail.com", "PASSWORD_RESET"))
                .thenReturn(Optional.of(otp));
        when(passwordEncoder.encode("newPassword456")).thenReturn("hashed_newPassword456");
        when(cacheManager.getCache("users")).thenReturn(userCache);

        passwordResetService.resetPassword(request);

        assertEquals("hashed_newPassword456", activeUser.getPasswordHash());
        assertTrue(otp.getIsUsed());
        verify(userRepository, times(1)).save(activeUser);
        verify(otpRepository, times(1)).save(otp);
        verify(userCache, times(1)).evict(activeUser.getUsername());
    }
}
