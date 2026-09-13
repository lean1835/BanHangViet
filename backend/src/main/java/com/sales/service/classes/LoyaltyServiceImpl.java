package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PaymentMethodConstant;
import com.sales.constant.PointTransactionType;
import com.sales.dto.request.AdjustPointsRequest;
import com.sales.dto.request.ApplyLoyaltyPointsRequest;
import com.sales.dto.request.LoyaltyProgramConfigRequest;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.LoyaltyService;
import com.sales.service.interfaces.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoyaltyServiceImpl implements LoyaltyService {

    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final LoyaltyProgramConfigRepository configRepository;
    private final CustomerPointTransactionRepository transactionRepository;
    private final OrderRepository orderRepository;
    private final ReturnTicketRepository returnTicketRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;
    private final org.springframework.beans.factory.ObjectProvider<OrderService> orderServiceProvider;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private boolean isStoreOwner(User user) {
        return user != null && user.getRole() != null &&
                ("VT-01".equals(user.getRole().getCode()) || "OWNER".equalsIgnoreCase(user.getRole().getCode()));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "loyalty_program_configs", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for loyalty program", e);
        }
    }

    @Override
    @Transactional
    public LoyaltyProgramConfigResponse getProgramConfig(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        LoyaltyProgramConfig config = configRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> {
                    LoyaltyProgramConfig defaultConfig = LoyaltyProgramConfig.builder()
                            .household(household)
                            .isEnabled(true)
                            .spendAmountPerPoint(new BigDecimal("10000.00"))
                            .pointValue(new BigDecimal("1000.00"))
                            .minPointsToRedeem(50)
                            .maxRedeemRatePerOrder(new BigDecimal("100.00"))
                            .pointExpiryDays(365)
                            .build();
                    return configRepository.save(defaultConfig);
                });

        return mapConfigToResponse(config);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoyaltyProgramConfigResponse updateProgramConfig(String currentUsername, LoyaltyProgramConfigRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        if (!isStoreOwner(currentUser)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (request.getSpendAmountPerPoint() == null || request.getSpendAmountPerPoint().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_LOYALTY_CONFIG);
        }
        if (request.getPointValue() == null || request.getPointValue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_LOYALTY_CONFIG);
        }
        if (request.getMinPointsToRedeem() == null || request.getMinPointsToRedeem() < 0) {
            throw new AppException(ErrorCode.INVALID_LOYALTY_CONFIG);
        }
        if (request.getMaxRedeemRatePerOrder() == null || request.getMaxRedeemRatePerOrder().compareTo(BigDecimal.ZERO) <= 0
                || request.getMaxRedeemRatePerOrder().compareTo(new BigDecimal("100.00")) > 0) {
            throw new AppException(ErrorCode.INVALID_LOYALTY_CONFIG);
        }
        if (request.getPointExpiryDays() == null || request.getPointExpiryDays() < 0) {
            throw new AppException(ErrorCode.INVALID_LOYALTY_CONFIG);
        }

        LoyaltyProgramConfig config = configRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> LoyaltyProgramConfig.builder()
                        .household(household)
                        .build());

        Map<String, Object> oldValues = new HashMap<>();
        oldValues.put("isEnabled", config.getIsEnabled());
        oldValues.put("spendAmountPerPoint", config.getSpendAmountPerPoint());
        oldValues.put("pointValue", config.getPointValue());
        oldValues.put("minPointsToRedeem", config.getMinPointsToRedeem());
        oldValues.put("maxRedeemRatePerOrder", config.getMaxRedeemRatePerOrder());
        oldValues.put("pointExpiryDays", config.getPointExpiryDays());

        config.setIsEnabled(request.getIsEnabled());
        config.setSpendAmountPerPoint(request.getSpendAmountPerPoint());
        config.setPointValue(request.getPointValue());
        config.setMinPointsToRedeem(request.getMinPointsToRedeem());
        config.setMaxRedeemRatePerOrder(request.getMaxRedeemRatePerOrder());
        config.setPointExpiryDays(request.getPointExpiryDays());

        config = configRepository.save(config);

        logActivity(household, currentUser, "UPDATE_LOYALTY_CONFIG", config.getId(), oldValues, request);

        return mapConfigToResponse(config);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerLoyaltySummaryResponse getCustomerLoyaltySummary(String currentUsername, String customerId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(customerId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        LoyaltyProgramConfig config = configRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> LoyaltyProgramConfig.builder()
                        .household(household)
                        .isEnabled(true)
                        .spendAmountPerPoint(new BigDecimal("10000.00"))
                        .pointValue(new BigDecimal("1000.00"))
                        .minPointsToRedeem(50)
                        .maxRedeemRatePerOrder(new BigDecimal("100.00"))
                        .pointExpiryDays(365)
                        .build());

        int availablePoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        BigDecimal pointVal = config.getPointValue() != null ? config.getPointValue() : BigDecimal.ZERO;
        BigDecimal monetaryEquivalent = pointVal.multiply(BigDecimal.valueOf(availablePoints)).setScale(2, RoundingMode.HALF_UP);
        boolean isEligible = Boolean.TRUE.equals(config.getIsEnabled()) && availablePoints >= config.getMinPointsToRedeem();

        Integer totalEarned = transactionRepository.sumPointsEarnedByCustomer(household.getId(), customer.getId());
        Integer totalRedeemed = transactionRepository.sumPointsRedeemedByCustomer(household.getId(), customer.getId());
        Integer totalDeducted = transactionRepository.sumPointsDeductedByCustomer(household.getId(), customer.getId());

        LocalDate today = LocalDate.now();
        LocalDate nearestExp = transactionRepository.findNearestExpiringDate(household.getId(), customer.getId(), today).orElse(null);
        Integer expiringSoon = transactionRepository.sumPointsExpiringSoon(household.getId(), customer.getId(), today, today.plusDays(30));

        return CustomerLoyaltySummaryResponse.builder()
                .customerId(customer.getId())
                .customerName(customer.getName())
                .phoneNumber(customer.getPhoneNumber())
                .availablePoints(availablePoints)
                .monetaryEquivalent(monetaryEquivalent)
                .isEligibleToRedeem(isEligible)
                .minPointsToRedeem(config.getMinPointsToRedeem())
                .totalPointsEarned(totalEarned != null ? totalEarned : 0)
                .totalPointsRedeemed(totalRedeemed != null ? totalRedeemed : 0)
                .totalPointsDeductedOnReturn(totalDeducted != null ? totalDeducted : 0)
                .nearestExpiringDate(nearestExp)
                .pointsExpiringSoon(expiringSoon != null ? expiringSoon : 0)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PointTransactionResponse> getCustomerPointTransactions(
            String currentUsername, String customerId, int page, int size, String type) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(customerId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        Pageable pageable = PageRequest.of(page, size);
        Page<CustomerPointTransaction> txPage;
        if (type != null && !type.trim().isEmpty()) {
            txPage = transactionRepository.findAllByHouseholdIdAndCustomerIdAndTypeOrderByCreatedAtDesc(
                    household.getId(), customerId, type.trim().toUpperCase(), pageable);
        } else {
            txPage = transactionRepository.findAllByHouseholdIdAndCustomerIdOrderByCreatedAtDesc(
                    household.getId(), customerId, pageable);
        }

        List<PointTransactionResponse> dtoList = txPage.getContent().stream()
                .map(this::mapTransactionToResponse)
                .collect(Collectors.toList());

        return PageResponse.<PointTransactionResponse>builder()
                .content(dtoList)
                .pageNumber(txPage.getNumber())
                .pageSize(txPage.getSize())
                .totalElements(txPage.getTotalElements())
                .totalPages(txPage.getTotalPages())
                .last(txPage.isLast())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse applyPointsToOrder(String currentUsername, String orderId, ApplyLoyaltyPointsRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (!"CREATING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_NOT_IN_CREATING_STATUS);
        }

        if (order.getCustomer() == null) {
            throw new AppException(ErrorCode.CUSTOMER_REQUIRED_FOR_LOYALTY);
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(order.getCustomer().getId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        LoyaltyProgramConfig config = configRepository.findByHouseholdId(household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.LOYALTY_PROGRAM_NOT_ENABLED));

        if (!Boolean.TRUE.equals(config.getIsEnabled())) {
            throw new AppException(ErrorCode.LOYALTY_PROGRAM_NOT_ENABLED);
        }

        Integer pointsToRedeem = request.getPointsToRedeem();
        if (pointsToRedeem == null || pointsToRedeem <= 0) {
            throw new AppException(ErrorCode.POINTS_MUST_BE_POSITIVE);
        }

        int currentPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        if (currentPoints < pointsToRedeem) {
            throw new AppException(ErrorCode.INSUFFICIENT_LOYALTY_POINTS);
        }

        if (pointsToRedeem < config.getMinPointsToRedeem()) {
            throw new AppException(ErrorCode.MIN_POINTS_TO_REDEEM_NOT_REACHED);
        }

        OrderService orderService = orderServiceProvider.getObject();

        // Tính tiền quy đổi
        BigDecimal pointValue = config.getPointValue() != null ? config.getPointValue() : BigDecimal.ZERO;
        BigDecimal pointDiscount = pointValue.multiply(BigDecimal.valueOf(pointsToRedeem)).setScale(0, RoundingMode.HALF_UP).setScale(2);

        // Tính tổng tiền đơn hàng phải trả trước khi giảm trừ đổi điểm (đã gồm thuế và các khoản giảm khác chuẩn QTN-07)
        order.setPointDiscountAmount(BigDecimal.ZERO);
        orderService.recalculateOrderTotals(order);
        BigDecimal payableBeforePoints = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;

        BigDecimal maxAllowedDiscount = payableBeforePoints;
        if (config.getMaxRedeemRatePerOrder() != null && config.getMaxRedeemRatePerOrder().compareTo(BigDecimal.valueOf(100)) < 0) {
            BigDecimal rateLimit = payableBeforePoints.multiply(config.getMaxRedeemRatePerOrder())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            maxAllowedDiscount = maxAllowedDiscount.min(rateLimit);
        }

        if (pointDiscount.compareTo(maxAllowedDiscount) > 0) {
            throw new AppException(ErrorCode.POINTS_TO_REDEEM_EXCEEDS_ORDER_TOTAL);
        }

        order.setPointDiscountAmount(pointDiscount);
        order.setPointsRedeemed(pointsToRedeem);
        orderService.recalculateOrderTotals(order);

        order = orderRepository.save(order);
        return orderService.getOrder(currentUsername, order.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse removePointsFromOrder(String currentUsername, String orderId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (!"CREATING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_NOT_IN_CREATING_STATUS);
        }

        order.setPointDiscountAmount(BigDecimal.ZERO);
        order.setPointsRedeemed(0);

        OrderService orderService = orderServiceProvider.getObject();
        orderService.recalculateOrderTotals(order);

        order = orderRepository.save(order);
        return orderService.getOrder(currentUsername, order.getId());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void processPointsRedeemed(Order order, User currentUser) {
        if (order.getPointsRedeemed() == null || order.getPointsRedeemed() <= 0) {
            return;
        }
        if (order.getCustomer() == null) {
            return;
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                order.getCustomer().getId(), order.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        int pointsToRedeem = order.getPointsRedeemed();
        int curPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        if (curPoints < pointsToRedeem) {
            throw new AppException(ErrorCode.INSUFFICIENT_LOYALTY_POINTS);
        }

        int newBalance = curPoints - pointsToRedeem;
        customer.setLoyaltyPoints(newBalance);
        customerRepository.save(customer);

        CustomerPointTransaction transaction = CustomerPointTransaction.builder()
                .household(order.getHousehold())
                .customer(customer)
                .order(order)
                .type(PointTransactionType.REDEEM)
                .pointsChange(-pointsToRedeem)
                .balanceAfter(newBalance)
                .monetaryEquivalent(order.getPointDiscountAmount() != null ? order.getPointDiscountAmount() : BigDecimal.ZERO)
                .description("Đổi điểm thanh toán đơn hàng " + order.getOrderNumber())
                .createdByUser(currentUser)
                .build();

        transactionRepository.save(transaction);
        log.info("Khách hàng {} đã đổi {} điểm cho đơn hàng {}", customer.getId(), pointsToRedeem, order.getOrderNumber());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void earnPointsForCompletedOrder(Order order, User currentUser) {
        if (order.getCustomer() == null) {
            return;
        }

        LoyaltyProgramConfig config = configRepository.findByHouseholdId(order.getHousehold().getId())
                .orElse(null);

        if (config == null || !Boolean.TRUE.equals(config.getIsEnabled())) {
            return;
        }

        if (config.getSpendAmountPerPoint() == null || config.getSpendAmountPerPoint().compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        // Bóc tách thanh toán: Chỉ tính trên phần tiền thực trả (CASH, BANK_TRANSFER đã xác nhận).
        // TUYỆT ĐỐI KHÔNG TÍNH phần ghi nợ (DEBT).
        BigDecimal actualPaidAmount = BigDecimal.ZERO;
        if (order.getPayments() != null && !order.getPayments().isEmpty()) {
            for (OrderPayment payment : order.getPayments()) {
                if (Boolean.TRUE.equals(payment.getIsConfirmed())) {
                    String method = payment.getPaymentMethod();
                    if (PaymentMethodConstant.CASH.equals(method) || PaymentMethodConstant.BANK_TRANSFER.equals(method)) {
                        if (payment.getAmount() != null) {
                            actualPaidAmount = actualPaidAmount.add(payment.getAmount());
                        }
                    }
                }
            }
        } else {
            String method = order.getPaymentMethod();
            if (PaymentMethodConstant.CASH.equals(method) || PaymentMethodConstant.BANK_TRANSFER.equals(method)) {
                actualPaidAmount = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;
            }
        }

        if (actualPaidAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal pointsDecimal = actualPaidAmount.divide(config.getSpendAmountPerPoint(), 0, RoundingMode.FLOOR);
        int pointsEarned = pointsDecimal.intValue();

        if (pointsEarned <= 0) {
            return;
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                order.getCustomer().getId(), order.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        int curPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        int newBalance = curPoints + pointsEarned;
        customer.setLoyaltyPoints(newBalance);
        customerRepository.save(customer);

        order.setPointsEarned(pointsEarned);

        BigDecimal pointValue = config.getPointValue() != null ? config.getPointValue() : BigDecimal.ZERO;
        BigDecimal monetaryEquivalent = pointValue.multiply(BigDecimal.valueOf(pointsEarned));

        LocalDate expiryDate = null;
        if (config.getPointExpiryDays() != null && config.getPointExpiryDays() > 0) {
            expiryDate = LocalDate.now().plusDays(config.getPointExpiryDays());
        }

        CustomerPointTransaction transaction = CustomerPointTransaction.builder()
                .household(order.getHousehold())
                .customer(customer)
                .order(order)
                .type(PointTransactionType.EARN)
                .pointsChange(pointsEarned)
                .balanceAfter(newBalance)
                .monetaryEquivalent(monetaryEquivalent)
                .expiryDate(expiryDate)
                .description(String.format("Tích điểm từ đơn hàng %s (Tiền thực trả: %s VNĐ)", order.getOrderNumber(), actualPaidAmount.toPlainString()))
                .createdByUser(currentUser)
                .build();

        transactionRepository.save(transaction);
        log.info("Khách hàng {} được tích {} điểm từ đơn hàng {}", customer.getId(), pointsEarned, order.getOrderNumber());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deductPointsForReturnTicket(ReturnTicket returnTicket, User currentUser) {
        if (returnTicket.getCustomer() == null || returnTicket.getOriginalOrder() == null) {
            return;
        }

        Order originalOrder = returnTicket.getOriginalOrder();
        if (originalOrder.getPointsEarned() == null || originalOrder.getPointsEarned() <= 0) {
            return;
        }

        BigDecimal originalFinal = originalOrder.getFinalAmount();
        if (originalFinal == null || originalFinal.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        BigDecimal returnAmount = returnTicket.getTotalReturnAmount();
        if (returnAmount == null || returnAmount.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        // Tỷ lệ thu hồi điểm (đảm bảo không thu hồi vượt quá số điểm gốc đã tích lũy khi có nhiều phiếu trả hàng)
        Integer alreadyDeducted = transactionRepository.sumPointsDeductedByOrderId(originalOrder.getId());
        int totalEarned = originalOrder.getPointsEarned();
        int maxCanDeduct = Math.max(0, totalEarned - (alreadyDeducted != null ? alreadyDeducted : 0));
        if (maxCanDeduct <= 0) {
            return;
        }

        BigDecimal pointsDeductedDecimal = BigDecimal.valueOf(totalEarned)
                .multiply(returnAmount)
                .divide(originalFinal, 0, RoundingMode.HALF_UP);

        int pointsToDeduct = Math.min(pointsDeductedDecimal.intValue(), maxCanDeduct);
        if (pointsToDeduct <= 0) {
            return;
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                returnTicket.getCustomer().getId(), returnTicket.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        int curPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        int newBalance = Math.max(0, curPoints - pointsToDeduct);
        customer.setLoyaltyPoints(newBalance);
        customerRepository.save(customer);

        returnTicket.setPointsDeducted(pointsToDeduct);
        returnTicketRepository.save(returnTicket);

        CustomerPointTransaction transaction = CustomerPointTransaction.builder()
                .household(returnTicket.getHousehold())
                .customer(customer)
                .order(originalOrder)
                .returnTicket(returnTicket)
                .type(PointTransactionType.RETURN_DEDUCTION)
                .pointsChange(-pointsToDeduct)
                .balanceAfter(newBalance)
                .description(String.format("Thu hồi điểm do trả hàng theo phiếu %s (Đơn gốc %s)", returnTicket.getTicketNumber(), originalOrder.getOrderNumber()))
                .createdByUser(currentUser)
                .build();

        transactionRepository.save(transaction);
        log.info("Thu hồi {} điểm của khách hàng {} từ phiếu trả hàng {}", pointsToDeduct, customer.getId(), returnTicket.getTicketNumber());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public PointTransactionResponse adjustPointsManually(String currentUsername, String customerId, AdjustPointsRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        if (!isStoreOwner(currentUser)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(customerId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        int pointsChange = request.getPointsChange();
        if (pointsChange == 0) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        int curPoints = customer.getLoyaltyPoints() != null ? customer.getLoyaltyPoints() : 0;
        int newBalance = Math.max(0, curPoints + pointsChange);
        customer.setLoyaltyPoints(newBalance);
        customerRepository.save(customer);

        CustomerPointTransaction transaction = CustomerPointTransaction.builder()
                .household(household)
                .customer(customer)
                .type(PointTransactionType.ADJUST)
                .pointsChange(pointsChange)
                .balanceAfter(newBalance)
                .description(request.getReason())
                .createdByUser(currentUser)
                .build();

        transaction = transactionRepository.save(transaction);
        return mapTransactionToResponse(transaction);
    }

    private LoyaltyProgramConfigResponse mapConfigToResponse(LoyaltyProgramConfig config) {
        return LoyaltyProgramConfigResponse.builder()
                .id(config.getId())
                .householdId(config.getHousehold().getId())
                .isEnabled(config.getIsEnabled())
                .spendAmountPerPoint(config.getSpendAmountPerPoint())
                .pointValue(config.getPointValue())
                .minPointsToRedeem(config.getMinPointsToRedeem())
                .maxRedeemRatePerOrder(config.getMaxRedeemRatePerOrder())
                .pointExpiryDays(config.getPointExpiryDays())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    private PointTransactionResponse mapTransactionToResponse(CustomerPointTransaction tx) {
        return PointTransactionResponse.builder()
                .id(tx.getId())
                .customerId(tx.getCustomer() != null ? tx.getCustomer().getId() : null)
                .customerName(tx.getCustomer() != null ? tx.getCustomer().getName() : null)
                .orderId(tx.getOrder() != null ? tx.getOrder().getId() : null)
                .orderNumber(tx.getOrder() != null ? tx.getOrder().getOrderNumber() : null)
                .returnTicketId(tx.getReturnTicket() != null ? tx.getReturnTicket().getId() : null)
                .returnTicketNumber(tx.getReturnTicket() != null ? tx.getReturnTicket().getTicketNumber() : null)
                .type(tx.getType())
                .pointsChange(tx.getPointsChange())
                .balanceAfter(tx.getBalanceAfter())
                .monetaryEquivalent(tx.getMonetaryEquivalent())
                .description(tx.getDescription())
                .expiryDate(tx.getExpiryDate())
                .createdByUserId(tx.getCreatedByUser() != null ? tx.getCreatedByUser().getId() : null)
                .createdByUsername(tx.getCreatedByUser() != null ? tx.getCreatedByUser().getUsername() : null)
                .createdAt(tx.getCreatedAt())
                .build();
    }
}
