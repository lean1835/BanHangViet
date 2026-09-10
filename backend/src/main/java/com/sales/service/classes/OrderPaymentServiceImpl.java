package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PaymentMethodConstant;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.ConfirmBankTransferRequest;
import com.sales.dto.response.OrderPaymentResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Order;
import com.sales.entity.OrderPayment;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.OrderPaymentRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.OrderPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class OrderPaymentServiceImpl implements OrderPaymentService {

    private final OrderPaymentRepository orderPaymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final com.sales.repository.BusinessHouseholdSettingsRepository settingsRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;
    private final HttpServletRequest httpServletRequest;

    @org.springframework.beans.factory.annotation.Autowired
    public OrderPaymentServiceImpl(OrderPaymentRepository orderPaymentRepository,
                                  OrderRepository orderRepository,
                                  UserRepository userRepository,
                                  com.sales.repository.BusinessHouseholdSettingsRepository settingsRepository,
                                  ActivityLogHelper activityLogHelper,
                                  ObjectMapper objectMapper,
                                  HttpServletRequest httpServletRequest) {
        this.orderPaymentRepository = orderPaymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.settingsRepository = settingsRepository;
        this.activityLogHelper = activityLogHelper;
        this.objectMapper = objectMapper;
        this.httpServletRequest = httpServletRequest;
    }

    public OrderPaymentServiceImpl(OrderPaymentRepository orderPaymentRepository,
                                  OrderRepository orderRepository,
                                  UserRepository userRepository,
                                  ActivityLogHelper activityLogHelper,
                                  ObjectMapper objectMapper,
                                  HttpServletRequest httpServletRequest) {
        this(orderPaymentRepository, orderRepository, userRepository, null, activityLogHelper, objectMapper, httpServletRequest);
    }


    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            String oldStr = oldValue != null ? (oldValue instanceof String ? (String) oldValue : objectMapper.writeValueAsString(oldValue)) : null;
            String newStr = newValue != null ? (newValue instanceof String ? (String) newValue : objectMapper.writeValueAsString(newValue)) : null;
            String clientIp = httpServletRequest != null ? httpServletRequest.getRemoteAddr() : null;
            String userAgent = httpServletRequest != null ? httpServletRequest.getHeader("User-Agent") : null;
            activityLogHelper.logActivityInNewTransaction(household, actor, action, "order_payments", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to log activity for action {}: {}", action, e.getMessage());
        }
    }

    private boolean calculateOverdue(OrderPayment payment, Integer cachedTimeout) {
        if (payment == null || Boolean.TRUE.equals(payment.getIsConfirmed()) || payment.getCreatedAt() == null) {
            return false;
        }
        int timeout = cachedTimeout != null ? cachedTimeout : 15;
        return LocalDateTime.now().isAfter(payment.getCreatedAt().plusMinutes(timeout));
    }

    private OrderPaymentResponse mapToResponse(OrderPayment payment, Integer cachedTimeout) {
        if (payment == null) {
            return null;
        }
        return OrderPaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .orderCode(payment.getOrder() != null ? payment.getOrder().getOrderNumber() : null)
                .householdId(payment.getHousehold() != null ? payment.getHousehold().getId() : null)
                .paymentMethod(payment.getPaymentMethod())
                .amount(payment.getAmount())
                .amountGiven(payment.getAmountGiven())
                .changeAmount(payment.getChangeAmount())
                .transactionCode(payment.getTransactionCode())
                .isConfirmed(payment.getIsConfirmed())
                .confirmedAt(payment.getConfirmedAt())
                .confirmedByUserId(payment.getConfirmedByUser() != null ? payment.getConfirmedByUser().getId() : null)
                .confirmedByUsername(payment.getConfirmedByUser() != null ? payment.getConfirmedByUser().getUsername() : null)
                .confirmedByFullName(payment.getConfirmedByUser() != null ? payment.getConfirmedByUser().getFullName() : null)
                .notes(payment.getNotes())
                .isTransferOverdue(calculateOverdue(payment, cachedTimeout))
                .createdAt(payment.getCreatedAt())
                .build();
    }

    private OrderPaymentResponse mapToResponse(OrderPayment payment) {
        int timeout = 15;
        if (payment != null && payment.getHousehold() != null && settingsRepository != null) {
            timeout = settingsRepository.findByHouseholdId(payment.getHousehold().getId())
                    .map(s -> s.getBankTransferTimeoutMinutes() != null ? s.getBankTransferTimeoutMinutes() : 15)
                    .orElse(15);
        }
        return mapToResponse(payment, timeout);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderPaymentResponse> getOrderPayments(String currentUsername, String orderId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        String householdId = currentUser.getHousehold().getId();

        orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        int timeout = settingsRepository != null
                ? settingsRepository.findByHouseholdId(householdId)
                        .map(s -> s.getBankTransferTimeoutMinutes() != null ? s.getBankTransferTimeoutMinutes() : 15)
                        .orElse(15)
                : 15;

        List<OrderPayment> payments = orderPaymentRepository.findByOrderIdAndHouseholdIdWithDetails(orderId, householdId);
        return payments.stream().map(p -> mapToResponse(p, timeout)).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderPaymentResponse confirmBankTransfer(String currentUsername, String orderId, String paymentId, ConfirmBankTransferRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        String householdId = currentUser.getHousehold().getId();

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (!"CREATING".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CHANGE_PAYMENT);
        }

        if (order.getShift() != null && order.getShift().getStatus() == ShiftStatus.CLOSED) {
            throw new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND);
        }

        OrderPayment payment = orderPaymentRepository.findByIdAndOrderIdAndHouseholdId(paymentId, orderId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_PAYMENT_NOT_FOUND));

        if (!PaymentMethodConstant.BANK_TRANSFER.equals(payment.getPaymentMethod())) {
            throw new AppException(ErrorCode.NOT_BANK_TRANSFER_PAYMENT);
        }

        if (Boolean.TRUE.equals(payment.getIsConfirmed())) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_CONFIRMED);
        }

        if (request == null || request.getTransactionCode() == null || request.getTransactionCode().trim().isEmpty()) {
            throw new AppException(ErrorCode.PAYMENT_TRANSACTION_CODE_REQUIRED);
        }

        Map<String, Object> oldLog = new HashMap<>();
        oldLog.put("isConfirmed", payment.getIsConfirmed());
        oldLog.put("transactionCode", payment.getTransactionCode());

        payment.setIsConfirmed(true);
        payment.setConfirmedAt(LocalDateTime.now());
        payment.setConfirmedByUser(currentUser);
        payment.setTransactionCode(request.getTransactionCode().trim());
        if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
            payment.setNotes(request.getNotes().trim());
        }

        OrderPayment saved = orderPaymentRepository.save(payment);

        Map<String, Object> newLog = new HashMap<>();
        newLog.put("isConfirmed", saved.getIsConfirmed());
        newLog.put("transactionCode", saved.getTransactionCode());
        newLog.put("confirmedByUserId", currentUser.getId());
        newLog.put("confirmedAt", saved.getConfirmedAt());

        logActivity(currentUser.getHousehold(), currentUser, "CONFIRM_BANK_TRANSFER", saved.getId(), oldLog, newLog);

        return mapToResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderPaymentResponse confirmOrderBankTransfer(String currentUsername, String orderId, ConfirmBankTransferRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        String householdId = currentUser.getHousehold().getId();

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (!"CREATING".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CHANGE_PAYMENT);
        }

        if (order.getShift() != null && order.getShift().getStatus() == ShiftStatus.CLOSED) {
            throw new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND);
        }

        if (request == null || request.getTransactionCode() == null || request.getTransactionCode().trim().isEmpty()) {
            throw new AppException(ErrorCode.PAYMENT_TRANSACTION_CODE_REQUIRED);
        }

        OrderPayment payment = orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod(orderId, householdId, PaymentMethodConstant.BANK_TRANSFER)
                .orElse(null);

        if (payment == null) {
            // Tự động tạo mới khoản thanh toán chuyển khoản nếu đơn đang ở trạng thái CREATING
            // (Hỗ trợ cả đơn thanh toán trực tiếp qua BANK_TRANSFER lẫn đơn thanh toán kết hợp COMBINED hoặc khởi tạo từ CASH)
            BigDecimal paymentAmount = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;
            payment = OrderPayment.builder()
                    .order(order)
                    .household(currentUser.getHousehold())
                    .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                    .amount(paymentAmount)
                    .isConfirmed(false)
                    .build();
            order.addPayment(payment);
            payment = orderPaymentRepository.save(payment);
        }

        if (Boolean.TRUE.equals(payment.getIsConfirmed())) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_CONFIRMED);
        }

        Map<String, Object> oldLog = new HashMap<>();
        oldLog.put("isConfirmed", payment.getIsConfirmed());
        oldLog.put("transactionCode", payment.getTransactionCode());

        payment.setIsConfirmed(true);
        payment.setConfirmedAt(LocalDateTime.now());
        payment.setConfirmedByUser(currentUser);
        payment.setTransactionCode(request.getTransactionCode().trim());
        if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
            payment.setNotes(request.getNotes().trim());
        }

        OrderPayment saved = orderPaymentRepository.save(payment);

        Map<String, Object> newLog = new HashMap<>();
        newLog.put("isConfirmed", saved.getIsConfirmed());
        newLog.put("transactionCode", saved.getTransactionCode());
        newLog.put("confirmedByUserId", currentUser.getId());
        newLog.put("confirmedAt", saved.getConfirmedAt());

        logActivity(currentUser.getHousehold(), currentUser, "CONFIRM_BANK_TRANSFER", saved.getId(), oldLog, newLog);

        return mapToResponse(saved);
    }
}

