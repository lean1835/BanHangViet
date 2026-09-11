package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.RoleCode;
import com.sales.dto.request.UpdateSessionSettingsRequest;
import com.sales.dto.response.SessionSettingsResponse;
import com.sales.dto.response.UserSessionResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.User;
import com.sales.entity.UserSession;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.BusinessHouseholdRepository;
import com.sales.repository.UserRepository;
import com.sales.repository.UserSessionRepository;
import com.sales.service.interfaces.JwtService;
import com.sales.service.interfaces.UserSessionService;
import com.sales.utils.DeviceDetectionUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserSessionServiceImpl implements UserSessionService {

    private final UserSessionRepository userSessionRepository;
    private final UserRepository userRepository;
    private final BusinessHouseholdRepository householdRepository;
    private final ActivityLogHelper activityLogHelper;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long expirationMs;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserSession createSession(User user, String clientIp, String userAgent) {
        String sessionId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusSeconds(expirationMs / 1000);

        String deviceType = DeviceDetectionUtil.detectDeviceType(userAgent);
        String deviceName = DeviceDetectionUtil.detectDeviceName(userAgent);

        UserSession session = UserSession.builder()
                .id(sessionId)
                .user(user)
                .household(user.getHousehold())
                .deviceType(deviceType)
                .deviceName(deviceName)
                .ipAddress(clientIp)
                .userAgent(userAgent != null && userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent)
                .loginAt(now)
                .lastActiveAt(now)
                .expiresAt(expiresAt)
                .isRevoked(false)
                .build();

        return userSessionRepository.save(session);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean validateSession(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return true;
        }

        UserSession session = userSessionRepository.findByIdWithHousehold(sessionId).orElse(null);
        if (session == null) {
            return false;
        }

        if (Boolean.TRUE.equals(session.getIsRevoked())) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();

        // Kiểm tra thời hạn tuyệt đối theo expiresAt của token JWT (24 giờ)
        if (session.getExpiresAt() != null && session.getExpiresAt().isBefore(now)) {
            session.setIsRevoked(true);
            session.setRevokedAt(now);
            session.setRevokeReason("Phiên hết hạn");
            userSessionRepository.save(session);
            return false;
        }

        // Tự động hết hạn phiên khi vượt quá thời gian không thao tác của hộ (mặc định 60 phút, tối thiểu 5 phút)
        int timeoutMinutes = 60;
        if (session.getHousehold() != null && session.getHousehold().getSessionTimeoutMinutes() != null
                && session.getHousehold().getSessionTimeoutMinutes() >= 5) {
            timeoutMinutes = session.getHousehold().getSessionTimeoutMinutes();
        }

        if (session.getLastActiveAt() != null && session.getLastActiveAt().plusMinutes(timeoutMinutes).isBefore(now)) {
            session.setIsRevoked(true);
            session.setRevokedAt(now);
            session.setRevokeReason("Tự động hết hạn do không thao tác quá " + timeoutMinutes + " phút");
            userSessionRepository.save(session);
            log.info("Phiên làm việc {} đã tự động hết hạn do không thao tác", sessionId);
            return false;
        }

        if (session.getLastActiveAt() == null || session.getLastActiveAt().plusSeconds(30).isBefore(now)) {
            userSessionRepository.updateLastActiveAt(sessionId, now);
        }

        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSessionResponse> getSessions(String currentUsername) {
        User user = findUserByUsername(currentUsername);
        String currentSessionId = getCurrentSessionId();

        List<UserSession> sessions;
        boolean isOwner = RoleCode.VT_01.getCode().equals(user.getRole().getCode());

        if (isOwner && user.getHousehold() != null) {
            sessions = userSessionRepository.findActiveSessionsByHouseholdId(user.getHousehold().getId());
        } else {
            sessions = userSessionRepository.findActiveSessionsByUserId(user.getId());
        }

        int timeoutMinutes = (user.getHousehold() != null && user.getHousehold().getSessionTimeoutMinutes() != null
                && user.getHousehold().getSessionTimeoutMinutes() >= 5)
                ? user.getHousehold().getSessionTimeoutMinutes() : 60;
        LocalDateTime now = LocalDateTime.now();

        return sessions.stream()
                .filter(s -> (s.getExpiresAt() == null || s.getExpiresAt().isAfter(now)) &&
                        (s.getLastActiveAt() == null || !s.getLastActiveAt().plusMinutes(timeoutMinutes).isBefore(now)))
                .map(s -> mapToResponse(s, currentSessionId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void revokeSession(String sessionId, String reason, String currentUsername) {
        User actor = findUserByUsername(currentUsername);
        UserSession session = userSessionRepository.findById(sessionId)
                .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));

        if (Boolean.TRUE.equals(session.getIsRevoked())) {
            throw new AppException(ErrorCode.SESSION_ALREADY_REVOKED);
        }

        boolean isOwner = RoleCode.VT_01.getCode().equals(actor.getRole().getCode());
        if (isOwner) {
            if (actor.getHousehold() == null || session.getHousehold() == null ||
                    !session.getHousehold().getId().equals(actor.getHousehold().getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        } else {
            if (!session.getUser().getId().equals(actor.getId())) {
                throw new AppException(ErrorCode.CANNOT_REVOKE_OTHER_USER_SESSION);
            }
        }

        LocalDateTime now = LocalDateTime.now();
        session.setIsRevoked(true);
        session.setRevokedAt(now);
        session.setRevokedByUser(actor);
        session.setRevokeReason(reason != null && !reason.isBlank() ? reason : "Đăng xuất từ xa");
        userSessionRepository.save(session);

        logAudit(actor.getHousehold(), actor, "REMOTE_LOGOUT_SESSION", session.getId(),
                null,
                Map.of(
                        "actionDescription", "Đăng xuất từ xa phiên làm việc",
                        "sessionId", session.getId(),
                        "targetUsername", session.getUser().getUsername(),
                        "targetUserId", session.getUser().getId(),
                        "deviceType", session.getDeviceType(),
                        "reason", session.getRevokeReason()
                ));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void revokeAllSessionsForUser(String targetUserId, String reason, String currentUsername) {
        User actor = findUserByUsername(currentUsername);
        boolean isOwner = RoleCode.VT_01.getCode().equals(actor.getRole().getCode());

        if (!isOwner && !actor.getId().equals(targetUserId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        User targetUser = userRepository.findById(targetUserId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (isOwner) {
            if (actor.getHousehold() == null || targetUser.getHousehold() == null ||
                    !actor.getHousehold().getId().equals(targetUser.getHousehold().getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        LocalDateTime now = LocalDateTime.now();
        String effectiveReason = reason != null && !reason.isBlank() ? reason : "Đăng xuất toàn bộ phiên từ xa";

        userSessionRepository.revokeAllActiveSessionsForUser(targetUserId, now, actor, effectiveReason);

        logAudit(actor.getHousehold(), actor, "REMOTE_LOGOUT_ALL_SESSIONS", targetUserId,
                null,
                Map.of(
                        "actionDescription", "Đăng xuất toàn bộ phiên làm việc của người dùng",
                        "targetUserId", targetUserId,
                        "targetUsername", targetUser.getUsername(),
                        "reason", effectiveReason
                ));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void revokeAllSessionsExcept(String userId, String currentSessionId, String reason, User actor) {
        LocalDateTime now = LocalDateTime.now();
        String effectiveReason = reason != null && !reason.isBlank() ? reason : "Vô hiệu hóa phiên do đổi mật khẩu";

        if (currentSessionId != null && !currentSessionId.isBlank()) {
            userSessionRepository.revokeOtherActiveSessionsForUser(userId, currentSessionId, now, actor, effectiveReason);
        } else {
            userSessionRepository.revokeAllActiveSessionsForUser(userId, now, actor, effectiveReason);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public SessionSettingsResponse getSessionSettings(String currentUsername) {
        User user = findUserByUsername(currentUsername);
        checkIsOwner(user);

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        return SessionSettingsResponse.builder()
                .householdId(household.getId())
                .sessionTimeoutMinutes(household.getSessionTimeoutMinutes() != null && household.getSessionTimeoutMinutes() >= 5 ? household.getSessionTimeoutMinutes() : 60)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SessionSettingsResponse updateSessionSettings(String currentUsername, UpdateSessionSettingsRequest request) {
        User user = findUserByUsername(currentUsername);
        checkIsOwner(user);

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        Integer timeout = request.getSessionTimeoutMinutes();
        if (timeout == null || timeout < 5 || timeout > 1440) {
            throw new AppException(ErrorCode.SESSION_TIMEOUT_INVALID);
        }

        Integer oldTimeout = household.getSessionTimeoutMinutes();
        household.setSessionTimeoutMinutes(timeout);
        household = householdRepository.save(household);

        logAudit(household, user, "UPDATE_SESSION_SETTINGS", household.getId(),
                Map.of("sessionTimeoutMinutes", oldTimeout != null ? oldTimeout : 60),
                Map.of("sessionTimeoutMinutes", timeout));

        return SessionSettingsResponse.builder()
                .householdId(household.getId())
                .sessionTimeoutMinutes(household.getSessionTimeoutMinutes())
                .build();
    }

    private UserSessionResponse mapToResponse(UserSession session, String currentSessionId) {
        User u = session.getUser();
        boolean isCurrent = currentSessionId != null && currentSessionId.equals(session.getId());

        return UserSessionResponse.builder()
                .id(session.getId())
                .userId(u != null ? u.getId() : null)
                .username(u != null ? u.getUsername() : null)
                .fullName(u != null ? u.getFullName() : null)
                .roleCode(u != null && u.getRole() != null ? u.getRole().getCode() : null)
                .roleName(u != null && u.getRole() != null ? u.getRole().getName() : null)
                .deviceType(session.getDeviceType())
                .deviceName(session.getDeviceName())
                .ipAddress(session.getIpAddress())
                .loginAt(session.getLoginAt())
                .lastActiveAt(session.getLastActiveAt())
                .expiresAt(session.getExpiresAt())
                .isRevoked(session.getIsRevoked())
                .revokedAt(session.getRevokedAt())
                .revokeReason(session.getRevokeReason())
                .isCurrentSession(isCurrent)
                .build();
    }

    private String getCurrentSessionId() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String authHeader = request.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    return jwtService.extractSessionId(token);
                }
            }
        } catch (Exception e) {
            log.debug("Không thể trích xuất currentSessionId từ request: {}", e.getMessage());
        }
        return null;
    }

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkIsOwner(User user) {
        if (!RoleCode.VT_01.getCode().equals(user.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private void logAudit(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
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

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "user_sessions", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Không thể ghi activity log cho thao tác {}", action, e);
        }
    }
}
