package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CloseShiftRequest;
import com.sales.dto.request.OpenShiftRequest;
import com.sales.dto.response.ShiftResponse;
import com.sales.entity.ActivityLog;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Shift;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ActivityLogRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.ShiftRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.ShiftService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ShiftServiceImpl implements ShiftService {

    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;
    private final OrderRepository orderRepository;
    private final PointOfSaleRepository pointOfSaleRepository;
    private final ObjectMapper objectMapper;
    private final com.sales.repository.OrderPaymentRepository orderPaymentRepository;
    private final com.sales.repository.BusinessHouseholdSettingsRepository settingsRepository;
    private final com.sales.repository.ShiftHandoverRepository shiftHandoverRepository;
    private final com.sales.repository.CashTransactionRepository cashTransactionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public ShiftServiceImpl(ShiftRepository shiftRepository,
                            UserRepository userRepository,
                            ActivityLogHelper activityLogHelper,
                            OrderRepository orderRepository,
                            PointOfSaleRepository pointOfSaleRepository,
                            ObjectMapper objectMapper,
                            com.sales.repository.OrderPaymentRepository orderPaymentRepository,
                            com.sales.repository.BusinessHouseholdSettingsRepository settingsRepository,
                            com.sales.repository.ShiftHandoverRepository shiftHandoverRepository,
                            com.sales.repository.CashTransactionRepository cashTransactionRepository) {
        this.shiftRepository = shiftRepository;
        this.userRepository = userRepository;
        this.activityLogHelper = activityLogHelper;
        this.orderRepository = orderRepository;
        this.pointOfSaleRepository = pointOfSaleRepository;
        this.objectMapper = objectMapper;
        this.orderPaymentRepository = orderPaymentRepository;
        this.settingsRepository = settingsRepository;
        this.shiftHandoverRepository = shiftHandoverRepository;
        this.cashTransactionRepository = cashTransactionRepository;
    }

    public ShiftServiceImpl(ShiftRepository shiftRepository,
                            UserRepository userRepository,
                            ActivityLogHelper activityLogHelper,
                            OrderRepository orderRepository,
                            PointOfSaleRepository pointOfSaleRepository,
                            ObjectMapper objectMapper,
                            com.sales.repository.OrderPaymentRepository orderPaymentRepository,
                            com.sales.repository.BusinessHouseholdSettingsRepository settingsRepository,
                            com.sales.repository.ShiftHandoverRepository shiftHandoverRepository) {
        this(shiftRepository, userRepository, activityLogHelper, orderRepository, pointOfSaleRepository, objectMapper, orderPaymentRepository, settingsRepository, shiftHandoverRepository, null);
    }

    public ShiftServiceImpl(ShiftRepository shiftRepository,
                            UserRepository userRepository,
                            ActivityLogHelper activityLogHelper,
                            OrderRepository orderRepository,
                            PointOfSaleRepository pointOfSaleRepository,
                            ObjectMapper objectMapper,
                            com.sales.repository.OrderPaymentRepository orderPaymentRepository,
                            com.sales.repository.BusinessHouseholdSettingsRepository settingsRepository) {
        this(shiftRepository, userRepository, activityLogHelper, orderRepository, pointOfSaleRepository, objectMapper, orderPaymentRepository, settingsRepository, null, null);
    }

    public ShiftServiceImpl(ShiftRepository shiftRepository,
                            UserRepository userRepository,
                            ActivityLogHelper activityLogHelper,
                            OrderRepository orderRepository,
                            PointOfSaleRepository pointOfSaleRepository,
                            ObjectMapper objectMapper) {
        this(shiftRepository, userRepository, activityLogHelper, orderRepository, pointOfSaleRepository, objectMapper, null, null, null, null);
    }


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

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "shifts", targetId, oldStr, newStr, clientIp, userAgent);
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
        return mapToResponse(shift, null, null);
    }

    private ShiftResponse mapToResponse(Shift shift, BigDecimal explicitIncome, BigDecimal explicitExpense) {
        BigDecimal expectedCash = shift.getClosingCashExpected();
        BigDecimal currentOpeningCash = shift.getOpeningCash();

        BigDecimal totalCashIncome = explicitIncome != null ? explicitIncome : BigDecimal.ZERO;
        BigDecimal totalCashExpense = explicitExpense != null ? explicitExpense : BigDecimal.ZERO;
        int pendingExpenseCount = 0;

        if (shift.getStatus() == ShiftStatus.OPEN) {
            if (cashTransactionRepository != null) {
                totalCashIncome = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                        shift.getId(), com.sales.constant.CashTransactionType.INCOME, com.sales.constant.CashTransactionStatus.APPROVED);
                totalCashExpense = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                        shift.getId(), com.sales.constant.CashTransactionType.EXPENSE, com.sales.constant.CashTransactionStatus.APPROVED);
                pendingExpenseCount = (int) cashTransactionRepository.countByShiftIdAndStatus(
                        shift.getId(), com.sales.constant.CashTransactionStatus.PENDING_APPROVAL);
            }

            BigDecimal collectedSales = orderRepository.sumCollectedAmountByShiftId(shift.getId());
            expectedCash = shift.getOpeningCash().add(collectedSales).add(totalCashIncome).subtract(totalCashExpense);
            if (shiftHandoverRepository != null) {
                List<com.sales.entity.ShiftHandover> prevHandovers = shiftHandoverRepository.findByShiftIdOrderByStageNumberAsc(shift.getId());
                if (!prevHandovers.isEmpty()) {
                    BigDecimal totalHandoverDiff = prevHandovers.stream()
                            .map(com.sales.entity.ShiftHandover::getDifferenceAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    expectedCash = expectedCash.add(totalHandoverDiff);
                    currentOpeningCash = prevHandovers.get(prevHandovers.size() - 1).getActualCash();
                }
            }
        }
        return ShiftResponse.builder()
                .id(shift.getId())
                .userId(shift.getUser().getId())
                .username(shift.getUser().getUsername())
                .fullName(shift.getUser().getFullName())
                .householdId(shift.getHousehold().getId())
                .pointOfSaleId(shift.getPointOfSale() != null ? shift.getPointOfSale().getId() : null)
                .pointOfSaleName(shift.getPointOfSale() != null ? shift.getPointOfSale().getName() : null)
                .posCode(shift.getPointOfSale() != null ? shift.getPointOfSale().getPosCode() : null)
                .openedAt(shift.getOpenedAt())
                .closedAt(shift.getClosedAt())
                .openingCash(currentOpeningCash)
                .closingCashExpected(expectedCash)
                .closingCashActual(shift.getClosingCashActual())
                .differenceAmount(shift.getDifferenceAmount())
                .differenceReason(shift.getDifferenceReason())
                .totalCashIncome(totalCashIncome)
                .totalCashExpense(totalCashExpense)
                .pendingExpenseCount(pendingExpenseCount)
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

        User targetUser = currentUser;
        if (request.getUserId() != null && !request.getUserId().trim().isEmpty()) {
            if (!"VT-01".equals(currentUser.getRole().getCode())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            targetUser = userRepository.findById(request.getUserId())
                    .filter(u -> u.getDeletedAt() == null)
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
            if (targetUser.getHousehold() == null || !targetUser.getHousehold().getId().equals(household.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        // QTN-15 / NCL-03-CN-006-TC-02: Check if target user already has an open shift
        if (shiftRepository.existsByUserIdAndStatus(targetUser.getId(), ShiftStatus.OPEN)) {
            throw new AppException(ErrorCode.SHIFT_ALREADY_OPEN);
        }

        // QTN-28 / NCL-17-CN-002: Check POS assignment for sales employee (VT-02)
        if (targetUser.getRole() != null && "VT-02".equals(targetUser.getRole().getCode())) {
            if (targetUser.getPointOfSale() == null && pointOfSaleRepository.countByHouseholdIdAndDeletedAtIsNull(household.getId()) > 0) {
                throw new AppException(ErrorCode.POS_EMPLOYEE_NOT_ASSIGNED);
            }
        }

        Shift shift = Shift.builder()
                .household(household)
                .user(targetUser)
                .pointOfSale(targetUser.getPointOfSale())
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

        Shift shift = shiftRepository.findById(shiftId)
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
        if (!shift.getUser().getId().equals(currentUser.getId()) && 
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

        // NCL-03-CN-014: Kiểm tra còn khoản chi nào PENDING_APPROVAL không? Nếu còn -> chặn đóng ca
        if (cashTransactionRepository != null) {
            long pendingCount = cashTransactionRepository.countByShiftIdAndStatus(
                    shiftId, com.sales.constant.CashTransactionStatus.PENDING_APPROVAL);
            if (pendingCount > 0) {
                log.warn("Cannot close shift ID: {} because it has {} pending approval expense(s).", shiftId, pendingCount);
                throw new AppException(ErrorCode.SHIFT_HAS_PENDING_EXPENSES);
            }
        }

        // Calculate expected cash (unifying CASH, BANK_TRANSFER, DEBT down payments, and non-sales CASH transactions)
        BigDecimal collectedSales = orderRepository.sumCollectedAmountByShiftId(shiftId);
        BigDecimal totalCashIncome = BigDecimal.ZERO;
        BigDecimal totalCashExpense = BigDecimal.ZERO;
        if (cashTransactionRepository != null) {
            totalCashIncome = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                    shiftId, com.sales.constant.CashTransactionType.INCOME, com.sales.constant.CashTransactionStatus.APPROVED);
            totalCashExpense = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                    shiftId, com.sales.constant.CashTransactionType.EXPENSE, com.sales.constant.CashTransactionStatus.APPROVED);
        }

        BigDecimal expectedCash = shift.getOpeningCash()
                .add(collectedSales)
                .add(totalCashIncome)
                .subtract(totalCashExpense);

        // NCL-03-CN-013: Trừ/cộng chênh lệch của các lần bàn giao trước đó để không đổ dồn chênh lệch lên người đóng ca cuối cùng
        if (shiftHandoverRepository != null) {
            List<com.sales.entity.ShiftHandover> prevHandovers = shiftHandoverRepository.findByShiftIdOrderByStageNumberAsc(shiftId);
            BigDecimal totalHandoverDiff = prevHandovers.stream()
                    .map(com.sales.entity.ShiftHandover::getDifferenceAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            expectedCash = expectedCash.add(totalHandoverDiff);
        }

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

        return mapToResponse(shift, totalCashIncome, totalCashExpense);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftResponse> getShiftsHistory(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<Shift> shifts;
        String roleCode = currentUser.getRole().getCode();
        if ("VT-01".equals(roleCode) || "VT-03".equals(roleCode)) {
            shifts = shiftRepository.findByHouseholdIdOrderByOpenedAtDesc(household.getId());
        } else {
            shifts = shiftRepository.findByHouseholdIdAndUserIdOrderByOpenedAtDesc(household.getId(), currentUser.getId());
        }

        return shifts.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public com.sales.dto.response.BankTransferReconciliationResponse getBankTransferReconciliation(String currentUsername, String shiftId) {
        User user = getAuthenticatedUser(currentUsername);
        String householdId = user.getHousehold().getId();

        Shift shift = shiftRepository.findByIdAndHouseholdId(shiftId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));

        int timeout = settingsRepository != null
                ? settingsRepository.findByHouseholdId(householdId)
                        .map(s -> s.getBankTransferTimeoutMinutes() != null ? s.getBankTransferTimeoutMinutes() : 15)
                        .orElse(15)
                : 15;

        List<com.sales.entity.OrderPayment> bankPayments = orderPaymentRepository.findBankTransfersByShiftIdAndHouseholdId(shiftId, householdId);

        BigDecimal totalConfirmedAmount = BigDecimal.ZERO;
        int unconfirmedCount = 0;
        BigDecimal totalUnconfirmedAmount = BigDecimal.ZERO;
        List<com.sales.dto.response.BankTransferItemResponse> items = new java.util.ArrayList<>();

        for (com.sales.entity.OrderPayment p : bankPayments) {
            boolean isConfirmed = Boolean.TRUE.equals(p.getIsConfirmed());
            boolean isOverdue = false;
            if (isConfirmed) {
                totalConfirmedAmount = totalConfirmedAmount.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
            } else {
                unconfirmedCount++;
                totalUnconfirmedAmount = totalUnconfirmedAmount.add(p.getAmount() != null ? p.getAmount() : BigDecimal.ZERO);
                if (p.getCreatedAt() != null) {
                    isOverdue = LocalDateTime.now().isAfter(p.getCreatedAt().plusMinutes(timeout));
                }
            }

            items.add(com.sales.dto.response.BankTransferItemResponse.builder()
                    .paymentId(p.getId())
                    .orderId(p.getOrder() != null ? p.getOrder().getId() : null)
                    .orderCode(p.getOrder() != null ? p.getOrder().getOrderNumber() : null)
                    .amount(p.getAmount())
                    .transactionCode(p.getTransactionCode())
                    .isConfirmed(isConfirmed)
                    .confirmedAt(p.getConfirmedAt())
                    .confirmedByUserId(p.getConfirmedByUser() != null ? p.getConfirmedByUser().getId() : null)
                    .confirmedByUsername(p.getConfirmedByUser() != null ? p.getConfirmedByUser().getUsername() : null)
                    .confirmedByFullName(p.getConfirmedByUser() != null ? p.getConfirmedByUser().getFullName() : null)
                    .confirmedByUserName(p.getConfirmedByUser() != null ? p.getConfirmedByUser().getFullName() : null)
                    .notes(p.getNotes())
                    .isTransferOverdue(isOverdue)
                    .createdAt(p.getCreatedAt())
                    .orderStatus(p.getOrder() != null ? p.getOrder().getStatus() : null)
                    .build());
        }

        return com.sales.dto.response.BankTransferReconciliationResponse.builder()
                .shiftId(shift.getId())
                .shiftCode(shift.getId())
                .totalTransactions(bankPayments.size())
                .totalConfirmedAmount(totalConfirmedAmount)
                .unconfirmedTransactionsCount(unconfirmedCount)
                .totalUnconfirmedAmount(totalUnconfirmedAmount)
                .transactions(items)
                .build();
    }

}

