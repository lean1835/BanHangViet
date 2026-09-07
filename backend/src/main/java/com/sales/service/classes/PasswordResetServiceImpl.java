package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.ForgotPasswordRequest;
import com.sales.dto.request.ResetPasswordRequest;
import com.sales.dto.request.VerifyOtpRequest;
import com.sales.dto.response.ForgotPasswordResponse;
import com.sales.dto.response.VerifyOtpResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PasswordResetOtp;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PasswordResetOtpRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.PasswordResetService;
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

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;

    private final SecureRandom secureRandom = new SecureRandom();

    private static final long OTP_COOLDOWN_SECONDS = 60;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ForgotPasswordResponse sendResetOtp(ForgotPasswordRequest request) {
        String phoneNumber = request.getPhoneNumber().trim();

        // 1. Tìm tài khoản theo số điện thoại
        User user = userRepository.findByPhoneNumberAndDeletedAtIsNull(phoneNumber)
                .orElseThrow(() -> new AppException(ErrorCode.PHONE_NUMBER_NOT_FOUND));

        // 2. Kiểm tra tài khoản có bị khóa hay không (NCL-01-CN-005-TC-03)
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        // 3. Kiểm tra tần suất gửi OTP (Cooldown 60 giây chống spam)
        otpRepository.findTopByPhoneNumberOrderByCreatedAtDesc(phoneNumber)
                .ifPresent(lastOtp -> {
                    if (lastOtp.getCreatedAt() != null &&
                            lastOtp.getCreatedAt().plusSeconds(OTP_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                        throw new AppException(ErrorCode.OTP_COOLDOWN_ACTIVE);
                    }
                });

        // 4. Vô hiệu hóa toàn bộ các mã OTP chưa sử dụng trước đó của số điện thoại này
        otpRepository.invalidateAllPendingOtps(phoneNumber);

        // 5. Sinh mã OTP 6 chữ số ngẫu nhiên
        int codeInt = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(codeInt);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiryTime = now.plusMinutes(OTP_EXPIRATION_MINUTES);

        // 6. Lưu thông tin OTP vào cơ sở dữ liệu
        PasswordResetOtp otp = PasswordResetOtp.builder()
                .user(user)
                .phoneNumber(phoneNumber)
                .otpCode(otpCode)
                .expiryTime(expiryTime)
                .isUsed(false)
                .attemptCount(0)
                .build();

        otpRepository.save(otp);

        log.info("Đã sinh mã OTP đặt lại mật khẩu cho số điện thoại: {} (User: {})", phoneNumber, user.getUsername());

        // 7. Trả về kết quả an toàn (không rò rỉ mã OTP ra public API response)
        return ForgotPasswordResponse.builder()
                .phoneNumber(phoneNumber)
                .expiresInSeconds(OTP_EXPIRATION_MINUTES * 60)
                .message("Mã xác thực đã được gửi tới số điện thoại của bạn và có hiệu lực trong " + OTP_EXPIRATION_MINUTES + " phút.")
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        String phoneNumber = request.getPhoneNumber().trim();
        String otpCode = request.getOtpCode().trim();

        // 1. Tìm OTP mới nhất chưa sử dụng của số điện thoại
        PasswordResetOtp otp = otpRepository.findTopByPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc(phoneNumber)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED));

        // 2. Kiểm tra thời hạn hiệu lực (NCL-01-CN-005-TC-02)
        if (LocalDateTime.now().isAfter(otp.getExpiryTime())) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        // 3. Kiểm tra số lần nhập sai tối đa
        if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
            throw new AppException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
        }

        // 4. Kiểm tra mã OTP
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
        String phoneNumber = request.getPhoneNumber().trim();
        String otpCode = request.getOtpCode().trim();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        // 1. Kiểm tra xác nhận mật khẩu
        if (!newPassword.equals(confirmPassword)) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRMATION_MISMATCH);
        }

        // 2. Tìm người dùng theo số điện thoại
        User user = userRepository.findByPhoneNumberAndDeletedAtIsNull(phoneNumber)
                .orElseThrow(() -> new AppException(ErrorCode.PHONE_NUMBER_NOT_FOUND));

        // 3. Kiểm tra trạng thái tài khoản (NCL-01-CN-005-TC-03)
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        // 4. Tìm và xác thực OTP mới nhất (NCL-01-CN-005-TC-02)
        PasswordResetOtp otp = otpRepository.findTopByPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc(phoneNumber)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED));

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

        // 5. Cập nhật mật khẩu mới và thời điểm đổi mật khẩu (NCL-01-CN-005-TC-01: kết thúc mọi phiên cũ)
        LocalDateTime now = LocalDateTime.now();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        user.setPasswordChangedAt(now);
        userRepository.save(user);

        // 6. Đánh dấu OTP đã sử dụng
        otp.setIsUsed(true);
        otpRepository.save(otp);

        // 7. Xóa cache phiên người dùng
        if (cacheManager.getCache("users") != null) {
            cacheManager.getCache("users").evict(user.getUsername());
        }

        // 8. Ghi nhật ký kiểm toán (Activity Log)
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
            logDetail.put("actionDescription", "Đặt lại mật khẩu thành công qua mã OTP");
            logDetail.put("timestamp", LocalDateTime.now().toString());

            String detailStr = objectMapper.writeValueAsString(logDetail);

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "users", targetId, null, detailStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for reset password", e);
        }
    }
}
