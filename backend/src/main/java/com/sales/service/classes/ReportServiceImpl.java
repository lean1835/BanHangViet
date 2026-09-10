package com.sales.service.classes;

import com.sales.constant.DebtType;
import com.sales.constant.ShiftStatus;
import com.sales.constant.CashTransactionType;
import com.sales.constant.CashTransactionStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final PointOfSaleRepository pointOfSaleRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ShiftRepository shiftRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final CashTransactionRepository cashTransactionRepository;
    private final BusinessHouseholdSettingsRepository settingsRepository;
    private final ShiftHandoverRepository shiftHandoverRepository;
    private final ObjectMapper objectMapper;

    private BusinessHousehold getHouseholdAndValidate(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return household;
    }

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyRevenueProjection> getDailyRevenue(String currentUsername, LocalDate fromDate, LocalDate toDate) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);
        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);
        if (start.isAfter(end)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        return orderRepository.getDailyRevenue(household.getId(), start, end);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductRevenueProjection> getProductRevenue(String currentUsername, LocalDate fromDate, LocalDate toDate) {
        return getProductRevenue(currentUsername, fromDate, toDate, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductRevenueProjection> getProductRevenue(String currentUsername, LocalDate fromDate, LocalDate toDate, Integer limit) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);
        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);
        if (start.isAfter(end)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        List<ProductRevenueProjection> list = orderRepository.getProductRevenue(household.getId(), start, end);
        if (limit != null && limit > 0 && list.size() > limit) {
            return list.stream().limit(limit).collect(Collectors.toList());
        }
        return list;
    }

    @Override
    @Transactional(readOnly = true)
    public ReconciliationResponse getReconciliation(String currentUsername, LocalDate date) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);
        if (date == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "COMPLETED", start, end
        );

        BigDecimal cash = BigDecimal.ZERO;
        BigDecimal transfer = BigDecimal.ZERO;
        BigDecimal debt = BigDecimal.ZERO;

        Map<String, List<com.sales.entity.OrderPayment>> paymentsByOrderId = new HashMap<>();
        if (!orders.isEmpty()) {
            paymentsByOrderId = orderPaymentRepository
                    .findByOrderIdIn(orders.stream().map(Order::getId).collect(Collectors.toList()))
                    .stream()
                    .collect(Collectors.groupingBy(p -> p.getOrder().getId()));
        }

        for (Order o : orders) {
            List<com.sales.entity.OrderPayment> orderPayments = paymentsByOrderId.get(o.getId());
            if (orderPayments != null && !orderPayments.isEmpty()) {
                for (com.sales.entity.OrderPayment op : orderPayments) {
                    if ("CASH".equals(op.getPaymentMethod())) {
                        cash = cash.add(op.getAmount());
                    } else if ("BANK_TRANSFER".equals(op.getPaymentMethod())) {
                        transfer = transfer.add(op.getAmount());
                    } else if ("DEBT".equals(op.getPaymentMethod())) {
                        debt = debt.add(op.getAmount());
                    }
                }
            } else {
                if ("CASH".equals(o.getPaymentMethod())) {
                    cash = cash.add(o.getFinalAmount());
                } else if ("BANK_TRANSFER".equals(o.getPaymentMethod())) {
                    transfer = transfer.add(o.getFinalAmount());
                } else if ("DEBT".equals(o.getPaymentMethod())) {
                    Optional<CustomerDebt> debtOpt = customerDebtRepository.findFirstByOrderIdAndType(o.getId(), DebtType.DEBT_CREATED);
                    if (debtOpt.isPresent()) {
                        BigDecimal debtBalance = debtOpt.get().getAmount() != null ? debtOpt.get().getAmount() : BigDecimal.ZERO;
                        BigDecimal paidAdvance = o.getFinalAmount().subtract(debtBalance);
                        if (paidAdvance.compareTo(BigDecimal.ZERO) < 0) {
                            paidAdvance = BigDecimal.ZERO;
                        }
                        debt = debt.add(debtBalance);
                        cash = cash.add(paidAdvance);
                    } else {
                        debt = debt.add(o.getFinalAmount());
                    }
                }
            }
        }

        List<EInvoice> errorInvoices = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "SEND_ERROR", start, end
        );

        List<InvoiceResponse> errorInvoiceResponses = errorInvoices.stream()
                .map(this::mapInvoiceToResponse)
                .collect(Collectors.toList());

        List<Shift> shifts = shiftRepository.findByHouseholdIdAndOpenedAtBetween(household.getId(), start, end);
        BigDecimal closingCashExpected = BigDecimal.ZERO;
        BigDecimal closingCashActual = BigDecimal.ZERO;

        for (Shift s : shifts) {
            if (s.getClosingCashExpected() != null) {
                closingCashExpected = closingCashExpected.add(s.getClosingCashExpected());
            }
            if (s.getClosingCashActual() != null) {
                closingCashActual = closingCashActual.add(s.getClosingCashActual());
            }
        }

        return ReconciliationResponse.builder()
                .date(date)
                .totalCash(cash)
                .totalTransfer(transfer)
                .totalDebt(debt)
                .closingCashExpected(closingCashExpected)
                .closingCashActual(closingCashActual)
                .errorInvoicesCount(errorInvoices.size())
                .errorInvoices(errorInvoiceResponses)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void lockReconciliation(String currentUsername, LocalDate date, String notes) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);
        User currentUser = getAuthenticatedUser(currentUsername);
        if (date == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        ReconciliationResponse reconciliation = getReconciliation(currentUsername, date);

        try {
            Map<String, Object> logPayload = new HashMap<>();
            logPayload.put("reconciliation", reconciliation);
            logPayload.put("notes", notes != null ? notes : "");
            String newValueJson = objectMapper.writeValueAsString(logPayload);

            activityLogHelper.logActivityInNewTransaction(
                    household,
                    currentUser,
                    "CHOT_DOI_CHIEU_NGAY",
                    "orders",
                    household.getId(),
                    null,
                    newValueJson,
                    null,
                    null
            );
            log.info("Chốt đối chiếu ngày thành công. Hộ={}, Ngày={}, Ghi chú={}", household.getId(), date, notes);
        } catch (Exception e) {
            log.error("Lỗi khi serialize kết quả đối chiếu", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardOverviewResponse getDashboardOverview(String currentUsername, LocalDate fromDate, LocalDate toDate) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);
        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);
        if (start.isAfter(end)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        BigDecimal totalRevenue = orderRepository.sumFinalAmountByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "COMPLETED", start, end
        );

        long orderCount = orderRepository.countByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "COMPLETED", start, end
        );

        long issuedInvoiceCount = eInvoiceRepository.countByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "ISSUED", start, end
        );

        List<DailyRevenueProjection> dailyRevenues = orderRepository.getDailyRevenue(household.getId(), start, end);

        return DashboardOverviewResponse.builder()
                .totalRevenue(totalRevenue)
                .orderCount((int) orderCount)
                .issuedInvoiceCount(issuedInvoiceCount)
                .dailyRevenues(dailyRevenues)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CompareRevenueResponse compareRevenue(String currentUsername, LocalDate period1Start, LocalDate period1End, LocalDate period2Start, LocalDate period2End) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);
        if (period1Start == null || period1End == null || period2Start == null || period2End == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        if (period1Start.isAfter(period1End) || period2Start.isAfter(period2End)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        // Check overlap
        if (!period1Start.isAfter(period2End) && !period1End.isBefore(period2Start)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime p1Start = period1Start.atStartOfDay();
        LocalDateTime p1End = period1End.atTime(LocalTime.MAX);
        LocalDateTime p2Start = period2Start.atStartOfDay();
        LocalDateTime p2End = period2End.atTime(LocalTime.MAX);

        BigDecimal p1Revenue = orderRepository.sumFinalAmountByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "COMPLETED", p1Start, p1End
        );

        BigDecimal p2Revenue = orderRepository.sumFinalAmountByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "COMPLETED", p2Start, p2End
        );

        p1Revenue = p1Revenue != null ? p1Revenue : BigDecimal.ZERO;
        p2Revenue = p2Revenue != null ? p2Revenue : BigDecimal.ZERO;

        BigDecimal diffAmount = p2Revenue.subtract(p1Revenue);
        BigDecimal diffPercent = BigDecimal.ZERO;

        if (p1Revenue.compareTo(BigDecimal.ZERO) == 0) {
            if (p2Revenue.compareTo(BigDecimal.ZERO) > 0) {
                diffPercent = new BigDecimal("100.00");
            }
        } else {
            diffPercent = diffAmount.multiply(new BigDecimal("100.00"))
                    .divide(p1Revenue, 2, RoundingMode.HALF_UP);
        }

        return CompareRevenueResponse.builder()
                .period1Revenue(p1Revenue)
                .period2Revenue(p2Revenue)
                .differenceAmount(diffAmount)
                .differencePercentage(diffPercent)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ActivityLogResponse> getActivityLogs(String currentUsername, String targetUsername, LocalDate fromDate, LocalDate toDate, int page, int size) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);
        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);
        if (start.isAfter(end)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<ActivityLog> logs = activityLogRepository.findLogs(
                household.getId(),
                targetUsername != null && targetUsername.isEmpty() ? null : targetUsername,
                start,
                end,
                pageable
        );

        List<ActivityLogResponse> content = logs.getContent().stream()
                .map(log -> ActivityLogResponse.builder()
                        .id(log.getId())
                        .username(log.getUser() != null ? log.getUser().getUsername() : null)
                        .fullName(log.getUser() != null ? log.getUser().getFullName() : null)
                        .action(log.getAction())
                        .targetTable(log.getTargetTable())
                        .targetId(log.getTargetId())
                        .oldValue(log.getOldValue())
                        .newValue(log.getNewValue())
                        .clientIp(log.getClientIp())
                        .userAgent(log.getUserAgent())
                        .createdAt(log.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PageResponse.<ActivityLogResponse>builder()
                .content(content)
                .pageNumber(logs.getNumber())
                .pageSize(logs.getSize())
                .totalElements(logs.getTotalElements())
                .totalPages(logs.getTotalPages())
                .last(logs.isLast())
                .build();
    }

    private InvoiceResponse mapInvoiceToResponse(EInvoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .householdId(invoice.getHousehold().getId())
                .householdName(invoice.getHousehold().getName())
                .orderId(invoice.getOrder() != null ? invoice.getOrder().getId() : null)
                .orderNumber(invoice.getOrder() != null ? invoice.getOrder().getOrderNumber() : null)
                .createdByUserId(invoice.getCreatedByUser().getId())
                .createdByUsername(invoice.getCreatedByUser().getUsername())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoicePattern(invoice.getInvoicePattern())
                .invoiceSymbol(invoice.getInvoiceSymbol())
                .buyerName(invoice.getBuyerName())
                .buyerTaxCode(invoice.getBuyerTaxCode())
                .buyerAddress(invoice.getBuyerAddress())
                .buyerPhone(invoice.getBuyerPhone())
                .buyerEmail(invoice.getBuyerEmail())
                .totalAmountBeforeTax(invoice.getTotalAmountBeforeTax())
                .taxAmount(invoice.getTaxAmount())
                .discountAmount(invoice.getDiscountAmount())
                .finalAmount(invoice.getFinalAmount())
                .status(invoice.getStatus())
                .taxAuthorityCode(invoice.getTaxAuthorityCode())
                .taxAuthorityResponse(invoice.getTaxAuthorityResponse())
                .cancelReason(invoice.getCancelReason())
                .lookupCode(invoice.getLookupCode())
                .sentToTaxAt(invoice.getSentToTaxAt())
                .taxResponseAt(invoice.getTaxResponseAt())
                .canceledAt(invoice.getCanceledAt())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PosRevenueReportResponse getPosRevenueReport(String currentUsername, LocalDate fromDate, LocalDate toDate, String posId) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);

        LocalDate startLocalDate = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate endLocalDate = toDate != null ? toDate : LocalDate.now();
        if (startLocalDate.isAfter(endLocalDate)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime startDateTime = startLocalDate.atStartOfDay();
        LocalDateTime endDateTime = endLocalDate.atTime(LocalTime.MAX);

        List<PointOfSale> posList;
        String filterPosId = (posId != null && !posId.trim().isEmpty()) ? posId.trim() : null;
        if (filterPosId != null) {
            PointOfSale pos = pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(filterPosId, household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.POS_NOT_FOUND));
            posList = List.of(pos);
        } else {
            posList = pointOfSaleRepository.findAllByHouseholdIdAndDeletedAtIsNull(household.getId());
        }

        List<PosRevenueProjection> orderMetrics = orderRepository.getPosRevenueSummary(
                household.getId(), startDateTime, endDateTime, filterPosId
        );
        Map<String, PosRevenueProjection> orderMetricsMap = orderMetrics.stream()
                .filter(m -> m.getPosId() != null)
                .collect(Collectors.toMap(PosRevenueProjection::getPosId, m -> m, (m1, m2) -> m1));

        List<PosInvoiceCountProjection> invoiceMetrics = eInvoiceRepository.getPosInvoiceCounts(
                household.getId(), startDateTime, endDateTime, filterPosId
        );
        Map<String, Long> invoiceCountMap = invoiceMetrics.stream()
                .filter(m -> m.getPosId() != null)
                .collect(Collectors.toMap(PosInvoiceCountProjection::getPosId, PosInvoiceCountProjection::getInvoiceCount, (c1, c2) -> c1));

        List<PosDailyRevenueProjection> dailyMetrics = orderRepository.getPosDailyRevenue(
                household.getId(), startDateTime, endDateTime, filterPosId
        );
        List<PosDailyRevenueResponse> dailyBreakdown = dailyMetrics.stream()
                .map(d -> PosDailyRevenueResponse.builder()
                        .salesDate(d.getSalesDate() != null ? d.getSalesDate().toLocalDate() : null)
                        .posId(d.getPosId())
                        .posName(d.getPosName())
                        .orderCount(d.getOrderCount() != null ? d.getOrderCount() : 0L)
                        .netRevenue(d.getNetRevenue() != null ? d.getNetRevenue() : BigDecimal.ZERO)
                        .build())
                .collect(Collectors.toList());

        long totalOrders = 0L;
        long totalInvoices = 0L;
        BigDecimal totalGrossSales = BigDecimal.ZERO;
        BigDecimal totalDiscount = BigDecimal.ZERO;
        BigDecimal totalNetRevenue = BigDecimal.ZERO;
        BigDecimal totalCashRevenue = BigDecimal.ZERO;
        BigDecimal totalBankRevenue = BigDecimal.ZERO;
        BigDecimal totalDebtRevenue = BigDecimal.ZERO;
        int activePosCount = 0;

        List<PosRevenueSummaryResponse> posSummaries = new ArrayList<>();
        for (PointOfSale pos : posList) {
            if (Boolean.TRUE.equals(pos.getIsActive())) {
                activePosCount++;
            }
            PosRevenueProjection metric = orderMetricsMap.get(pos.getId());
            Long invCount = invoiceCountMap.getOrDefault(pos.getId(), 0L);

            Long orders = (metric != null && metric.getOrderCount() != null) ? metric.getOrderCount() : 0L;
            BigDecimal gross = (metric != null && metric.getGrossSales() != null) ? metric.getGrossSales() : BigDecimal.ZERO;
            BigDecimal discount = (metric != null && metric.getTotalDiscount() != null) ? metric.getTotalDiscount() : BigDecimal.ZERO;
            BigDecimal net = (metric != null && metric.getNetRevenue() != null) ? metric.getNetRevenue() : BigDecimal.ZERO;
            BigDecimal cash = (metric != null && metric.getCashRevenue() != null) ? metric.getCashRevenue() : BigDecimal.ZERO;
            BigDecimal bank = (metric != null && metric.getBankRevenue() != null) ? metric.getBankRevenue() : BigDecimal.ZERO;
            BigDecimal debt = (metric != null && metric.getDebtRevenue() != null) ? metric.getDebtRevenue() : BigDecimal.ZERO;

            totalOrders += orders;
            totalInvoices += invCount;
            totalGrossSales = totalGrossSales.add(gross);
            totalDiscount = totalDiscount.add(discount);
            totalNetRevenue = totalNetRevenue.add(net);
            totalCashRevenue = totalCashRevenue.add(cash);
            totalBankRevenue = totalBankRevenue.add(bank);
            totalDebtRevenue = totalDebtRevenue.add(debt);

            posSummaries.add(PosRevenueSummaryResponse.builder()
                    .posId(pos.getId())
                    .posCode(pos.getPosCode())
                    .posName(pos.getName())
                    .address(pos.getAddress())
                    .phoneNumber(pos.getPhoneNumber())
                    .invoiceSymbol(pos.getInvoiceSymbol())
                    .isDefault(pos.getIsDefault())
                    .isActive(pos.getIsActive())
                    .orderCount(orders)
                    .invoiceCount(invCount)
                    .grossSales(gross)
                    .totalDiscount(discount)
                    .netRevenue(net)
                    .cashRevenue(cash)
                    .bankRevenue(bank)
                    .debtRevenue(debt)
                    .revenuePercentage(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP))
                    .build());
        }

        for (PosRevenueSummaryResponse summary : posSummaries) {
            if (totalNetRevenue.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal percentage = summary.getNetRevenue()
                        .multiply(BigDecimal.valueOf(100))
                        .divide(totalNetRevenue, 2, RoundingMode.HALF_UP);
                summary.setRevenuePercentage(percentage);
            } else {
                summary.setRevenuePercentage(BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP));
            }
        }

        PosHouseholdTotalResponse householdSummary = PosHouseholdTotalResponse.builder()
                .totalPosCount(posList.size())
                .activePosCount(activePosCount)
                .totalOrders(totalOrders)
                .totalInvoices(totalInvoices)
                .totalGrossSales(totalGrossSales)
                .totalDiscount(totalDiscount)
                .totalNetRevenue(totalNetRevenue)
                .totalCashRevenue(totalCashRevenue)
                .totalBankRevenue(totalBankRevenue)
                .totalDebtRevenue(totalDebtRevenue)
                .build();

        return PosRevenueReportResponse.builder()
                .fromDate(startLocalDate)
                .toDate(endLocalDate)
                .householdSummary(householdSummary)
                .posSummaries(posSummaries)
                .dailyBreakdown(dailyBreakdown)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeShiftReportResponse getEmployeeShiftReport(
            String currentUsername,
            LocalDate fromDate,
            LocalDate toDate,
            String userId,
            BigDecimal customThreshold) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);

        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);
        if (start.isAfter(end)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        BigDecimal appliedThreshold = customThreshold;
        if (appliedThreshold == null) {
            appliedThreshold = settingsRepository.findByHouseholdId(household.getId())
                    .map(BusinessHouseholdSettings::getShiftDifferenceThreshold)
                    .orElse(BigDecimal.ZERO);
        }
        if (appliedThreshold == null || appliedThreshold.compareTo(BigDecimal.ZERO) < 0) {
            appliedThreshold = BigDecimal.ZERO;
        }

        String filterUserId = (userId != null && !userId.trim().isEmpty()) ? userId.trim() : null;
        List<Shift> closedShifts = shiftRepository.findClosedShiftsForReport(
                household.getId(),
                ShiftStatus.CLOSED,
                start,
                end,
                filterUserId);

        List<ShiftRevenueReportItemResponse> shiftItems = new ArrayList<>();
        Map<String, List<ShiftRevenueReportItemResponse>> shiftsByUser = new HashMap<>();

        BigDecimal totalCashRevAll = BigDecimal.ZERO;
        BigDecimal totalBankRevAll = BigDecimal.ZERO;
        BigDecimal totalRevAll = BigDecimal.ZERO;
        int totalCompletedOrdersAll = 0;
        int totalCanceledOrdersAll = 0;
        BigDecimal totalDiffAmountAll = BigDecimal.ZERO;
        int totalExceededShiftsAll = 0;

        for (Shift s : closedShifts) {
            BigDecimal cashRev = orderRepository.sumCashSalesAmountByShiftId(s.getId());
            if (cashRev == null) cashRev = BigDecimal.ZERO;

            BigDecimal bankRev = orderRepository.sumBankTransferSalesAmountByShiftId(s.getId());
            if (bankRev == null) bankRev = BigDecimal.ZERO;

            BigDecimal totalRev = cashRev.add(bankRev);

            int completedOrders = (int) orderRepository.countByShiftIdAndStatusAndDeletedAtIsNull(s.getId(), "COMPLETED");
            int canceledOrders = (int) orderRepository.countByShiftIdAndStatusAndDeletedAtIsNull(s.getId(), "CANCELED");

            BigDecimal cashIncome = BigDecimal.ZERO;
            BigDecimal cashExpense = BigDecimal.ZERO;
            if (cashTransactionRepository != null) {
                cashIncome = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                        s.getId(), CashTransactionType.INCOME, CashTransactionStatus.APPROVED);
                cashExpense = cashTransactionRepository.sumAmountByShiftIdAndTypeAndStatus(
                        s.getId(), CashTransactionType.EXPENSE, CashTransactionStatus.APPROVED);
            }

            BigDecimal diffAmount = s.getDifferenceAmount() != null ? s.getDifferenceAmount() : BigDecimal.ZERO;
            boolean isExceeded = diffAmount.abs().compareTo(appliedThreshold) > 0;
            if (isExceeded) {
                totalExceededShiftsAll++;
            }

            int handoversCount = shiftHandoverRepository != null ? shiftHandoverRepository.countByShiftId(s.getId()) : 0;

            ShiftRevenueReportItemResponse item = ShiftRevenueReportItemResponse.builder()
                    .shiftId(s.getId())
                    .userId(s.getUser().getId())
                    .username(s.getUser().getUsername())
                    .employeeName(s.getUser().getFullName())
                    .pointOfSaleId(s.getPointOfSale() != null ? s.getPointOfSale().getId() : null)
                    .pointOfSaleName(s.getPointOfSale() != null ? s.getPointOfSale().getName() : null)
                    .openedAt(s.getOpenedAt())
                    .closedAt(s.getClosedAt())
                    .openingCash(s.getOpeningCash())
                    .closingCashExpected(s.getClosingCashExpected())
                    .closingCashActual(s.getClosingCashActual())
                    .cashRevenue(cashRev)
                    .bankTransferRevenue(bankRev)
                    .totalRevenue(totalRev)
                    .totalOrders(completedOrders)
                    .canceledOrders(canceledOrders)
                    .cashIncome(cashIncome)
                    .cashExpense(cashExpense)
                    .differenceAmount(diffAmount)
                    .differenceReason(s.getDifferenceReason())
                    .isDifferenceExceeded(isExceeded)
                    .handoversCount(handoversCount)
                    .status(s.getStatus().name())
                    .build();

            shiftItems.add(item);
            shiftsByUser.computeIfAbsent(s.getUser().getId(), k -> new ArrayList<>()).add(item);

            totalCashRevAll = totalCashRevAll.add(cashRev);
            totalBankRevAll = totalBankRevAll.add(bankRev);
            totalRevAll = totalRevAll.add(totalRev);
            totalCompletedOrdersAll += completedOrders;
            totalCanceledOrdersAll += canceledOrders;
            totalDiffAmountAll = totalDiffAmountAll.add(diffAmount);
        }

        List<EmployeeRevenueSummaryResponse> employeeSummaries = new ArrayList<>();
        for (Map.Entry<String, List<ShiftRevenueReportItemResponse>> entry : shiftsByUser.entrySet()) {
            List<ShiftRevenueReportItemResponse> userShifts = entry.getValue();
            if (userShifts.isEmpty()) continue;

            ShiftRevenueReportItemResponse first = userShifts.get(0);
            int shiftsCount = userShifts.size();

            BigDecimal userCashRev = BigDecimal.ZERO;
            BigDecimal userBankRev = BigDecimal.ZERO;
            BigDecimal userTotalRev = BigDecimal.ZERO;
            int userOrders = 0;
            int userCanceled = 0;
            BigDecimal userDiff = BigDecimal.ZERO;
            int userExceededCount = 0;

            for (ShiftRevenueReportItemResponse it : userShifts) {
                userCashRev = userCashRev.add(it.getCashRevenue());
                userBankRev = userBankRev.add(it.getBankTransferRevenue());
                userTotalRev = userTotalRev.add(it.getTotalRevenue());
                userOrders += it.getTotalOrders();
                userCanceled += it.getCanceledOrders();
                userDiff = userDiff.add(it.getDifferenceAmount());
                if (it.isDifferenceExceeded()) {
                    userExceededCount++;
                }
            }

            double avgOrders = shiftsCount > 0 ? (double) userOrders / shiftsCount : 0.0;
            avgOrders = Math.round(avgOrders * 100.0) / 100.0;

            BigDecimal avgRev = shiftsCount > 0
                    ? userTotalRev.divide(BigDecimal.valueOf(shiftsCount), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            employeeSummaries.add(EmployeeRevenueSummaryResponse.builder()
                    .userId(first.getUserId())
                    .username(first.getUsername())
                    .employeeName(first.getEmployeeName())
                    .totalShifts(shiftsCount)
                    .totalCashRevenue(userCashRev)
                    .totalBankTransferRevenue(userBankRev)
                    .totalRevenue(userTotalRev)
                    .totalOrders(userOrders)
                    .totalCanceledOrders(userCanceled)
                    .averageOrdersPerShift(avgOrders)
                    .averageRevenuePerShift(avgRev)
                    .totalDifferenceAmount(userDiff)
                    .exceededShiftsCount(userExceededCount)
                    .build());
        }

        employeeSummaries.sort((a, b) -> b.getTotalRevenue().compareTo(a.getTotalRevenue()));

        return EmployeeShiftReportResponse.builder()
                .fromDate(start.toLocalDate())
                .toDate(end.toLocalDate())
                .appliedThreshold(appliedThreshold)
                .totalShiftsCount(shiftItems.size())
                .totalExceededShiftsCount(totalExceededShiftsAll)
                .totalCashRevenue(totalCashRevAll)
                .totalBankTransferRevenue(totalBankRevAll)
                .totalRevenue(totalRevAll)
                .totalOrdersCount(totalCompletedOrdersAll)
                .totalCanceledOrdersCount(totalCanceledOrdersAll)
                .totalDifferenceAmount(totalDiffAmountAll)
                .shifts(shiftItems)
                .employeeSummaries(employeeSummaries)
                .build();
    }
}
