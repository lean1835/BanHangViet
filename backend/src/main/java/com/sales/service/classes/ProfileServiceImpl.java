package com.sales.service.classes;

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
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PasswordResetOtpRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.JwtService;
import com.sales.service.interfaces.ProfileService;
import com.sales.service.interfaces.UserSessionService;
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
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileServiceImpl implements ProfileService {

    private static final long OTP_EXPIRATION_MINUTES = 5;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final long OTP_COOLDOWN_SECONDS = 60;
    private static final String OTP_TYPE_UPDATE_PHONE = "UPDATE_PHONE";

    private final UserRepository userRepository;
    private final PasswordResetOtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;
    private final CacheManager cacheManager;
    private final JwtService jwtService;
    private final UserSessionService userSessionService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(String username) {
        User user = findUserByUsername(username);
        checkUserActive(user);
        return mapToUserProfileResponse(user);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserProfileResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = findUserByUsername(username);
        checkUserActive(user);

        String oldFullName = user.getFullName();
        String newFullName = request.getFullName().trim();

        user.setFullName(newFullName);
        User updatedUser = userRepository.save(user);

        evictUserCache(username);

        logProfileActivity(updatedUser.getHousehold(), updatedUser, "UPDATE_PROFILE", updatedUser.getId(),
                Map.of("fullName", oldFullName != null ? oldFullName : ""),
                Map.of("fullName", newFullName, "actionDescription", "Cập nhật thông tin hồ sơ cá nhân"));

        return mapToUserProfileResponse(updatedUser);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ChangePasswordResponse changePassword(String username, ChangePasswordRequest request) {
        User user = findUserByUsername(username);
        checkUserActive(user);

        String currentPassword = request.getCurrentPassword();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();

        // 1. Kiểm tra xác nhận mật khẩu
        if (!newPassword.equals(confirmPassword)) {
            throw new AppException(ErrorCode.PASSWORD_CONFIRMATION_MISMATCH);
        }

        // 2. Kiểm tra mật khẩu hiện tại
        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        }

        // 3. Kiểm tra mật khẩu mới không trùng mật khẩu cũ
        if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
            throw new AppException(ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT);
        }

        // 4. Cập nhật mật khẩu mới và thời điểm đổi mật khẩu để vô hiệu hóa toàn bộ phiên cũ
        LocalDateTime now = LocalDateTime.now();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setPasswordChangedAt(now);
        user.setMustChangePassword(false);
        user = userRepository.save(user);

        evictUserCache(username);

        // 5. Thu hồi tất cả các phiên khác ngoại trừ phiên hiện tại
        String currentSessionId = null;
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest httpRequest = attributes.getRequest();
                String authHeader = httpRequest.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    currentSessionId = jwtService.extractSessionId(authHeader.substring(7));
                }
            }
        } catch (Exception ignored) {
        }
        userSessionService.revokeAllSessionsExcept(user.getId(), currentSessionId, "Vô hiệu hóa phiên do đổi mật khẩu", user);

        // 6. Sinh token JWT mới cho phiên hiện tại (chứa pwdAt mới)
        String newToken = currentSessionId != null
                ? jwtService.generateToken(user, currentSessionId)
                : jwtService.generateToken(user);

        logProfileActivity(user.getHousehold(), user, "CHANGE_PASSWORD", user.getId(),
                null,
                Map.of("actionDescription", "Người dùng tự đổi mật khẩu cá nhân thành công. Đã vô hiệu hóa các phiên khác.",
                        "passwordChangedAt", now.toString()));

        return ChangePasswordResponse.builder()
                .token(newToken)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UpdatePhoneSendOtpResponse sendUpdatePhoneOtp(String username, UpdatePhoneSendOtpRequest request) {
        User user = findUserByUsername(username);
        checkUserActive(user);

        String newPhoneNumber = request.getNewPhoneNumber().trim();

        // 1. Kiểm tra số điện thoại mới có trùng với số hiện tại
        if (newPhoneNumber.equals(user.getPhoneNumber())) {
            throw new AppException(ErrorCode.PHONE_NUMBER_UNCHANGED);
        }

        // 2. Kiểm tra số điện thoại mới đã được tài khoản khác sử dụng chưa
        userRepository.findByPhoneNumberAndDeletedAtIsNull(newPhoneNumber)
                .ifPresent(existingUser -> {
                    if (!existingUser.getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
                    }
                });

        // 3. Kiểm tra Cooldown 60s chống spam OTP (theo user và theo số điện thoại mới)
        otpRepository.findTopByUserIdAndTypeOrderByCreatedAtDesc(user.getId(), OTP_TYPE_UPDATE_PHONE)
                .ifPresent(lastOtp -> {
                    if (lastOtp.getCreatedAt() != null &&
                            lastOtp.getCreatedAt().plusSeconds(OTP_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                        throw new AppException(ErrorCode.OTP_COOLDOWN_ACTIVE);
                    }
                });

        otpRepository.findTopByPhoneNumberAndTypeOrderByCreatedAtDesc(newPhoneNumber, OTP_TYPE_UPDATE_PHONE)
                .ifPresent(lastOtp -> {
                    if (lastOtp.getCreatedAt() != null &&
                            lastOtp.getCreatedAt().plusSeconds(OTP_COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
                        throw new AppException(ErrorCode.OTP_COOLDOWN_ACTIVE);
                    }
                });

        // 4. Vô hiệu hóa các OTP trước đó của user và của số điện thoại này
        otpRepository.invalidateAllPendingOtpsForUser(user.getId(), OTP_TYPE_UPDATE_PHONE);
        otpRepository.invalidateAllPendingOtps(newPhoneNumber, OTP_TYPE_UPDATE_PHONE);

        // 5. Sinh mã OTP 6 số ngẫu nhiên
        int codeInt = 100000 + secureRandom.nextInt(900000);
        String otpCode = String.valueOf(codeInt);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiryTime = now.plusMinutes(OTP_EXPIRATION_MINUTES);

        PasswordResetOtp otp = PasswordResetOtp.builder()
                .user(user)
                .phoneNumber(newPhoneNumber)
                .type(OTP_TYPE_UPDATE_PHONE)
                .otpCode(otpCode)
                .expiryTime(expiryTime)
                .isUsed(false)
                .attemptCount(0)
                .build();

        otpRepository.save(otp);

        log.info("Đã sinh mã OTP cập nhật số điện thoại cho user: {} (SĐT mới: {})", username, newPhoneNumber);

        return UpdatePhoneSendOtpResponse.builder()
                .phoneNumber(newPhoneNumber)
                .expiresInSeconds(OTP_EXPIRATION_MINUTES * 60)
                .message("Mã xác thực đã được gửi tới số điện thoại mới và có hiệu lực trong " + OTP_EXPIRATION_MINUTES + " phút.")
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserProfileResponse verifyAndUpdatePhone(String username, UpdatePhoneVerifyOtpRequest request) {
        User user = findUserByUsername(username);
        checkUserActive(user);

        String newPhoneNumber = request.getNewPhoneNumber().trim();
        String otpCode = request.getOtpCode().trim();

        // 1. Kiểm tra số điện thoại mới đã được tài khoản khác sử dụng chưa
        userRepository.findByPhoneNumberAndDeletedAtIsNull(newPhoneNumber)
                .ifPresent(existingUser -> {
                    if (!existingUser.getId().equals(user.getId())) {
                        throw new AppException(ErrorCode.PHONE_NUMBER_ALREADY_EXISTS);
                    }
                });

        // 2. Tìm OTP mới nhất gắn với user và số điện thoại mới (loại bỏ fallback không an toàn)
        PasswordResetOtp otp = otpRepository.findTopByUserIdAndPhoneNumberAndTypeAndIsUsedFalseOrderByCreatedAtDesc(user.getId(), newPhoneNumber, OTP_TYPE_UPDATE_PHONE)
                .orElseThrow(() -> new AppException(ErrorCode.OTP_EXPIRED));

        // 3. Kiểm tra hạn OTP
        if (LocalDateTime.now().isAfter(otp.getExpiryTime())) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
            throw new AppException(ErrorCode.OTP_EXPIRED);
        }

        // 4. Kiểm tra số lần thử tối đa
        if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
            otp.setIsUsed(true);
            otpRepository.save(otp);
            throw new AppException(ErrorCode.OTP_MAX_ATTEMPTS_EXCEEDED);
        }

        // 5. Kiểm tra mã OTP
        if (!otp.getOtpCode().equals(otpCode)) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
                otp.setIsUsed(true);
            }
            otpRepository.save(otp);
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        // 6. Đánh dấu OTP đã sử dụng
        otp.setIsUsed(true);
        otpRepository.save(otp);

        // 7. Cập nhật số điện thoại mới cho người dùng
        String oldPhoneNumber = user.getPhoneNumber();
        user.setPhoneNumber(newPhoneNumber);
        User updatedUser = userRepository.save(user);

        evictUserCache(username);

        logProfileActivity(updatedUser.getHousehold(), updatedUser, "UPDATE_PHONE_NUMBER", updatedUser.getId(),
                Map.of("phoneNumber", oldPhoneNumber != null ? oldPhoneNumber : ""),
                Map.of("phoneNumber", newPhoneNumber, "actionDescription", "Cập nhật số điện thoại nhận mã xác thực thành công"));

        return mapToUserProfileResponse(updatedUser);
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkUserActive(User user) {
        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }
    }

    private void evictUserCache(String username) {
        if (cacheManager != null && cacheManager.getCache("users") != null) {
            cacheManager.getCache("users").evict(username);
        }
    }

    private UserProfileResponse mapToUserProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .roleCode(user.getRole() != null ? user.getRole().getCode() : null)
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .householdId(user.getHousehold() != null ? user.getHousehold().getId() : null)
                .householdName(user.getHousehold() != null ? user.getHousehold().getName() : null)
                .pointOfSaleId(user.getPointOfSale() != null ? user.getPointOfSale().getId() : null)
                .pointOfSaleName(user.getPointOfSale() != null ? user.getPointOfSale().getName() : null)
                .posCode(user.getPointOfSale() != null ? user.getPointOfSale().getPosCode() : null)
                .isActive(user.getIsActive())
                .mustChangePassword(user.getMustChangePassword())
                .passwordChangedAt(user.getPasswordChangedAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private void logProfileActivity(BusinessHousehold household, User actor, String action, String targetId,
                                    Map<String, Object> oldValueMap, Map<String, Object> newValueMap) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = null;
            if (request != null) {
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                    clientIp = xForwardedFor.split(",")[0].trim();
                } else {
                    clientIp = request.getRemoteAddr();
                }
            }
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldValueJson = oldValueMap != null ? objectMapper.writeValueAsString(oldValueMap) : null;
            String newValueJson = newValueMap != null ? objectMapper.writeValueAsString(newValueMap) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "users", targetId, oldValueJson, newValueJson, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for profile action: {}", action, e);
        }
    }
}
