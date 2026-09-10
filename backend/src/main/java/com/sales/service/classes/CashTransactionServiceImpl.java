package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.CashTransactionStatus;
import com.sales.constant.CashTransactionType;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CreateCashTransactionRequest;
import com.sales.dto.request.RejectCashExpenseRequest;
import com.sales.dto.response.CashTransactionResponse;
import com.sales.dto.response.ShiftCashSummaryResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.CashTransactionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CashTransactionServiceImpl implements CashTransactionService {

    private final CashTransactionRepository transactionRepository;
    private final CashTransactionCategoryRepository categoryRepository;
    private final ShiftRepository shiftRepository;
    private final ShiftHandoverRepository shiftHandoverRepository;
    private final OrderRepository orderRepository;
    private final BusinessHouseholdSettingsRepository householdSettingsRepository;
    private final UserRepository userRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

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

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "cash_transactions", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for cash transaction", e);
        }
    }

    public synchronized String generateTransactionCode(String householdId, CashTransactionType type) {
        String prefix = (type == CashTransactionType.INCOME) ? "PT" : "PC";
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        String codePrefix = prefix + "-" + datePart + "-";

        Optional<String> maxCodeOpt = transactionRepository.findMaxCodeByPrefix(householdId, codePrefix);
        int nextSeq = 1;
        if (maxCodeOpt.isPresent()) {
            String maxCode = maxCodeOpt.get();
            try {
                String seqStr = maxCode.substring(codePrefix.length());
                nextSeq = Integer.parseInt(seqStr) + 1;
            } catch (NumberFormatException ignored) {
                nextSeq = 1;
            }
        }
        String generatedCode = String.format("%s%04d", codePrefix, nextSeq);
        while (transactionRepository.existsByHouseholdIdAndCode(householdId, generatedCode)) {
            nextSeq++;
            generatedCode = String.format("%s%04d", codePrefix, nextSeq);
        }
        return generatedCode;
    }

    private Shift resolveActiveShift(User currentUser, BusinessHousehold household, String explicitShiftId) {
        if (explicitShiftId != null && !explicitShiftId.trim().isEmpty()) {
            Shift shift = shiftRepository.findById(explicitShiftId.trim())
                    .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));
            if (!shift.getHousehold().getId().equals(household.getId())) {
                throw new AppException(ErrorCode.SHIFT_PERMISSION_DENIED);
            }
            if (shift.getStatus() != ShiftStatus.OPEN) {
                throw new AppException(ErrorCode.CASH_TRANSACTION_SHIFT_NOT_OPEN);
            }
            return shift;
        }

        Optional<Shift> userShift = shiftRepository.findByUserIdAndStatus(currentUser.getId(), ShiftStatus.OPEN);
        if (userShift.isPresent()) {
            return userShift.get();
        }

        // If current user is owner (VT-01), check if there is an active shift in the household
        if (currentUser.getRole() != null && "VT-01".equals(currentUser.getRole().getCode())) {
            List<Shift> openShifts = shiftRepository.findByHouseholdIdOrderByOpenedAtDesc(household.getId())
                    .stream()
                    .filter(s -> s.getStatus() == ShiftStatus.OPEN)
                    .collect(Collectors.toList());
            if (!openShifts.isEmpty()) {
                return openShifts.get(0);
            }
        }

        throw new AppException(ErrorCode.CASH_TRANSACTION_SHIFT_NOT_OPEN);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CashTransactionResponse createTransaction(String currentUsername, CreateCashTransactionRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.CASH_TRANSACTION_AMOUNT_INVALID);
        }

        Shift shift = resolveActiveShift(currentUser, household, request.getShiftId());

        CashTransactionCategory category = null;
        if (request.getCategoryId() != null && !request.getCategoryId().trim().isEmpty()) {
            category = categoryRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getCategoryId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.CASH_CATEGORY_NOT_FOUND));
            if (category.getType() != request.getType()) {
                throw new AppException(ErrorCode.CASH_CATEGORY_TYPE_MISMATCH);
            }
        }

        // Determine approval status
        CashTransactionStatus status = CashTransactionStatus.APPROVED;
        if (request.getType() == CashTransactionType.EXPENSE) {
            boolean isOwner = currentUser.getRole() != null && "VT-01".equals(currentUser.getRole().getCode());
            if (!isOwner) {
                BusinessHouseholdSettings settings = householdSettingsRepository.findByHouseholdId(household.getId())
                        .orElse(null);
                BigDecimal threshold = settings != null && settings.getExpenseApprovalThreshold() != null
                        ? settings.getExpenseApprovalThreshold()
                        : new BigDecimal("500000.00");

                if (request.getAmount().compareTo(threshold) > 0) {
                    status = CashTransactionStatus.PENDING_APPROVAL;
                }
            }
        }

        String code = generateTransactionCode(household.getId(), request.getType());

        CashTransaction tx = CashTransaction.builder()
                .code(code)
                .household(household)
                .shift(shift)
                .category(category)
                .categoryName(request.getCategoryName().trim())
                .type(request.getType())
                .amount(request.getAmount().setScale(2, RoundingMode.HALF_UP))
                .personName(request.getPersonName() != null ? request.getPersonName().trim() : null)
                .notes(request.getNotes() != null ? request.getNotes().trim() : null)
                .status(status)
                .createdByUser(currentUser)
                .build();

        tx = transactionRepository.save(tx);

        Map<String, Object> logMap = new HashMap<>();
        logMap.put("code", tx.getCode());
        logMap.put("type", tx.getType().name());
        logMap.put("amount", tx.getAmount());
        logMap.put("status", tx.getStatus().name());
        logMap.put("shiftId", shift.getId());
        logActivity(household, currentUser, "CREATE_CASH_TRANSACTION", tx.getId(), null, logMap);

        log.info("Created cash transaction {} ({}) amount: {} status: {} by user: {}",
                tx.getCode(), tx.getType(), tx.getAmount(), tx.getStatus(), currentUser.getUsername());

        return mapToResponse(tx);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashTransactionResponse> getCurrentShiftTransactions(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Shift shift = resolveActiveShift(currentUser, household, null);
        return transactionRepository.findByShiftIdAndHouseholdIdOrderByCreatedAtDesc(shift.getId(), household.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CashTransactionResponse> getShiftTransactions(String currentUsername, String shiftId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));
        if (!shift.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.SHIFT_PERMISSION_DENIED);
        }

        return transactionRepository.findByShiftIdAndHouseholdIdOrderByCreatedAtDesc(shiftId, household.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ShiftCashSummaryResponse getShiftCashSummary(String currentUsername, String shiftId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Shift shift = shiftRepository.findById(shiftId)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));
        if (!shift.getHousehold().getId().equals(household.getId())) {
            throw new AppException(ErrorCode.SHIFT_PERMISSION_DENIED);
        }

        BigDecimal openingCash = shift.getOpeningCash() != null ? shift.getOpeningCash() : BigDecimal.ZERO;
        BigDecimal cashSales = orderRepository.sumCashSalesAmountByShiftId(shiftId);
        if (cashSales == null) {
            cashSales = BigDecimal.ZERO;
        }

        BigDecimal totalApprovedIncome = transactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                shiftId, CashTransactionType.INCOME, CashTransactionStatus.APPROVED);
        if (totalApprovedIncome == null) {
            totalApprovedIncome = BigDecimal.ZERO;
        }

        BigDecimal totalApprovedExpense = transactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                shiftId, CashTransactionType.EXPENSE, CashTransactionStatus.APPROVED);
        if (totalApprovedExpense == null) {
            totalApprovedExpense = BigDecimal.ZERO;
        }

        BigDecimal totalPendingExpense = transactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                shiftId, CashTransactionType.EXPENSE, CashTransactionStatus.PENDING_APPROVAL);
        if (totalPendingExpense == null) {
            totalPendingExpense = BigDecimal.ZERO;
        }

        int pendingCount = (int) transactionRepository.countByShiftIdAndStatus(shiftId, CashTransactionStatus.PENDING_APPROVAL);

        BigDecimal handoverDiff = BigDecimal.ZERO;
        if (shiftHandoverRepository != null) {
            List<ShiftHandover> prevHandovers = shiftHandoverRepository.findByShiftIdOrderByStageNumberAsc(shiftId);
            if (!prevHandovers.isEmpty()) {
                handoverDiff = prevHandovers.stream()
                        .map(ShiftHandover::getDifferenceAmount)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal netCashChange = totalApprovedIncome.subtract(totalApprovedExpense).setScale(2, RoundingMode.HALF_UP);
        BigDecimal currentExpectedCash = openingCash
                .add(cashSales)
                .add(totalApprovedIncome)
                .subtract(totalApprovedExpense)
                .add(handoverDiff)
                .setScale(2, RoundingMode.HALF_UP);

        return ShiftCashSummaryResponse.builder()
                .shiftId(shiftId)
                .openingCash(openingCash.setScale(2, RoundingMode.HALF_UP))
                .cashSales(cashSales.setScale(2, RoundingMode.HALF_UP))
                .totalApprovedIncome(totalApprovedIncome.setScale(2, RoundingMode.HALF_UP))
                .totalApprovedExpense(totalApprovedExpense.setScale(2, RoundingMode.HALF_UP))
                .netCashChange(netCashChange)
                .totalPendingExpense(totalPendingExpense.setScale(2, RoundingMode.HALF_UP))
                .pendingExpenseCount(pendingCount)
                .handoverDifference(handoverDiff.setScale(2, RoundingMode.HALF_UP))
                .currentExpectedCash(currentExpectedCash)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CashTransactionResponse getTransactionById(String currentUsername, String transactionId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        CashTransaction tx = transactionRepository.findByIdAndHouseholdId(transactionId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CASH_TRANSACTION_NOT_FOUND));

        return mapToResponse(tx);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CashTransactionResponse approveTransaction(String currentUsername, String transactionId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (currentUser.getRole() == null || !"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.CASH_TRANSACTION_APPROVAL_DENIED);
        }

        CashTransaction tx = transactionRepository.findByIdAndHouseholdId(transactionId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CASH_TRANSACTION_NOT_FOUND));

        if (tx.getStatus() != CashTransactionStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.CASH_TRANSACTION_NOT_PENDING);
        }

        Map<String, Object> oldMap = new HashMap<>();
        oldMap.put("status", tx.getStatus().name());

        tx.setStatus(CashTransactionStatus.APPROVED);
        tx.setApprovedByUser(currentUser);
        tx.setApprovedAt(LocalDateTime.now());

        tx = transactionRepository.save(tx);

        Map<String, Object> newMap = new HashMap<>();
        newMap.put("status", tx.getStatus().name());
        newMap.put("approvedBy", currentUser.getUsername());
        newMap.put("approvedAt", tx.getApprovedAt());
        logActivity(household, currentUser, "APPROVE_CASH_EXPENSE", tx.getId(), oldMap, newMap);

        log.info("Approved cash expense transaction {} amount: {} by owner: {}",
                tx.getCode(), tx.getAmount(), currentUser.getUsername());

        return mapToResponse(tx);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CashTransactionResponse rejectTransaction(String currentUsername, String transactionId, RejectCashExpenseRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (currentUser.getRole() == null || !"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.CASH_TRANSACTION_APPROVAL_DENIED);
        }

        CashTransaction tx = transactionRepository.findByIdAndHouseholdId(transactionId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CASH_TRANSACTION_NOT_FOUND));

        if (tx.getStatus() != CashTransactionStatus.PENDING_APPROVAL) {
            throw new AppException(ErrorCode.CASH_TRANSACTION_NOT_PENDING);
        }

        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new AppException(ErrorCode.CASH_TRANSACTION_REJECTION_REASON_REQUIRED);
        }

        Map<String, Object> oldMap = new HashMap<>();
        oldMap.put("status", tx.getStatus().name());

        tx.setStatus(CashTransactionStatus.REJECTED);
        tx.setRejectionReason(request.getReason().trim());
        tx.setApprovedByUser(currentUser);
        tx.setApprovedAt(LocalDateTime.now());

        tx = transactionRepository.save(tx);

        Map<String, Object> newMap = new HashMap<>();
        newMap.put("status", tx.getStatus().name());
        newMap.put("rejectionReason", tx.getRejectionReason());
        newMap.put("rejectedBy", currentUser.getUsername());
        logActivity(household, currentUser, "REJECT_CASH_EXPENSE", tx.getId(), oldMap, newMap);

        log.info("Rejected cash expense transaction {} amount: {} reason: {} by owner: {}",
                tx.getCode(), tx.getAmount(), tx.getRejectionReason(), currentUser.getUsername());

        return mapToResponse(tx);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void updateExpenseThreshold(String currentUsername, BigDecimal threshold) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (currentUser.getRole() == null || !"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (threshold == null || threshold.compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.EXPENSE_THRESHOLD_INVALID);
        }

        BusinessHouseholdSettings settings = householdSettingsRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> BusinessHouseholdSettings.builder()
                        .household(household)
                        .build());

        BigDecimal oldThreshold = settings.getExpenseApprovalThreshold();
        settings.setExpenseApprovalThreshold(threshold.setScale(2, RoundingMode.HALF_UP));
        householdSettingsRepository.save(settings);

        logActivity(household, currentUser, "UPDATE_EXPENSE_THRESHOLD", household.getId(), oldThreshold, threshold);
        log.info("Updated expense approval threshold for household {} from {} to {}",
                household.getId(), oldThreshold, threshold);
    }

    private CashTransactionResponse mapToResponse(CashTransaction tx) {
        return CashTransactionResponse.builder()
                .id(tx.getId())
                .code(tx.getCode())
                .shiftId(tx.getShift().getId())
                .categoryId(tx.getCategory() != null ? tx.getCategory().getId() : null)
                .categoryName(tx.getCategoryName())
                .type(tx.getType())
                .amount(tx.getAmount())
                .personName(tx.getPersonName())
                .notes(tx.getNotes())
                .status(tx.getStatus())
                .createdByUserId(tx.getCreatedByUser().getId())
                .createdByUsername(tx.getCreatedByUser().getUsername())
                .createdByFullName(tx.getCreatedByUser().getFullName())
                .approvedByUserId(tx.getApprovedByUser() != null ? tx.getApprovedByUser().getId() : null)
                .approvedByFullName(tx.getApprovedByUser() != null ? tx.getApprovedByUser().getFullName() : null)
                .approvedAt(tx.getApprovedAt())
                .rejectionReason(tx.getRejectionReason())
                .createdAt(tx.getCreatedAt())
                .updatedAt(tx.getUpdatedAt())
                .build();
    }
}
