package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.dto.request.CloseShiftRequest;
import com.viet.sales.dto.request.OpenShiftRequest;
import com.viet.sales.dto.response.ShiftResponse;
import com.viet.sales.entity.ActivityLog;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Shift;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.OrderRepository;
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

import java.math.BigDecimal;
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
    private final OrderRepository orderRepository;
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
        if (shift.getClosedAt() != null) {
            map.put("closedAt", shift.getClosedAt());
        }
        map.put("openingCash", shift.getOpeningCash());
        if (shift.getClosingCashExpected() != null) {
            map.put("closingCashExpected", shift.getClosingCashExpected());
        }
        if (shift.getClosingCashActual() != null) {
            map.put("closingCashActual", shift.getClosingCashActual());
        }
        if (shift.getDifferenceAmount() != null) {
            map.put("differenceAmount", shift.getDifferenceAmount());
        }
        if (shift.getDifferenceReason() != null) {
            map.put("differenceReason", shift.getDifferenceReason());
        }
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ShiftResponse closeShift(String currentUsername, String shiftId, CloseShiftRequest request) {
        log.info("Starting close shift process for shift ID: {} by user: {}", shiftId, currentUsername);

        User currentUser = getAuthenticatedUser(currentUsername);

        Shift shift = shiftRepository.findByIdForUpdate(shiftId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));

        if (shift.getStatus() == ShiftStatus.CLOSED) {
            log.warn("Shift ID: {} is already closed.", shiftId);
            throw new AppException(ErrorCode.SHIFT_ALREADY_CLOSED);
        }

        // Household isolation check
        if (!shift.getHousehold().getId().equals(currentUser.getHousehold().getId())) {
            log.warn("User {} tried to access shift of a different household", currentUsername);
            throw new AppException(ErrorCode.SHIFT_PERMISSION_DENIED);
        }

        // Ownership validation: only shift owner or owner role (VT-01) can close the shift
        if (!shift.getUser().getUsername().equals(currentUsername) && 
                !currentUser.getRole().getCode().equals("VT-01")) {
            log.warn("User {} is not authorized to close shift of user {}", currentUsername, shift.getUser().getUsername());
            throw new AppException(ErrorCode.SHIFT_PERMISSION_DENIED);
        }

        // Check if there are pending orders in the shift
        boolean hasPending = orderRepository.existsByShiftIdAndStatusAndDeletedAtIsNull(shiftId, "CREATING");
        if (hasPending) {
            log.warn("Cannot close shift ID: {} because it has pending orders in CREATING state.", shiftId);
            throw new AppException(ErrorCode.SHIFT_HAS_PENDING_ORDER);
        }

        // Calculate expected cash
        BigDecimal cashSales = orderRepository.sumFinalAmountByShiftIdAndStatusAndPaymentMethodAndDeletedAtIsNull(shiftId, "COMPLETED", "CASH");
        BigDecimal expectedCash = shift.getOpeningCash().add(cashSales);

        BigDecimal actualCash = request.getClosingCashActual();
        BigDecimal difference = actualCash.subtract(expectedCash);

        // If there's a difference, differenceReason is mandatory
        if (difference.compareTo(BigDecimal.ZERO) != 0) {
            if (request.getDifferenceReason() == null || request.getDifferenceReason().trim().isEmpty()) {
                log.warn("Discrepancy of {} detected but no reason provided.", difference);
                throw new AppException(ErrorCode.INVALID_ACTUAL_CASH);
            }
        }

        Map<String, Object> oldShiftLog = buildShiftLogMap(shift);

        // Update shift
        shift.setClosedAt(LocalDateTime.now());
        shift.setClosingCashExpected(expectedCash);
        shift.setClosingCashActual(actualCash);
        shift.setDifferenceAmount(difference);
        shift.setDifferenceReason(request.getDifferenceReason());
        shift.setStatus(ShiftStatus.CLOSED);

        shift = shiftRepository.save(shift);

        logActivity(shift.getHousehold(), currentUser, "CLOSE_SHIFT", shift.getId(), oldShiftLog, buildShiftLogMap(shift));

        log.info("Shift ID: {} closed successfully. Discrepancy: {}", shiftId, difference);

        return mapToResponse(shift);
    }
}
