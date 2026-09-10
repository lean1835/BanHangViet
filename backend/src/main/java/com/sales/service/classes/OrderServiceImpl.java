package com.sales.service.classes;

import com.sales.constant.DebtStatus;
import com.sales.constant.DebtType;
import com.sales.constant.PaymentMethodConstant;
import com.sales.constant.RoundingRule;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.*;
import com.sales.dto.response.*;
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
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
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
    private final DiningTableRepository diningTableRepository;
    private final BusinessHouseholdSettingsRepository settingsRepository;
    private final OrderPaymentRepository orderPaymentRepository;

    private Integer getHouseholdMaxHoldingHours(String householdId) {
        if (settingsRepository == null) return 4;
        return settingsRepository.findByHouseholdId(householdId)
                .map(BusinessHouseholdSettings::getMaxOrderHoldingHours)
                .orElse(4);
    }


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
            // Nếu đơn hàng gắn với một ca đang mở, CHỈ DUY NHẤT thu ngân hiện tại của ca đó mới được thao tác (NCL-03-CN-013)
            if (order.getShift() != null && order.getShift().getStatus() == ShiftStatus.OPEN) {
                boolean isCurrentShiftCashier = order.getShift().getUser().getId().equals(currentUser.getId());
                if (!isCurrentShiftCashier) {
                    throw new AppException(ErrorCode.FORBIDDEN);
                }
                return;
            }

            boolean isCreator = order.getCreatedByUser().getId().equals(currentUser.getId());
            if (!isCreator) {
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
        return mapToResponse(order, warnings, changeAmount, qrCodeUrl, null);
    }

    private OrderResponse mapToResponse(Order order, List<String> warnings, BigDecimal changeAmount, String qrCodeUrl, List<OrderPayment> preloadedPayments) {
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

        // NCL-03-CN-010 Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
        String diningTableId = order.getDiningTable() != null ? order.getDiningTable().getId() : null;
        String diningTableName = order.getDiningTable() != null ? order.getDiningTable().getName() : null;
        String diningTableArea = order.getDiningTable() != null ? order.getDiningTable().getArea() : null;

        Long holdingDurationMinutes = 0L;
        boolean isOverdue = false;
        if ("CREATING".equals(order.getStatus())) {
            LocalDateTime createdAt = order.getCreatedAt() != null ? order.getCreatedAt() : LocalDateTime.now();
            holdingDurationMinutes = Duration.between(createdAt, LocalDateTime.now()).toMinutes();
            Integer maxHoldingHours = getHouseholdMaxHoldingHours(order.getHousehold().getId());
            int limitHours = (maxHoldingHours != null && maxHoldingHours > 0) ? maxHoldingHours : 4;
            isOverdue = holdingDurationMinutes >= (limitHours * 60L);
            if (isOverdue) {
                if (warnings == null) {
                    warnings = new ArrayList<>();
                }
                warnings.add(String.format("Cảnh báo: Đơn hàng đã treo %d giờ %d phút (vượt quá giới hạn %d giờ). Vui lòng kiểm tra và thanh toán",
                        holdingDurationMinutes / 60, holdingDurationMinutes % 60, limitHours));
            }
        }

        List<OrderPaymentResponse> paymentResponses = null;
        if (preloadedPayments != null) {
            paymentResponses = preloadedPayments.stream()
                    .map(this::mapPaymentToResponse)
                    .collect(Collectors.toList());
        } else if (order.getPayments() != null && !order.getPayments().isEmpty()) {
            paymentResponses = order.getPayments().stream()
                    .map(this::mapPaymentToResponse)
                    .collect(Collectors.toList());
        } else if (order.getId() != null && !"CREATING".equals(order.getStatus())) {
            List<OrderPayment> dbPayments = orderPaymentRepository.findByOrderId(order.getId());
            if (dbPayments != null && !dbPayments.isEmpty()) {
                paymentResponses = dbPayments.stream()
                        .map(this::mapPaymentToResponse)
                        .collect(Collectors.toList());
            }
        }

        if (changeAmount == null && paymentResponses != null) {
            changeAmount = paymentResponses.stream()
                    .filter(p -> "CASH".equals(p.getPaymentMethod()) && p.getChangeAmount() != null && p.getChangeAmount().compareTo(BigDecimal.ZERO) > 0)
                    .map(OrderPaymentResponse::getChangeAmount)
                    .findFirst()
                    .orElse(null);
        }

        Boolean isBankTransferConfirmed = null;
        if (paymentResponses != null && !paymentResponses.isEmpty()) {
            boolean hasTransfer = paymentResponses.stream().anyMatch(p -> "BANK_TRANSFER".equals(p.getPaymentMethod()));
            if (hasTransfer) {
                isBankTransferConfirmed = paymentResponses.stream()
                        .filter(p -> "BANK_TRANSFER".equals(p.getPaymentMethod()))
                        .allMatch(p -> Boolean.TRUE.equals(p.getIsConfirmed()));
            }
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
                .cancelReason(order.getCancelReason() != null ? order.getCancelReason().name() : null)
                .cancelReasonDescription(order.getCancelReason() != null ? order.getCancelReason().getDescription() : null)
                .cancelReasonNote(order.getCancelReasonNote())
                .canceledByUserId(order.getCanceledByUser() != null ? order.getCanceledByUser().getId() : null)
                .canceledByUsername(order.getCanceledByUser() != null ? order.getCanceledByUser().getUsername() : null)
                .canceledByFullName(order.getCanceledByUser() != null ? order.getCanceledByUser().getFullName() : null)
                .canceledAt(order.getCanceledAt())
                .orderLabel(order.getOrderLabel())
                .diningTableId(diningTableId)
                .diningTableName(diningTableName)
                .diningTableArea(diningTableArea)
                .isOverdue(isOverdue)
                .holdingDurationMinutes(holdingDurationMinutes)
                .payments(paymentResponses)
                .isBankTransferConfirmed(isBankTransferConfirmed)
                .build();
    }

    private OrderPaymentResponse mapPaymentToResponse(OrderPayment payment) {
        if (payment == null) return null;
        return OrderPaymentResponse.builder()
                .id(payment.getId())
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
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
                .createdAt(payment.getCreatedAt())
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

        DiningTable diningTable = null;
        if (request.getDiningTableId() != null && !request.getDiningTableId().trim().isEmpty()) {
            String tableId = request.getDiningTableId().trim();
            diningTable = diningTableRepository.findByIdAndHouseholdIdForUpdate(tableId, household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.DINING_TABLE_NOT_FOUND));

            if (!Boolean.TRUE.equals(diningTable.getIsActive())) {
                throw new AppException(ErrorCode.DINING_TABLE_INACTIVE);
            }

            boolean occupied = orderRepository.existsByDiningTableIdAndStatusAndDeletedAtIsNull(tableId, "CREATING");
            if (occupied) {
                throw new AppException(ErrorCode.DINING_TABLE_OCCUPIED);
            }
        }

        String orderLabel = (request.getOrderLabel() != null && !request.getOrderLabel().trim().isEmpty())
                ? request.getOrderLabel().trim() : null;

        Order order = Order.builder()
                .household(household)
                .shift(activeShift)
                .pointOfSale(pointOfSale)
                .createdByUser(currentUser)
                .customer(customer)
                .orderNumber(orderNumber)
                .orderLabel(orderLabel)
                .diningTable(diningTable)
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
    public OrderResponse setPaymentMethod(String currentUsername, String orderId, SetPaymentMethodRequest request) {
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

        // Xóa các khoản thanh toán cũ chưa hoàn tất của đơn hàng này
        List<OrderPayment> oldPayments = orderPaymentRepository.findByOrderIdAndHouseholdId(orderId, household.getId());
        if (!oldPayments.isEmpty()) {
            orderPaymentRepository.deleteAll(oldPayments);
        }
        if (order.getPayments() != null) {
            order.getPayments().clear();
        }

        if ("BANK_TRANSFER".equals(method)) {
            order.setPaymentMethod("BANK_TRANSFER");
            order.setPaymentStatus("PENDING");
            qrCodeUrl = generateQrCodeUrl(order);

            OrderPayment bankPayment = OrderPayment.builder()
                    .order(order)
                    .household(household)
                    .paymentMethod("BANK_TRANSFER")
                    .amount(order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO)
                    .isConfirmed(false)
                    .build();
            bankPayment = orderPaymentRepository.save(bankPayment);
            order.addPayment(bankPayment);
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

        if (order.getItems().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        // QTN-07: Tổng tiền hóa đơn phải khớp các dòng hàng
        validateOrderIntegrityQTN07(order);

        BigDecimal changeAmount = null;
        List<OrderPayment> paymentEntities = new ArrayList<>();

        if (request != null && request.getPayments() != null) {
            if (request.getPayments().isEmpty()) {
                throw new AppException(ErrorCode.PAYMENTS_EMPTY);
            }
            Set<String> uniqueMethods = new HashSet<>();
            BigDecimal sumPayments = BigDecimal.ZERO;
            for (OrderPaymentRequest pr : request.getPayments()) {
                if (pr.getPaymentMethod() == null || !PaymentMethodConstant.isValid(pr.getPaymentMethod())) {
                    throw new AppException(ErrorCode.INVALID_PAYMENT_METHOD);
                }
                if (!uniqueMethods.add(pr.getPaymentMethod())) {
                    throw new AppException(ErrorCode.DUPLICATE_PAYMENT_METHOD);
                }
                if (pr.getAmount() == null || pr.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                    throw new AppException(ErrorCode.PAYMENT_AMOUNT_INVALID);
                }
                sumPayments = sumPayments.add(pr.getAmount());
            }

            BigDecimal expectedFinalAmount = order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO;
            if (sumPayments.setScale(0, RoundingMode.HALF_UP).compareTo(expectedFinalAmount.setScale(0, RoundingMode.HALF_UP)) != 0) {
                throw new AppException(ErrorCode.PAYMENT_TOTAL_MISMATCH);
            }

            boolean hasDebt = false;
            for (OrderPaymentRequest pr : request.getPayments()) {
                String method = pr.getPaymentMethod();
                OrderPayment payment = OrderPayment.builder()
                        .order(order)
                        .household(household)
                        .paymentMethod(method)
                        .amount(pr.getAmount())
                        .transactionCode(pr.getTransactionCode())
                        .notes(pr.getNotes())
                        .build();

                if (PaymentMethodConstant.CASH.equals(method)) {
                    BigDecimal given = pr.getAmountGiven() != null ? pr.getAmountGiven() : pr.getAmount();
                    if (given.compareTo(pr.getAmount()) < 0) {
                        throw new AppException(ErrorCode.CASH_GIVEN_LESS_THAN_AMOUNT);
                    }
                    changeAmount = given.subtract(pr.getAmount());
                    payment.setAmountGiven(given);
                    payment.setChangeAmount(changeAmount);
                    payment.setIsConfirmed(true);
                    payment.setConfirmedAt(LocalDateTime.now());
                    payment.setConfirmedByUser(currentUser);
                } else if (PaymentMethodConstant.BANK_TRANSFER.equals(method)) {
                    OrderPayment existingBankPayment = orderPaymentRepository
                            .findFirstByOrderIdAndHouseholdIdAndPaymentMethod(order.getId(), household.getId(), PaymentMethodConstant.BANK_TRANSFER)
                            .orElse(null);

                    if (existingBankPayment == null || !Boolean.TRUE.equals(existingBankPayment.getIsConfirmed())) {
                        throw new AppException(ErrorCode.BANK_TRANSFER_NOT_CONFIRMED);
                    }
                    String txCode = pr.getTransactionCode() != null && !pr.getTransactionCode().trim().isEmpty()
                            ? pr.getTransactionCode().trim()
                            : existingBankPayment.getTransactionCode();
                    if (txCode == null || txCode.trim().isEmpty()) {
                        throw new AppException(ErrorCode.PAYMENT_TRANSACTION_CODE_REQUIRED);
                    }
                    existingBankPayment.setTransactionCode(txCode);
                    existingBankPayment.setAmount(pr.getAmount());
                    if (pr.getNotes() != null && !pr.getNotes().trim().isEmpty()) {
                        existingBankPayment.setNotes(pr.getNotes().trim());
                    }
                    payment = existingBankPayment;
                } else if (PaymentMethodConstant.DEBT.equals(method)) {

                    hasDebt = true;
                    Customer customer = order.getCustomer();
                    if (customer == null) {
                        throw new AppException(ErrorCode.CUSTOMER_REQUIRED_FOR_DEBT);
                    }
                    customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                            customer.getId(), household.getId())
                            .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

                    BigDecimal netDebtAmount = pr.getAmount();
                    BigDecimal potentialDebt = customer.getCurrentDebt().add(netDebtAmount);
                    if (potentialDebt.compareTo(customer.getCreditLimit()) > 0) {
                        throw new AppException(ErrorCode.CREDIT_LIMIT_EXCEEDED);
                    }
                    customer.setCurrentDebt(potentialDebt);
                    customerRepository.save(customer);
                    order.setCustomer(customer);

                    LocalDateTime debtDueDate = request.getDueDate() != null ? request.getDueDate() : LocalDateTime.now().plusDays(7);
                    CustomerDebt debtRecord = CustomerDebt.builder()
                            .household(household)
                            .customer(customer)
                            .order(order)
                            .amount(netDebtAmount)
                            .remainingAmount(netDebtAmount)
                            .type(DebtType.DEBT_CREATED)
                            .status(DebtStatus.PENDING)
                            .dueDate(debtDueDate)
                            .notes("Ghi nợ từ đơn hàng " + order.getOrderNumber())
                            .createdByUser(currentUser)
                            .build();
                    customerDebtRepository.save(debtRecord);

                    payment.setIsConfirmed(true);
                    payment.setConfirmedAt(LocalDateTime.now());
                    payment.setConfirmedByUser(currentUser);
                }
                paymentEntities.add(payment);
            }

            if (paymentEntities.size() > 1) {
                order.setPaymentMethod(PaymentMethodConstant.COMBINED);
            } else if (!paymentEntities.isEmpty()) {
                order.setPaymentMethod(paymentEntities.get(0).getPaymentMethod());
            }

            if (hasDebt) {
                order.setPaymentStatus("DEBT");
            } else {
                order.setPaymentStatus("PAID");
            }
        } else {
            if (order.getPaymentMethod() == null) {
                throw new AppException(ErrorCode.PAYMENT_METHOD_NOT_SELECTED);
            }

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

                OrderPayment p = OrderPayment.builder()
                        .order(order)
                        .household(household)
                        .paymentMethod("CASH")
                        .amount(expectedFinalAmount)
                        .amountGiven(amountGiven)
                        .changeAmount(changeAmount)
                        .isConfirmed(true)
                        .confirmedAt(LocalDateTime.now())
                        .confirmedByUser(currentUser)
                        .build();
                paymentEntities.add(p);
            } else if ("BANK_TRANSFER".equals(order.getPaymentMethod())) {
                OrderPayment existingBankPayment = orderPaymentRepository
                        .findFirstByOrderIdAndHouseholdIdAndPaymentMethod(order.getId(), household.getId(), "BANK_TRANSFER")
                        .orElse(null);

                if (existingBankPayment == null || !Boolean.TRUE.equals(existingBankPayment.getIsConfirmed())) {
                    throw new AppException(ErrorCode.BANK_TRANSFER_NOT_CONFIRMED);
                }

                order.setPaymentStatus("PAID");
                paymentEntities.add(existingBankPayment);
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

                if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
                    OrderPayment cashPart = OrderPayment.builder()
                            .order(order)
                            .household(household)
                            .paymentMethod("CASH")
                            .amount(paidAmount)
                            .amountGiven(paidAmount)
                            .changeAmount(BigDecimal.ZERO)
                            .isConfirmed(true)
                            .confirmedAt(LocalDateTime.now())
                            .confirmedByUser(currentUser)
                            .notes("Thanh toán tiền mặt đính kèm đơn nợ")
                            .build();
                    paymentEntities.add(cashPart);
                }

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

                    OrderPayment debtPart = OrderPayment.builder()
                            .order(order)
                            .household(household)
                            .paymentMethod("DEBT")
                            .amount(netDebtAmount)
                            .isConfirmed(true)
                            .confirmedAt(LocalDateTime.now())
                            .confirmedByUser(currentUser)
                            .notes("Ghi nợ đơn hàng " + order.getOrderNumber())
                            .build();
                    paymentEntities.add(debtPart);
                }
            }
        }

        if (!paymentEntities.isEmpty()) {
            if (order.getPayments() == null) {
                order.setPayments(new ArrayList<>());
            }
            order.getPayments().removeIf(p -> !paymentEntities.contains(p));
            for (OrderPayment p : paymentEntities) {
                if (!order.getPayments().contains(p)) {
                    order.addPayment(p);
                }
            }
            orderPaymentRepository.saveAll(paymentEntities);
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

        List<String> orderIds = orders.stream().map(Order::getId).collect(Collectors.toList());
        Map<String, List<OrderPayment>> paymentsByOrderId = new HashMap<>();
        if (!orderIds.isEmpty()) {
            paymentsByOrderId = orderPaymentRepository.findByOrderIdIn(orderIds).stream()
                    .collect(Collectors.groupingBy(p -> p.getOrder() != null ? p.getOrder().getId() : ""));
        }

        Map<String, List<OrderPayment>> finalPaymentsByOrderId = paymentsByOrderId;
        return orders.stream()
                .map(order -> mapToResponse(order, new ArrayList<>(), null, null, finalPaymentsByOrderId.get(order.getId())))
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

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse cancelOrder(String currentUsername, String orderId, CancelOrderRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        checkOrderOwnership(order, currentUser);
        validateShiftIsOpen(order);

        // 1. Validate Order Status (TC-03 & QTN-03)
        if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CANCEL);
        }
        if ("CANCELED".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_ALREADY_CANCELED);
        }
        if (!"CREATING".equalsIgnoreCase(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_CANCEL_NOT_CREATING_STATUS);
        }

        // 2. Validate Cancel Reason & Note (TC-02)
        if (request == null || request.getCancelReason() == null) {
            throw new AppException(ErrorCode.ORDER_CANCEL_REASON_REQUIRED);
        }
        if (request.getCancelReason() == OrderCancelReason.OTHER) {
            if (request.getCancelReasonNote() == null || request.getCancelReasonNote().trim().isEmpty()) {
                throw new AppException(ErrorCode.ORDER_CANCEL_NOTE_REQUIRED);
            }
        }

        Map<String, Object> oldValues = buildOrderLogMap(order);

        // 3. Update Order state (TC-01)
        order.setStatus("CANCELED");
        order.setCancelReason(request.getCancelReason());
        order.setCancelReasonNote(request.getCancelReasonNote() != null ? request.getCancelReasonNote().trim() : null);
        order.setCanceledByUser(currentUser);
        order.setCanceledAt(LocalDateTime.now());

        // Note on Inventory: Orders in CREATING status have not deducted physical stock yet.
        // Therefore, canceling an order maintains stock neutrality (no stock deduction or return needed).

        Order savedOrder = orderRepository.save(order);

        // 4. Log Activity per QTN-09
        Map<String, Object> newValues = buildOrderLogMap(savedOrder);
        newValues.put("cancelReason", savedOrder.getCancelReason().name());
        newValues.put("cancelReasonDescription", savedOrder.getCancelReason().getDescription());
        newValues.put("cancelReasonNote", savedOrder.getCancelReasonNote());
        newValues.put("canceledByUserId", currentUser.getId());
        newValues.put("canceledByUsername", currentUser.getUsername());
        newValues.put("canceledAt", savedOrder.getCanceledAt() != null ? savedOrder.getCanceledAt().toString() : null);

        logActivity(household, currentUser, "CANCEL_ORDER", savedOrder.getId(), oldValues, newValues);

        return mapToResponse(savedOrder, new ArrayList<>(), null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderCancelReasonDto> getCancelReasons() {
        return Arrays.stream(OrderCancelReason.values())
                .map(r -> OrderCancelReasonDto.builder()
                        .code(r.name())
                        .description(r.getDescription())
                        .requiresNote(r == OrderCancelReason.OTHER)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CanceledOrderStatisticsResponse getCanceledOrderStatistics(
            String currentUsername,
            String shiftId,
            LocalDateTime fromDate,
            LocalDateTime toDate) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String effectiveShiftId = org.springframework.util.StringUtils.hasText(shiftId) ? shiftId.trim() : null;

        Shift shift = null;
        if (effectiveShiftId != null) {
            shift = shiftRepository.findByIdAndHouseholdId(effectiveShiftId, household.getId()).orElse(null);
        }

        // QTN-10 & User Roles: Thu ngân VT-02 chỉ xem số liệu đơn hủy do chính mình lập
        boolean isSalesperson = currentUser.getRole() != null && "VT-02".equals(currentUser.getRole().getCode());
        String effectiveEmployeeId = isSalesperson ? currentUser.getId() : null;

        List<Order> canceledOrders = orderRepository.findCanceledOrders(household.getId(), effectiveShiftId, effectiveEmployeeId, fromDate, toDate);

        long totalCount = canceledOrders.size();
        BigDecimal totalAmount = canceledOrders.stream()
                .map(Order::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Group by cancel reason
        Map<OrderCancelReason, Long> reasonCountMap = canceledOrders.stream()
                .filter(o -> o.getCancelReason() != null)
                .collect(Collectors.groupingBy(Order::getCancelReason, Collectors.counting()));

        List<CancelReasonStatDto> byReason = Arrays.stream(OrderCancelReason.values())
                .map(r -> {
                    long cnt = reasonCountMap.getOrDefault(r, 0L);
                    double pct = totalCount > 0 ? (cnt * 100.0 / totalCount) : 0.0;
                    return CancelReasonStatDto.builder()
                            .reasonCode(r.name())
                            .reasonDescription(r.getDescription())
                            .count(cnt)
                            .percentage(BigDecimal.valueOf(pct).setScale(1, RoundingMode.HALF_UP).doubleValue())
                            .build();
                })
                .collect(Collectors.toList());

        // Group by employee ID (tránh rủi ro hashCode/equals và lazy load trên thực thể User)
        Map<String, List<Order>> employeeOrderMap = canceledOrders.stream()
                .filter(o -> o.getCanceledByUser() != null && o.getCanceledByUser().getId() != null)
                .collect(Collectors.groupingBy(o -> o.getCanceledByUser().getId()));

        List<EmployeeCancelStatDto> byEmployee = employeeOrderMap.values().stream()
                .map(orders -> {
                    User emp = orders.get(0).getCanceledByUser();
                    BigDecimal empTotalAmount = orders.stream()
                            .map(Order::getTotalAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return EmployeeCancelStatDto.builder()
                            .employeeId(emp.getId())
                            .employeeUsername(emp.getUsername())
                            .employeeFullName(emp.getFullName())
                            .count(orders.size())
                            .totalAmount(empTotalAmount)
                            .build();
                })
                .sorted(Comparator.comparing(EmployeeCancelStatDto::getCount).reversed())
                .collect(Collectors.toList());

        // Top 10 recent canceled orders
        List<CanceledOrderSummaryDto> recent = canceledOrders.stream()
                .sorted(Comparator.comparing(Order::getCanceledAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .map(o -> CanceledOrderSummaryDto.builder()
                        .orderId(o.getId())
                        .orderNumber(o.getOrderNumber())
                        .totalAmount(o.getTotalAmount())
                        .cancelReason(o.getCancelReason() != null ? o.getCancelReason().name() : null)
                        .cancelReasonDescription(o.getCancelReason() != null ? o.getCancelReason().getDescription() : null)
                        .cancelReasonNote(o.getCancelReasonNote())
                        .canceledByFullName(o.getCanceledByUser() != null ? o.getCanceledByUser().getFullName() : null)
                        .canceledAt(o.getCanceledAt())
                        .build())
                .collect(Collectors.toList());

        String shiftName = null;
        if (shift != null) {
            String userName = (shift.getUser() != null && shift.getUser().getFullName() != null) ? shift.getUser().getFullName() : "";
            shiftName = "Ca làm việc " + userName + (shift.getOpenedAt() != null ? " (" + shift.getOpenedAt() + ")" : "");
        }

        return CanceledOrderStatisticsResponse.builder()
                .totalCanceledOrders(totalCount)
                .totalCanceledAmount(totalAmount)
                .shiftId(effectiveShiftId)
                .shiftName(shiftName)
                .fromDate(fromDate)
                .toDate(toDate)
                .byReason(byReason)
                .byEmployee(byEmployee)
                .recentCanceledOrders(recent)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse holdOrder(String currentUsername, String orderId, HoldOrderRequest request) {
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
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_HELD);
        }

        String label = (request.getOrderLabel() != null && !request.getOrderLabel().trim().isEmpty())
                ? request.getOrderLabel().trim() : null;
        String tableId = (request.getDiningTableId() != null && !request.getDiningTableId().trim().isEmpty())
                ? request.getDiningTableId().trim() : null;

        if (label == null && tableId == null) {
            throw new AppException(ErrorCode.ORDER_LABEL_OR_TABLE_REQUIRED);
        }

        DiningTable table = null;
        if (tableId != null) {
            table = diningTableRepository.findByIdAndHouseholdIdForUpdate(tableId, household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.DINING_TABLE_NOT_FOUND));

            if (!Boolean.TRUE.equals(table.getIsActive())) {
                throw new AppException(ErrorCode.DINING_TABLE_INACTIVE);
            }

            boolean occupied = orderRepository.existsByDiningTableIdAndStatusAndIdNotAndDeletedAtIsNull(
                    tableId, "CREATING", order.getId());
            if (occupied) {
                throw new AppException(ErrorCode.DINING_TABLE_OCCUPIED);
            }
        }

        order.setOrderLabel(label);
        order.setDiningTable(table);
        Order savedOrder = orderRepository.save(order);

        Map<String, Object> logDetails = new HashMap<>();
        logDetails.put("orderLabel", label);
        logDetails.put("tableName", table != null ? table.getName() : null);
        logActivity(household, currentUser, "HOLD_ORDER", savedOrder.getId(), null, logDetails);

        return mapToResponse(savedOrder, new ArrayList<>(), null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse updateOrderLabel(String currentUsername, String orderId, UpdateOrderLabelRequest request) {
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
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_HELD);
        }

        order.setOrderLabel(request.getOrderLabel().trim());
        Order savedOrder = orderRepository.save(order);

        logActivity(household, currentUser, "UPDATE_ORDER_LABEL", savedOrder.getId(), null,
                Map.of("orderLabel", request.getOrderLabel().trim()));

        return mapToResponse(savedOrder, new ArrayList<>(), null, null);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse switchDiningTable(String currentUsername, String orderId, SwitchDiningTableRequest request) {
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
            throw new AppException(ErrorCode.ORDER_CANNOT_BE_HELD);
        }

        String newTableId = request.getNewDiningTableId().trim();
        if (order.getDiningTable() != null && order.getDiningTable().getId().equals(newTableId)) {
            throw new AppException(ErrorCode.CANNOT_SWITCH_TO_SAME_TABLE);
        }

        DiningTable newTable = diningTableRepository.findByIdAndHouseholdIdForUpdate(newTableId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.DINING_TABLE_NOT_FOUND));

        if (!Boolean.TRUE.equals(newTable.getIsActive())) {
            throw new AppException(ErrorCode.DINING_TABLE_INACTIVE);
        }

        boolean occupied = orderRepository.existsByDiningTableIdAndStatusAndIdNotAndDeletedAtIsNull(
                newTableId, "CREATING", order.getId());
        if (occupied) {
            throw new AppException(ErrorCode.DINING_TABLE_OCCUPIED);
        }

        String oldTableName = order.getDiningTable() != null ? order.getDiningTable().getName() : "Không có";
        order.setDiningTable(newTable);
        Order savedOrder = orderRepository.save(order);

        logActivity(household, currentUser, "SWITCH_DINING_TABLE", savedOrder.getId(), null,
                Map.of("oldTable", oldTableName, "newTable", newTable.getName()));

        return mapToResponse(savedOrder, new ArrayList<>(), null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HeldOrderSummaryResponse> getHeldOrders(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Optional<Shift> activeShiftOpt = shiftRepository.findByUserIdAndStatus(currentUser.getId(), ShiftStatus.OPEN);
        List<Order> heldOrders;
        if (activeShiftOpt.isPresent()) {
            heldOrders = orderRepository.findByHouseholdIdAndShiftIdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                    household.getId(), activeShiftOpt.get().getId(), "CREATING");
        } else {
            heldOrders = orderRepository.findByHouseholdIdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                    household.getId(), "CREATING");
        }

        Integer maxHoldingHours = getHouseholdMaxHoldingHours(household.getId());
        int limitHours = (maxHoldingHours != null && maxHoldingHours > 0) ? maxHoldingHours : 4;
        LocalDateTime now = LocalDateTime.now();

        return heldOrders.stream().map(o -> {
            LocalDateTime createdAt = o.getCreatedAt() != null ? o.getCreatedAt() : now;
            long minutes = Duration.between(createdAt, now).toMinutes();
            boolean isOverdue = minutes >= (limitHours * 60L);

            return HeldOrderSummaryResponse.builder()
                    .id(o.getId())
                    .orderNumber(o.getOrderNumber())
                    .orderLabel(o.getOrderLabel())
                    .diningTableId(o.getDiningTable() != null ? o.getDiningTable().getId() : null)
                    .diningTableName(o.getDiningTable() != null ? o.getDiningTable().getName() : null)
                    .diningTableArea(o.getDiningTable() != null ? o.getDiningTable().getArea() : null)
                    .customerId(o.getCustomer() != null ? o.getCustomer().getId() : null)
                    .customerName(o.getCustomer() != null ? o.getCustomer().getName() : "Khách lẻ")
                    .itemCount(o.getItems() != null ? o.getItems().size() : 0)
                    .totalAmount(o.getTotalAmount())
                    .createdAt(o.getCreatedAt())
                    .holdingDurationMinutes(minutes)
                    .isOverdue(isOverdue)
                    .createdByUserId(o.getCreatedByUser() != null ? o.getCreatedByUser().getId() : null)
                    .createdByUsername(o.getCreatedByUser() != null ? o.getCreatedByUser().getUsername() : null)
                    .createdByFullName(o.getCreatedByUser() != null ? o.getCreatedByUser().getFullName() : null)
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse switchPaymentMethod(String currentUsername, String orderId, SwitchPaymentMethodRequest request) {
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
            throw new AppException(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CHANGE_PAYMENT);
        }

        if (request == null || request.getNewPaymentMethod() == null) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        String newMethod = request.getNewPaymentMethod().trim().toUpperCase();
        if (!List.of("CASH", "BANK_TRANSFER", "DEBT").contains(newMethod)) {
            throw new AppException(ErrorCode.INVALID_PAYMENT_SWITCH_METHOD);
        }

        // Xóa các khoản thanh toán cũ của đơn hàng
        List<OrderPayment> oldPayments = orderPaymentRepository.findByOrderIdAndHouseholdId(orderId, household.getId());
        if (!oldPayments.isEmpty()) {
            orderPaymentRepository.deleteAll(oldPayments);
        }
        if (order.getPayments() != null) {
            order.getPayments().clear();
        }

        String qrCodeUrl = null;
        if ("BANK_TRANSFER".equals(newMethod)) {
            order.setPaymentMethod("BANK_TRANSFER");
            order.setPaymentStatus("PENDING");
            qrCodeUrl = generateQrCodeUrl(order);

            OrderPayment bankPayment = OrderPayment.builder()
                    .order(order)
                    .household(household)
                    .paymentMethod("BANK_TRANSFER")
                    .amount(order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO)
                    .isConfirmed(false)
                    .notes(request.getNotes())
                    .build();
            bankPayment = orderPaymentRepository.save(bankPayment);
            order.addPayment(bankPayment);
        } else if ("DEBT".equals(newMethod)) {
            String customerId = request.getCustomerId();
            Customer customer = null;
            if (customerId != null && !customerId.trim().isEmpty()) {
                customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                        customerId.trim(), household.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
            } else if (order.getCustomer() != null) {
                customer = customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate(
                        order.getCustomer().getId(), household.getId())
                        .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));
            } else {
                throw new AppException(ErrorCode.CUSTOMER_REQUIRED_FOR_DEBT);
            }

            BigDecimal potentialDebt = customer.getCurrentDebt().add(order.getFinalAmount());
            if (potentialDebt.compareTo(customer.getCreditLimit()) > 0) {
                throw new AppException(ErrorCode.CREDIT_LIMIT_EXCEEDED);
            }
            order.setCustomer(customer);
            order.setPaymentMethod("DEBT");
            order.setPaymentStatus("DEBT");
        } else {
            // CASH
            order.setPaymentMethod("CASH");
            order.setPaymentStatus("PENDING");
        }

        order = orderRepository.save(order);

        logActivity(household, currentUser, "SWITCH_PAYMENT_METHOD", order.getId(), null, buildOrderLogMap(order));

        return mapToResponse(order, checkStockWarnings(order), null, qrCodeUrl);
    }
}


