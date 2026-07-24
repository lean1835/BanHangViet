package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CollectDebtRequest;
import com.viet.sales.dto.response.CustomerDebtResponse;
import com.viet.sales.dto.response.DebtSummaryResponse;
import com.viet.sales.entity.ActivityLog;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Customer;
import com.viet.sales.entity.CustomerDebt;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.CustomerDebtRepository;
import com.viet.sales.repository.CustomerRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.CustomerDebtService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerDebtServiceImpl implements CustomerDebtService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
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
                    .targetTable("customer_debts")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to write activity log for customer debt", e);
        }
    }

    private Map<String, Object> buildDebtLogMap(CustomerDebt debt) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", debt.getId());
        map.put("customerId", debt.getCustomer().getId());
        map.put("amount", debt.getAmount());
        map.put("remainingAmount", debt.getRemainingAmount());
        map.put("type", debt.getType());
        map.put("status", debt.getStatus());
        map.put("orderId", debt.getOrder() != null ? debt.getOrder().getId() : null);
        map.put("dueDate", debt.getDueDate());
        return map;
    }

    private CustomerDebtResponse mapToResponse(CustomerDebt debt) {
        return CustomerDebtResponse.builder()
                .id(debt.getId())
                .householdId(debt.getHousehold().getId())
                .customerId(debt.getCustomer().getId())
                .customerName(debt.getCustomer().getName())
                .customerPhone(debt.getCustomer().getPhoneNumber())
                .orderId(debt.getOrder() != null ? debt.getOrder().getId() : null)
                .orderNumber(debt.getOrder() != null ? debt.getOrder().getOrderNumber() : null)
                .amount(debt.getAmount())
                .remainingAmount(debt.getRemainingAmount())
                .type(debt.getType())
                .status(debt.getStatus())
                .dueDate(debt.getDueDate())
                .notes(debt.getNotes())
                .createdByUserId(debt.getCreatedByUser().getId())
                .createdByUsername(debt.getCreatedByUser().getUsername())
                .createdAt(debt.getCreatedAt())
                .updatedAt(debt.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomerDebtResponse collectDebt(String currentUsername, CollectDebtRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Khóa bi quan khách hàng để tránh race condition khi cập nhật nợ
        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                request.getCustomerId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        BigDecimal paymentAmount = request.getAmount();

        // Chặn thu nợ nhiều hơn dư nợ hiện tại (ngăn current_debt < 0 do ràng buộc DB)
        if (paymentAmount.compareTo(customer.getCurrentDebt()) > 0) {
            throw new AppException(ErrorCode.INVALID_DEBT_PAYMENT_AMOUNT);
        }

        // Lấy các khoản nợ đang nợ (PENDING/OVERDUE) cũ nhất để trả theo nguyên tắc FIFO
        List<CustomerDebt> activeDebts = customerDebtRepository.findByCustomerIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
                customer.getId(), household.getId(), List.of("PENDING", "OVERDUE"), "DEBT_CREATED");

        BigDecimal totalActiveDebt = activeDebts.stream()
                .map(CustomerDebt::getRemainingAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (paymentAmount.compareTo(totalActiveDebt) > 0) {
            throw new AppException(ErrorCode.INVALID_DEBT_PAYMENT_AMOUNT);
        }

        BigDecimal remainingPayment = paymentAmount;
        List<CustomerDebt> updatedDebts = new ArrayList<>();

        for (CustomerDebt debt : activeDebts) {
            if (remainingPayment.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            BigDecimal debtUnpaid = debt.getRemainingAmount();
            if (remainingPayment.compareTo(debtUnpaid) >= 0) {
                remainingPayment = remainingPayment.subtract(debtUnpaid);
                debt.setRemainingAmount(BigDecimal.ZERO);
                debt.setStatus("PAID");
            } else {
                debt.setRemainingAmount(debtUnpaid.subtract(remainingPayment));
                remainingPayment = BigDecimal.ZERO;
            }
            updatedDebts.add(debt);
        }

        if (!updatedDebts.isEmpty()) {
            customerDebtRepository.saveAll(updatedDebts);
        }

        // Trừ dư nợ hiện tại của khách hàng
        customer.setCurrentDebt(customer.getCurrentDebt().subtract(paymentAmount));
        customerRepository.save(customer);

        // Tạo bản ghi giao dịch trả nợ DEBT_PAID
        CustomerDebt paymentRecord = CustomerDebt.builder()
                .household(household)
                .customer(customer)
                .amount(paymentAmount)
                .remainingAmount(BigDecimal.ZERO)
                .type("DEBT_PAID")
                .status("PAID")
                .dueDate(LocalDateTime.now())
                .notes(request.getNotes() != null && !request.getNotes().trim().isEmpty() 
                        ? request.getNotes() : "Khách hàng trả nợ")
                .createdByUser(currentUser)
                .build();

        paymentRecord = customerDebtRepository.save(paymentRecord);

        logActivity(household, currentUser, "COLLECT_DEBT", paymentRecord.getId(), null, buildDebtLogMap(paymentRecord));

        return mapToResponse(paymentRecord);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerDebtResponse> getDebtHistory(String currentUsername, String customerId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Đảm bảo khách hàng thuộc hộ kinh doanh
        customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(customerId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        List<CustomerDebt> history = customerDebtRepository.findByCustomerIdAndHouseholdIdOrderByCreatedAtDescWithRelations(
                customerId, household.getId());

        return history.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerDebtResponse> getDebtReminders(String currentUsername, String statusFilter) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<CustomerDebt> reminders;
        if (statusFilter != null && !statusFilter.trim().isEmpty()) {
            reminders = customerDebtRepository.findByHouseholdIdAndStatusInAndTypeOrderByDueDateAscWithRelations(
                    household.getId(), List.of(statusFilter.toUpperCase()), "DEBT_CREATED");
        } else {
            reminders = customerDebtRepository.findByHouseholdIdAndStatusInAndTypeOrderByDueDateAscWithRelations(
                    household.getId(), List.of("PENDING", "OVERDUE"), "DEBT_CREATED");
        }

        return reminders.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DebtSummaryResponse getDebtSummary(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BigDecimal totalActiveDebt = customerDebtRepository.sumTotalActiveDebt(household.getId());
        BigDecimal totalOverdueDebt = customerDebtRepository.sumTotalOverdueDebt(household.getId());
        long totalDebtors = customerDebtRepository.countCustomersWithActiveDebt(household.getId());

        return DebtSummaryResponse.builder()
                .totalActiveDebt(totalActiveDebt)
                .totalOverdueDebt(totalOverdueDebt)
                .totalDebtors(totalDebtors)
                .build();
    }
}
