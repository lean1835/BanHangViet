package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.DebtStatus;
import com.sales.constant.DebtType;
import com.sales.constant.ReconciliationStatus;
import com.sales.constant.RoleCode;
import com.sales.dto.request.ConfirmDebtReconciliationRequest;
import com.sales.dto.request.CreateDebtAdjustmentRequest;
import com.sales.dto.request.CreateDebtReconciliationRequest;
import com.sales.dto.request.DebtReconciliationPreviewRequest;
import com.sales.dto.response.CustomerDebtResponse;
import com.sales.dto.response.DebtReconciliationItemResponse;
import com.sales.dto.response.DebtReconciliationResponse;
import com.sales.dto.response.DebtStatementPrintResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.CustomerDebtReconciliationService;
import com.sales.utils.VietnameseNumberToWordsUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
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
public class CustomerDebtReconciliationServiceImpl implements CustomerDebtReconciliationService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final CustomerDebtReconciliationRepository reconciliationRepository;
    private final CustomerDebtReconciliationItemRepository reconciliationItemRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkOwnerRole(User user) {
        if (user.getRole() == null) {
            throw new AppException(ErrorCode.ONLY_STORE_OWNER_CAN_RECONCILE);
        }
        String code = user.getRole().getCode();
        String name = user.getRole().getName();
        if (!RoleCode.VT_01.getCode().equals(code) && !RoleCode.VT_01.getCode().equals(name)) {
            throw new AppException(ErrorCode.ONLY_STORE_OWNER_CAN_RECONCILE);
        }
    }

    private void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null || startDate.isAfter(endDate)) {
            throw new AppException(ErrorCode.DEBT_RECONCILIATION_INVALID_DATE_RANGE);
        }
        if (endDate.isAfter(LocalDate.now())) {
            throw new AppException(ErrorCode.DEBT_RECONCILIATION_FUTURE_DATE);
        }
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(
                    household, actor, action, "customer_debt_reconciliations", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Lỗi khi ghi activity log đối chiếu công nợ", e);
        }
    }

    private String generateReconciliationCode(String householdId) {
        String datePrefix = "DREC-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd")) + "-";
        long countToday = reconciliationRepository.countByHouseholdIdAndCodeStartingWith(householdId, datePrefix);
        return datePrefix + String.format("%04d", countToday + 1);
    }

    private BigDecimal calculateOpeningDebtBalance(String customerId, String householdId, LocalDate startDate) {
        LocalDateTime startDateTime = startDate.atStartOfDay();

        BigDecimal openingIncurred = customerDebtRepository.sumAmountByCustomerAndTypeBefore(
                customerId, householdId, DebtType.DEBT_CREATED, startDateTime);
        if (openingIncurred == null) {
            openingIncurred = BigDecimal.ZERO;
        }

        BigDecimal openingPaid = customerDebtRepository.sumAmountByCustomerAndTypeBefore(
                customerId, householdId, DebtType.DEBT_PAID, startDateTime);
        if (openingPaid == null) {
            openingPaid = BigDecimal.ZERO;
        }

        return openingIncurred.subtract(openingPaid).setScale(2, RoundingMode.HALF_UP);
    }

    private CalculationResult calculatePeriodTransactions(
            BigDecimal openingDebtBalance,
            List<CustomerDebt> periodDebts) {

        BigDecimal totalIncurred = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal currentRunningBalance = openingDebtBalance;

        List<CustomerDebtReconciliationItem> items = new ArrayList<>();

        for (CustomerDebt debt : periodDebts) {
            BigDecimal amount = debt.getAmount() != null ? debt.getAmount().setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            String refCode = null;

            if (DebtType.DEBT_CREATED.equals(debt.getType())) {
                totalIncurred = totalIncurred.add(amount);
                currentRunningBalance = currentRunningBalance.add(amount);
                refCode = debt.getOrder() != null && debt.getOrder().getOrderNumber() != null 
                        ? debt.getOrder().getOrderNumber() : "DON-NO";
            } else if (DebtType.DEBT_PAID.equals(debt.getType())) {
                totalPaid = totalPaid.add(amount);
                currentRunningBalance = currentRunningBalance.subtract(amount);
                refCode = "PHIEU-THU";
            }

            CustomerDebtReconciliationItem item = CustomerDebtReconciliationItem.builder()
                    .customerDebt(debt)
                    .transactionDate(debt.getCreatedAt())
                    .type(debt.getType())
                    .referenceCode(refCode)
                    .amount(amount)
                    .runningBalance(currentRunningBalance)
                    .notes(debt.getNotes())
                    .build();
            items.add(item);
        }

        BigDecimal closingDebtBalance = openingDebtBalance.add(totalIncurred).subtract(totalPaid)
                .setScale(2, RoundingMode.HALF_UP);

        String closingDebtInWords = VietnameseNumberToWordsUtil.convert(closingDebtBalance);

        return CalculationResult.builder()
                .openingDebtBalance(openingDebtBalance)
                .totalDebtIncurred(totalIncurred)
                .totalDebtPaid(totalPaid)
                .closingDebtBalance(closingDebtBalance)
                .closingDebtInWords(closingDebtInWords)
                .items(items)
                .hasTransactions(!items.isEmpty())
                .build();
    }

    private String resolveTypeDescription(String type, String notes) {
        if (DebtType.DEBT_CREATED.equals(type)) {
            return "Mua hàng ghi nợ";
        }
        if (DebtType.DEBT_PAID.equals(type)) {
            if (notes != null && notes.toLowerCase().contains("trả hàng")) {
                return "Giảm trừ trả hàng";
            }
            return "Khách trả nợ";
        }
        return type;
    }

    private DebtReconciliationItemResponse mapItemToResponse(CustomerDebtReconciliationItem item) {
        return DebtReconciliationItemResponse.builder()
                .id(item.getId())
                .transactionDate(item.getTransactionDate())
                .type(item.getType())
                .typeDescription(resolveTypeDescription(item.getType(), item.getNotes()))
                .referenceCode(item.getReferenceCode())
                .debtId(item.getCustomerDebt() != null ? item.getCustomerDebt().getId() : null)
                .amount(item.getAmount())
                .runningBalance(item.getRunningBalance())
                .notes(item.getNotes())
                .build();
    }

    private DebtReconciliationResponse mapToResponse(CustomerDebtReconciliation reconciliation) {
        List<DebtReconciliationItemResponse> itemResponses = reconciliation.getItems() != null
                ? reconciliation.getItems().stream().map(this::mapItemToResponse).collect(Collectors.toList())
                : Collections.emptyList();

        return DebtReconciliationResponse.builder()
                .id(reconciliation.getId())
                .code(reconciliation.getCode())
                .householdId(reconciliation.getHousehold() != null ? reconciliation.getHousehold().getId() : null)
                .householdName(reconciliation.getHousehold() != null ? reconciliation.getHousehold().getName() : null)
                .customerId(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getId() : null)
                .customerName(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getName() : null)
                .customerPhone(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getPhoneNumber() : null)
                .customerAddress(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getAddress() : null)
                .customerTaxCode(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getTaxCode() : null)
                .creditLimit(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getCreditLimit() : null)
                .startDate(reconciliation.getStartDate())
                .endDate(reconciliation.getEndDate())
                .openingDebtBalance(reconciliation.getOpeningDebtBalance())
                .totalDebtIncurred(reconciliation.getTotalDebtIncurred())
                .totalDebtPaid(reconciliation.getTotalDebtPaid())
                .closingDebtBalance(reconciliation.getClosingDebtBalance())
                .closingDebtInWords(reconciliation.getClosingDebtInWords())
                .status(reconciliation.getStatus())
                .hasTransactions(!itemResponses.isEmpty())
                .notes(reconciliation.getNotes())
                .reconciledToDate(reconciliation.getReconciledToDate())
                .confirmedAt(reconciliation.getConfirmedAt())
                .confirmedByUsername(reconciliation.getConfirmedByUser() != null ? reconciliation.getConfirmedByUser().getUsername() : null)
                .createdByUsername(reconciliation.getCreatedByUser() != null ? reconciliation.getCreatedByUser().getUsername() : null)
                .createdAt(reconciliation.getCreatedAt())
                .items(itemResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DebtReconciliationResponse previewReconciliation(String currentUsername, DebtReconciliationPreviewRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        validateDateRange(request.getStartDate(), request.getEndDate());

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(
                request.getCustomerId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        BigDecimal openingDebtBalance = calculateOpeningDebtBalance(customer.getId(), household.getId(), request.getStartDate());

        LocalDateTime startDateTime = request.getStartDate().atStartOfDay();
        LocalDateTime endDateTimeExclusive = request.getEndDate().plusDays(1).atStartOfDay();
        List<CustomerDebt> periodDebts = customerDebtRepository.findPeriodDebts(
                customer.getId(), household.getId(), startDateTime, endDateTimeExclusive);

        CalculationResult calc = calculatePeriodTransactions(openingDebtBalance, periodDebts);

        List<DebtReconciliationItemResponse> itemResponses = calc.getItems().stream()
                .map(this::mapItemToResponse)
                .collect(Collectors.toList());

        return DebtReconciliationResponse.builder()
                .id(null)
                .code(null)
                .householdId(household.getId())
                .householdName(household.getName())
                .customerId(customer.getId())
                .customerName(customer.getName())
                .customerPhone(customer.getPhoneNumber())
                .customerAddress(customer.getAddress())
                .customerTaxCode(customer.getTaxCode())
                .creditLimit(customer.getCreditLimit())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .openingDebtBalance(calc.getOpeningDebtBalance())
                .totalDebtIncurred(calc.getTotalDebtIncurred())
                .totalDebtPaid(calc.getTotalDebtPaid())
                .closingDebtBalance(calc.getClosingDebtBalance())
                .closingDebtInWords(calc.getClosingDebtInWords())
                .status(ReconciliationStatus.DRAFT)
                .hasTransactions(calc.isHasTransactions())
                .notes(null)
                .reconciledToDate(null)
                .confirmedAt(null)
                .confirmedByUsername(null)
                .createdByUsername(currentUser.getUsername())
                .createdAt(LocalDateTime.now())
                .items(itemResponses)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DebtReconciliationResponse createReconciliation(String currentUsername, CreateDebtReconciliationRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        checkOwnerRole(currentUser);
        validateDateRange(request.getStartDate(), request.getEndDate());

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                request.getCustomerId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        if (customer.getLastReconciledDate() != null && !request.getStartDate().isAfter(customer.getLastReconciledDate())) {
            throw new AppException(ErrorCode.DEBT_RECONCILIATION_PERIOD_BEFORE_LAST_LOCK);
        }

        boolean hasOverlappingConfirmed = reconciliationRepository.existsOverlappingConfirmedReconciliation(
                household.getId(), customer.getId(), request.getStartDate(), request.getEndDate());
        if (hasOverlappingConfirmed) {
            throw new AppException(ErrorCode.DEBT_RECONCILIATION_OVERLAPPING_CONFIRMED);
        }

        BigDecimal openingDebtBalance = calculateOpeningDebtBalance(customer.getId(), household.getId(), request.getStartDate());

        LocalDateTime startDateTime = request.getStartDate().atStartOfDay();
        LocalDateTime endDateTimeExclusive = request.getEndDate().plusDays(1).atStartOfDay();
        List<CustomerDebt> periodDebts = customerDebtRepository.findPeriodDebts(
                customer.getId(), household.getId(), startDateTime, endDateTimeExclusive);

        CalculationResult calc = calculatePeriodTransactions(openingDebtBalance, periodDebts);

        boolean confirmNow = Boolean.TRUE.equals(request.getConfirmNow());
        String code = generateReconciliationCode(household.getId());

        CustomerDebtReconciliation reconciliation = CustomerDebtReconciliation.builder()
                .code(code)
                .household(household)
                .customer(customer)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .openingDebtBalance(calc.getOpeningDebtBalance())
                .totalDebtIncurred(calc.getTotalDebtIncurred())
                .totalDebtPaid(calc.getTotalDebtPaid())
                .closingDebtBalance(calc.getClosingDebtBalance())
                .closingDebtInWords(calc.getClosingDebtInWords())
                .status(confirmNow ? ReconciliationStatus.CONFIRMED : ReconciliationStatus.DRAFT)
                .notes(request.getNotes())
                .confirmedAt(confirmNow ? LocalDateTime.now() : null)
                .confirmedByUser(confirmNow ? currentUser : null)
                .reconciledToDate(confirmNow ? request.getEndDate() : null)
                .createdByUser(currentUser)
                .build();

        for (CustomerDebtReconciliationItem item : calc.getItems()) {
            item.setReconciliation(reconciliation);
            reconciliation.getItems().add(item);
        }

        CustomerDebtReconciliation savedRec = reconciliationRepository.save(reconciliation);

        if (confirmNow) {
            applyLockingToCustomerDebts(customer, savedRec, household.getId(), endDateTimeExclusive, request.getEndDate());
        }

        logActivity(household, currentUser, confirmNow ? "CREATE_AND_CONFIRM_DEBT_RECONCILIATION" : "CREATE_DRAFT_DEBT_RECONCILIATION",
                savedRec.getId(), null, Map.of("code", code, "status", savedRec.getStatus(), "closingDebt", savedRec.getClosingDebtBalance()));

        return mapToResponse(savedRec);
    }

    private void applyLockingToCustomerDebts(
            Customer customer,
            CustomerDebtReconciliation reconciliation,
            String householdId,
            LocalDateTime endDateTimeExclusive,
            LocalDate endDate) {

        List<CustomerDebt> debtsToLock = customerDebtRepository.findDebtsToLock(
                customer.getId(), householdId, endDateTimeExclusive);

        for (CustomerDebt debt : debtsToLock) {
            debt.setLocked(true);
            debt.setReconciliation(reconciliation);
        }

        if (!debtsToLock.isEmpty()) {
            customerDebtRepository.saveAll(debtsToLock);
        }

        customer.setLastReconciledDate(endDate);
        customer.setLastReconciliation(reconciliation);
        customerRepository.save(customer);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public DebtReconciliationResponse confirmReconciliation(String currentUsername, String id, ConfirmDebtReconciliationRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        checkOwnerRole(currentUser);

        CustomerDebtReconciliation reconciliation = reconciliationRepository.findWithDetailsByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DEBT_RECONCILIATION_NOT_FOUND));

        if (ReconciliationStatus.CONFIRMED.equals(reconciliation.getStatus())) {
            throw new AppException(ErrorCode.DEBT_RECONCILIATION_ALREADY_CONFIRMED);
        }
        if (ReconciliationStatus.CANCELLED.equals(reconciliation.getStatus())) {
            throw new AppException(ErrorCode.DEBT_RECONCILIATION_ALREADY_CANCELLED);
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                reconciliation.getCustomer().getId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        reconciliation.setStatus(ReconciliationStatus.CONFIRMED);
        reconciliation.setConfirmedAt(LocalDateTime.now());
        reconciliation.setConfirmedByUser(currentUser);
        reconciliation.setReconciledToDate(reconciliation.getEndDate());

        if (request != null && StringUtils.hasText(request.getNotes())) {
            String combinedNotes = StringUtils.hasText(reconciliation.getNotes())
                    ? reconciliation.getNotes() + "\n" + request.getNotes()
                    : request.getNotes();
            reconciliation.setNotes(combinedNotes);
        }

        CustomerDebtReconciliation savedRec = reconciliationRepository.save(reconciliation);

        LocalDateTime endDateTimeExclusive = reconciliation.getEndDate().plusDays(1).atStartOfDay();
        applyLockingToCustomerDebts(customer, savedRec, household.getId(), endDateTimeExclusive, reconciliation.getEndDate());

        logActivity(household, currentUser, "CONFIRM_DEBT_RECONCILIATION", savedRec.getId(),
                Map.of("status", ReconciliationStatus.DRAFT),
                Map.of("status", ReconciliationStatus.CONFIRMED, "reconciledToDate", savedRec.getReconciledToDate()));

        return mapToResponse(savedRec);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void cancelReconciliation(String currentUsername, String id) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        checkOwnerRole(currentUser);

        CustomerDebtReconciliation reconciliation = reconciliationRepository.findByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DEBT_RECONCILIATION_NOT_FOUND));

        if (ReconciliationStatus.CONFIRMED.equals(reconciliation.getStatus())) {
            throw new AppException(ErrorCode.DEBT_RECONCILIATION_ALREADY_CONFIRMED);
        }

        reconciliation.setStatus(ReconciliationStatus.CANCELLED);
        reconciliationRepository.save(reconciliation);

        logActivity(household, currentUser, "CANCEL_DEBT_RECONCILIATION", reconciliation.getId(),
                Map.of("status", ReconciliationStatus.DRAFT),
                Map.of("status", ReconciliationStatus.CANCELLED));
    }

    @Override
    @Transactional(readOnly = true)
    public DebtReconciliationResponse getReconciliationById(String currentUsername, String id) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        CustomerDebtReconciliation reconciliation = reconciliationRepository.findWithDetailsByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DEBT_RECONCILIATION_NOT_FOUND));

        return mapToResponse(reconciliation);
    }

    private DebtReconciliationResponse mapToSummaryResponse(CustomerDebtReconciliation reconciliation) {
        boolean hasTransactions = (reconciliation.getTotalDebtIncurred() != null && reconciliation.getTotalDebtIncurred().compareTo(BigDecimal.ZERO) != 0)
                || (reconciliation.getTotalDebtPaid() != null && reconciliation.getTotalDebtPaid().compareTo(BigDecimal.ZERO) != 0);

        return DebtReconciliationResponse.builder()
                .id(reconciliation.getId())
                .code(reconciliation.getCode())
                .householdId(reconciliation.getHousehold() != null ? reconciliation.getHousehold().getId() : null)
                .householdName(reconciliation.getHousehold() != null ? reconciliation.getHousehold().getName() : null)
                .customerId(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getId() : null)
                .customerName(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getName() : null)
                .customerPhone(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getPhoneNumber() : null)
                .customerAddress(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getAddress() : null)
                .customerTaxCode(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getTaxCode() : null)
                .creditLimit(reconciliation.getCustomer() != null ? reconciliation.getCustomer().getCreditLimit() : null)
                .startDate(reconciliation.getStartDate())
                .endDate(reconciliation.getEndDate())
                .openingDebtBalance(reconciliation.getOpeningDebtBalance())
                .totalDebtIncurred(reconciliation.getTotalDebtIncurred())
                .totalDebtPaid(reconciliation.getTotalDebtPaid())
                .closingDebtBalance(reconciliation.getClosingDebtBalance())
                .closingDebtInWords(reconciliation.getClosingDebtInWords())
                .status(reconciliation.getStatus())
                .hasTransactions(hasTransactions)
                .notes(reconciliation.getNotes())
                .reconciledToDate(reconciliation.getReconciledToDate())
                .confirmedAt(reconciliation.getConfirmedAt())
                .confirmedByUsername(reconciliation.getConfirmedByUser() != null ? reconciliation.getConfirmedByUser().getUsername() : null)
                .createdByUsername(reconciliation.getCreatedByUser() != null ? reconciliation.getCreatedByUser().getUsername() : null)
                .createdAt(reconciliation.getCreatedAt())
                .items(Collections.emptyList())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DebtReconciliationResponse> getReconciliations(
            String currentUsername,
            String customerId,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            Pageable pageable) {

        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Page<CustomerDebtReconciliation> page = reconciliationRepository.filterReconciliations(
                household.getId(), customerId, status, startDate, endDate, pageable);

        return page.map(this::mapToSummaryResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public DebtStatementPrintResponse getPrintStatement(String currentUsername, String id) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        CustomerDebtReconciliation reconciliation = reconciliationRepository.findWithDetailsByIdAndHouseholdId(id, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DEBT_RECONCILIATION_NOT_FOUND));

        Customer customer = reconciliation.getCustomer();

        List<DebtReconciliationItemResponse> itemResponses = reconciliation.getItems() != null
                ? reconciliation.getItems().stream().map(this::mapItemToResponse).collect(Collectors.toList())
                : Collections.emptyList();

        return DebtStatementPrintResponse.builder()
                .documentTitle("GIẤY ĐỐI CHIẾU VÀ XÁC NHẬN CÔNG NỢ")
                .reconciliationCode(reconciliation.getCode())
                .printedDate(LocalDate.now())
                .householdName(household.getName())
                .householdTaxCode(household.getTaxCode())
                .householdAddress(household.getAddress())
                .householdPhone(household.getPhoneNumber())
                .householdRepresentative(household.getRepresentativeName())
                .customerName(customer.getName())
                .customerPhone(customer.getPhoneNumber())
                .customerTaxCode(customer.getTaxCode())
                .customerAddress(customer.getAddress())
                .startDate(reconciliation.getStartDate())
                .endDate(reconciliation.getEndDate())
                .openingDebtBalance(reconciliation.getOpeningDebtBalance())
                .totalDebtIncurred(reconciliation.getTotalDebtIncurred())
                .totalDebtPaid(reconciliation.getTotalDebtPaid())
                .closingDebtBalance(reconciliation.getClosingDebtBalance())
                .closingDebtInWords(reconciliation.getClosingDebtInWords())
                .hasTransactions(!itemResponses.isEmpty())
                .notes(reconciliation.getNotes())
                .transactions(itemResponses)
                .sellerSignTitle("ĐẠI DIỆN BÊN BÁN\n(Ký, đóng dấu và ghi rõ họ tên)")
                .buyerSignTitle("ĐẠI DIỆN BÊN MUA\n(Ký, xác nhận nợ và ghi rõ họ tên)")
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerDebtResponse createDebtAdjustment(String currentUsername, CreateDebtAdjustmentRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        checkOwnerRole(currentUser);

        if (!StringUtils.hasText(request.getReason())) {
            throw new AppException(ErrorCode.DEBT_ADJUSTMENT_REASON_REQUIRED);
        }

        String adjType = request.getAdjustmentType() != null ? request.getAdjustmentType().trim().toUpperCase() : "";
        if (!"DEBT_INCREASE".equals(adjType) && !"DEBT_DECREASE".equals(adjType)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        boolean isIncrease = "DEBT_INCREASE".equals(adjType);

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                request.getCustomerId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        BigDecimal currentDebt = customer.getCurrentDebt() != null ? customer.getCurrentDebt() : BigDecimal.ZERO;
        BigDecimal adjustmentAmount = request.getAmount().setScale(2, RoundingMode.HALF_UP);

        if (isIncrease) {
            customer.setCurrentDebt(currentDebt.add(adjustmentAmount));
        } else {
            customer.setCurrentDebt(currentDebt.subtract(adjustmentAmount).max(BigDecimal.ZERO));
        }
        customerRepository.save(customer);

        // P0 Fix: Đồng bộ hóa remainingAmount của các khoản nợ mở khi điều chỉnh giảm nợ (DEBT_DECREASE)
        if (!isIncrease) {
            List<CustomerDebt> activeDebts = customerDebtRepository.findByCustomerIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
                    customer.getId(), household.getId(), List.of(DebtStatus.PENDING, DebtStatus.OVERDUE), DebtType.DEBT_CREATED);

            BigDecimal remainingOffset = adjustmentAmount;
            for (CustomerDebt debt : activeDebts) {
                if (remainingOffset.compareTo(BigDecimal.ZERO) <= 0) {
                    break;
                }
                BigDecimal unpaid = debt.getRemainingAmount() != null ? debt.getRemainingAmount() : BigDecimal.ZERO;
                if (remainingOffset.compareTo(unpaid) >= 0) {
                    remainingOffset = remainingOffset.subtract(unpaid);
                    debt.setRemainingAmount(BigDecimal.ZERO);
                    debt.setStatus(DebtStatus.PAID);
                } else {
                    debt.setRemainingAmount(unpaid.subtract(remainingOffset));
                    remainingOffset = BigDecimal.ZERO;
                }
            }
            if (!activeDebts.isEmpty()) {
                customerDebtRepository.saveAll(activeDebts);
            }
        }

        CustomerDebt adjustmentDebt = CustomerDebt.builder()
                .household(household)
                .customer(customer)
                .amount(adjustmentAmount)
                .remainingAmount(isIncrease ? adjustmentAmount : BigDecimal.ZERO)
                .type(isIncrease ? DebtType.DEBT_CREATED : DebtType.DEBT_PAID)
                .status(isIncrease ? DebtStatus.PENDING : DebtStatus.PAID)
                .dueDate(LocalDateTime.now().plusDays(30))
                .notes("[Bút toán điều chỉnh]: " + request.getReason())
                .createdByUser(currentUser)
                .isLocked(false)
                .build();

        adjustmentDebt = customerDebtRepository.save(adjustmentDebt);

        logActivity(household, currentUser, "CREATE_DEBT_ADJUSTMENT", adjustmentDebt.getId(),
                null, Map.of("adjustmentType", adjType, "amount", adjustmentAmount, "reason", request.getReason()));

        return CustomerDebtResponse.builder()
                .id(adjustmentDebt.getId())
                .householdId(household.getId())
                .customerId(customer.getId())
                .customerName(customer.getName())
                .customerPhone(customer.getPhoneNumber())
                .amount(adjustmentDebt.getAmount())
                .remainingAmount(adjustmentDebt.getRemainingAmount())
                .type(adjustmentDebt.getType())
                .status(adjustmentDebt.getStatus())
                .dueDate(adjustmentDebt.getDueDate())
                .notes(adjustmentDebt.getNotes())
                .createdByUserId(currentUser.getId())
                .createdByUsername(currentUser.getUsername())
                .createdAt(adjustmentDebt.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DebtReconciliationResponse getLatestReconciliation(String currentUsername, String customerId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        CustomerDebtReconciliation reconciliation = reconciliationRepository
                .findFirstByHouseholdIdAndCustomerIdAndStatusOrderByConfirmedAtDesc(
                        household.getId(), customerId, ReconciliationStatus.CONFIRMED)
                .orElseThrow(() -> new AppException(ErrorCode.DEBT_RECONCILIATION_NOT_FOUND));

        return mapToResponse(reconciliation);
    }

    @lombok.Data
    @lombok.Builder
    private static class CalculationResult {
        private BigDecimal openingDebtBalance;
        private BigDecimal totalDebtIncurred;
        private BigDecimal totalDebtPaid;
        private BigDecimal closingDebtBalance;
        private String closingDebtInWords;
        private List<CustomerDebtReconciliationItem> items;
        private boolean hasTransactions;
    }
}
