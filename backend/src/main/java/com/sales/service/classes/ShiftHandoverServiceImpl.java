package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.ShiftHandoverRequest;
import com.sales.dto.response.*;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Order;
import com.sales.entity.Shift;
import com.sales.entity.ShiftHandover;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.OrderRepository;
import com.sales.repository.ShiftHandoverRepository;
import com.sales.repository.ShiftRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.ShiftHandoverService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ShiftHandoverServiceImpl implements ShiftHandoverService {

    private final ShiftRepository shiftRepository;
    private final ShiftHandoverRepository shiftHandoverRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;
    private final com.sales.repository.CashTransactionRepository cashTransactionRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public ShiftHandoverServiceImpl(ShiftRepository shiftRepository,
                                   ShiftHandoverRepository shiftHandoverRepository,
                                   UserRepository userRepository,
                                   OrderRepository orderRepository,
                                   PasswordEncoder passwordEncoder,
                                   ActivityLogHelper activityLogHelper,
                                   ObjectMapper objectMapper,
                                   com.sales.repository.CashTransactionRepository cashTransactionRepository) {
        this.shiftRepository = shiftRepository;
        this.shiftHandoverRepository = shiftHandoverRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.passwordEncoder = passwordEncoder;
        this.activityLogHelper = activityLogHelper;
        this.objectMapper = objectMapper;
        this.cashTransactionRepository = cashTransactionRepository;
    }

    public ShiftHandoverServiceImpl(ShiftRepository shiftRepository,
                                   ShiftHandoverRepository shiftHandoverRepository,
                                   UserRepository userRepository,
                                   OrderRepository orderRepository,
                                   PasswordEncoder passwordEncoder,
                                   ActivityLogHelper activityLogHelper,
                                   ObjectMapper objectMapper) {
        this(shiftRepository, shiftHandoverRepository, userRepository, orderRepository, passwordEncoder, activityLogHelper, objectMapper, null);
    }

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getDeletedAt() == null)
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
            log.error("Failed to write activity log for shift handover", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ShiftHandoverSummaryResponse getHandoverSummary(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Shift shift = shiftRepository.findByUserIdAndStatus(currentUser.getId(), ShiftStatus.OPEN)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));

        Optional<ShiftHandover> lastHandoverOpt = shiftHandoverRepository.findTopByShiftIdOrderByStageNumberDesc(shift.getId());

        LocalDateTime stageStartTime;
        BigDecimal stageOpeningCash;
        int currentStage;

        if (lastHandoverOpt.isPresent()) {
            ShiftHandover lastHandover = lastHandoverOpt.get();
            stageStartTime = lastHandover.getHandoverTime();
            stageOpeningCash = lastHandover.getActualCash();
            currentStage = lastHandover.getStageNumber() + 1;
        } else {
            stageStartTime = shift.getOpenedAt();
            stageOpeningCash = shift.getOpeningCash();
            currentStage = 1;
        }

        LocalDateTime now = LocalDateTime.now();
        BigDecimal cashRevenue = orderRepository.sumCashSalesAmountByShiftIdAndTimeRange(shift.getId(), stageStartTime, now);
        if (cashRevenue == null) {
            cashRevenue = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal stageIncome = BigDecimal.ZERO;
        BigDecimal stageExpense = BigDecimal.ZERO;
        int pendingExpenseCount = 0;
        BigDecimal totalPendingExpense = BigDecimal.ZERO;
        if (cashTransactionRepository != null) {
            BigDecimal inc = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatusAndTimeRange(
                    shift.getId(), com.sales.constant.CashTransactionType.INCOME, com.sales.constant.CashTransactionStatus.APPROVED, stageStartTime, now);
            stageIncome = inc != null ? inc : BigDecimal.ZERO;
            BigDecimal exp = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatusAndTimeRange(
                    shift.getId(), com.sales.constant.CashTransactionType.EXPENSE, com.sales.constant.CashTransactionStatus.APPROVED, stageStartTime, now);
            stageExpense = exp != null ? exp : BigDecimal.ZERO;
            pendingExpenseCount = (int) cashTransactionRepository.countByShiftIdAndStatus(
                    shift.getId(), com.sales.constant.CashTransactionStatus.PENDING_APPROVAL);
            totalPendingExpense = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                    shift.getId(), com.sales.constant.CashTransactionType.EXPENSE, com.sales.constant.CashTransactionStatus.PENDING_APPROVAL);
            if (totalPendingExpense == null) {
                totalPendingExpense = BigDecimal.ZERO;
            }
        }

        BigDecimal expectedCash = stageOpeningCash.add(cashRevenue).add(stageIncome).subtract(stageExpense).setScale(2, RoundingMode.HALF_UP);

        int completedOrdersCount = orderRepository.countCompletedOrdersByShiftIdAndTimeRange(shift.getId(), stageStartTime, now);

        List<Order> pendingOrders = orderRepository.findByHouseholdIdAndShiftIdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                household.getId(), shift.getId(), "CREATING");

        List<PendingOrderSummaryResponse> pendingOrderResponses = pendingOrders.stream()
                .map(o -> PendingOrderSummaryResponse.builder()
                        .orderId(o.getId())
                        .orderNumber(o.getOrderNumber())
                        .orderLabel(o.getOrderLabel())
                        .tableName(o.getDiningTable() != null ? o.getDiningTable().getName() : null)
                        .finalAmount(o.getFinalAmount())
                        .createdAt(o.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        List<User> householdUsers = userRepository.findByHouseholdIdAndDeletedAtIsNull(household.getId());
        Set<String> openShiftUserIds = new HashSet<>(shiftRepository.findOpenShiftUserIdsByHouseholdId(household.getId()));
        List<EligibleRecipientResponse> eligibleRecipients = householdUsers.stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .filter(u -> u.getRole() != null && ("VT-01".equals(u.getRole().getCode()) || "VT-02".equals(u.getRole().getCode())))
                .map(u -> {
                    boolean hasOpen = openShiftUserIds.contains(u.getId());
                    return EligibleRecipientResponse.builder()
                            .userId(u.getId())
                            .username(u.getUsername())
                            .fullName(u.getFullName())
                            .roleCode(u.getRole().getCode())
                            .roleName(u.getRole().getName())
                            .hasOpenShift(hasOpen)
                            .build();
                })
                .collect(Collectors.toList());

        return ShiftHandoverSummaryResponse.builder()
                .shiftId(shift.getId())
                .currentStage(currentStage)
                .senderUserId(currentUser.getId())
                .senderUsername(currentUser.getUsername())
                .senderFullName(currentUser.getFullName())
                .posName(shift.getPointOfSale() != null ? shift.getPointOfSale().getName() : null)
                .posCode(shift.getPointOfSale() != null ? shift.getPointOfSale().getPosCode() : null)
                .stageStartedAt(stageStartTime)
                .openingCash(stageOpeningCash)
                .cashRevenue(cashRevenue)
                .expectedCash(expectedCash)
                .completedOrdersCount(completedOrdersCount)
                .pendingOrdersCount(pendingOrders.size())
                .pendingExpenseCount(pendingExpenseCount)
                .totalPendingExpense(totalPendingExpense)
                .pendingOrders(pendingOrderResponses)
                .eligibleRecipients(eligibleRecipients)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ShiftHandoverResponse performShiftHandover(String currentUsername, ShiftHandoverRequest request) {
        log.info("Starting shift handover initiated by user: {}", currentUsername);

        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Shift shift;
        if (request.getShiftId() != null && !request.getShiftId().trim().isEmpty()) {
            shift = shiftRepository.findByIdWithLock(request.getShiftId())
                    .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));
        } else {
            Shift currentActive = shiftRepository.findByUserIdAndStatus(currentUser.getId(), ShiftStatus.OPEN)
                    .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));
            shift = shiftRepository.findByIdWithLock(currentActive.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));
        }

        if (shift.getStatus() != ShiftStatus.OPEN) {
            log.warn("Shift ID {} is not open", shift.getId());
            throw new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND);
        }

        if (!shift.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (!shift.getUser().getId().equals(currentUser.getId()) && !"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.SHIFT_PERMISSION_DENIED);
        }

        if (currentUser.getId().equals(request.getRecipientUserId())) {
            log.warn("User {} attempted to handover shift to self", currentUsername);
            throw new AppException(ErrorCode.CANNOT_HANDOVER_TO_SELF);
        }

        User recipientUser = userRepository.findById(request.getRecipientUserId())
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.RECIPIENT_NOT_FOUND));

        if (recipientUser.getHousehold() == null || !recipientUser.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.RECIPIENT_NOT_FOUND);
        }

        if (!Boolean.TRUE.equals(recipientUser.getIsActive())) {
            log.warn("Recipient user {} is inactive or locked", recipientUser.getUsername());
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        String recipientRole = recipientUser.getRole() != null ? recipientUser.getRole().getCode() : "";
        if (!"VT-01".equals(recipientRole) && !"VT-02".equals(recipientRole)) {
            log.warn("Recipient user {} has invalid role {}", recipientUser.getUsername(), recipientRole);
            throw new AppException(ErrorCode.RECIPIENT_NOT_AUTHORIZED_FOR_POS);
        }

        if (shiftRepository.existsByUserIdAndStatus(recipientUser.getId(), ShiftStatus.OPEN)) {
            log.warn("Recipient user {} already has an open shift", recipientUser.getUsername());
            throw new AppException(ErrorCode.RECIPIENT_ALREADY_HAS_OPEN_SHIFT);
        }

        if (request.getRecipientPassword() == null || request.getRecipientPassword().trim().isEmpty()) {
            throw new AppException(ErrorCode.RECIPIENT_AUTHENTICATION_FAILED);
        }

        if (!passwordEncoder.matches(request.getRecipientPassword(), recipientUser.getPasswordHash())) {
            log.warn("Authentication failed for recipient user {}", recipientUser.getUsername());
            throw new AppException(ErrorCode.RECIPIENT_AUTHENTICATION_FAILED);
        }

        if (request.getActualCash() == null || request.getActualCash().compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.INVALID_HANDOVER_CASH);
        }

        // NCL-03-CN-014: Kiểm tra còn khoản chi nào PENDING_APPROVAL không? Nếu còn -> chặn bàn giao ca
        if (cashTransactionRepository != null) {
            long pendingExpenses = cashTransactionRepository.countByShiftIdAndStatus(
                    shift.getId(), com.sales.constant.CashTransactionStatus.PENDING_APPROVAL);
            if (pendingExpenses > 0) {
                log.warn("Cannot handover shift ID: {} because it has {} pending approval expense(s).", shift.getId(), pendingExpenses);
                throw new AppException(ErrorCode.SHIFT_HAS_PENDING_EXPENSES);
            }
        }

        Optional<ShiftHandover> lastHandoverOpt = shiftHandoverRepository.findTopByShiftIdOrderByStageNumberDesc(shift.getId());

        LocalDateTime stageStartTime;
        BigDecimal stageOpeningCash;
        int stageNumber;

        if (lastHandoverOpt.isPresent()) {
            ShiftHandover lastHandover = lastHandoverOpt.get();
            stageStartTime = lastHandover.getHandoverTime();
            stageOpeningCash = lastHandover.getActualCash();
            stageNumber = lastHandover.getStageNumber() + 1;
        } else {
            stageStartTime = shift.getOpenedAt();
            stageOpeningCash = shift.getOpeningCash();
            stageNumber = 1;
        }

        LocalDateTime now = LocalDateTime.now();
        BigDecimal cashRevenue = orderRepository.sumCashSalesAmountByShiftIdAndTimeRange(shift.getId(), stageStartTime, now);
        if (cashRevenue == null) {
            cashRevenue = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal stageIncome = BigDecimal.ZERO;
        BigDecimal stageExpense = BigDecimal.ZERO;
        if (cashTransactionRepository != null) {
            BigDecimal inc = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatusAndTimeRange(
                    shift.getId(), com.sales.constant.CashTransactionType.INCOME, com.sales.constant.CashTransactionStatus.APPROVED, stageStartTime, now);
            stageIncome = inc != null ? inc : BigDecimal.ZERO;
            BigDecimal exp = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatusAndTimeRange(
                    shift.getId(), com.sales.constant.CashTransactionType.EXPENSE, com.sales.constant.CashTransactionStatus.APPROVED, stageStartTime, now);
            stageExpense = exp != null ? exp : BigDecimal.ZERO;
        }

        BigDecimal expectedCash = stageOpeningCash.add(cashRevenue).add(stageIncome).subtract(stageExpense).setScale(2, RoundingMode.HALF_UP);
        BigDecimal actualCash = request.getActualCash().setScale(2, RoundingMode.HALF_UP);
        BigDecimal differenceAmount = actualCash.subtract(expectedCash).setScale(2, RoundingMode.HALF_UP);

        if (differenceAmount.compareTo(BigDecimal.ZERO) != 0) {
            if (request.getDifferenceReason() == null || request.getDifferenceReason().trim().isEmpty()) {
                log.warn("Discrepancy {} detected in handover but reason is missing", differenceAmount);
                throw new AppException(ErrorCode.HANDOVER_DIFFERENCE_REASON_REQUIRED);
            }
        }

        int completedOrdersCount = orderRepository.countCompletedOrdersByShiftIdAndTimeRange(shift.getId(), stageStartTime, now);
        int pendingOrdersCount = orderRepository.countByShiftIdAndStatusAndDeletedAtIsNull(shift.getId(), "CREATING");

        ShiftHandover handover = ShiftHandover.builder()
                .shift(shift)
                .household(household)
                .senderUser(currentUser)
                .receiverUser(recipientUser)
                .handoverTime(now)
                .stageNumber(stageNumber)
                .openingCash(stageOpeningCash)
                .cashRevenue(cashRevenue)
                .expectedCash(expectedCash)
                .actualCash(actualCash)
                .differenceAmount(differenceAmount)
                .differenceReason(request.getDifferenceReason())
                .completedOrdersCount(completedOrdersCount)
                .pendingOrdersCount(pendingOrdersCount)
                .notes(request.getNotes())
                .build();

        handover = shiftHandoverRepository.save(handover);

        User oldShiftUser = shift.getUser();
        shift.setUser(recipientUser);
        shift = shiftRepository.save(shift);

        Map<String, Object> oldLogMap = new HashMap<>();
        oldLogMap.put("userId", oldShiftUser.getId());
        oldLogMap.put("username", oldShiftUser.getUsername());
        oldLogMap.put("stage", stageNumber);

        Map<String, Object> newLogMap = new HashMap<>();
        newLogMap.put("userId", recipientUser.getId());
        newLogMap.put("username", recipientUser.getUsername());
        newLogMap.put("handoverId", handover.getId());
        newLogMap.put("actualCash", actualCash);
        newLogMap.put("differenceAmount", differenceAmount);

        logActivity(household, currentUser, "SHIFT_HANDOVER", shift.getId(), oldLogMap, newLogMap);

        log.info("Shift ID {} handed over successfully from {} to {}. Discrepancy: {}",
                shift.getId(), currentUser.getUsername(), recipientUser.getUsername(), differenceAmount);

        return ShiftHandoverResponse.builder()
                .id(handover.getId())
                .shiftId(shift.getId())
                .stageNumber(handover.getStageNumber())
                .senderUserId(currentUser.getId())
                .senderUsername(currentUser.getUsername())
                .senderFullName(currentUser.getFullName())
                .receiverUserId(recipientUser.getId())
                .receiverUsername(recipientUser.getUsername())
                .receiverFullName(recipientUser.getFullName())
                .handoverTime(handover.getHandoverTime())
                .openingCash(handover.getOpeningCash())
                .cashRevenue(handover.getCashRevenue())
                .expectedCash(handover.getExpectedCash())
                .actualCash(handover.getActualCash())
                .differenceAmount(handover.getDifferenceAmount())
                .differenceReason(handover.getDifferenceReason())
                .completedOrdersCount(handover.getCompletedOrdersCount())
                .pendingOrdersCount(handover.getPendingOrdersCount())
                .notes(handover.getNotes())
                .createdAt(handover.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ShiftHandoverResponse> getHandoversByShiftId(String currentUsername, String shiftId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));

        if (!shift.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<ShiftHandover> handovers = shiftHandoverRepository.findByShiftIdOrderByStageNumberAsc(shiftId);

        return handovers.stream()
                .map(h -> ShiftHandoverResponse.builder()
                        .id(h.getId())
                        .shiftId(shift.getId())
                        .stageNumber(h.getStageNumber())
                        .senderUserId(h.getSenderUser().getId())
                        .senderUsername(h.getSenderUser().getUsername())
                        .senderFullName(h.getSenderUser().getFullName())
                        .receiverUserId(h.getReceiverUser().getId())
                        .receiverUsername(h.getReceiverUser().getUsername())
                        .receiverFullName(h.getReceiverUser().getFullName())
                        .handoverTime(h.getHandoverTime())
                        .openingCash(h.getOpeningCash())
                        .cashRevenue(h.getCashRevenue())
                        .expectedCash(h.getExpectedCash())
                        .actualCash(h.getActualCash())
                        .differenceAmount(h.getDifferenceAmount())
                        .differenceReason(h.getDifferenceReason())
                        .completedOrdersCount(h.getCompletedOrdersCount())
                        .pendingOrdersCount(h.getPendingOrdersCount())
                        .notes(h.getNotes())
                        .createdAt(h.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShiftStagesSummaryResponse getShiftStagesSummary(String currentUsername, String shiftId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();

        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));

        if (!shift.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<ShiftHandover> handovers = shiftHandoverRepository.findByShiftIdOrderByStageNumberAsc(shiftId);

        List<ShiftStageDetailResponse> stageDetails = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        BigDecimal totalDifference = BigDecimal.ZERO;

        LocalDateTime prevEndTime = shift.getOpenedAt();

        for (ShiftHandover ho : handovers) {
            stageDetails.add(ShiftStageDetailResponse.builder()
                    .stageNumber(ho.getStageNumber())
                    .stageType("HANDOVER")
                    .cashierUserId(ho.getSenderUser().getId())
                    .cashierUsername(ho.getSenderUser().getUsername())
                    .cashierFullName(ho.getSenderUser().getFullName())
                    .startTime(prevEndTime)
                    .endTime(ho.getHandoverTime())
                    .stageOpeningCash(ho.getOpeningCash())
                    .stageCashRevenue(ho.getCashRevenue())
                    .stageExpectedCash(ho.getExpectedCash())
                    .stageActualCash(ho.getActualCash())
                    .stageDifferenceAmount(ho.getDifferenceAmount())
                    .stageDifferenceReason(ho.getDifferenceReason())
                    .completedOrdersCount(ho.getCompletedOrdersCount())
                    .receiverFullName(ho.getReceiverUser().getFullName())
                    .build());

            totalRevenue = totalRevenue.add(ho.getCashRevenue());
            totalDifference = totalDifference.add(ho.getDifferenceAmount());
            prevEndTime = ho.getHandoverTime();
        }

        if (shift.getStatus() == ShiftStatus.CLOSED && shift.getClosedAt() != null) {
            int finalStageNumber = handovers.size() + 1;
            BigDecimal finalOpening = handovers.isEmpty() ? shift.getOpeningCash()
                    : handovers.get(handovers.size() - 1).getActualCash();

            BigDecimal finalRevenue = orderRepository.sumCashSalesAmountByShiftIdAndTimeRange(
                    shift.getId(), prevEndTime, shift.getClosedAt());
            if (finalRevenue == null) {
                finalRevenue = BigDecimal.ZERO;
            }

            BigDecimal finalIncome = BigDecimal.ZERO;
            BigDecimal finalExpense = BigDecimal.ZERO;
            if (cashTransactionRepository != null) {
                BigDecimal inc = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatusAndTimeRange(
                        shift.getId(), com.sales.constant.CashTransactionType.INCOME, com.sales.constant.CashTransactionStatus.APPROVED, prevEndTime, shift.getClosedAt());
                if (inc != null) {
                    finalIncome = inc;
                }
                BigDecimal exp = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatusAndTimeRange(
                        shift.getId(), com.sales.constant.CashTransactionType.EXPENSE, com.sales.constant.CashTransactionStatus.APPROVED, prevEndTime, shift.getClosedAt());
                if (exp != null) {
                    finalExpense = exp;
                }
            }

            BigDecimal finalExpected = finalOpening.add(finalRevenue).add(finalIncome).subtract(finalExpense);
            BigDecimal finalActual = shift.getClosingCashActual() != null ? shift.getClosingCashActual() : finalExpected;
            BigDecimal finalDiff = finalActual.subtract(finalExpected);

            int finalCompletedOrders = orderRepository.countCompletedOrdersByShiftIdAndTimeRange(
                    shift.getId(), prevEndTime, shift.getClosedAt());

            stageDetails.add(ShiftStageDetailResponse.builder()
                    .stageNumber(finalStageNumber)
                    .stageType("FINAL_CLOSE")
                    .cashierUserId(shift.getUser().getId())
                    .cashierUsername(shift.getUser().getUsername())
                    .cashierFullName(shift.getUser().getFullName())
                    .startTime(prevEndTime)
                    .endTime(shift.getClosedAt())
                    .stageOpeningCash(finalOpening)
                    .stageCashRevenue(finalRevenue)
                    .stageExpectedCash(finalExpected)
                    .stageActualCash(finalActual)
                    .stageDifferenceAmount(finalDiff)
                    .stageDifferenceReason(shift.getDifferenceReason())
                    .completedOrdersCount(finalCompletedOrders)
                    .receiverFullName(null)
                    .build());

            totalRevenue = totalRevenue.add(finalRevenue);
            totalDifference = totalDifference.add(finalDiff);
        } else if (shift.getStatus() == ShiftStatus.OPEN) {
            int currentStageNumber = handovers.size() + 1;
            BigDecimal currentOpening = handovers.isEmpty() ? shift.getOpeningCash()
                    : handovers.get(handovers.size() - 1).getActualCash();

            LocalDateTime now = LocalDateTime.now();
            BigDecimal currentRevenue = orderRepository.sumCashSalesAmountByShiftIdAndTimeRange(
                    shift.getId(), prevEndTime, now);
            if (currentRevenue == null) {
                currentRevenue = BigDecimal.ZERO;
            }

            BigDecimal currentIncome = BigDecimal.ZERO;
            BigDecimal currentExpense = BigDecimal.ZERO;
            if (cashTransactionRepository != null) {
                BigDecimal inc = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatusAndTimeRange(
                        shift.getId(), com.sales.constant.CashTransactionType.INCOME, com.sales.constant.CashTransactionStatus.APPROVED, prevEndTime, now);
                if (inc != null) {
                    currentIncome = inc;
                }
                BigDecimal exp = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatusAndTimeRange(
                        shift.getId(), com.sales.constant.CashTransactionType.EXPENSE, com.sales.constant.CashTransactionStatus.APPROVED, prevEndTime, now);
                if (exp != null) {
                    currentExpense = exp;
                }
            }

            BigDecimal currentExpected = currentOpening.add(currentRevenue).add(currentIncome).subtract(currentExpense);
            int currentCompletedOrders = orderRepository.countCompletedOrdersByShiftIdAndTimeRange(
                    shift.getId(), prevEndTime, now);

            stageDetails.add(ShiftStageDetailResponse.builder()
                    .stageNumber(currentStageNumber)
                    .stageType("CURRENT")
                    .cashierUserId(shift.getUser().getId())
                    .cashierUsername(shift.getUser().getUsername())
                    .cashierFullName(shift.getUser().getFullName())
                    .startTime(prevEndTime)
                    .endTime(now)
                    .stageOpeningCash(currentOpening)
                    .stageCashRevenue(currentRevenue)
                    .stageExpectedCash(currentExpected)
                    .stageActualCash(currentExpected)
                    .stageDifferenceAmount(BigDecimal.ZERO)
                    .stageDifferenceReason(null)
                    .completedOrdersCount(currentCompletedOrders)
                    .receiverFullName(null)
                    .build());

            totalRevenue = totalRevenue.add(currentRevenue);
        }

        return ShiftStagesSummaryResponse.builder()
                .shiftId(shift.getId())
                .shiftStatus(shift.getStatus().name())
                .openedAt(shift.getOpenedAt())
                .closedAt(shift.getClosedAt())
                .shiftOpeningCash(shift.getOpeningCash())
                .totalShiftRevenue(totalRevenue)
                .totalDifferenceAmount(totalDifference)
                .stages(stageDetails)
                .build();
    }
}
