package com.sales.service.classes;

import com.sales.constant.DebtStatus;
import com.sales.constant.DebtType;
import com.sales.constant.RoundingRule;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.*;
import com.sales.dto.response.CalculateWeightResponse;
import com.sales.dto.response.OrderItemResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.OrderService;
import com.sales.service.interfaces.PosInventoryService;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;
    private final CustomerDebtRepository customerDebtRepository;
    private final com.sales.service.interfaces.PromotionService promotionService;
    private final com.sales.repository.PromotionRepository promotionRepository;
    private final PosInventoryRepository posInventoryRepository;
    private final PosInventoryService posInventoryService;
    private final ProductUnitConversionRepository productUnitConversionRepository;
    private final com.sales.service.interfaces.ProductPriceTierService productPriceTierService;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkOrderOwnership(Order order, User currentUser) {
        boolean isSalesperson = "VT-02".equals(currentUser.getRole().getCode());
        if (isSalesperson) {
            if (currentUser.getPointOfSale() != null && order.getPointOfSale() != null
                    && !currentUser.getPointOfSale().getId().equals(order.getPointOfSale().getId())) {
                throw new AppException(ErrorCode.POS_EMPLOYEE_ACCESS_DENIED);
            }
            if (!order.getCreatedByUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }
    }

    private void validateShiftIsOpen(Order order) {
        if (order.getShift() != null && order.getShift().getStatus() == ShiftStatus.CLOSED) {
            throw new AppException(ErrorCode.SHIFT_ALREADY_CLOSED);
        }
    }

    private String getClientIp() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest().getRemoteAddr() : null;
    }

    private String getUserAgent() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest().getHeader("User-Agent") : null;
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

            activityLogHelper.logActivityInNewTransaction(household, actor, action, "orders", targetId, oldStr, newStr, clientIp, userAgent);
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
        map.put("customerDiscountAmount", order.getCustomerDiscountAmount());
        map.put("promotionDiscountAmount", order.getPromotionDiscountAmount());
        map.put("finalAmount", order.getFinalAmount());
        map.put("paymentMethod", order.getPaymentMethod());
        map.put("paymentStatus", order.getPaymentStatus());
        map.put("status", order.getStatus());
        return map;
    }

    private RoundingRule resolveRoundingRule(BusinessHousehold household) {
        if (household != null && household.getRoundingRule() != null) {
            try {
                return RoundingRule.valueOf(household.getRoundingRule());
            } catch (Exception ignored) {
                return RoundingRule.HALF_UP;
            }
        }
        return RoundingRule.HALF_UP;
    }

    private BigDecimal resolveQuantity(Product product, BigDecimal inputQuantity, BigDecimal buyAmount, BigDecimal itemUnitPrice, BigDecimal conversionFactor) {
        if (buyAmount != null && buyAmount.compareTo(BigDecimal.ZERO) > 0) {
            if (!Boolean.TRUE.equals(product.getIsSoldByWeight())) {
                throw new AppException(ErrorCode.NON_WEIGHT_PRODUCT_DECIMAL_NOT_ALLOWED);
            }
            if (itemUnitPrice == null || itemUnitPrice.compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            BigDecimal factor = (conversionFactor != null && conversionFactor.compareTo(BigDecimal.ZERO) > 0)
                    ? conversionFactor
                    : BigDecimal.ONE;
            BigDecimal baseMinStep = product.getMinWeightStep() != null ? product.getMinWeightStep() : new BigDecimal("0.001");
            BigDecimal minStep = baseMinStep.divide(factor, 6, RoundingMode.HALF_UP);
            int maxDecimals = product.getDecimalPlaces() != null ? product.getDecimalPlaces() : 3;

            BigDecimal rawQty = buyAmount.divide(itemUnitPrice, 8, RoundingMode.HALF_UP);
            BigDecimal steps = rawQty.divide(minStep, 0, RoundingMode.HALF_UP);
            if (steps.compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.BUY_AMOUNT_TOO_SMALL);
            }
            return steps.multiply(minStep).setScale(maxDecimals, RoundingMode.HALF_UP);
        }

        if (inputQuantity == null || inputQuantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }
        return inputQuantity;
    }

    private void validateWeightQuantity(Product product, BigDecimal quantity, BigDecimal conversionFactor) {
        if (Boolean.TRUE.equals(product.getIsSoldByWeight())) {
            BigDecimal factor = (conversionFactor != null && conversionFactor.compareTo(BigDecimal.ZERO) > 0)
                    ? conversionFactor
                    : BigDecimal.ONE;

            // Quy đổi số lượng về đơn vị cơ sở trước khi kiểm tra
            BigDecimal baseQuantity = quantity.multiply(factor);
            BigDecimal minStep = product.getMinWeightStep() != null ? product.getMinWeightStep() : new BigDecimal("0.001");
            int maxDecimals = product.getDecimalPlaces() != null ? product.getDecimalPlaces() : 3;

            // TC-02: Số lượng nhập nhỏ hơn bước nhảy tối thiểu
            if (baseQuantity.compareTo(minStep) < 0) {
                throw new AppException(ErrorCode.WEIGHT_STEP_INVALID);
            }

            // Kiểm tra số chữ số thập phân
            BigDecimal stripped = baseQuantity.stripTrailingZeros();
            if (stripped.scale() > maxDecimals) {
                throw new AppException(ErrorCode.DECIMAL_PLACES_EXCEEDED);
            }

            // Kiểm tra bội số của bước nhảy tối thiểu
            BigDecimal remainder = baseQuantity.remainder(minStep);
            BigDecimal tolerance = new BigDecimal("0.00001");
            if (remainder.compareTo(tolerance) > 0 && remainder.compareTo(minStep.subtract(tolerance)) < 0) {
                throw new AppException(ErrorCode.WEIGHT_STEP_INVALID);
            }
        } else {
            // Hàng thường không bán theo cân: bắt buộc số nguyên
            if (quantity.remainder(BigDecimal.ONE).compareTo(BigDecimal.ZERO) != 0) {
                throw new AppException(ErrorCode.NON_WEIGHT_PRODUCT_DECIMAL_NOT_ALLOWED);
            }
        }
    }

    private void calculateAndApplyLineRounding(OrderItem item, BusinessHousehold household, BigDecimal baseAmount, BigDecimal taxAmount) {
        BigDecimal exactSubtotal = baseAmount.add(taxAmount);
        RoundingRule rule = resolveRoundingRule(household);
        BigDecimal roundedSubtotal = rule.applyRounding(exactSubtotal);
        BigDecimal roundingDifference = roundedSubtotal.subtract(exactSubtotal).setScale(2, RoundingMode.HALF_UP);

        item.setSubtotal(roundedSubtotal);
        item.setRoundingDifference(roundingDifference);
    }

    private void validateOrderIntegrityQTN07(Order order) {
        Set<String> seenIds = new HashSet<>();
        BigDecimal sumSubtotals = BigDecimal.ZERO;
        for (OrderItem item : order.getItems()) {
            if (item.getId() != null) {
                if (!seenIds.add(item.getId())) {
                    continue;
                }
            }
            BigDecimal sub = item.getSubtotal() != null ? item.getSubtotal() : BigDecimal.ZERO;
            sumSubtotals = sumSubtotals.add(sub);
        }
        sumSubtotals = sumSubtotals.setScale(2, RoundingMode.HALF_UP);

        if (order.getTotalAmount() == null || order.getTotalAmount().setScale(2, RoundingMode.HALF_UP).compareTo(sumSubtotals) != 0) {
            log.error("QTN-07: Tổng tiền đơn hàng [{}] không khớp với tổng thành tiền các dòng hàng [{}]",
                    order.getTotalAmount(), sumSubtotals);
            throw new AppException(ErrorCode.ORDER_TOTAL_MISMATCH);
        }
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
                        .promotionId(item.getPromotion() != null ? item.getPromotion().getId() : null)
                        .promotionName(item.getPromotionName())
                        .priceTierId(item.getPriceTier() != null ? item.getPriceTier().getId() : null)
                        .priceTierName(item.getPriceTierName())
                        .taxRatePercentage(item.getTaxRatePercentage())
                        .taxAmount(item.getTaxAmount())
                        .roundingDifference(item.getRoundingDifference() != null ? item.getRoundingDifference() : BigDecimal.ZERO.setScale(2))
                        .subtotal(item.getSubtotal())
                        .unitConversionId(item.getUnitConversionId())
                        .unitName(item.getUnitName() != null ? item.getUnitName() : (item.getProduct() != null ? item.getProduct().getUnit() : null))
                        .conversionFactor(item.getConversionFactor() != null ? item.getConversionFactor() : BigDecimal.ONE)
                        .baseQuantity(item.getBaseQuantity() != null ? item.getBaseQuantity() : item.getQuantity())
                        .isSoldByWeight(item.getProduct() != null ? item.getProduct().getIsSoldByWeight() : false)
                        .decimalPlaces(item.getProduct() != null ? item.getProduct().getDecimalPlaces() : 0)
                        .minWeightStep(item.getProduct() != null ? item.getProduct().getMinWeightStep() : BigDecimal.ONE)
                        .build())
                .collect(Collectors.toList());

        BigDecimal debtAmount = BigDecimal.ZERO;
        BigDecimal paidAmount = order.getFinalAmount();

        if ("DEBT".equals(order.getPaymentMethod())) {
            CustomerDebt debtRecord = customerDebtRepository.findFirstByOrderIdAndType(order.getId(), DebtType.DEBT_CREATED).orElse(null);
            if (debtRecord != null) {
                debtAmount = debtRecord.getAmount();
                paidAmount = order.getFinalAmount().subtract(debtAmount).max(BigDecimal.ZERO);
            } else if ("PAID".equals(order.getPaymentStatus())) {
                debtAmount = BigDecimal.ZERO;
                paidAmount = order.getFinalAmount();
            } else {
                debtAmount = order.getFinalAmount();
                paidAmount = BigDecimal.ZERO;
            }
        } else if ("CASH".equals(order.getPaymentMethod())) {
            paidAmount = order.getFinalAmount().add(changeAmount != null ? changeAmount : BigDecimal.ZERO);
        }

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
                .customerDiscountAmount(order.getCustomerDiscountAmount())
                .promotionDiscountAmount(order.getPromotionDiscountAmount())
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
                .paidAmount(paidAmount)
                .debtAmount(debtAmount)
                .qrCodeUrl(qrCodeUrl)
                .build();
    }

    private List<String> checkStockWarnings(Order order) {
        List<String> warnings = new ArrayList<>();
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product product = item.getProduct();
                BigDecimal reqQty = item.getBaseQuantity() != null ? item.getBaseQuantity() : item.getQuantity();
                if (reqQty != null && product.getStockQuantity() != null && reqQty.compareTo(product.getStockQuantity()) > 0) {
                    warnings.add("Sản phẩm '" + product.getName() + "' vượt quá số lượng tồn kho khả dụng (Yêu cầu: " 
                            + reqQty + ", Hiện có: " + product.getStockQuantity() + ")");
                }
            }
        }
        return warnings;
    }

    private void recalculateOrderTotals(Order order) {
        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalCartAmount = BigDecimal.ZERO;
        BigDecimal itemPromoDiscountSum = BigDecimal.ZERO;

        // Khử trùng lặp thực thể OrderItem do Join Fetch / EntityGraph
        List<OrderItem> uniqueItems = new ArrayList<>();
        Set<String> seenIds = new HashSet<>();
        for (OrderItem item : order.getItems()) {
            if (item.getId() != null) {
                if (seenIds.add(item.getId())) {
                    uniqueItems.add(item);
                }
            } else {
                uniqueItems.add(item);
            }
        }

        for (OrderItem item : uniqueItems) {
            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
            BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal lineDiscount = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal lineBase = qty.multiply(price).subtract(lineDiscount);

            totalCartAmount = totalCartAmount.add(lineBase);
            itemPromoDiscountSum = itemPromoDiscountSum.add(lineDiscount);

            if (item.getSubtotal() != null) {
                totalSubtotal = totalSubtotal.add(item.getSubtotal());
            }
        }
        order.setTotalAmount(totalSubtotal);

        // Bước 1: Khuyến mại tự động SP -> itemPromoDiscountSum (đã trừ trong totalCartAmount)

        // Bước 2: Chiết khấu khách VIP (áp dụng trên số tiền sau KM tự động: totalCartAmount)
        BigDecimal customerDiscountAmount = BigDecimal.ZERO;
        if (order.getCustomer() != null && order.getCustomer().getDiscountRate() != null
                && order.getCustomer().getDiscountRate().compareTo(BigDecimal.ZERO) > 0) {
            Customer cust = order.getCustomer();
            if ("PERCENTAGE".equalsIgnoreCase(cust.getDiscountType())) {
                customerDiscountAmount = totalCartAmount.multiply(cust.getDiscountRate())
                        .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP).setScale(2);
            } else {
                customerDiscountAmount = totalCartAmount.min(cust.getDiscountRate()).setScale(0, RoundingMode.HALF_UP).setScale(2);
            }
        }

        // Số tiền còn lại sau Bước 2 (sau chiết khấu VIP)
        BigDecimal afterVipAmount = totalCartAmount.subtract(customerDiscountAmount).max(BigDecimal.ZERO);

        // Bước 3: Chiết khấu thêm (áp dụng trên số tiền sau chiết khấu VIP: afterVipAmount)
        BigDecimal manualDiscount = BigDecimal.ZERO;
        if (order.getDiscountType() != null) {
            if ("PERCENTAGE".equals(order.getDiscountType())) {
                BigDecimal rate = order.getDiscountRateOrValue() != null ? order.getDiscountRateOrValue() : BigDecimal.ZERO;
                manualDiscount = afterVipAmount.multiply(rate).divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP).setScale(2);
            } else if ("CASH".equals(order.getDiscountType())) {
                manualDiscount = order.getDiscountRateOrValue() != null ? afterVipAmount.min(order.getDiscountRateOrValue()).setScale(0, RoundingMode.HALF_UP).setScale(2) : BigDecimal.ZERO;
            }
        }

        BigDecimal afterDiscountAmount = afterVipAmount.subtract(manualDiscount).max(BigDecimal.ZERO);

        // Bước 4: Thuế GTGT (VAT) được tính trên giá sau khi chiết khấu thêm (afterDiscountAmount)
        BigDecimal finalTaxAmount = BigDecimal.ZERO;
        if (totalCartAmount.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal discountRatio = afterDiscountAmount.divide(totalCartAmount, 6, RoundingMode.HALF_UP);
            for (OrderItem item : uniqueItems) {
                BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
                BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal lineDiscount = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal lineBase = qty.multiply(price).subtract(lineDiscount);
                BigDecimal discountedLineBase = lineBase.multiply(discountRatio);
                BigDecimal taxRate = item.getTaxRatePercentage() != null ? item.getTaxRatePercentage() : BigDecimal.ZERO;
                BigDecimal lineTax = discountedLineBase.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                finalTaxAmount = finalTaxAmount.add(lineTax);
            }
        }

        // Làm tròn tiền thuế và tiền thanh toán cuối cùng về số nguyên đồng (VND không có số lẻ thập phân)
        finalTaxAmount = finalTaxAmount.setScale(0, RoundingMode.HALF_UP).setScale(2);

        // Bước 5: Khách cần trả (finalAmount = afterDiscountAmount + finalTaxAmount)
        BigDecimal finalAmount = afterDiscountAmount.add(finalTaxAmount).max(BigDecimal.ZERO).setScale(0, RoundingMode.HALF_UP).setScale(2);

        BigDecimal promotionDiscountAmount = itemPromoDiscountSum.add(manualDiscount).setScale(0, RoundingMode.HALF_UP).setScale(2);
        BigDecimal totalDiscount = itemPromoDiscountSum.add(customerDiscountAmount).add(manualDiscount).setScale(0, RoundingMode.HALF_UP).setScale(2);

        order.setPromotionDiscountAmount(promotionDiscountAmount);
        order.setCustomerDiscountAmount(customerDiscountAmount);
        order.setDiscountAmount(totalDiscount);
        order.setFinalAmount(finalAmount);
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

        if (activeShift.getStatus() == ShiftStatus.CLOSED) {
            throw new AppException(ErrorCode.ACTIVE_SHIFT_NOT_FOUND);
        }

        Customer customer = null;
        if (request.getCustomerId() != null && !request.getCustomerId().trim().isEmpty()) {
            customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getCustomerId(), household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
        }

        String orderNumber = "OD-" + System.currentTimeMillis() + "-" + (int) (Math.random() * 900 + 100);

        PointOfSale pointOfSale = currentUser.getPointOfSale() != null 
                ? currentUser.getPointOfSale() 
                : (activeShift != null ? activeShift.getPointOfSale() : null);

        Order order = Order.builder()
                .household(household)
                .shift(activeShift)
                .pointOfSale(pointOfSale)
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

        // NCL-17-CN-002-TC-03: Kiểm tra sản phẩm đã được khai tồn tại điểm bán chưa
        if (order.getPointOfSale() != null) {
            if (!posInventoryRepository.existsByPointOfSaleIdAndProductId(order.getPointOfSale().getId(), product.getId())) {
                throw new AppException(ErrorCode.POS_PRODUCT_NOT_INITIALIZED);
            }
        }

        ProductUnitConversion conversion = null;
        if (org.springframework.util.StringUtils.hasText(request.getUnitConversionId())) {
            conversion = productUnitConversionRepository.findByIdAndProductId(request.getUnitConversionId(), product.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.UNIT_CONVERSION_NOT_FOUND));
        }

        String unitConversionId = conversion != null ? conversion.getId() : null;
        String unitName = conversion != null ? conversion.getUnitName() : product.getUnit();
        BigDecimal conversionFactor = conversion != null ? conversion.getConversionFactor() : BigDecimal.ONE;
        BigDecimal itemUnitPrice = (conversion != null && conversion.getPrice() != null)
                ? conversion.getPrice()
                : (conversion != null ? product.getPrice().multiply(conversion.getConversionFactor()) : product.getPrice());

        OrderItem existingItem = order.getItems().stream()
                .filter(item -> item.getProduct() != null 
                        && item.getProduct().getId().equals(product.getId())
                        && java.util.Objects.equals(item.getUnitConversionId(), unitConversionId))
                .findFirst().orElse(null);

        BigDecimal quantityToAdd = resolveQuantity(product, request.getQuantity(), request.getBuyAmount(), itemUnitPrice, conversionFactor);
        validateWeightQuantity(product, quantityToAdd, conversionFactor);

        BigDecimal targetQuantity = existingItem != null ? existingItem.getQuantity().add(quantityToAdd) : quantityToAdd;
        validateWeightQuantity(product, targetQuantity, conversionFactor);
        BigDecimal targetBaseQuantity = targetQuantity.multiply(conversionFactor);

        ProductPriceTier matchedTier = (productPriceTierService != null && product != null)
                ? productPriceTierService.matchPriceTier(household.getId(), product, targetQuantity, unitConversionId)
                : null;

        com.sales.dto.response.PromotionItemResultResponse promoResult = promotionService.calculateItemPromotion(
                currentUser,
                product,
                targetQuantity,
                itemUnitPrice,
                request.getBypassPromotion()
        );

        com.sales.dto.response.PricingDecision decision = productPriceTierService != null
                ? productPriceTierService.resolvePricingDecision(
                        itemUnitPrice,
                        matchedTier,
                        promoResult,
                        targetQuantity
                )
                : null;

        BigDecimal effectiveUnitPrice = (decision != null && decision.getUnitPrice() != null) ? decision.getUnitPrice() : itemUnitPrice;
        BigDecimal effectiveDiscount = (decision != null && decision.getDiscountAmount() != null)
                ? decision.getDiscountAmount()
                : (promoResult != null && promoResult.getDiscountAmount() != null ? promoResult.getDiscountAmount() : BigDecimal.ZERO);
        String appliedPromoName = decision != null ? decision.getPromotionName() : (promoResult != null ? promoResult.getPromotionName() : null);
        Promotion promoEntity = decision != null && decision.getPromotion() != null
                ? decision.getPromotion()
                : (appliedPromoName != null && promoResult != null && promoResult.getPromotionId() != null
                        ? promotionRepository.findById(promoResult.getPromotionId()).orElse(null)
                        : null);
        ProductPriceTier appliedTier = decision != null ? decision.getPriceTier() : null;
        String appliedTierName = decision != null ? decision.getPriceTierName() : null;

        BigDecimal taxRate = product.getTaxRate() != null ? product.getTaxRate().getRatePercentage() : BigDecimal.ZERO;
        BigDecimal baseAmount = targetQuantity.multiply(effectiveUnitPrice).subtract(effectiveDiscount);
        BigDecimal taxAmount = baseAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        if (existingItem != null) {
            existingItem.setQuantity(targetQuantity);
            existingItem.setBaseQuantity(targetBaseQuantity);
            existingItem.setUnitPrice(effectiveUnitPrice);
            existingItem.setUnitConversionId(unitConversionId);
            existingItem.setUnitName(unitName);
            existingItem.setConversionFactor(conversionFactor);
            existingItem.setDiscountAmount(effectiveDiscount);
            existingItem.setPromotion(promoEntity);
            existingItem.setPromotionName(appliedPromoName);
            existingItem.setPriceTier(appliedTier);
            existingItem.setPriceTierName(appliedTierName);
            existingItem.setTaxAmount(taxAmount);
            calculateAndApplyLineRounding(existingItem, household, baseAmount, taxAmount);
        } else {
            OrderItem newItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .productName(product.getName())
                    .quantity(targetQuantity)
                    .baseQuantity(targetBaseQuantity)
                    .unitPrice(effectiveUnitPrice)
                    .unitConversionId(unitConversionId)
                    .unitName(unitName)
                    .conversionFactor(conversionFactor)
                    .discountAmount(effectiveDiscount)
                    .promotion(promoEntity)
                    .promotionName(appliedPromoName)
                    .priceTier(appliedTier)
                    .priceTierName(appliedTierName)
                    .taxRatePercentage(taxRate)
                    .taxAmount(taxAmount)
                    .subtotal(BigDecimal.ZERO)
                    .build();
            calculateAndApplyLineRounding(newItem, household, baseAmount, taxAmount);
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

        Product product = item.getProduct();

        BigDecimal regularUnitPrice = item.getUnitPrice();
        if (request.getUnitConversionId() != null) {
            if (org.springframework.util.StringUtils.hasText(request.getUnitConversionId())) {
                ProductUnitConversion conversion = productUnitConversionRepository.findByIdAndProductId(request.getUnitConversionId(), product.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.UNIT_CONVERSION_NOT_FOUND));
                item.setUnitConversionId(conversion.getId());
                item.setUnitName(conversion.getUnitName());
                item.setConversionFactor(conversion.getConversionFactor());
                regularUnitPrice = conversion.getPrice() != null 
                        ? conversion.getPrice() 
                        : product.getPrice().multiply(conversion.getConversionFactor());
                item.setUnitPrice(regularUnitPrice);
            } else {
                item.setUnitConversionId(null);
                item.setUnitName(product != null ? product.getUnit() : null);
                item.setConversionFactor(BigDecimal.ONE);
                if (product != null) {
                    regularUnitPrice = product.getPrice();
                    item.setUnitPrice(regularUnitPrice);
                }
            }
        } else {
            if (item.getUnitConversionId() != null && product != null) {
                ProductUnitConversion conversion = productUnitConversionRepository.findByIdAndProductId(item.getUnitConversionId(), product.getId()).orElse(null);
                if (conversion != null) {
                    regularUnitPrice = conversion.getPrice() != null ? conversion.getPrice() : product.getPrice().multiply(conversion.getConversionFactor());
                }
            } else if (product != null) {
                regularUnitPrice = product.getPrice();
            }
        }

        BigDecimal conversionFactor = item.getConversionFactor() != null ? item.getConversionFactor() : BigDecimal.ONE;
        BigDecimal newQuantity = resolveQuantity(product, request.getQuantity(), request.getBuyAmount(), regularUnitPrice, conversionFactor);
        validateWeightQuantity(product, newQuantity, conversionFactor);
        item.setBaseQuantity(newQuantity.multiply(conversionFactor));

        ProductPriceTier matchedTier = (productPriceTierService != null && product != null)
                ? productPriceTierService.matchPriceTier(household.getId(), product, newQuantity, item.getUnitConversionId())
                : null;

        com.sales.dto.response.PromotionItemResultResponse promoResult = product != null
                ? promotionService.calculateItemPromotion(
                        currentUser,
                        product,
                        newQuantity,
                        regularUnitPrice,
                        false
                )
                : null;

        com.sales.dto.response.PricingDecision decision = productPriceTierService != null
                ? productPriceTierService.resolvePricingDecision(
                        regularUnitPrice,
                        matchedTier,
                        promoResult,
                        newQuantity
                )
                : null;

        BigDecimal effectiveUnitPrice = (decision != null && decision.getUnitPrice() != null) ? decision.getUnitPrice() : regularUnitPrice;
        BigDecimal discountAmount = (decision != null && decision.getDiscountAmount() != null)
                ? decision.getDiscountAmount()
                : (promoResult != null && promoResult.getDiscountAmount() != null ? promoResult.getDiscountAmount() : BigDecimal.ZERO);
        String promoName = decision != null ? decision.getPromotionName() : (promoResult != null ? promoResult.getPromotionName() : null);
        Promotion promoEntity = decision != null && decision.getPromotion() != null
                ? decision.getPromotion()
                : (promoName != null && promoResult != null && promoResult.getPromotionId() != null
                        ? promotionRepository.findById(promoResult.getPromotionId()).orElse(null)
                        : null);
        ProductPriceTier appliedTier = decision != null ? decision.getPriceTier() : null;
        String appliedTierName = decision != null ? decision.getPriceTierName() : null;

        BigDecimal taxRate = item.getTaxRatePercentage() != null ? item.getTaxRatePercentage() : BigDecimal.ZERO;
        BigDecimal baseAmount = newQuantity.multiply(effectiveUnitPrice).subtract(discountAmount);
        BigDecimal taxAmount = baseAmount.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        item.setQuantity(newQuantity);
        item.setUnitPrice(effectiveUnitPrice);
        item.setDiscountAmount(discountAmount);
        item.setPromotion(promoEntity);
        item.setPromotionName(promoName);
        item.setPriceTier(appliedTier);
        item.setPriceTierName(appliedTierName);
        item.setTaxAmount(taxAmount);
        calculateAndApplyLineRounding(item, household, baseAmount, taxAmount);

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

        // Check salesperson limit (10% of total amount)
        boolean isOwner = "VT-01".equals(currentUser.getRole().getCode());
        if (!isOwner) {
            BigDecimal maxAllowedDiscount = order.getTotalAmount().multiply(BigDecimal.valueOf(0.10));
            if (discountAmount.compareTo(maxAllowedDiscount) > 0) {
                throw new AppException(ErrorCode.DISCOUNT_LIMIT_EXCEEDED);
            }
        }

        order.setDiscountType(request.getDiscountType());
        order.setDiscountRateOrValue(request.getDiscountValue());
        recalculateOrderTotals(order);

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

        // QTN-07: Tổng tiền hóa đơn phải khớp các dòng hàng
        validateOrderIntegrityQTN07(order);

        BigDecimal changeAmount = null;

        if ("CASH".equals(order.getPaymentMethod())) {
            if (request == null || request.getAmountGiven() == null) {
                throw new AppException(ErrorCode.INSUFFICIENT_PAYMENT);
            }
            BigDecimal amountGiven = request.getAmountGiven();
            BigDecimal expectedFinalAmount = order.getFinalAmount() != null
                    ? order.getFinalAmount()
                    : BigDecimal.ZERO;

            BigDecimal roundedAmountGiven = amountGiven.setScale(0, RoundingMode.HALF_UP);
            BigDecimal roundedExpectedAmount = expectedFinalAmount.setScale(0, RoundingMode.HALF_UP);

            // Kiểm tra số tiền khách trả phải đủ so với số tiền cần thanh toán theo QTN-03
            if (roundedAmountGiven.compareTo(roundedExpectedAmount) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_PAYMENT);
            }
            changeAmount = amountGiven.subtract(expectedFinalAmount);
            if (changeAmount.compareTo(BigDecimal.ZERO) < 0) {
                changeAmount = BigDecimal.ZERO;
            }
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

            BigDecimal paidAmount = (request != null && request.getAmountGiven() != null)
                    ? request.getAmountGiven()
                    : BigDecimal.ZERO;
            if (paidAmount.compareTo(order.getFinalAmount()) > 0) {
                paidAmount = order.getFinalAmount();
            }
            BigDecimal netDebtAmount = order.getFinalAmount().subtract(paidAmount);

            BigDecimal potentialDebt = customer.getCurrentDebt().add(netDebtAmount);
            if (potentialDebt.compareTo(customer.getCreditLimit()) > 0) {
                throw new AppException(ErrorCode.CREDIT_LIMIT_EXCEEDED);
            }
            customer.setCurrentDebt(potentialDebt);
            customerRepository.save(customer);
            order.setCustomer(customer);
            order.setPaymentStatus(netDebtAmount.compareTo(BigDecimal.ZERO) == 0 ? "PAID" : "DEBT");

            if (netDebtAmount.compareTo(BigDecimal.ZERO) > 0) {
                LocalDateTime debtDueDate = request != null && request.getDueDate() != null ? request.getDueDate() : LocalDateTime.now().plusDays(7);

                // Tạo và lưu bản ghi công nợ customer_debts (DEBT_CREATED) với số tiền nợ thực tế
                CustomerDebt debtRecord = CustomerDebt.builder()
                        .household(household)
                        .customer(customer)
                        .order(order)
                        .amount(netDebtAmount)
                        .remainingAmount(netDebtAmount)
                        .type(DebtType.DEBT_CREATED)
                        .status(DebtStatus.PENDING)
                        .dueDate(debtDueDate)
                        .notes("Ghi nợ từ đơn hàng " + order.getOrderNumber() + (paidAmount.compareTo(BigDecimal.ZERO) > 0 ? " (Đã tạm trả: " + paidAmount + ")" : ""))
                        .createdByUser(currentUser)
                        .build();
                customerDebtRepository.save(debtRecord);
            }
        }

        // Get warnings before deduction
        List<String> warnings = checkStockWarnings(order);

        // Logic fix: Deduplicate items and subtract physical stock quantity accurately
        Map<String, BigDecimal> productDeductions = new HashMap<>();
        Map<String, Product> productMap = new HashMap<>();
        Map<String, BigDecimal> posStockDeductions = new HashMap<>();
        Set<String> processedItemIds = new HashSet<>();

        for (OrderItem item : order.getItems()) {
            if (item.getId() != null && !processedItemIds.add(item.getId())) {
                continue; // Skip duplicate collection instances from join fetches
            }
            if (item.getProduct() != null && item.getQuantity() != null && item.getQuantity().compareTo(BigDecimal.ZERO) > 0) {
                Product product = item.getProduct();
                productMap.put(product.getId(), product);
                BigDecimal deductQty = item.getBaseQuantity() != null ? item.getBaseQuantity() : item.getQuantity();
                productDeductions.merge(product.getId(), deductQty, BigDecimal::add);

                if (order.getPointOfSale() != null) {
                    posStockDeductions.merge(product.getId(), deductQty, BigDecimal::add);
                }
            }
        }

        // Atomic DB deduction: Trừ tồn kho sản phẩm trực tiếp ở mức DB để tránh lặp thực thể/dirty check
        for (Map.Entry<String, BigDecimal> entry : productDeductions.entrySet()) {
            productRepository.deductStock(entry.getKey(), household.getId(), entry.getValue());
            Product product = productMap.get(entry.getKey());
            if (product != null && product.getStockQuantity() != null) {
                product.setStockQuantity(product.getStockQuantity().subtract(entry.getValue()));
            }
        }

        // NCL-17-CN-002-TC-01: Trừ tồn kho theo điểm bán hàng loạt (tránh N+1 query)
        if (order.getPointOfSale() != null && !posStockDeductions.isEmpty()) {
            posInventoryService.batchDeductPosStock(
                    household.getId(), order.getPointOfSale().getId(), posStockDeductions);
        }

        order.setStatus("COMPLETED");
        order.setSyncedAt(LocalDateTime.now());

        if (order.getCustomer() != null) {
            Customer customer = order.getCustomer();
            BigDecimal currentTotalSpent = customer.getTotalSpent() != null ? customer.getTotalSpent() : BigDecimal.ZERO;
            customer.setTotalSpent(currentTotalSpent.add(order.getFinalAmount()));
            customerRepository.save(customer);
        }

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

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersHistory(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<Order> orders;
        boolean isSalesperson = "VT-02".equals(currentUser.getRole().getCode());
        if (isSalesperson) {
            orders = orderRepository.findByHouseholdIdAndCreatedByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(
                    household.getId(), currentUser.getId());
        } else {
            orders = orderRepository.findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc(household.getId());
        }

        return orders.stream()
                .map(order -> mapToResponse(order, new ArrayList<>(), null, null))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CalculateWeightResponse calculateWeight(String currentUsername, CalculateWeightRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Product product = productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getProductId(), household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (!Boolean.TRUE.equals(product.getIsSoldByWeight())) {
            throw new AppException(ErrorCode.NON_WEIGHT_PRODUCT_DECIMAL_NOT_ALLOWED);
        }

        BigDecimal conversionFactor = BigDecimal.ONE;
        String unitName = product.getUnit();
        BigDecimal unitPrice = product.getPrice();

        if (org.springframework.util.StringUtils.hasText(request.getUnitConversionId())) {
            ProductUnitConversion conversion = productUnitConversionRepository.findByIdAndProductId(request.getUnitConversionId(), product.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.UNIT_CONVERSION_NOT_FOUND));
            unitPrice = conversion.getPrice() != null ? conversion.getPrice() : product.getPrice().multiply(conversion.getConversionFactor());
            unitName = conversion.getUnitName();
            conversionFactor = conversion.getConversionFactor();
        }

        BigDecimal quantity = resolveQuantity(product, null, request.getBuyAmount(), unitPrice, conversionFactor);
        validateWeightQuantity(product, quantity, conversionFactor);

        BigDecimal exactSubtotal = quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
        RoundingRule rule = resolveRoundingRule(household);
        BigDecimal roundedSubtotal = rule.applyRounding(exactSubtotal);
        BigDecimal roundingDifference = roundedSubtotal.subtract(exactSubtotal).setScale(2, RoundingMode.HALF_UP);

        return CalculateWeightResponse.builder()
                .productId(product.getId())
                .productName(product.getName())
                .buyAmount(request.getBuyAmount())
                .unitPrice(unitPrice)
                .calculatedQuantity(quantity)
                .exactSubtotal(exactSubtotal)
                .roundedSubtotal(roundedSubtotal)
                .roundingDifference(roundingDifference)
                .unitName(unitName)
                .conversionFactor(conversionFactor)
                .minWeightStep(product.getMinWeightStep())
                .decimalPlaces(product.getDecimalPlaces())
                .build();
    }
}
