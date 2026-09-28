package com.sales.modules.auth.service.impl;
import com.sales.modules.audit.service.impl.ActivityLogHelper;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.auth.dto.request.ForgotPasswordRequest;
import com.sales.modules.auth.dto.request.ResetPasswordRequest;
import com.sales.modules.auth.dto.request.VerifyOtpRequest;
import com.sales.modules.auth.dto.response.ForgotPasswordResponse;
import com.sales.modules.auth.dto.response.VerifyOtpResponse;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.PasswordResetOtp;
import com.sales.modules.auth.entity.User;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.auth.repository.PasswordResetOtpRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.common.utils.EmailService;
import com.sales.modules.auth.service.PasswordResetService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetServiceImpl implements PasswordResetService {
    private static final long OTP_EXPIRATION_MINUTES = 5;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final long OTP_COOLDOWN_SECONDS = 60;
    private static final String OTP_TYPE_PASSWORD_RESET = "PASSWORD_RESET";

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ForgotPasswordResponse sendResetOtp(ForgotPasswordRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        String phoneNumber = request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null;

        if (email != null && !email.isEmpty()) {
            return sendResetOtpByEmail(email);
        } else if (phoneNumber != null && !phoneNumber.isEmpty()) {
            return sendResetOtpByPhone(phoneNumber);
        } else {
            throw new AppException(ErrorCode.EMAIL_NOT_FOUND);
        }
    }

    private ForgotPasswordResponse sendResetOtpByEmail(String email) {
        User user = userRepository.findByEmailAndDeletedAtIsNull(email)
                .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_FOUND));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        otpRepository.findTopByEmailAndTypeOrderByCreatedAtDesc(email, OTP_TYPE_PASSWORD_RESET)
                .ifPresent(lastOtp -> {
                    if (lastOtp.getCreatedAt() != null &&
                            lastOtp.getCreatedAt().plusSeconds(OTP_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                        throw new AppException(ErrorCode.OTP_COOLDOWN_ACTIVE);
                    }
                });

        otpRepository.invalidateAllPendingOtpsForEmail(email, OTP_TYPE_PASSWORD_RESET);

        int codeInt = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(codeInt);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiryTime = now.plusMinutes(OTP_EXPIRATION_MINUTES);

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .user(user)
                .email(email)
                .phoneNumber(user.getPhoneNumber())
                .type(OTP_TYPE_PASSWORD_RESET)
                .otpCode(otpCode)
                .expiryTime(expiryTime)
                .isUsed(false)
                .attemptCount(0)
                .build();

        otpRepository.save(otp);

        try {
            emailService.sendPasswordResetOtpEmail(email, otpCode, user.getFullName());
        } catch (Exception e) {
            log.error("Không thể gửi email OTP đặt lại mật khẩu cho {}: {}", email, e.getMessage());
        }

        log.info("Đã sinh mã OTP đặt lại mật khẩu cho email: {} (User: {})", email, user.getUsername());

        return ForgotPasswordResponse.builder()
                .email(email)
                .phoneNumber(user.getPhoneNumber())
                .expiresInSeconds(OTP_EXPIRATION_MINUTES * 60)
                .message("Mã xác thực đã được gửi tới Gmail của bạn và có hiệu lực trong " + OTP_EXPIRATION_MINUTES + " phút.")
                .build();
    }

    private ForgotPasswordResponse sendResetOtpByPhone(String phoneNumber) {
        User user = userRepository.findByPhoneNumberAndDeletedAtIsNull(phoneNumber)
                .orElseThrow(() -> new AppException(ErrorCode.PHONE_NUMBER_NOT_FOUND));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        otpRepository.findTopByPhoneNumberAndTypeOrderByCreatedAtDesc(phoneNumber, OTP_TYPE_PASSWORD_RESET)
                .ifPresent(lastOtp -> {
                    if (lastOtp.getCreatedAt() != null &&
                            lastOtp.getCreatedAt().plusSeconds(OTP_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                        throw new AppException(ErrorCode.OTP_COOLDOWN_ACTIVE);
                    }
                });

        otpRepository.invalidateAllPendingOtps(phoneNumber, OTP_TYPE_PASSWORD_RESET);

        int codeInt = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(codeInt);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiryTime = now.plusMinutes(OTP_EXPIRATION_MINUTES);

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .user(user)
                .phoneNumber(phoneNumber)
                .type(OTP_TYPE_PASSWORD_RESET)
                .otpCode(otpCode)
                .expiryTime(expiryTime)
                .isUsed(false)
                .attemptCount(0)
                .build();

        otpRepository.save(otp);

        log.info("Đã sinh mã OTP đặt lại mật khẩu cho số điện thoại: {} (User: {})", phoneNumber, user.getUsername());

        return ForgotPasswordResponse.builder()
                .phoneNumber(phoneNumber)
                .expiresInSeconds(OTP_EXPIRATION_MINUTES * 60)
                .message("Mã xác thực đã được gửi tới số điện thoại của bạn và có hiệu lực trong " + OTP_EXPIRATION_MINUTES + " phút.")
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        String phoneNumber = request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null;
        String otpCode = request.getOtpCode().trim();

        PasswordResetOtp otp;
        if (email != null && !email.isEmpty()) {
            otp = otpRepository.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(email, OTP_TYPE_PASSWORD_RESET)
                    .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED));
        } else if (phoneNumber != null && !phoneNumber.isEmpty()) {
            otp = otpRepository.findTopByPhoneNumberAndTypeAndIsUsedFalseOrderByCreatedAtDesc(phoneNumber, OTP_TYPE_PASSWORD_RESET)
                    .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED));
        } else {
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        if (LocalDateTime.now().isAfter(otp.getExpiryTime())) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
            throw new AppException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
        }

        if (!otp.getOtpCode().equals(otpCode)) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
                otp.setIsUsed(true);
            }
            otpRepository.save(otp);
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        return VerifyOtpResponse.builder()
                .valid(true)
                .message("Mã xác thực hợp lệ. Bạn có thể tiến hành đặt lại mật khẩu.")
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : null;
        String phoneNumber = request.getPhoneNumber() != null ? request.getPhoneNumber().trim() : null;
        String otpCode = request.getOtpCode().trim();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        if (!newPassword.equals(confirmPassword)) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRMATION_MISMATCH);
        }

        User user;
        if (email != null && !email.isEmpty()) {
            user = userRepository.findByEmailAndDeletedAtIsNull(email)
                    .orElseThrow(() -> new AppException(ErrorCode.EMAIL_NOT_FOUND));
        } else if (phoneNumber != null && !phoneNumber.isEmpty()) {
            user = userRepository.findByPhoneNumberAndDeletedAtIsNull(phoneNumber)
                    .orElseThrow(() -> new AppException(ErrorCode.PHONE_NUMBER_NOT_FOUND));
        } else {
            throw new AppException(ErrorCode.EMAIL_NOT_FOUND);
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        PasswordResetOtp otp;
        if (email != null && !email.isEmpty()) {
            otp = otpRepository.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(email, OTP_TYPE_PASSWORD_RESET)
                    .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED));
        } else {
            otp = otpRepository.findTopByPhoneNumberAndTypeAndIsUsedFalseOrderByCreatedAtDesc(phoneNumber, OTP_TYPE_PASSWORD_RESET)
                    .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED));
        }
        if (LocalDateTime.now().isAfter(otp.getExpiryTime())) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
            throw new AppException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
        }

        if (!otp.getOtpCode().equals(otpCode)) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
                otp.setIsUsed(true);
            }
            otpRepository.save(otp);
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        LocalDateTime now = LocalDateTime.now();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        user.setPasswordChangedAt(now);
        userRepository.save(user);

        otp.setIsUsed(true);
        otpRepository.save(otp);

        if (cacheManager.getCache("users") != null) {
            cacheManager.getCache("users").evict(user.getUsername());
        }

        logResetPasswordActivity(user.getHousehold(), user, "RESET_PASSWORD", user.getId());
    }

    private void logResetPasswordActivity(BusinessHousehold household, User actor, String action, String targetId) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            Map<String, Object> logDetail = new HashMap<>();
            logDetail.put("userId", actor.getId());
            logDetail.put("username", actor.getUsername());
            logDetail.put("phoneNumber", actor.getPhoneNumber());
            logDetail.put("email", actor.getEmail());
            logDetail.put("actionDescription", "Đặt lại mật khẩu thành công qua mã OTP");
            logDetail.put("timestamp", LocalDateTime.now().toString());

            String detailStr = objectMapper.writeValueAsString(logDetail);

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "users", targetId, null, detailStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for reset password", e);
        }
    }
}
