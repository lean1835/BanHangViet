package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.dto.request.OpenShiftRequest;
import com.viet.sales.dto.response.ShiftResponse;
import com.viet.sales.entity.ActivityLog;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Shift;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.ShiftRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.ShiftService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ShiftServiceImpl implements ShiftService {

    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            ActivityLog logRecord = ActivityLog.builder()
                    .household(household)
                    .user(actor)
                    .action(action)
                    .targetTable("shifts")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to write activity log", e);
        }
    }

    private Map<String, Object> buildShiftLogMap(Shift shift) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", shift.getId());
        map.put("userId", shift.getUser().getId());
        map.put("username", shift.getUser().getUsername());
        map.put("openedAt", shift.getOpenedAt());
        map.put("openingCash", shift.getOpeningCash());
        map.put("status", shift.getStatus().name());
        return map;
    }

    private ShiftResponse mapToResponse(Shift shift) {
        return ShiftResponse.builder()
                .id(shift.getId())
                .userId(shift.getUser().getId())
                .username(shift.getUser().getUsername())
                .fullName(shift.getUser().getFullName())
                .householdId(shift.getHousehold().getId())
                .openedAt(shift.getOpenedAt())
                .closedAt(shift.getClosedAt())
                .openingCash(shift.getOpeningCash())
                .closingCashExpected(shift.getClosingCashExpected())
                .closingCashActual(shift.getClosingCashActual())
                .differenceAmount(shift.getDifferenceAmount())
                .differenceReason(shift.getDifferenceReason())
                .status(shift.getStatus().name())
                .createdAt(shift.getCreatedAt())
                .updatedAt(shift.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ShiftResponse openShift(String currentUsername, OpenShiftRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // QTN-15 / NCL-03-CN-006-TC-02: Check if user already has an open shift
        if (shiftRepository.existsByUserIdAndStatus(currentUser.getId(), ShiftStatus.OPEN)) {
            throw new AppException(ErrorCode.SHIFT_ALREADY_OPEN);
        }

        Shift shift = Shift.builder()
                .household(household)
                .user(currentUser)
                .openedAt(LocalDateTime.now())
                .openingCash(request.getOpeningCash())
                .status(ShiftStatus.OPEN)
                .build();

        shift = shiftRepository.save(shift);

        logActivity(household, currentUser, "OPEN_SHIFT", shift.getId(), null, buildShiftLogMap(shift));

        return mapToResponse(shift);
    }

    @Override
    @Transactional(readOnly = true)
    public ShiftResponse getActiveShift(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        Shift shift = shiftRepository.findByUserIdAndStatus(currentUser.getId(), ShiftStatus.OPEN)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));
        return mapToResponse(shift);
    }
}
