package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.dto.request.*;
import com.viet.sales.dto.response.OrderItemResponse;
import com.viet.sales.dto.response.OrderResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.*;
import com.viet.sales.service.interfaces.OrderService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkOrderOwnership(Order order, User currentUser) {
        boolean isSalesperson = "VT-02".equals(currentUser.getRole().getCode());
        if (isSalesperson && !order.getCreatedByUser().getId().equals(currentUser.getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private void validateShiftIsOpen(Order order) {
        if (order.getShift() != null && order.getShift().getStatus() == ShiftStatus.CLOSED) {
            throw new AppException(ErrorCode.SHIFT_ALREADY_CLOSED);
        }
    }

    private String generateQrCodeUrl(Order order) {
        try {
            BusinessHousehold household = order.getHousehold();
            String bin = "970415"; // default VietinBank mock BIN
            String accNum = household.getTaxCode() != null && !household.getTaxCode().trim().isEmpty() 
                    ? household.getTaxCode() : "113366668888";
            String accName = java.net.URLEncoder.encode(household.getName(), "UTF-8");
            String addInfo = java.net.URLEncoder.encode("Thanh toan don hang " + order.getOrderNumber(), "UTF-8");
            return "https://api.vietqr.io/image/" + bin + "-" + accNum + "-jLq5qSg.jpg?accountName=" 
                    + accName + "&amount=" + order.getFinalAmount() + "&addInfo=" + addInfo;
        } catch (Exception e) {
            log.error("Failed to generate QR code URL", e);
            return null;
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

            ActivityLog logRecord = ActivityLog.builder()
                    .household(household)
                    .user(actor)
                    .action(action)
                    .targetTable("orders")
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

    private Map<String, Object> buildOrderLogMap(Order order) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", order.getId());
        map.put("orderNumber", order.getOrderNumber());
        map.put("totalAmount", order.getTotalAmount());
        map.put("discountAmount", order.getDiscountAmount());
        map.put("finalAmount", order.getFinalAmount());
        map.put("paymentMethod", order.getPaymentMethod());
        map.put("paymentStatus", order.getPaymentStatus());
        map.put("status", order.getStatus());
        return map;
    }

    private OrderResponse mapToResponse(Order order, List<String> warnings, BigDecimal changeAmount, String qrCodeUrl) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .discountAmount(item.getDiscountAmount())
                        .taxRatePercentage(item.getTaxRatePercentage())
                        .taxAmount(item.getTaxAmount())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .householdId(order.getHousehold().getId())
                .shiftId(order.getShift() != null ? order.getShift().getId() : null)
                .createdByUserId(order.getCreatedByUser().getId())
                .createdByUsername(order.getCreatedByUser().getUsername())
                .customerId(order.getCustomer() != null ? order.getCustomer().getId() : null)
                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : null)
                .totalAmount(order.getTotalAmount())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .status(order.getStatus())
                .syncStatus(order.getSyncStatus())
                .isOffline(order.getIsOffline())
                .syncedAt(order.getSyncedAt())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .items(itemResponses)
                .warningMessages(warnings)
                .changeAmount(changeAmount)
                .qrCodeUrl(qrCodeUrl)
                .build();
    }

    private List<String> checkStockWarnings(Order order) {
        List<String> warnings = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product product = item.getProduct();
                if (item.getQuantity().compareTo(product.getStockQuantity()) > 0) {
                    warnings.add("Sản phẩm '" + product.getName() + "' vượt quá số lượng tồn kho khả dụng (Yêu cầu: " 
                            + item.getQuantity() + ", Hiện có: " + product.getStockQuantity() + ")");
                }
            }
        }
        return warnings;
    }

    private void recalculateOrderTotals(Order order) {
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            total = total.add(item.getSubtotal());
        }
        order.setTotalAmount(total);

        BigDecimal discountAmount = order.getDiscountAmount();
        if (order.getDiscountType() != null) {
            if ("PERCENTAGE".equals(order.getDiscountType())) {
                BigDecimal rate = order.getDiscountRateOrValue() != null ? order.getDiscountRateOrValue() : BigDecimal.ZERO;
                discountAmount = total.multiply(rate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            } else if ("CASH".equals(order.getDiscountType())) {
                discountAmount = order.getDiscountRateOrValue() != null ? order.getDiscountRateOrValue() : BigDecimal.ZERO;
            }
        }
        if (discountAmount.compareTo(total) > 0) {
            discountAmount = total;
        }
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(total.subtract(discountAmount).max(BigDecimal.ZERO));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse createOrder(String currentUsername, CreateOrderRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // QTN-15 / NCL-03-CN-006-TC-02: Check active shift
        Shift activeShift = shiftRepository.findByUserIdAndStatus(currentUser.getId(), ShiftStatus.OPEN)
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));

        // Lock the active shift to prevent concurrency race with closeShift
        activeShift = shiftRepository.findByIdForUpdate(activeShift.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND));

        if (activeShift.getStatus() == ShiftStatus.CLOSED) {
            throw new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND);
        }

        Customer customer = null;
        if (request.getCustomerId() != null && !request.getCustomerId().trim().isEmpty()) {
            customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getCustomerId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
        }

        String orderNumber = "OD-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100);

        Order order = Order.builder()
                .household(household)
                .shift(activeShift)
                .createdByUser(currentUser)
                .customer(customer)
                .orderNumber(orderNumber)
                .totalAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .paymentMethod("CASH")
                .paymentStatus("PENDING")
                .status("CREATING")
                .syncStatus("SYNCED")
                .isOffline(false)
                .build();

        order = orderRepository.save(order);

        logActivity(household, currentUser, "CREATE_ORDER", order.getId(), null, buildOrderLogMap(order));

        return mapToResponse(order, new ArrayList<>(), null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse addOrderItem(String currentUsername, String orderId, CreateOrderItemRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        checkOrderOwnership(order, currentUser);
        validateShiftIsOpen(order);

        if (!"CREATING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PAID);
        }

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getProductId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        OrderItem existingItem = order.getItems().stream()
                .filter(item -> item.getProduct() != null && item.getProduct().getId().equals(product.getId()))
                .findFirst().orElse(null);

        BigDecimal quantityToAdd = request.getQuantity();
        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity().add(quantityToAdd));
            // Recalculate item line subtotal
            BigDecimal baseAmount = existingItem.getQuantity().multiply(existingItem.getUnitPrice()).subtract(existingItem.getDiscountAmount());
            BigDecimal taxAmount = baseAmount.multiply(existingItem.getTaxRatePercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            existingItem.setTaxAmount(taxAmount);
            existingItem.setSubtotal(baseAmount.add(taxAmount));
        } else {
            BigDecimal baseAmount = quantityToAdd.multiply(product.getPrice());
            BigDecimal taxRate = product.getTaxRate().getRatePercentage();
            BigDecimal taxAmount = baseAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal subtotal = baseAmount.add(taxAmount);

            OrderItem newItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .quantity(quantityToAdd)
                    .unitPrice(product.getPrice())
                    .discountAmount(BigDecimal.ZERO)
                    .taxRatePercentage(taxRate)
                    .taxAmount(taxAmount)
                    .subtotal(subtotal)
                    .build();
            order.getItems().add(newItem);
        }

        recalculateOrderTotals(order);
        order = orderRepository.save(order);

        List<String> warnings = checkStockWarnings(order);

        logActivity(household, currentUser, "ADD_ORDER_ITEM", order.getId(), null, buildOrderLogMap(order));

        return mapToResponse(order, warnings, null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse updateOrderItem(String currentUsername, String orderId, String itemId, UpdateOrderItemRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        checkOrderOwnership(order, currentUser);
        validateShiftIsOpen(order);

        if (!"CREATING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PAID);
        }

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));

        item.setQuantity(request.getQuantity());
        BigDecimal baseAmount = item.getQuantity().multiply(item.getUnitPrice()).subtract(item.getDiscountAmount());
        BigDecimal taxAmount = baseAmount.multiply(item.getTaxRatePercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        item.setTaxAmount(taxAmount);
        item.setSubtotal(baseAmount.add(taxAmount));

        recalculateOrderTotals(order);
        order = orderRepository.save(order);

        List<String> warnings = checkStockWarnings(order);

        logActivity(household, currentUser, "UPDATE_ORDER_ITEM", order.getId(), null, buildOrderLogMap(order));

        return mapToResponse(order, warnings, null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse deleteOrderItem(String currentUsername, String orderId, String itemId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        checkOrderOwnership(order, currentUser);
        validateShiftIsOpen(order);

        if (!"CREATING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PAID);
        }

        OrderItem item = order.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_ITEM_NOT_FOUND));

        order.getItems().remove(item);

        recalculateOrderTotals(order);
        order = orderRepository.save(order);

        List<String> warnings = checkStockWarnings(order);

        logActivity(household, currentUser, "DELETE_ORDER_ITEM", order.getId(), null, buildOrderLogMap(order));

        return mapToResponse(order, warnings, null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse applyDiscount(String currentUsername, String orderId, ApplyDiscountRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        checkOrderOwnership(order, currentUser);
        validateShiftIsOpen(order);

        if (!"CREATING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PAID);
        }

        BigDecimal discountAmount;
        if ("PERCENTAGE".equals(request.getDiscountType())) {
            discountAmount = order.getTotalAmount().multiply(request.getDiscountValue()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discountAmount = request.getDiscountValue();
        }

        if (discountAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        if (discountAmount.compareTo(order.getTotalAmount()) > 0) {
            throw new AppException(ErrorCode.DISCOUNT_EXCEEDS_TOTAL);
        }

        // Check salesperson limit (10% of total amount) - Removed/Commented out to allow up to 100% discount
        // boolean isOwner = "VT-01".equals(currentUser.getRole().getCode());
        // if (!isOwner) {
        //     BigDecimal maxAllowedDiscount = order.getTotalAmount().multiply(BigDecimal.valueOf(0.10));
        //     if (discountAmount.compareTo(maxAllowedDiscount) > 0) {
        //         throw new AppException(ErrorCode.DISCOUNT_LIMIT_EXCEEDED);
        //     }
        // }

        order.setDiscountType(request.getDiscountType());
        order.setDiscountRateOrValue(request.getDiscountValue());
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(order.getTotalAmount().subtract(discountAmount));

        order = orderRepository.save(order);

        logActivity(household, currentUser, "APPLY_DISCOUNT", order.getId(), null, buildOrderLogMap(order));

        return mapToResponse(order, checkStockWarnings(order), null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse setPaymentMethod(String currentUsername, String orderId, OrderPaymentRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        checkOrderOwnership(order, currentUser);
        validateShiftIsOpen(order);

        if (!"CREATING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PAID);
        }

        String method = request.getPaymentMethod();
        String qrCodeUrl = null;

        if ("BANK_TRANSFER".equals(method)) {
            order.setPaymentMethod("BANK_TRANSFER");
            order.setPaymentStatus("PENDING");
            qrCodeUrl = generateQrCodeUrl(order);
        } else if ("DEBT".equals(method)) {
            if (order.getCustomer() == null) {
                throw new AppException(ErrorCode.CUSTOMER_REQUIRED_FOR_DEBT);
            }
            // Concurrency fix: lock the Customer entity for update
            Customer customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                    order.getCustomer().getId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

            BigDecimal potentialDebt = customer.getCurrentDebt().add(order.getFinalAmount());
            if (potentialDebt.compareTo(customer.getCreditLimit()) > 0) {
                throw new AppException(ErrorCode.CREDIT_LIMIT_EXCEEDED);
            }
            order.setCustomer(customer);
            order.setPaymentMethod("DEBT");
            order.setPaymentStatus("DEBT");
        } else {
            order.setPaymentMethod("CASH");
            order.setPaymentStatus("PENDING");
        }

        order = orderRepository.save(order);

        logActivity(household, currentUser, "SET_PAYMENT_METHOD", order.getId(), null, buildOrderLogMap(order));

        return mapToResponse(order, checkStockWarnings(order), null, qrCodeUrl);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse completeOrder(String currentUsername, String orderId, CompleteOrderRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        checkOrderOwnership(order, currentUser);
        validateShiftIsOpen(order);

        if (!"CREATING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_PAID);
        }

        if (order.getPaymentMethod() == null) {
            throw new AppException(ErrorCode.PAYMENT_METHOD_NOT_SELECTED);
        }

        if (order.getItems().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        BigDecimal changeAmount = null;

        if ("CASH".equals(order.getPaymentMethod())) {
            if (request == null || request.getAmountGiven() == null) {
                throw new AppException(ErrorCode.INSUFFICIENT_PAYMENT);
            }
            BigDecimal amountGiven = request.getAmountGiven();
            if (amountGiven.compareTo(order.getFinalAmount()) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_PAYMENT);
            }
            changeAmount = amountGiven.subtract(order.getFinalAmount());
            order.setPaymentStatus("PAID");
        } else if ("BANK_TRANSFER".equals(order.getPaymentMethod())) {
            order.setPaymentStatus("PAID");
        } else if ("DEBT".equals(order.getPaymentMethod())) {
            Customer customer = order.getCustomer();
            if (customer == null) {
                throw new AppException(ErrorCode.CUSTOMER_REQUIRED_FOR_DEBT);
            }
            // Concurrency fix: lock the Customer entity for update
            customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                    customer.getId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

            BigDecimal potentialDebt = customer.getCurrentDebt().add(order.getFinalAmount());
            if (potentialDebt.compareTo(customer.getCreditLimit()) > 0) {
                throw new AppException(ErrorCode.CREDIT_LIMIT_EXCEEDED);
            }
            customer.setCurrentDebt(potentialDebt);
            customerRepository.save(customer);
            order.setCustomer(customer);
            order.setPaymentStatus("DEBT");
        }

        // Get warnings before deduction
        List<String> warnings = checkStockWarnings(order);

        // Logic fix: Subtract physical stock quantity
        List<Product> productsToSave = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product product = item.getProduct();
                product.setStockQuantity(product.getStockQuantity().subtract(item.getQuantity()));
                productsToSave.add(product);
            }
        }
        if (!productsToSave.isEmpty()) {
            productRepository.saveAll(productsToSave);
        }

        order.setStatus("COMPLETED");
        order.setSyncedAt(LocalDateTime.now());

        order = orderRepository.save(order);

        logActivity(household, currentUser, "COMPLETE_ORDER", order.getId(), null, buildOrderLogMap(order));

        return mapToResponse(order, warnings, changeAmount, null);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(String currentUsername, String orderId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        checkOrderOwnership(order, currentUser);

        List<String> warnings = "CREATING".equals(order.getStatus()) ? checkStockWarnings(order) : new ArrayList<>();

        String qrCodeUrl = null;
        if ("BANK_TRANSFER".equals(order.getPaymentMethod()) && "PENDING".equals(order.getPaymentStatus())) {
            qrCodeUrl = generateQrCodeUrl(order);
        }

        return mapToResponse(order, warnings, null, qrCodeUrl);
    }
}
