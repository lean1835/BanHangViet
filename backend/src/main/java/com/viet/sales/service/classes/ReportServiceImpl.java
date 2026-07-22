package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.response.*;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.*;
import com.viet.sales.service.interfaces.ReportService;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final ActivityLogRepository activityLogRepository;
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
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        return orderRepository.getDailyRevenue(household.getId(), start, end);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductRevenueProjection> getProductRevenue(String currentUsername, LocalDate fromDate, LocalDate toDate) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        return orderRepository.getProductRevenue(household.getId(), start, end);
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

        for (Order o : orders) {
            if ("CASH".equals(o.getPaymentMethod())) {
                cash = cash.add(o.getFinalAmount());
            } else if ("BANK_TRANSFER".equals(o.getPaymentMethod())) {
                transfer = transfer.add(o.getFinalAmount());
            } else if ("DEBT".equals(o.getPaymentMethod())) {
                debt = debt.add(o.getFinalAmount());
            }
        }

        List<EInvoice> errorInvoices = eInvoiceRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "SEND_ERROR", start, end
        );

        List<InvoiceResponse> errorInvoiceResponses = errorInvoices.stream()
                .map(this::mapInvoiceToResponse)
                .collect(Collectors.toList());

        return ReconciliationResponse.builder()
                .date(date)
                .totalCash(cash)
                .totalTransfer(transfer)
                .totalDebt(debt)
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
            String dailyReconciliationJson = objectMapper.writeValueAsString(reconciliation);

            ActivityLog logRecord = ActivityLog.builder()
                    .household(household)
                    .user(currentUser)
                    .action("CHOT_DOI_CHIEU_NGAY")
                    .targetTable("orders")
                    .targetId(household.getId())
                    .oldValue(null)
                    .newValue(dailyReconciliationJson)
                    .clientIp(null)
                    .userAgent(notes) // store notes in userAgent or append to details
                    .build();

            activityLogRepository.save(logRecord);
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
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "COMPLETED", start, end
        );

        BigDecimal totalRevenue = orders.stream()
                .map(Order::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long issuedInvoiceCount = eInvoiceRepository.countByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "ISSUED", start, end
        );

        List<DailyRevenueProjection> dailyRevenues = orderRepository.getDailyRevenue(household.getId(), start, end);

        return DashboardOverviewResponse.builder()
                .totalRevenue(totalRevenue)
                .orderCount(orders.size())
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

        BigDecimal p1Revenue = orderRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "COMPLETED", p1Start, p1End
        ).stream().map(Order::getFinalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal p2Revenue = orderRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullAndCreatedAtBetween(
                household.getId(), "COMPLETED", p2Start, p2End
        ).stream().map(Order::getFinalAmount).reduce(BigDecimal.ZERO, BigDecimal::add);

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
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime start = fromDate != null ? fromDate.atStartOfDay() : LocalDate.now().minusDays(30).atStartOfDay();
        LocalDateTime end = toDate != null ? toDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

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
}
