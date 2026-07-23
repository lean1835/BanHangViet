package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.constant.ShiftStatus;
import com.viet.sales.dto.request.SyncCheckRequest;
import com.viet.sales.dto.request.OfflineOrderRequest;
import com.viet.sales.dto.request.OfflineOrderItemRequest;
import com.viet.sales.dto.request.SyncResolveRequest;
import com.viet.sales.dto.response.SyncCheckResponse;
import com.viet.sales.dto.response.OrderResponse;
import com.viet.sales.dto.response.OrderItemResponse;
import com.viet.sales.dto.response.InvoiceResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.*;
import com.viet.sales.service.interfaces.SyncService;
import com.viet.sales.service.interfaces.EInvoiceService;
import com.viet.sales.constant.ConflictResolutionStrategy;
import com.viet.sales.event.OrderSyncedEvent;
import org.springframework.context.ApplicationEventPublisher;
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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SyncServiceImpl implements SyncService {

    private static final int MAX_SYNC_HOURS = 24;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final ShiftRepository shiftRepository;
    private final UserRepository userRepository;
    private final ActivityLogRepository activityLogRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final EInvoiceService eInvoiceService;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

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
                    .targetTable("orders")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to write activity log in sync service", e);
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

    private OrderResponse mapToResponse(Order order) {
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
                .warningMessages(new ArrayList<>())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public SyncCheckResponse checkConflicts(String username, SyncCheckRequest request) {
        User currentUser = getAuthenticatedUser(username);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<String> duplicates = new ArrayList<>();
        List<String> conflicts = new ArrayList<>();

        if (request.getOfflineOrderNumbers() != null && !request.getOfflineOrderNumbers().isEmpty()) {
            List<Order> existing = orderRepository.findByOrderNumberInAndHouseholdIdAndDeletedAtIsNull(
                    request.getOfflineOrderNumbers(), household.getId());
            duplicates = existing.stream().map(Order::getOrderNumber).collect(Collectors.toList());
        }

        return SyncCheckResponse.builder()
                .duplicates(duplicates)
                .conflicts(conflicts)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<OrderResponse> bulkUpload(String username, List<OfflineOrderRequest> requests) {
        User currentUser = getAuthenticatedUser(username);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<OrderResponse> responses = new ArrayList<>();

        if (requests == null || requests.isEmpty()) {
            return responses;
        }

        // Deduplicate payload by orderNumber to avoid duplicate orders in the same batch
        Map<String, OfflineOrderRequest> uniqueRequestsMap = new java.util.LinkedHashMap<>();
        for (OfflineOrderRequest req : requests) {
            if (req.getOrderNumber() != null && !req.getOrderNumber().trim().isEmpty()) {
                uniqueRequestsMap.putIfAbsent(req.getOrderNumber(), req);
            }
        }
        requests = new ArrayList<>(uniqueRequestsMap.values());

        // --- BATCH PRE-FETCHING (To prevent N+1 Queries) ---
        // 1. Existing orders map
        List<String> orderNumbers = requests.stream()
                .map(OfflineOrderRequest::getOrderNumber)
                .filter(num -> num != null && !num.trim().isEmpty())
                .collect(Collectors.toList());
        List<Order> existingOrders = orderNumbers.isEmpty() ? new ArrayList<>() :
                orderRepository.findByOrderNumberInAndHouseholdIdAndDeletedAtIsNull(orderNumbers, household.getId());
        Map<String, Order> existingOrderMap = existingOrders.stream()
                .collect(Collectors.toMap(Order::getOrderNumber, o -> o));

        // 2. Customers map
        List<String> customerIds = requests.stream()
                .map(OfflineOrderRequest::getCustomerId)
                .filter(id -> id != null && !id.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());
        List<Customer> customers = customerIds.isEmpty() ? new ArrayList<>() :
                customerRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(customerIds, household.getId());
        Map<String, Customer> customerMap = customers.stream()
                .collect(Collectors.toMap(Customer::getId, c -> c));

        // 3. Shifts map
        List<String> shiftIds = requests.stream()
                .map(OfflineOrderRequest::getShiftId)
                .filter(id -> id != null && !id.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());
        List<Shift> shifts = shiftIds.isEmpty() ? new ArrayList<>() :
                shiftRepository.findAllById(shiftIds);
        Map<String, Shift> shiftMap = shifts.stream()
                .collect(Collectors.toMap(Shift::getId, s -> s));

        // Fallback active open shift
        Shift activeShift = shiftRepository.findByUserIdAndStatus(currentUser.getId(), ShiftStatus.OPEN).orElse(null);

        // 4. Products map
        List<String> productIds = requests.stream()
                .filter(r -> r.getItems() != null)
                .flatMap(r -> r.getItems().stream())
                .map(OfflineOrderItemRequest::getProductId)
                .filter(id -> id != null && !id.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());
        List<Product> products = productIds.isEmpty() ? new ArrayList<>() :
                productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(productIds, household.getId());
        Map<String, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // -----------------------------------------------------

        for (OfflineOrderRequest req : requests) {
            List<String> warnings = new ArrayList<>();

            // 1. Check if order number already exists on server
            Order existing = existingOrderMap.get(req.getOrderNumber());
            if (existing != null) {
                // Already synced previously, skip duplicate creation to prevent double record
                responses.add(mapToResponse(existing));
                continue;
            }

            // Check overdue sync limit (QTN-11 & AC NCL-08-CN-002-TC-02)
            if (req.getCreatedAt() != null && req.getCreatedAt().isBefore(LocalDateTime.now().minusHours(MAX_SYNC_HOURS))) {
                warnings.add("Đơn hàng " + req.getOrderNumber() + " đồng bộ quá hạn quy định (24 giờ).");
            }

            // 2. Resolve shift
            Shift shift = null;
            if (req.getShiftId() != null && !req.getShiftId().trim().isEmpty()) {
                shift = shiftMap.get(req.getShiftId());
            }
            if (shift == null) {
                shift = activeShift;
            }

            // 3. Resolve customer
            Customer customer = null;
            if (req.getCustomerId() != null && !req.getCustomerId().trim().isEmpty()) {
                customer = customerMap.get(req.getCustomerId());
            }

            // 4. Create Order entity
            Order order = Order.builder()
                    .household(household)
                    .shift(shift)
                    .createdByUser(currentUser)
                    .customer(customer)
                    .orderNumber(req.getOrderNumber())
                    .totalAmount(req.getTotalAmount() != null ? req.getTotalAmount() : BigDecimal.ZERO)
                    .discountAmount(req.getDiscountAmount() != null ? req.getDiscountAmount() : BigDecimal.ZERO)
                    .finalAmount(req.getFinalAmount() != null ? req.getFinalAmount() : BigDecimal.ZERO)
                    .paymentMethod(req.getPaymentMethod())
                    .paymentStatus(req.getPaymentStatus() != null ? req.getPaymentStatus() : "PAID")
                    .status("COMPLETED")
                    .syncStatus("SYNCED")
                    .isOffline(true)
                    .syncedAt(LocalDateTime.now())
                    .discountType(req.getDiscountType())
                    .discountRateOrValue(req.getDiscountRateOrValue())
                    .build();

            // Explicitly set createdAt using the offline timestamp
            order.setCreatedAt(req.getCreatedAt());

            List<OrderItem> items = new ArrayList<>();

            if (req.getItems() != null) {
                for (OfflineOrderItemRequest itemReq : req.getItems()) {
                    Product product = productMap.get(itemReq.getProductId());
                    if (product == null) {
                        throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
                    }

                    // Subtract stock atomically
                    productRepository.deductStock(product.getId(), household.getId(), itemReq.getQuantity());

                    OrderItem orderItem = OrderItem.builder()
                            .order(order)
                            .product(product)
                            .productName(product.getName())
                            .quantity(itemReq.getQuantity())
                            .unitPrice(itemReq.getUnitPrice())
                            .discountAmount(itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO)
                            .taxRatePercentage(itemReq.getTaxRatePercentage() != null ? itemReq.getTaxRatePercentage() : BigDecimal.ZERO)
                            .taxAmount(itemReq.getTaxAmount() != null ? itemReq.getTaxAmount() : BigDecimal.ZERO)
                            .subtotal(itemReq.getSubtotal() != null ? itemReq.getSubtotal() : BigDecimal.ZERO)
                            .build();

                    items.add(orderItem);
                }
            }

            order.setItems(items);
            order = orderRepository.save(order);

            // Write activity logs
            logActivity(household, currentUser, "SYNC_OFFLINE_ORDER", order.getId(), null, buildOrderLogMap(order));

            // 5. Decoupled automatic invoice generation via Event Listener (running post-commit asynchronously)
            eventPublisher.publishEvent(new OrderSyncedEvent(username, order.getId()));

            OrderResponse orderResponse = mapToResponse(order);
            orderResponse.setWarningMessages(warnings);
            responses.add(orderResponse);
        }

        return responses;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse resolveConflict(String username, SyncResolveRequest request) {
        User currentUser = getAuthenticatedUser(username);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Only owner is allowed
        if (!"VT-01".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        ConflictResolutionStrategy strategy = request.getResolutionStrategy();
        String orderNo = request.getOrderNumber();

        Order serverOrder = orderRepository.findByOrderNumberAndHouseholdIdAndDeletedAtIsNull(orderNo, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (ConflictResolutionStrategy.KEEP_SERVER.equals(strategy)) {
            // Keep server data as-is, just log activity
            logActivity(household, currentUser, "RESOLVE_CONFLICT_KEEP_SERVER", serverOrder.getId(), null, buildOrderLogMap(serverOrder));
            return mapToResponse(serverOrder);

        } else if (ConflictResolutionStrategy.OVERWRITE_SERVER.equals(strategy)) {
            OfflineOrderRequest clientData = request.getClientOrderData();
            if (clientData == null) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }

            // 1. Revert previous stock changes atomically
            for (OrderItem item : serverOrder.getItems()) {
                if (item.getProduct() != null) {
                    productRepository.addStock(item.getProduct().getId(), household.getId(), item.getQuantity());
                }
            }

            // 2. Clear old items
            serverOrder.getItems().clear();
            orderRepository.saveAndFlush(serverOrder);

            // 3. Set new values
            serverOrder.setTotalAmount(clientData.getTotalAmount());
            serverOrder.setDiscountAmount(clientData.getDiscountAmount());
            serverOrder.setFinalAmount(clientData.getFinalAmount());
            serverOrder.setPaymentMethod(clientData.getPaymentMethod());
            serverOrder.setPaymentStatus(clientData.getPaymentStatus() != null ? clientData.getPaymentStatus() : "PAID");
            serverOrder.setDiscountType(clientData.getDiscountType());
            serverOrder.setDiscountRateOrValue(clientData.getDiscountRateOrValue());
            serverOrder.setSyncStatus("SYNCED");
            serverOrder.setSyncedAt(LocalDateTime.now());

            List<OrderItem> newItems = new ArrayList<>();

            if (clientData.getItems() != null) {
                for (OfflineOrderItemRequest itemReq : clientData.getItems()) {
                    Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(itemReq.getProductId(), household.getId())
                            .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

                    // Apply new stock subtraction atomically
                    productRepository.deductStock(product.getId(), household.getId(), itemReq.getQuantity());

                    OrderItem orderItem = OrderItem.builder()
                            .order(serverOrder)
                            .product(product)
                            .productName(product.getName())
                            .quantity(itemReq.getQuantity())
                            .unitPrice(itemReq.getUnitPrice())
                            .discountAmount(itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO)
                            .taxRatePercentage(itemReq.getTaxRatePercentage() != null ? itemReq.getTaxRatePercentage() : BigDecimal.ZERO)
                            .taxAmount(itemReq.getTaxAmount() != null ? itemReq.getTaxAmount() : BigDecimal.ZERO)
                            .subtotal(itemReq.getSubtotal() != null ? itemReq.getSubtotal() : BigDecimal.ZERO)
                            .build();

                    newItems.add(orderItem);
                }
            }

            serverOrder.getItems().addAll(newItems);
            serverOrder = orderRepository.save(serverOrder);

            // Log activity
            logActivity(household, currentUser, "RESOLVE_CONFLICT_OVERWRITE_SERVER", serverOrder.getId(), null, buildOrderLogMap(serverOrder));

            // Find existing invoice if any and delete/cancel in DB
            eInvoiceRepository.findByOrderIdAndDeletedAtIsNull(serverOrder.getId()).ifPresent(inv -> {
                inv.setDeletedAt(LocalDateTime.now());
                eInvoiceRepository.save(inv);
            });
            // Decoupled automatic invoice generation via Event Listener (running post-commit asynchronously)
            eventPublisher.publishEvent(new OrderSyncedEvent(username, serverOrder.getId()));

            return mapToResponse(serverOrder);

        } else if (ConflictResolutionStrategy.KEEP_BOTH.equals(strategy)) {
            OfflineOrderRequest clientData = request.getClientOrderData();
            if (clientData == null) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }

            // Modify order number to be unique
            String newOrderNo = orderNo + "-OFF-" + System.currentTimeMillis();

            // 1. Resolve shift
            Shift shift = null;
            if (clientData.getShiftId() != null && !clientData.getShiftId().trim().isEmpty()) {
                shift = shiftRepository.findById(clientData.getShiftId()).orElse(null);
            }
            if (shift == null) {
                shift = shiftRepository.findByUserIdAndStatus(currentUser.getId(), ShiftStatus.OPEN).orElse(null);
            }

            // 2. Resolve customer
            Customer customer = null;
            if (clientData.getCustomerId() != null && !clientData.getCustomerId().trim().isEmpty()) {
                customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(clientData.getCustomerId(), household.getId()).orElse(null);
            }

            // 3. Build new order
            Order newOrder = Order.builder()
                    .household(household)
                    .shift(shift)
                    .createdByUser(currentUser)
                    .customer(customer)
                    .orderNumber(newOrderNo)
                    .totalAmount(clientData.getTotalAmount())
                    .discountAmount(clientData.getDiscountAmount())
                    .finalAmount(clientData.getFinalAmount())
                    .paymentMethod(clientData.getPaymentMethod())
                    .paymentStatus(clientData.getPaymentStatus() != null ? clientData.getPaymentStatus() : "PAID")
                    .status("COMPLETED")
                    .syncStatus("SYNCED")
                    .isOffline(true)
                    .syncedAt(LocalDateTime.now())
                    .discountType(clientData.getDiscountType())
                    .discountRateOrValue(clientData.getDiscountRateOrValue())
                    .build();

            newOrder.setCreatedAt(clientData.getCreatedAt());

            List<OrderItem> items = new ArrayList<>();

            if (clientData.getItems() != null) {
                for (OfflineOrderItemRequest itemReq : clientData.getItems()) {
                    Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(itemReq.getProductId(), household.getId())
                            .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

                    // Subtract stock atomically
                    productRepository.deductStock(product.getId(), household.getId(), itemReq.getQuantity());

                    OrderItem orderItem = OrderItem.builder()
                            .order(newOrder)
                            .product(product)
                            .productName(product.getName())
                            .quantity(itemReq.getQuantity())
                            .unitPrice(itemReq.getUnitPrice())
                            .discountAmount(itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO)
                            .taxRatePercentage(itemReq.getTaxRatePercentage() != null ? itemReq.getTaxRatePercentage() : BigDecimal.ZERO)
                            .taxAmount(itemReq.getTaxAmount() != null ? itemReq.getTaxAmount() : BigDecimal.ZERO)
                            .subtotal(itemReq.getSubtotal() != null ? itemReq.getSubtotal() : BigDecimal.ZERO)
                            .build();

                    items.add(orderItem);
                }
            }

            newOrder.setItems(items);
            newOrder = orderRepository.save(newOrder);

            logActivity(household, currentUser, "RESOLVE_CONFLICT_KEEP_BOTH", newOrder.getId(), null, buildOrderLogMap(newOrder));

            // Decoupled automatic invoice generation via Event Listener (running post-commit asynchronously)
            eventPublisher.publishEvent(new OrderSyncedEvent(username, newOrder.getId()));

            return mapToResponse(newOrder);
        } else {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
    }
}
