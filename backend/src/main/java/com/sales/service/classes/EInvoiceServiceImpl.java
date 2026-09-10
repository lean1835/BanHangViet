package com.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.BulkIssueInvoiceRequest;
import com.sales.dto.request.CancelInvoiceRequest;
import com.sales.dto.request.CreateAdjustmentInvoiceItemRequest;
import com.sales.dto.request.CreateAdjustmentInvoiceRequest;
import com.sales.dto.request.ResendCustomerDeliveryRequest;
import com.sales.dto.request.UpdateInvoiceRequest;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.EInvoiceService;
import com.sales.service.interfaces.EmailService;
import com.sales.service.interfaces.InvoiceNumberRangeService;
import com.sales.service.interfaces.TaxConnectionService;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EInvoiceServiceImpl implements EInvoiceService {

    private final UserRepository userRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final EInvoiceItemRepository eInvoiceItemRepository;
    private final InvoiceStatusLogRepository invoiceStatusLogRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ProductRepository productRepository;
    private final InvoiceTemplateRepository invoiceTemplateRepository;
    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final InvoiceDeliveryLogRepository invoiceDeliveryLogRepository;
    private final CustomerRepository customerRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;
    private final InvoiceNumberRangeService invoiceNumberRangeService;
    private final TaxConnectionService taxConnectionService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue,
            Object newValue) {
        logActivity(household, actor, action, "e_invoices", targetId, oldValue, newValue);
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetType, String targetId, Object oldValue,
            Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                    .getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;

            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;

            activityLogHelper.logActivityInNewTransaction(household, actor, action, targetType, targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for " + targetType, e);
        }
    }

    private void checkInvoiceOwnership(EInvoice invoice, User currentUser) {
        if (currentUser.getHousehold() == null ||
                !currentUser.getHousehold().getId().equals(invoice.getHousehold().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    private Map<String, Object> buildInvoiceLogMap(EInvoice invoice) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", invoice.getId());
        map.put("invoiceNumber", invoice.getInvoiceNumber());
        map.put("buyerName", invoice.getBuyerName());
        map.put("finalAmount", invoice.getFinalAmount());
        map.put("status", invoice.getStatus());
        map.put("originalInvoiceId",
                invoice.getOriginalInvoice() != null ? invoice.getOriginalInvoice().getId() : null);
        return map;
    }

    private boolean checkDataDifference(EInvoice original, CreateAdjustmentInvoiceRequest request) {
        // Kiểm tra thông tin người mua (sử dụng giá trị thực tế sẽ lưu nếu input là
        // null)
        String resolvedBuyerName = request.getBuyerName() != null ? request.getBuyerName() : original.getBuyerName();
        String resolvedBuyerTaxCode = request.getBuyerTaxCode() != null ? request.getBuyerTaxCode()
                : original.getBuyerTaxCode();
        String resolvedBuyerAddress = request.getBuyerAddress() != null ? request.getBuyerAddress()
                : original.getBuyerAddress();
        String resolvedBuyerPhone = request.getBuyerPhone() != null ? request.getBuyerPhone()
                : original.getBuyerPhone();
        String resolvedBuyerEmail = request.getBuyerEmail() != null ? request.getBuyerEmail()
                : original.getBuyerEmail();

        if (!Objects.equals(original.getBuyerName(), resolvedBuyerName))
            return true;
        if (!Objects.equals(original.getBuyerTaxCode(), resolvedBuyerTaxCode))
            return true;
        if (!Objects.equals(original.getBuyerAddress(), resolvedBuyerAddress))
            return true;
        if (!Objects.equals(original.getBuyerPhone(), resolvedBuyerPhone))
            return true;
        if (!Objects.equals(original.getBuyerEmail(), resolvedBuyerEmail))
            return true;

        // Kiểm tra danh sách hàng hóa
        List<EInvoiceItem> originalItems = original.getItems();
        List<CreateAdjustmentInvoiceItemRequest> reqItems = request.getItems();

        if (originalItems.size() != reqItems.size())
            return true;

        // So sánh từng cặp sản phẩm (để đơn giản và chính xác, chúng ta sort theo
        // productId hoặc productName nếu productId null)
        List<EInvoiceItem> sortedOriginal = new ArrayList<>(originalItems);
        sortedOriginal.sort(Comparator.comparing(
                item -> item.getProductName() + "_" + (item.getProduct() != null ? item.getProduct().getId() : "")));

        List<CreateAdjustmentInvoiceItemRequest> sortedReq = new ArrayList<>(reqItems);
        sortedReq.sort(Comparator.comparing(
                item -> item.getProductName() + "_" + (item.getProductId() != null ? item.getProductId() : "")));

        for (int i = 0; i < sortedOriginal.size(); i++) {
            EInvoiceItem origItem = sortedOriginal.get(i);
            CreateAdjustmentInvoiceItemRequest reqItem = sortedReq.get(i);

            String origProdId = origItem.getProduct() != null ? origItem.getProduct().getId() : null;
            String reqProdId = reqItem.getProductId();
            if (!Objects.equals(origProdId, reqProdId))
                return true;
            if (!Objects.equals(origItem.getProductName(), reqItem.getProductName()))
                return true;
            if (!Objects.equals(origItem.getUnit(), reqItem.getUnit()))
                return true;
            if (origItem.getQuantity().compareTo(reqItem.getQuantity()) != 0)
                return true;
            if (origItem.getUnitPrice().compareTo(reqItem.getUnitPrice()) != 0)
                return true;
            if (origItem.getTaxRatePercentage().compareTo(reqItem.getTaxRatePercentage()) != 0)
                return true;

            BigDecimal reqDiscount = reqItem.getDiscountAmount() != null ? reqItem.getDiscountAmount()
                    : BigDecimal.ZERO;
            if (origItem.getDiscountAmount().compareTo(reqDiscount) != 0)
                return true;
        }

        return false;
    }

    private InvoiceResponse mapToInvoiceResponse(EInvoice invoice) {
        return mapToInvoiceResponse(invoice, true);
    }

    private InvoiceResponse mapToInvoiceResponse(EInvoice invoice, boolean includePayments) {
        List<InvoiceItemResponse> items = invoice.getItems().stream()
                .map(item -> InvoiceItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .unit(item.getUnit())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxRatePercentage(item.getTaxRatePercentage())
                        .taxAmount(item.getTaxAmount())
                        .discountAmount(item.getDiscountAmount())
                        .promotionName(item.getPromotionName())
                        .subtotal(item.getSubtotal())
                        .createdAt(item.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        String paymentMethod = invoice.getPaymentMethod();
        if (paymentMethod == null && invoice.getOrder() != null) {
            paymentMethod = invoice.getOrder().getPaymentMethod();
        }
        if (paymentMethod == null) {
            paymentMethod = "CASH";
        }

        List<OrderPaymentResponse> paymentResponses = null;
        if (includePayments && invoice.getOrder() != null && orderPaymentRepository != null) {
            List<OrderPayment> orderPayments = orderPaymentRepository.findByOrderId(invoice.getOrder().getId());
            if (orderPayments != null && !orderPayments.isEmpty()) {
                paymentResponses = orderPayments.stream()
                        .map(op -> OrderPaymentResponse.builder()
                                .id(op.getId())
                                .orderId(invoice.getOrder().getId())
                                .orderCode(invoice.getOrder().getOrderNumber())
                                .householdId(invoice.getHousehold() != null ? invoice.getHousehold().getId() : null)
                                .paymentMethod(op.getPaymentMethod())
                                .amount(op.getAmount())
                                .amountGiven(op.getAmountGiven())
                                .changeAmount(op.getChangeAmount())
                                .transactionCode(op.getTransactionCode())
                                .isConfirmed(op.getIsConfirmed())
                                .notes(op.getNotes())
                                .createdAt(op.getCreatedAt())
                                .build())
                        .collect(Collectors.toList());
            }
        }

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .householdId(invoice.getHousehold() != null ? invoice.getHousehold().getId() : null)
                .householdName(invoice.getHousehold() != null ? invoice.getHousehold().getName() : null)
                .householdTaxCode(invoice.getHousehold() != null ? invoice.getHousehold().getTaxCode() : null)
                .householdAddress(invoice.getHousehold() != null ? invoice.getHousehold().getAddress() : null)
                .householdPhone(invoice.getHousehold() != null ? invoice.getHousehold().getPhoneNumber() : null)
                .orderId(invoice.getOrder() != null ? invoice.getOrder().getId() : null)
                .orderNumber(invoice.getOrder() != null ? invoice.getOrder().getOrderNumber() : null)
                .originalInvoiceId(invoice.getOriginalInvoice() != null ? invoice.getOriginalInvoice().getId() : null)
                .createdByUserId(invoice.getCreatedByUser() != null ? invoice.getCreatedByUser().getId() : null)
                .createdByUsername(invoice.getCreatedByUser() != null ? invoice.getCreatedByUser().getUsername() : null)
                .createdByFullName(invoice.getCreatedByUser() != null ? invoice.getCreatedByUser().getFullName() : null)
                .canceledByUserId(invoice.getCanceledByUser() != null ? invoice.getCanceledByUser().getId() : null)
                .canceledByUsername(
                        invoice.getCanceledByUser() != null ? invoice.getCanceledByUser().getUsername() : null)
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoicePattern(invoice.getInvoicePattern())
                .invoiceSymbol(invoice.getInvoiceSymbol())
                .title(invoice.getTitle() != null ? invoice.getTitle() : "HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                .footerNote(invoice.getFooterNote())
                .buyerName(invoice.getBuyerName())
                .buyerTaxCode(invoice.getBuyerTaxCode())
                .buyerPhone(invoice.getBuyerPhone())
                .buyerEmail(invoice.getBuyerEmail())
                .buyerAddress(invoice.getBuyerAddress())
                .totalAmountBeforeTax(invoice.getTotalAmountBeforeTax())
                .taxAmount(invoice.getTaxAmount())
                .discountAmount(invoice.getDiscountAmount())
                .finalAmount(invoice.getFinalAmount())
                .paymentMethod(paymentMethod)
                .payments(paymentResponses)
                .status(invoice.getStatus())
                .customerDeliveryStatus(invoice.getCustomerDeliveryStatus())
                .taxAuthorityCode(invoice.getTaxAuthorityCode())
                .taxAuthorityResponse(invoice.getTaxAuthorityResponse())
                .cancelReason(invoice.getCancelReason())
                .lookupCode(invoice.getLookupCode())
                .sentToTaxAt(invoice.getSentToTaxAt())
                .taxResponseAt(invoice.getTaxResponseAt())
                .canceledAt(invoice.getCanceledAt())
                .retryCount(invoice.getRetryCount())
                .maxRetryCount(invoice.getMaxRetryCount())
                .nextRetryAt(invoice.getNextRetryAt())
                .lastRetryAt(invoice.getLastRetryAt())
                .errorCategory(invoice.getErrorCategory())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .isErrorNotified(invoice.getIsErrorNotified())
                .items(items)
                .build();
    }

    // ==========================================
    // NGHIỆP VỤ ĐIỀU CHỈNH HÓA ĐƠN
    // ==========================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse createAdjustmentInvoice(String currentUsername, String originalInvoiceId,
            CreateAdjustmentInvoiceRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        String role = user.getRole().getCode();

        // Quyền hạn chính: Chỉ chủ hộ kinh doanh (VT-01) hoặc Kế toán (VT-03) được phép
        if (!"VT-01".equals(role) && !"VT-03".equals(role)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // 1. Tìm hóa đơn gốc
        EInvoice original = eInvoiceRepository
                .findByIdAndHouseholdIdAndDeletedAtIsNull(originalInvoiceId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        // 2. Kiểm tra hóa đơn gốc đã bị điều chỉnh hoặc hủy trước đó chưa
        if ("ADJUSTED".equals(original.getStatus()) || "CANCELED".equals(original.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_ADJUSTED_OR_CANCELED);
        }

        // 3. Kiểm tra hóa đơn gốc đã được cấp mã chưa (trạng thái phải là ISSUED)
        if (!"ISSUED".equals(original.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_ISSUED);
        }

        // 4. Kiểm tra xem dữ liệu điều chỉnh có khác so với gốc hay không
        boolean hasChange = checkDataDifference(original, request);
        if (!hasChange) {
            throw new AppException(ErrorCode.INVOICE_ADJUSTMENT_NO_CHANGE);
        }

        // 5. Tính toán các khoản tiền cho hóa đơn điều chỉnh mới
        BigDecimal totalAmountBeforeTax = BigDecimal.ZERO;
        BigDecimal totalTaxAmount = BigDecimal.ZERO;
        BigDecimal totalDiscountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = BigDecimal.ZERO;

        List<EInvoiceItem> newItems = new ArrayList<>();

        // N+1 Query Avoidance: Batch load products if productIds are provided
        List<String> productIds = request.getItems().stream()
                .map(CreateAdjustmentInvoiceItemRequest::getProductId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Map<String, Product> productMap = new HashMap<>();
        if (!productIds.isEmpty()) {
            productRepository.findAllById(productIds).forEach(p -> productMap.put(p.getId(), p));
        }

        for (CreateAdjustmentInvoiceItemRequest itemReq : request.getItems()) {
            BigDecimal quantity = itemReq.getQuantity();
            BigDecimal unitPrice = itemReq.getUnitPrice();
            BigDecimal discountAmt = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount()
                    : BigDecimal.ZERO;
            BigDecimal taxRate = itemReq.getTaxRatePercentage() != null ? itemReq.getTaxRatePercentage()
                    : BigDecimal.ZERO;

            BigDecimal itemAmount = quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxableAmount = itemAmount.subtract(discountAmt).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxAmount = taxableAmount
                    .multiply(taxRate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
                    .setScale(2, RoundingMode.HALF_UP);
            BigDecimal subtotal = taxableAmount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

            totalAmountBeforeTax = totalAmountBeforeTax.add(taxableAmount);
            totalTaxAmount = totalTaxAmount.add(taxAmount);
            totalDiscountAmount = totalDiscountAmount.add(discountAmt);
            finalAmount = finalAmount.add(subtotal);

            Product product = null;
            if (itemReq.getProductId() != null) {
                product = productMap.get(itemReq.getProductId());
                if (product == null) {
                    throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
                }
            }

            EInvoiceItem newItem = EInvoiceItem.builder()
                    .product(product)
                    .productName(itemReq.getProductName())
                    .unit(itemReq.getUnit())
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .taxRatePercentage(taxRate)
                    .taxAmount(taxAmount)
                    .discountAmount(discountAmt)
                    .subtotal(subtotal)
                    .build();

            newItems.add(newItem);
        }

        // 6. Tạo hóa đơn điều chỉnh mới
        if (request.getBuyerTaxCode() != null) {
            validateBuyerTaxCode(request.getBuyerTaxCode());
        }

        String lookupCode;
        do {
            lookupCode = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10).toUpperCase();
        } while (eInvoiceRepository.existsByLookupCodeAndDeletedAtIsNull(lookupCode));

        EInvoice adjustmentInvoice = EInvoice.builder()
                .household(household)
                .order(original.getOrder())
                .originalInvoice(original)
                .createdByUser(user)
                .invoicePattern(original.getInvoicePattern())
                .invoiceSymbol(original.getInvoiceSymbol())
                .title(original.getTitle() != null ? original.getTitle() : "HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                .footerNote(original.getFooterNote())
                .buyerName(request.getBuyerName() != null ? request.getBuyerName() : original.getBuyerName())
                .buyerTaxCode(
                        request.getBuyerTaxCode() != null ? request.getBuyerTaxCode() : original.getBuyerTaxCode())
                .buyerAddress(
                        request.getBuyerAddress() != null ? request.getBuyerAddress() : original.getBuyerAddress())
                .buyerPhone(request.getBuyerPhone() != null ? request.getBuyerPhone() : original.getBuyerPhone())
                .buyerEmail(request.getBuyerEmail() != null ? request.getBuyerEmail() : original.getBuyerEmail())
                .totalAmountBeforeTax(totalAmountBeforeTax)
                .taxAmount(totalTaxAmount)
                .discountAmount(totalDiscountAmount)
                .finalAmount(finalAmount)
                .paymentMethod(original.getPaymentMethod())
                .status("DRAFT")
                .lookupCode(lookupCode)
                .build();

        for (EInvoiceItem item : newItems) {
            item.setInvoice(adjustmentInvoice);
        }
        adjustmentInvoice.setItems(newItems);

        // Lưu hóa đơn điều chỉnh vào CSDL
        EInvoice savedAdjustment = eInvoiceRepository.save(adjustmentInvoice);

        // 7. Cập nhật hóa đơn gốc sang trạng thái ADJUSTED
        String oldStatus = original.getStatus();
        original.setStatus("ADJUSTED");
        eInvoiceRepository.save(original);

        // 8. Ghi log trạng thái hóa đơn
        InvoiceStatusLog adjustmentLog = InvoiceStatusLog.builder()
                .invoice(savedAdjustment)
                .fromStatus("NONE")
                .toStatus("DRAFT")
                .changedByUser(user)
                .notes("Khởi tạo hóa đơn điều chỉnh. Lý do điều chỉnh: " + request.getAdjustmentReason())
                .build();
        invoiceStatusLogRepository.save(adjustmentLog);

        // 9. Ghi nhật ký hệ thống
        logActivity(household, user, "ADJUST_INVOICE", original.getId(), buildInvoiceLogMap(original),
                buildInvoiceLogMap(savedAdjustment));

        return mapToInvoiceResponse(savedAdjustment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceStatusLogResponse> getInvoiceLogs(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        // Bảo mật cách ly dữ liệu: Nhân viên VT-02 chỉ được xem log trạng thái hóa đơn
        // của chính mình
        if ("VT-02".equals(user.getRole().getCode())) {
            if (!invoice.getCreatedByUser().getId().equals(user.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        List<InvoiceStatusLog> logs = invoiceStatusLogRepository.findByInvoiceIdOrderByCreatedAtAsc(invoice.getId());
        return logs.stream().map(log -> InvoiceStatusLogResponse.builder()
                .id(log.getId())
                .invoiceId(log.getInvoice().getId())
                .fromStatus(log.getFromStatus())
                .toStatus(log.getToStatus())
                .changedByUserId(log.getChangedByUser().getId())
                .changedByFullName(log.getChangedByUser().getFullName())
                .notes(log.getNotes())
                .createdAt(log.getCreatedAt())
                .build()).collect(Collectors.toList());
    }

    // ============================================
    // NGHIỆP VỤ PHÁT HÀNH HÓA ĐƠN GỐC (Develop Branch)
    // ============================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse createInvoiceDraft(String currentUsername, String orderId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        if (household.getRevenueThresholdEnabled() == null || !household.getRevenueThresholdEnabled()) {
            throw new AppException(ErrorCode.FEATURE_NOT_ENABLED);
        }

        Order order = orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(orderId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.ORDER_NOT_FOUND));

        if (!"COMPLETED".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_NOT_COMPLETED);
        }

        if (!"PAID".equals(order.getPaymentStatus())) {
            throw new AppException(ErrorCode.ORDER_NOT_COMPLETED);
        }

        if (eInvoiceRepository.findByOrderIdAndDeletedAtIsNull(orderId).isPresent()) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_EXISTS);
        }

        InvoiceTemplate template = invoiceTemplateRepository.findByHouseholdId(household.getId())
                .orElseGet(() -> invoiceTemplateRepository.save(InvoiceTemplate.builder()
                        .household(household)
                        .invoicePattern("1")
                        .invoiceSymbol("1C26TAA")
                        .title("HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                        .footerNote(
                                "Cảm ơn quý khách đã mua hàng! Hóa đơn điện tử khởi tạo từ máy tính tiền có mã của CQT.")
                        .build()));

        String lookupCode;
        do {
            lookupCode = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10).toUpperCase();
        } while (eInvoiceRepository.existsByLookupCodeAndDeletedAtIsNull(lookupCode));

        BigDecimal totalBeforeTax = BigDecimal.ZERO;
        BigDecimal totalTaxAmount = BigDecimal.ZERO;

        List<EInvoiceItem> invoiceItems = new ArrayList<>();

        EInvoice invoice = EInvoice.builder()
                .household(household)
                .order(order)
                .createdByUser(currentUser)
                .invoicePattern(template.getInvoicePattern())
                .invoiceSymbol(template.getInvoiceSymbol())
                .title(template.getTitle() != null ? template.getTitle() : "HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                .footerNote(template.getFooterNote())
                .buyerName(order.getCustomer() != null ? order.getCustomer().getName() : "Khách mua lẻ")
                .buyerTaxCode(order.getCustomer() != null ? order.getCustomer().getTaxCode() : null)
                .buyerPhone(order.getCustomer() != null ? order.getCustomer().getPhoneNumber() : null)
                .buyerEmail(order.getCustomer() != null ? order.getCustomer().getEmail() : null)
                .buyerAddress(order.getCustomer() != null ? order.getCustomer().getAddress() : null)
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .paymentMethod(order.getPaymentMethod())
                .status("DRAFT")
                .lookupCode(lookupCode)
                .build();

        for (OrderItem orderItem : order.getItems()) {
            BigDecimal qty = orderItem.getQuantity();
            BigDecimal price = orderItem.getUnitPrice();
            BigDecimal disc = orderItem.getDiscountAmount();
            BigDecimal taxRate = orderItem.getTaxRatePercentage();
            BigDecimal taxAmt = orderItem.getTaxAmount();

            BigDecimal lineBeforeTax = qty.multiply(price).subtract(disc);
            totalBeforeTax = totalBeforeTax.add(lineBeforeTax);
            totalTaxAmount = totalTaxAmount.add(taxAmt);

            EInvoiceItem invItem = EInvoiceItem.builder()
                    .invoice(invoice)
                    .product(orderItem.getProduct())
                    .productName(orderItem.getProductName())
                    .unit(org.springframework.util.StringUtils.hasText(orderItem.getUnitName()) 
                            ? orderItem.getUnitName() 
                            : (orderItem.getProduct() != null ? orderItem.getProduct().getUnit() : "Cái"))
                    .quantity(qty)
                    .unitPrice(price)
                    .taxRatePercentage(taxRate)
                    .taxAmount(taxAmt)
                    .discountAmount(disc)
                    .promotion(orderItem.getPromotion())
                    .promotionName(orderItem.getPromotionName())
                    .subtotal(lineBeforeTax)
                    .build();

            invoiceItems.add(invItem);
        }

        invoice.setTotalAmountBeforeTax(totalBeforeTax);
        invoice.setTaxAmount(totalTaxAmount);
        invoice.setItems(invoiceItems);

        EInvoice savedInvoice = eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(savedInvoice)
                .fromStatus("-")
                .toStatus("DRAFT")
                .changedByUser(currentUser)
                .notes("Khởi tạo hóa đơn điện tử nháp từ đơn bán " + order.getOrderNumber())
                .build());

        log.info("Khởi tạo HĐĐT nháp thành công. ID={}, LookupCode={}", savedInvoice.getId(),
                savedInvoice.getLookupCode());
        return mapToInvoiceResponse(savedInvoice);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse submitToTax(String currentUsername, String invoiceId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        if (!"DRAFT".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        Map<String, Object> oldVal = buildInvoiceLogMap(invoice);

        String oldStatus = invoice.getStatus();
        invoice.setStatus("WAITING_TAX_CODE");
        invoice.setSentToTaxAt(LocalDateTime.now());

        EInvoice saved = eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus(oldStatus)
                .toStatus("WAITING_TAX_CODE")
                .changedByUser(currentUser)
                .notes("Gửi hóa đơn điện tử chờ cơ quan thuế cấp mã")
                .build());

        logActivity(invoice.getHousehold(), currentUser, "SUBMIT_TAX", saved.getId(), oldVal,
                buildInvoiceLogMap(saved));

        if (taxConnectionService != null && invoice.getHousehold() != null) {
            taxConnectionService.recordConnectionEvent(invoice.getHousehold().getId(), "ONLINE", 120, null);
        }

        log.info("HĐĐT ID={} được đưa vào hàng đợi chờ Cơ quan Thuế duyệt cấp mã.", invoiceId);
        return mapToInvoiceResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse resendInvoice(String currentUsername, String invoiceId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        if (!"SEND_ERROR".equals(invoice.getStatus()) && !"MANUAL_PROCESSING".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        String oldStatus = invoice.getStatus();
        invoice.setStatus("WAITING_TAX_CODE");
        invoice.setSentToTaxAt(LocalDateTime.now());
        invoice.setNextRetryAt(null);
        invoice.setErrorCategory(null);
        invoice.setTaxAuthorityResponse(null);

        EInvoice saved = eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus(oldStatus)
                .toStatus("WAITING_TAX_CODE")
                .changedByUser(currentUser)
                .notes("Gửi lại hóa đơn điện tử bị lỗi lên cơ quan thuế")
                .build());

        if (taxConnectionService != null && invoice.getHousehold() != null) {
            taxConnectionService.recordConnectionEvent(invoice.getHousehold().getId(), "ONLINE", 120, null);
        }

        log.info("Gửi lại HĐĐT bị lỗi ID={} lên Cơ quan Thuế thành công.", invoiceId);
        return mapToInvoiceResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse cancelInvoice(String currentUsername, String invoiceId, CancelInvoiceRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);

        String role = currentUser.getRole().getCode();
        if (!"VT-01".equals(role) && !"VT-03".equals(role)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        if (!"ISSUED".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_CANNOT_BE_CANCELED);
        }

        Map<String, Object> oldVal = buildInvoiceLogMap(invoice);

        String oldStatus = invoice.getStatus();
        invoice.setStatus("CANCELED");
        invoice.setCancelReason(request.getCancelReason());
        invoice.setCanceledAt(LocalDateTime.now());
        invoice.setCanceledByUser(currentUser);

        EInvoice saved = eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus(oldStatus)
                .toStatus("CANCELED")
                .changedByUser(currentUser)
                .notes("Hủy hóa đơn điện tử. Lý do: " + request.getCancelReason())
                .build());

        logActivity(invoice.getHousehold(), currentUser, "CANCEL_INVOICE", saved.getId(), oldVal,
                buildInvoiceLogMap(saved));

        log.info("Hủy HĐĐT thành công. ID={}, Lý do={}", invoiceId, request.getCancelReason());
        return mapToInvoiceResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(String currentUsername, String invoiceId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        // Bảo mật cách ly dữ liệu: Nhân viên VT-02 chỉ được xem hóa đơn do chính mình
        // tạo
        if ("VT-02".equals(currentUser.getRole().getCode())) {
            if (!invoice.getCreatedByUser().getId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        return mapToInvoiceResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> getInvoices(
            String currentUsername,
            String status,
            LocalDate fromDate,
            LocalDate toDate,
            String search,
            int page,
            int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // Bảo mật cách ly dữ liệu: Nhân viên VT-02 chỉ thấy hóa đơn của chính mình
        String createdByUserId = null;
        if ("VT-02".equals(currentUser.getRole().getCode())) {
            createdByUserId = currentUser.getId();
        }

        final String finalCreatedByUserId = createdByUserId;
        Specification<EInvoice> spec = (root, query, cb) -> {
            if (query != null && !Long.class.equals(query.getResultType())
                    && !long.class.equals(query.getResultType())) {
                root.fetch("items", JoinType.LEFT);
            }
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("household").get("id"), household.getId()));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (finalCreatedByUserId != null) {
                predicates.add(cb.equal(root.get("createdByUser").get("id"), finalCreatedByUserId));
            }

            if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate.atTime(LocalTime.MAX)));
            }

            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate numberPredicate = cb.like(cb.lower(root.get("invoiceNumber")), searchPattern);
                Predicate lookupPredicate = cb.like(cb.lower(root.get("lookupCode")), searchPattern);
                predicates.add(cb.or(numberPredicate, lookupPredicate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<EInvoice> pageData = eInvoiceRepository.findAll(spec, pageable);
        List<InvoiceResponse> content = pageData.getContent().stream()
                .map(inv -> mapToInvoiceResponse(inv, false))
                .collect(Collectors.toList());

        return PageResponse.<InvoiceResponse>builder()
                .content(content)
                .pageNumber(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> getWaitingInvoicesForTax(int page, int size) {
        Specification<EInvoice> spec = (root, query, cb) -> {
            if (query != null && !Long.class.equals(query.getResultType())
                    && !long.class.equals(query.getResultType())) {
                root.fetch("items", JoinType.LEFT);
            }
            return cb.and(
                    cb.equal(root.get("status"), "WAITING_TAX_CODE"),
                    cb.isNull(root.get("deletedAt")));
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<EInvoice> pageData = eInvoiceRepository.findAll(spec, pageable);
        List<InvoiceResponse> content = pageData.getContent().stream()
                .map(inv -> mapToInvoiceResponse(inv, false))
                .collect(Collectors.toList());

        return PageResponse.<InvoiceResponse>builder()
                .content(content)
                .pageNumber(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> getProcessedInvoicesForTax(int page, int size) {
        Specification<EInvoice> spec = (root, query, cb) -> {
            if (query != null && !Long.class.equals(query.getResultType())
                    && !long.class.equals(query.getResultType())) {
                root.fetch("items", JoinType.LEFT);
            }
            return cb.and(
                    root.get("status").in("ISSUED", "SEND_ERROR"),
                    cb.isNull(root.get("deletedAt")));
        };
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<EInvoice> pageData = eInvoiceRepository.findAll(spec, pageable);
        List<InvoiceResponse> content = pageData.getContent().stream()
                .map(inv -> mapToInvoiceResponse(inv, false))
                .collect(Collectors.toList());

        return PageResponse.<InvoiceResponse>builder()
                .content(content)
                .pageNumber(pageData.getNumber())
                .pageSize(pageData.getSize())
                .totalElements(pageData.getTotalElements())
                .totalPages(pageData.getTotalPages())
                .last(pageData.isLast())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public synchronized InvoiceResponse approveInvoiceByTax(String currentUsername, String invoiceId, String taxCode) {
        User currentUser = currentUsername != null ? getAuthenticatedUser(currentUsername) : null;
        if (currentUser == null) {
            currentUser = userRepository.findFirstByRole_CodeAndDeletedAtIsNull("VT-05")
                    .orElse(null);
        }

        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        if (!"WAITING_TAX_CODE".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        Map<String, Object> oldVal = buildInvoiceLogMap(invoice);

        String oldStatus = invoice.getStatus();

        // Sequential numbering using InvoiceNumberRangeService (NCL-04-CN-009)
        String householdId = invoice.getHousehold().getId();
        String invoiceNum;
        if (invoiceNumberRangeService != null) {
            try {
                invoiceNum = invoiceNumberRangeService.allocateNextInvoiceNumber(
                        householdId, invoice.getInvoicePattern(), invoice.getInvoiceSymbol());
            } catch (AppException e) {
                if (ErrorCode.INVOICE_RANGE_EXHAUSTED.equals(e.getErrorCode())) {
                    throw e; // NCL-04-CN-009-TC-03: Block issuance if range is exhausted
                }
                String pattern = invoice.getInvoicePattern();
                String symbol = invoice.getInvoiceSymbol();
                Optional<String> maxNumOpt = eInvoiceRepository.findMaxInvoiceNumber(householdId, pattern, symbol);
                int nextNum = 1;
                if (maxNumOpt.isPresent() && maxNumOpt.get() != null) {
                    try {
                        nextNum = Integer.parseInt(maxNumOpt.get()) + 1;
                    } catch (NumberFormatException ex) {
                        // Ignore
                    }
                }
                invoiceNum = String.format("%08d", nextNum);
            }
        } else {
            String pattern = invoice.getInvoicePattern();
            String symbol = invoice.getInvoiceSymbol();
            Optional<String> maxNumOpt = eInvoiceRepository.findMaxInvoiceNumber(householdId, pattern, symbol);
            int nextNum = 1;
            if (maxNumOpt.isPresent() && maxNumOpt.get() != null) {
                try {
                    nextNum = Integer.parseInt(maxNumOpt.get()) + 1;
                } catch (NumberFormatException e) {
                    // Ignore
                }
            }
            invoiceNum = String.format("%08d", nextNum);
        }

        invoice.setStatus("ISSUED");
        invoice.setInvoiceNumber(invoiceNum);
        invoice.setTaxAuthorityCode(
                taxCode != null ? taxCode : "CQT-" + UUID.randomUUID().toString().substring(0, 15).toUpperCase());
        invoice.setTaxResponseAt(LocalDateTime.now());

        EInvoice saved = eInvoiceRepository.save(invoice);

        if (taxConnectionService != null) {
            try {
                taxConnectionService.recordConnectionEvent(householdId, "ONLINE", 120, null);
            } catch (Exception e) {
                log.warn("Lỗi ghi log kết nối cơ quan thuế: {}", e.getMessage());
            }
        }

        String actorName = currentUser != null ? currentUser.getUsername() : "Hệ thống tự động";
        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus(oldStatus)
                .toStatus("ISSUED")
                .changedByUser(currentUser)
                .notes("Cơ quan thuế (" + actorName + ") đã phê duyệt cấp mã: "
                        + saved.getTaxAuthorityCode())
                .build());

        logActivity(invoice.getHousehold(), currentUser, "APPROVE_TAX", saved.getId(), oldVal,
                buildInvoiceLogMap(saved));

        log.info("Thuế duyệt cấp mã hóa đơn thành công. ID={}, Số HĐ={}, Mã CQT={}",
                invoiceId, saved.getInvoiceNumber(), saved.getTaxAuthorityCode());
        return mapToInvoiceResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse rejectInvoiceByTax(String currentUsername, String invoiceId, String errorMessage) {
        User currentUser = currentUsername != null ? getAuthenticatedUser(currentUsername) : null;
        if (currentUser == null) {
            currentUser = userRepository.findFirstByRole_CodeAndDeletedAtIsNull("VT-05")
                    .orElse(null);
        }

        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        if (!"WAITING_TAX_CODE".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        Map<String, Object> oldVal = buildInvoiceLogMap(invoice);

        String oldStatus = invoice.getStatus();
        invoice.setStatus("SEND_ERROR");
        invoice.setTaxAuthorityResponse(
                errorMessage != null ? errorMessage : "Dữ liệu hóa đơn không hợp lệ theo quy định.");
        invoice.setTaxResponseAt(LocalDateTime.now());

        EInvoice saved = eInvoiceRepository.save(invoice);

        if (taxConnectionService != null) {
            try {
                taxConnectionService.recordConnectionEvent(invoice.getHousehold().getId(), "SLOW", 500, errorMessage);
            } catch (Exception e) {
                log.warn("Lỗi ghi log kết nối cơ quan thuế: {}", e.getMessage());
            }
        }

        String actorName = currentUser != null ? currentUser.getUsername() : "Hệ thống tự động";
        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus(oldStatus)
                .toStatus("SEND_ERROR")
                .changedByUser(currentUser)
                .notes("Cơ quan thuế (" + actorName + ") đã từ chối cấp mã: "
                        + saved.getTaxAuthorityResponse())
                .build());

        logActivity(invoice.getHousehold(), currentUser, "REJECT_TAX", saved.getId(), oldVal,
                buildInvoiceLogMap(saved));

        log.info("Thuế từ chối cấp mã hóa đơn. ID={}, Lý do={}", invoiceId, saved.getTaxAuthorityResponse());
        return mapToInvoiceResponse(saved);
    }

    private void validateBuyerTaxCode(String taxCode) {
        if (taxCode == null || taxCode.trim().isEmpty()) {
            return;
        }
        String trimmed = taxCode.trim();
        if (!trimmed.matches("^\\d{10}$|^\\d{13}$|^\\d{10}-\\d{3}$")) {
            throw new AppException(ErrorCode.INVALID_TAX_CODE);
        }
    }

    private void syncCustomerProfile(BusinessHousehold household, String taxCode, String name, String address, String email, String phone) {
        if (household == null || taxCode == null || taxCode.trim().isEmpty()) {
            return;
        }
        String trimmedTaxCode = taxCode.trim();
        Optional<Customer> custOpt = customerRepository.findFirstByHouseholdIdAndTaxCodeAndDeletedAtIsNullOrderByCreatedAtDesc(household.getId(), trimmedTaxCode);
        if (custOpt.isPresent()) {
            Customer cust = custOpt.get();
            boolean updated = false;
            if (name != null && !name.trim().isEmpty() && !"Khách lẻ".equals(name.trim())) {
                if (!name.trim().equals(cust.getName())) {
                    cust.setName(name.trim());
                    updated = true;
                }
            }
            if (address != null && !address.trim().isEmpty()) {
                if (!address.trim().equals(cust.getAddress())) {
                    cust.setAddress(address.trim());
                    updated = true;
                }
            }
            if (email != null && !email.trim().isEmpty()) {
                if (!email.trim().equals(cust.getEmail())) {
                    cust.setEmail(email.trim());
                    updated = true;
                }
            }
            if (phone != null && !phone.trim().isEmpty()) {
                String cleanedPhone = phone.replaceAll("[^0-9]", "");
                if (cleanedPhone.matches("^[0-9]{9,15}$") && !cleanedPhone.equals(cust.getPhoneNumber())) {
                    Optional<Customer> phoneCustOpt = customerRepository.findFirstByPhoneNumberAndHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc(cleanedPhone, household.getId());
                    if (phoneCustOpt.isEmpty() || (phoneCustOpt.get().getId() != null && phoneCustOpt.get().getId().equals(cust.getId()))) {
                        cust.setPhoneNumber(cleanedPhone);
                        updated = true;
                    }
                }
            }
            if (updated) {
                customerRepository.save(cust);
            }
        } else {
            String digitsOnly = trimmedTaxCode.replaceAll("[^0-9]", "");
            String fallbackPhone = "09" + (digitsOnly + "00000000").substring(0, 8);
            String cleanedPhone = phone != null ? phone.replaceAll("[^0-9]", "") : "";
            String custPhone = cleanedPhone.matches("^[0-9]{9,15}$") ? cleanedPhone : fallbackPhone;

            Optional<Customer> phoneCustOpt = customerRepository.findFirstByPhoneNumberAndHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc(custPhone, household.getId());
            if (phoneCustOpt.isPresent()) {
                Customer existingCust = phoneCustOpt.get();
                existingCust.setTaxCode(trimmedTaxCode);
                if (name != null && !name.trim().isEmpty() && !"Khách lẻ".equals(name.trim())) {
                    existingCust.setName(name.trim());
                }
                if (address != null && !address.trim().isEmpty()) {
                    existingCust.setAddress(address.trim());
                }
                if (email != null && !email.trim().isEmpty()) {
                    existingCust.setEmail(email.trim());
                }
                customerRepository.save(existingCust);
            } else {
                Customer newCust = Customer.builder()
                        .household(household)
                        .taxCode(trimmedTaxCode)
                        .name(name != null && !name.trim().isEmpty() ? name.trim() : "Khách doanh nghiệp")
                        .phoneNumber(custPhone)
                        .address(address != null ? address.trim() : null)
                        .email(email != null ? email.trim() : null)
                        .build();
                customerRepository.save(newCust);
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse updateInvoice(String currentUsername, String invoiceId, UpdateInvoiceRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        if (!"DRAFT".equals(invoice.getStatus()) && !"SEND_ERROR".equals(invoice.getStatus()) && !"MANUAL_PROCESSING".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_EDITABLE);
        }

        Map<String, Object> oldVal = buildInvoiceLogMap(invoice);

        String rawTaxCode = request.getBuyerTaxCode() != null ? request.getBuyerTaxCode().trim() : null;
        String taxCode = (rawTaxCode != null && !rawTaxCode.isEmpty()) ? rawTaxCode : null;
        String buyerName = request.getBuyerName() != null ? request.getBuyerName().trim() : null;
        String buyerAddress = request.getBuyerAddress() != null ? request.getBuyerAddress().trim() : null;
        String buyerPhone = request.getBuyerPhone() != null ? request.getBuyerPhone().trim() : null;
        String buyerEmail = request.getBuyerEmail() != null ? request.getBuyerEmail().trim() : null;

        if (taxCode != null && !taxCode.isEmpty()) {
            validateBuyerTaxCode(taxCode);
            Optional<Customer> existingCustOpt = customerRepository.findFirstByHouseholdIdAndTaxCodeAndDeletedAtIsNullOrderByCreatedAtDesc(
                    currentUser.getHousehold().getId(), taxCode);
            if (existingCustOpt.isPresent()) {
                Customer cust = existingCustOpt.get();
                if (buyerName == null || buyerName.isEmpty()) {
                    buyerName = cust.getName();
                }
                if (buyerAddress == null || buyerAddress.isEmpty()) {
                    buyerAddress = cust.getAddress();
                }
                if (buyerEmail == null || buyerEmail.isEmpty()) {
                    buyerEmail = cust.getEmail();
                }
                if (buyerPhone == null || buyerPhone.isEmpty()) {
                    buyerPhone = cust.getPhoneNumber();
                }
            }
            if (buyerName == null || buyerName.trim().isEmpty() || buyerAddress == null || buyerAddress.trim().isEmpty()) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
        }

        String finalBuyerName = buyerName != null ? buyerName : invoice.getBuyerName();
        if ((taxCode == null || taxCode.isEmpty()) && (finalBuyerName == null || finalBuyerName.trim().isEmpty())) {
            finalBuyerName = "Khách lẻ";
        }

        invoice.setBuyerName(finalBuyerName);
        invoice.setBuyerTaxCode(taxCode);
        if (buyerAddress != null) invoice.setBuyerAddress(buyerAddress);
        if (buyerPhone != null) invoice.setBuyerPhone(buyerPhone);
        if (buyerEmail != null) invoice.setBuyerEmail(buyerEmail);

        EInvoice saved = eInvoiceRepository.save(invoice);

        if (taxCode != null && !taxCode.isEmpty() && finalBuyerName != null && !finalBuyerName.isEmpty() && !"Khách lẻ".equals(finalBuyerName)) {
            syncCustomerProfile(currentUser.getHousehold(), taxCode, finalBuyerName, invoice.getBuyerAddress(), invoice.getBuyerEmail(), invoice.getBuyerPhone());
        }

        logActivity(invoice.getHousehold(), currentUser, "UPDATE_INVOICE", saved.getId(), oldVal,
                buildInvoiceLogMap(saved));

        log.info("Cập nhật thông tin hóa đơn thành công. ID={}, Status={}", invoiceId, saved.getStatus());
        return mapToInvoiceResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerTaxLookupResponse lookupBuyerInfoByTaxCode(String currentUsername, String taxCode) {
        User currentUser = getAuthenticatedUser(currentUsername);
        validateBuyerTaxCode(taxCode);
        String trimmedTaxCode = taxCode != null ? taxCode.trim() : "";
        Customer customer = customerRepository.findFirstByHouseholdIdAndTaxCodeAndDeletedAtIsNullOrderByCreatedAtDesc(
                currentUser.getHousehold().getId(), trimmedTaxCode)
                .orElseThrow(() -> new AppException(ErrorCode.CUSTOMER_NOT_FOUND));

        return CustomerTaxLookupResponse.builder()
                .buyerName(customer.getName())
                .buyerTaxCode(customer.getTaxCode())
                .buyerAddress(customer.getAddress())
                .buyerPhone(customer.getPhoneNumber())
                .buyerEmail(customer.getEmail())
                .build();
    }

    private String generateMockQrCodeBase64(String text) {
        try {
            int size = 150;
            java.awt.image.BufferedImage image = new java.awt.image.BufferedImage(size, size,
                    java.awt.image.BufferedImage.TYPE_INT_RGB);
            java.awt.Graphics2D g = image.createGraphics();

            g.setColor(java.awt.Color.WHITE);
            g.fillRect(0, 0, size, size);

            g.setColor(java.awt.Color.BLACK);
            // Top-left corner box
            g.fillRect(10, 10, 35, 35);
            g.setColor(java.awt.Color.WHITE);
            g.fillRect(15, 15, 25, 25);
            g.setColor(java.awt.Color.BLACK);
            g.fillRect(20, 20, 15, 15);

            // Top-right corner box
            g.fillRect(105, 10, 35, 35);
            g.setColor(java.awt.Color.WHITE);
            g.fillRect(110, 15, 25, 25);
            g.setColor(java.awt.Color.BLACK);
            g.fillRect(115, 20, 15, 15);

            // Bottom-left corner box
            g.fillRect(10, 105, 35, 35);
            g.setColor(java.awt.Color.WHITE);
            g.fillRect(15, 110, 25, 25);
            g.setColor(java.awt.Color.BLACK);
            g.fillRect(20, 115, 15, 15);

            Random random = new Random(text.hashCode());
            for (int x = 10; x < 140; x += 5) {
                for (int y = 10; y < 140; y += 5) {
                    if ((x < 50 && y < 50) || (x > 100 && y < 50) || (x < 50 && y > 100)) {
                        continue;
                    }
                    if (random.nextBoolean()) {
                        g.fillRect(x, y, 4, 4);
                    }
                }
            }

            g.dispose();
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(image, "png", baos);
            byte[] bytes = baos.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.error("Failed to generate mock QR code", e);
            return "";
        }
    }

    private String generateQrCodeBase64(String text) {
        try {
            int size = 150;
            com.google.zxing.qrcode.QRCodeWriter qrCodeWriter = new com.google.zxing.qrcode.QRCodeWriter();
            com.google.zxing.common.BitMatrix bitMatrix = qrCodeWriter.encode(text,
                    com.google.zxing.BarcodeFormat.QR_CODE, size, size);

            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bitMatrix, "png", baos);
            byte[] bytes = baos.toByteArray();
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes);
        } catch (Exception e) {
            log.error("Failed to generate QR code using ZXing", e);
            return generateMockQrCodeBase64(text);
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceQrResponse getInvoiceQr(String currentUsername, String invoiceId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        if (!"ISSUED".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        String lookupUrl = (frontendUrl != null ? frontendUrl : "http://localhost:3000") + "/lookup-invoice?code="
                + invoice.getLookupCode();
        String qrCodeBase64 = generateQrCodeBase64(lookupUrl);

        invoice.setCustomerDeliveryStatus("SUCCESS");
        eInvoiceRepository.save(invoice);

        // Save delivery log for QR channel
        InvoiceDeliveryLog deliveryLog = InvoiceDeliveryLog.builder()
                .invoice(invoice)
                .channel("QR")
                .recipientAddress(lookupUrl)
                .status("SUCCESS")
                .build();
        invoiceDeliveryLogRepository.save(deliveryLog);

        return InvoiceQrResponse.builder()
                .invoiceId(invoice.getId())
                .lookupCode(invoice.getLookupCode())
                .lookupUrl(lookupUrl)
                .qrCodeBase64(qrCodeBase64)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deliverInvoiceViaEmail(String currentUsername, String invoiceId, String email) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        if (!"ISSUED".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_DELIVERY_NOT_ALLOWED);
        }

        invoice.setCustomerDeliveryStatus("PENDING");
        eInvoiceRepository.save(invoice);

        InvoiceDeliveryLog deliveryLog = InvoiceDeliveryLog.builder()
                .invoice(invoice)
                .channel("EMAIL")
                .recipientAddress(email)
                .status("PENDING")
                .build();

        InvoiceDeliveryLog savedLog = invoiceDeliveryLogRepository.save(deliveryLog);

        String lookupUrl = (frontendUrl != null ? frontendUrl : "http://localhost:3000") + "/lookup-invoice?code="
                + invoice.getLookupCode();
        String householdName = invoice.getHousehold().getName();
        String lookupCode = invoice.getLookupCode();
        BigDecimal finalAmount = invoice.getFinalAmount();

        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    emailService.sendInvoiceEmailAsync(savedLog.getId(), email, lookupUrl, householdName, lookupCode, finalAmount);
                }
            });
        } else {
            emailService.sendInvoiceEmailAsync(savedLog.getId(), email, lookupUrl, householdName, lookupCode, finalAmount);
        }

        log.info("Đăng ký gửi hóa đơn qua Email thành công đến: {}. Hóa đơn ID={}", email, invoiceId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoicePrintResponse getInvoicePrintLayout(String currentUsername, String invoiceId, String pageSize) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        boolean isOfficial = "ISSUED".equals(invoice.getStatus());
        String statusLabel = isOfficial ? "BẢN CHÍNH THỨC" : "BẢN NHÁP (CHƯA PHÁT HÀNH)";

        InvoiceTemplate template = invoiceTemplateRepository.findByHouseholdId(invoice.getHousehold().getId())
                .orElse(null);
        String pattern = template != null ? template.getInvoicePattern() : invoice.getInvoicePattern();
        String symbol = template != null ? template.getInvoiceSymbol() : invoice.getInvoiceSymbol();
        String title = template != null ? template.getTitle() : "HÓA ĐƠN BÁN HÀNG";
        String footer = template != null ? template.getFooterNote() : "Cảm ơn quý khách. Hẹn gặp lại!";

        String width = "K57".equalsIgnoreCase(pageSize) ? "200px" : "280px";

        StringBuilder itemsHtml = new StringBuilder();
        for (EInvoiceItem item : invoice.getItems()) {
            itemsHtml.append("<tr>")
                    .append("<td colspan=\"4\" style=\"padding-top:4px;\">").append(escHtml(item.getProductName()))
                    .append("</td>")
                    .append("</tr>")
                    .append("<tr style=\"border-bottom:1px dotted #ccc;\">")
                    .append("<td></td>")
                    .append("<td style=\"text-align:right;\">").append(item.getQuantity()).append("</td>")
                    .append("<td style=\"text-align:right;\">").append(item.getUnitPrice()).append("</td>")
                    .append("<td style=\"text-align:right;\">").append(item.getSubtotal()).append("</td>")
                    .append("</tr>");
        }

        String htmlContent = "<div style=\"font-family:'Courier New',Courier,monospace; width:" + width
                + "; padding:10px; font-size:12px; line-height:1.4;\">\n"
                + "    <div style=\"text-align:center; font-weight:bold; font-size:14px;\">"
                + escHtml(invoice.getHousehold().getName()) + "</div>\n"
                + "    <div style=\"text-align:center;\">MST: " + escHtml(invoice.getHousehold().getTaxCode())
                + "</div>\n"
                + "    <div style=\"text-align:center;\">Đ/C: " + escHtml(invoice.getHousehold().getAddress())
                + "</div>\n"
                + "    <div style=\"text-align:center;\">SĐT: " + escHtml(invoice.getHousehold().getPhoneNumber())
                + "</div>\n"
                + "    <div style=\"border-bottom:1px dashed #000; margin:10px 0;\"></div>\n"
                + "    <div style=\"text-align:center; font-weight:bold; font-size:14px;\">" + escHtml(title)
                + "</div>\n"
                + "    <div style=\"text-align:center; font-size:11px; font-weight:bold; color:red;\">("
                + escHtml(statusLabel) + ")</div>\n"
                + "    <div style=\"text-align:center; font-size:10px;\">Mẫu số: " + escHtml(pattern) + " | Ký hiệu: "
                + escHtml(symbol) + "</div>\n"
                + "    <div style=\"text-align:center; font-size:10px;\">Số HD: "
                + escHtml(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "N/A") + "</div>\n"
                + "    <div style=\"text-align:center; font-size:10px;\">Ngày lập: "
                + (invoice.getCreatedAt() != null ? invoice.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) : "") + "</div>\n"
                + "    <div style=\"border-bottom:1px dashed #000; margin:10px 0;\"></div>\n"
                + "    <div>Khách hàng: "
                + escHtml(invoice.getBuyerName() != null ? invoice.getBuyerName() : "Khách vãng lai") + "</div>\n"
                + "    <div>MST KH: " + escHtml(invoice.getBuyerTaxCode() != null ? invoice.getBuyerTaxCode() : "N/A")
                + "</div>\n"
                + "    <div style=\"border-bottom:1px dashed #000; margin:5px 0;\"></div>\n"
                + "    <table style=\"width:100%; border-collapse:collapse; font-size:12px;\">\n"
                + "        <thead>\n"
                + "            <tr style=\"border-bottom:1px solid #000;\">\n"
                + "                <th style=\"text-align:left;\">Tên hàng</th>\n"
                + "                <th style=\"text-align:right;\">SL</th>\n"
                + "                <th style=\"text-align:right;\">ĐG</th>\n"
                + "                <th style=\"text-align:right;\">T.Tiền</th>\n"
                + "            </tr>\n"
                + "        </thead>\n"
                + "        <tbody>\n"
                + itemsHtml.toString()
                + "        </tbody>\n"
                + "    </table>\n"
                + "    <div style=\"border-bottom:1px dashed #000; margin:10px 0;\"></div>\n"
                + "    <table style=\"width:100%; font-size:12px;\">\n"
                + "        <tr>\n"
                + "            <td>Cộng tiền hàng:</td>\n"
                + "            <td style=\"text-align:right;\">" + invoice.getTotalAmountBeforeTax() + "</td>\n"
                + "        </tr>\n"
                + "        <tr>\n"
                + "            <td>Tiền thuế GTGT:</td>\n"
                + "            <td style=\"text-align:right;\">" + invoice.getTaxAmount() + "</td>\n"
                + "        </tr>\n"
                + "        <tr>\n"
                + "            <td>Tiền chiết khấu:</td>\n"
                + "            <td style=\"text-align:right;\">" + invoice.getDiscountAmount() + "</td>\n"
                + "        </tr>\n"
                + "        <tr style=\"font-weight:bold; font-size:13px;\">\n"
                + "            <td>TỔNG THANH TOÁN:</td>\n"
                + "            <td style=\"text-align:right;\">" + invoice.getFinalAmount() + "</td>\n"
                + "        </tr>\n"
                + "    </table>\n"
                + "    <div style=\"border-bottom:1px dashed #000; margin:10px 0;\"></div>\n"
                + "    <div style=\"text-align:center; font-size:10px;\">\n"
                + "        Tra cứu hóa đơn tại: <b>"
                + escHtml(frontendUrl != null ? frontendUrl : "http://localhost:3000") + "/lookup-invoice</b><br/>\n"
                + "        Mã tra cứu: <b>" + escHtml(invoice.getLookupCode()) + "</b>\n"
                + "    </div>\n"
                + "    <div style=\"text-align:center; margin-top:10px; font-size:10px; font-style:italic;\">\n"
                + escHtml(footer) + "\n"
                + "    </div>\n"
                + "</div>";

        invoice.setCustomerDeliveryStatus("SUCCESS");
        eInvoiceRepository.save(invoice);

        InvoiceDeliveryLog deliveryLog = InvoiceDeliveryLog.builder()
                .invoice(invoice)
                .channel("PRINT")
                .recipientAddress(pageSize != null ? pageSize : "K80")
                .status("SUCCESS")
                .build();
        invoiceDeliveryLogRepository.save(deliveryLog);

        return InvoicePrintResponse.builder()
                .pageSize(pageSize != null ? pageSize : "K80")
                .htmlContent(htmlContent)
                .build();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) {
            return phone;
        }
        return phone.substring(0, 4) + "***" + phone.substring(phone.length() - 3);
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        int atIndex = email.indexOf("@");
        if (atIndex <= 3) {
            return "***" + email.substring(atIndex);
        }
        return email.substring(0, 3) + "***" + email.substring(atIndex);
    }

    private String maskAddress(String address) {
        if (address == null || address.isEmpty()) {
            return address;
        }
        int commaIndex = address.indexOf(",");
        if (commaIndex > 0) {
            return "***" + address.substring(commaIndex);
        }
        int spaceIndex = address.indexOf(" ");
        if (spaceIndex > 0) {
            return "***" + address.substring(spaceIndex);
        }
        return "***";
    }

    @Override
    @Transactional(readOnly = true)
    public PublicInvoiceResponse lookupInvoicePublicly(String lookupCode) {
        EInvoice invoice = eInvoiceRepository.findByLookupCodeAndDeletedAtIsNull(lookupCode)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        if (!"ISSUED".equals(invoice.getStatus()) && !"CANCELED".equals(invoice.getStatus())
                && !"ADJUSTED".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_FOUND);
        }

        List<EInvoiceItemResponse> items = invoice.getItems().stream()
                .map(item -> EInvoiceItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .unit(item.getUnit())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxRatePercentage(item.getTaxRatePercentage())
                        .taxAmount(item.getTaxAmount())
                        .discountAmount(item.getDiscountAmount())
                        .subtotal(item.getSubtotal())
                        .createdAt(item.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        String paymentMethod = invoice.getPaymentMethod();
        if (paymentMethod == null && invoice.getOrder() != null) {
            paymentMethod = invoice.getOrder().getPaymentMethod();
        }
        if (paymentMethod == null) {
            paymentMethod = "CASH";
        }

        List<OrderPaymentResponse> paymentResponses = null;
        if (invoice.getOrder() != null && orderPaymentRepository != null) {
            List<OrderPayment> orderPayments = orderPaymentRepository.findByOrderId(invoice.getOrder().getId());
            if (orderPayments != null && !orderPayments.isEmpty()) {
                paymentResponses = orderPayments.stream()
                        .map(op -> OrderPaymentResponse.builder()
                                .id(op.getId())
                                .orderId(invoice.getOrder().getId())
                                .orderCode(invoice.getOrder().getOrderNumber())
                                .householdId(invoice.getHousehold() != null ? invoice.getHousehold().getId() : null)
                                .paymentMethod(op.getPaymentMethod())
                                .amount(op.getAmount())
                                .amountGiven(op.getAmountGiven())
                                .changeAmount(op.getChangeAmount())
                                .transactionCode(op.getTransactionCode())
                                .isConfirmed(op.getIsConfirmed())
                                .notes(op.getNotes())
                                .createdAt(op.getCreatedAt())
                                .build())
                        .collect(Collectors.toList());
            }
        }

        return PublicInvoiceResponse.builder()
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoicePattern(invoice.getInvoicePattern())
                .invoiceSymbol(invoice.getInvoiceSymbol())
                .title(invoice.getTitle() != null ? invoice.getTitle() : "HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                .footerNote(invoice.getFooterNote())
                .householdName(invoice.getHousehold() != null ? invoice.getHousehold().getName() : null)
                .householdTaxCode(invoice.getHousehold() != null ? invoice.getHousehold().getTaxCode() : null)
                .householdAddress(invoice.getHousehold() != null ? invoice.getHousehold().getAddress() : null)
                .householdPhone(invoice.getHousehold() != null ? invoice.getHousehold().getPhoneNumber() : null)
                .buyerName(invoice.getBuyerName())
                .buyerTaxCode(invoice.getBuyerTaxCode())
                .buyerAddress(maskAddress(invoice.getBuyerAddress()))
                .buyerPhone(maskPhone(invoice.getBuyerPhone()))
                .buyerEmail(maskEmail(invoice.getBuyerEmail()))
                .status(invoice.getStatus())
                .totalAmountBeforeTax(invoice.getTotalAmountBeforeTax())
                .taxAmount(invoice.getTaxAmount())
                .discountAmount(invoice.getDiscountAmount())
                .finalAmount(invoice.getFinalAmount())
                .paymentMethod(paymentMethod)
                .payments(paymentResponses)
                .createdAt(invoice.getCreatedAt())
                .taxAuthorityCode(invoice.getTaxAuthorityCode())
                .items(items)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadInvoiceFilePublicly(String lookupCode, String format) {
        EInvoice invoice = eInvoiceRepository.findByLookupCodeAndDeletedAtIsNull(lookupCode)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        if (!"ISSUED".equals(invoice.getStatus()) && !"CANCELED".equals(invoice.getStatus())
                && !"ADJUSTED".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_FOUND);
        }

        if (invoice.getHousehold() == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }

        if ("xml".equalsIgnoreCase(format)) {
            StringBuilder xml = new StringBuilder();
            xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                    .append("<HieuDonDienTu>\n")
                    .append("    <ThongTinChung>\n")
                    .append("        <MauSo>").append(escXml(invoice.getInvoicePattern())).append("</MauSo>\n")
                    .append("        <KyHieu>").append(escXml(invoice.getInvoiceSymbol())).append("</KyHieu>\n")
                    .append("        <So>").append(escXml(invoice.getInvoiceNumber())).append("</So>\n")
                    .append("        <NgayLap>")
                    .append(escXml(invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString() : ""))
                    .append("</NgayLap>\n")
                    .append("        <MaTraCuu>").append(escXml(invoice.getLookupCode())).append("</MaTraCuu>\n")
                    .append("        <MaCoQuanThue>").append(escXml(invoice.getTaxAuthorityCode()))
                    .append("</MaCoQuanThue>\n")
                    .append("    </ThongTinChung>\n")
                    .append("    <BenBan>\n")
                    .append("        <Ten>")
                    .append(escXml(invoice.getHousehold() != null ? invoice.getHousehold().getName() : ""))
                    .append("</Ten>\n")
                    .append("        <MST>")
                    .append(escXml(invoice.getHousehold() != null ? invoice.getHousehold().getTaxCode() : ""))
                    .append("</MST>\n")
                    .append("        <DiaChi>")
                    .append(escXml(invoice.getHousehold() != null ? invoice.getHousehold().getAddress() : ""))
                    .append("</DiaChi>\n")
                    .append("    </BenBan>\n")
                    .append("    <BenMua>\n")
                    .append("        <Ten>")
                    .append(escXml(
                            invoice.getBuyerName() != null ? invoice.getBuyerName() : "Khách hàng không lấy hóa đơn"))
                    .append("</Ten>\n")
                    .append("        <MST>").append(escXml(invoice.getBuyerTaxCode())).append("</MST>\n")
                    .append("        <DiaChi>").append(escXml(invoice.getBuyerAddress())).append("</DiaChi>\n")
                    .append("    </BenMua>\n")
                    .append("    <ChiTietHangHoa>\n");

            for (EInvoiceItem item : invoice.getItems()) {
                xml.append("        <HangHoa>\n")
                        .append("            <Ten>").append(escXml(item.getProductName())).append("</Ten>\n")
                        .append("            <DonVi>").append(escXml(item.getUnit())).append("</DonVi>\n")
                        .append("            <SoLuong>").append(item.getQuantity()).append("</SoLuong>\n")
                        .append("            <DonGia>").append(item.getUnitPrice()).append("</DonGia>\n")
                        .append("            <ThueSuat>").append(item.getTaxRatePercentage()).append("</ThueSuat>\n")
                        .append("            <ThanhTien>").append(item.getSubtotal()).append("</ThanhTien>\n")
                        .append("        </HangHoa>\n");
            }

            xml.append("    </ChiTietHangHoa>\n")
                    .append("    <TongHop>\n")
                    .append("        <TongTienTruocThue>").append(invoice.getTotalAmountBeforeTax())
                    .append("</TongTienTruocThue>\n")
                    .append("        <TongTienThue>").append(invoice.getTaxAmount()).append("</TongTienThue>\n")
                    .append("        <TongTienChietKhau>").append(invoice.getDiscountAmount())
                    .append("</TongTienChietKhau>\n")
                    .append("        <TongTienThanhToan>").append(invoice.getFinalAmount())
                    .append("</TongTienThanhToan>\n")
                    .append("    </TongHop>\n")
                    .append("</HieuDonDienTu>\n");

            return xml.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        } else {
            StringBuilder html = new StringBuilder();
            html.append(
                    "<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n<title>Hoa don dien tu</title>\n</head>\n<body>\n")
                    .append("<div style=\"border:2px solid #000; padding:20px; font-family:Arial,sans-serif; max-width:800px; margin:0 auto;\">\n")
                    .append("  <h1 style=\"text-align:center; margin-bottom:5px;\">HÓA ĐƠN ĐIỆN TỬ</h1>\n")
                    .append("  <p style=\"text-align:center; font-style:italic;\">Mã tra cứu: ")
                    .append(escHtml(invoice.getLookupCode())).append("</p>\n")
                    .append("  <hr/>\n")
                    .append("  <h3>BÊN BÁN: ")
                    .append(escHtml(invoice.getHousehold() != null ? invoice.getHousehold().getName() : ""))
                    .append("</h3>\n")
                    .append("  <p>Mã số thuế: ")
                    .append(escHtml(invoice.getHousehold() != null ? invoice.getHousehold().getTaxCode() : ""))
                    .append("</p>\n")
                    .append("  <p>Địa chỉ: ")
                    .append(escHtml(invoice.getHousehold() != null ? invoice.getHousehold().getAddress() : ""))
                    .append("</p>\n")
                    .append("  <hr/>\n")
                    .append("  <h3>BÊN MUA: ")
                    .append(escHtml(invoice.getBuyerName() != null ? invoice.getBuyerName() : "Khách vãng lai"))
                    .append("</h3>\n")
                    .append("  <p>Địa chỉ: ")
                    .append(escHtml(invoice.getBuyerAddress() != null ? invoice.getBuyerAddress() : ""))
                    .append("</p>\n")
                    .append("  <hr/>\n")
                    .append("  <table border=\"1\" style=\"width:100%; border-collapse:collapse;\">\n")
                    .append("    <thead>\n")
                    .append("      <tr>\n")
                    .append("        <th>Tên hàng hóa</th><th>ĐVT</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th>\n")
                    .append("      </tr>\n")
                    .append("    </thead>\n")
                    .append("    <tbody>\n");

            for (EInvoiceItem item : invoice.getItems()) {
                html.append("      <tr>\n")
                        .append("        <td>").append(escHtml(item.getProductName())).append("</td>\n")
                        .append("        <td>").append(escHtml(item.getUnit())).append("</td>\n")
                        .append("        <td align=\"right\">").append(item.getQuantity()).append("</td>\n")
                        .append("        <td align=\"right\">").append(item.getUnitPrice()).append("</td>\n")
                        .append("        <td align=\"right\">").append(item.getSubtotal()).append("</td>\n")
                        .append("      </tr>\n");
            }

            html.append("    </tbody>\n")
                    .append("  </table>\n")
                    .append("  <p align=\"right\"><b>Cộng tiền trước thuế:</b> ")
                    .append(invoice.getTotalAmountBeforeTax()).append("</p>\n")
                    .append("  <p align=\"right\"><b>Thuế GTGT:</b> ").append(invoice.getTaxAmount()).append("</p>\n")
                    .append("  <p align=\"right\"><b>Chiết khấu:</b> ").append(invoice.getDiscountAmount())
                    .append("</p>\n")
                    .append("  <p align=\"right\" style=\"font-size:18px;\"><b>TỔNG THANH TOÁN:</b> ")
                    .append(invoice.getFinalAmount()).append("</p>\n")
                    .append("</div>\n</body>\n</html>");
            return html.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
        }
    }

    @Override
    public BulkIssueInvoiceResponse bulkIssueInvoices(String currentUsername, BulkIssueInvoiceRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);

        // Phân quyền theo AC-03: Kế toán (VT-03) bị chặn
        if (currentUser.getRole() != null && "VT-03".equals(currentUser.getRole().getCode())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        List<String> orderIds = request.getOrderIds() != null ? request.getOrderIds() : Collections.emptyList();
        List<InvoiceResponse> successInvoices = new ArrayList<>();
        List<BulkIssueFailedItemResponse> failedItems = new ArrayList<>();

        for (String orderId : orderIds) {
            try {
                // Tái sử dụng logic tạo draft và submit to tax trong giao dịch độc lập per-order
                InvoiceResponse submitted = transactionTemplate.execute(status -> {
                    InvoiceResponse draft = createInvoiceDraft(currentUsername, orderId);
                    return submitToTax(currentUsername, draft.getId());
                });
                if (submitted != null) {
                    successInvoices.add(submitted);
                }
            } catch (Exception e) {
                // Xử lý đơn bị lỗi thiếu thông tin/vi phạm ràng buộc (AC-02) mà không làm ngắt giao dịch của cả lô
                log.warn("Lỗi phát hành dồn hóa đơn cho orderId: {}, lý do: {}", orderId, e.getMessage());
                String orderNum = orderId;
                try {
                    Optional<Order> ordOpt = orderRepository.findById(orderId);
                    if (ordOpt.isPresent()) {
                        orderNum = ordOpt.get().getOrderNumber();
                    }
                } catch (Exception ex) {
                    log.debug("Không thể tìm orderNumber cho orderId: {}", orderId);
                }
                failedItems.add(BulkIssueFailedItemResponse.builder()
                        .orderId(orderId)
                        .orderNumber(orderNum)
                        .errorMessage(e.getMessage() != null ? e.getMessage() : "Thiếu thông tin bắt buộc hoặc vi phạm quy tắc hóa đơn")
                        .build());
            }
        }

        BulkIssueInvoiceResponse result = BulkIssueInvoiceResponse.builder()
                .syncSessionCode(request.getSyncSessionCode())
                .totalProcessed(orderIds.size())
                .successCount(successInvoices.size())
                .failedCount(failedItems.size())
                .successInvoices(successInvoices)
                .failedItems(failedItems)
                .build();

        // Lưu nhật ký phiên vào activity_logs (AC-04)
        Map<String, Object> logSummary = new HashMap<>();
        logSummary.put("syncSessionCode", request.getSyncSessionCode());
        logSummary.put("totalProcessed", orderIds.size());
        logSummary.put("successCount", successInvoices.size());
        logSummary.put("failedCount", failedItems.size());
        logSummary.put("failedItems", failedItems);

        logActivity(currentUser.getHousehold(), currentUser, "BULK_ISSUE_INVOICES",
                request.getSyncSessionCode() != null ? request.getSyncSessionCode() : UUID.randomUUID().toString(),
                null, logSummary);

        return result;
    }

    private String escXml(String val) {
        return org.apache.commons.text.StringEscapeUtils.escapeXml11(val != null ? val : "");
    }

    private String escHtml(String val) {
        return org.apache.commons.text.StringEscapeUtils.escapeHtml4(val != null ? val : "");
    }

    @Override
    @Transactional(readOnly = true)
    public DailyInvoiceControlResponse getDailyInvoiceControl(String currentUsername, LocalDate date) {
        User currentUser = getAuthenticatedUser(currentUsername);
        if (currentUser.getHousehold() == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        // QTN-10: Chỉ VT-01 (Chủ hộ) và VT-03 (Kế toán) được truy cập
        String roleCode = currentUser.getRole() != null ? currentUser.getRole().getCode() : "";
        if (!"VT-01".equals(roleCode) && !"VT-03".equals(roleCode)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        String householdId = currentUser.getHousehold().getId();
        LocalDate controlDate = date != null ? date : LocalDate.now();
        LocalDateTime endOfDay = controlDate.atTime(LocalTime.MAX);
        LocalDateTime now = LocalDateTime.now();

        // 1. Uninvoiced Orders (Đơn đã thanh toán nhưng chưa có hóa đơn hợp lệ up to controlDate - NCL-04-CN-008 / F-03 & F-04)
        List<Order> paidOrders = orderRepository.findUninvoicedOrdersUpToDate(householdId, endOfDay);

        List<UninvoicedOrderSummaryResponse> uninvoicedOrders = paidOrders.stream()
                .map(order -> {
                    long durationHours = java.time.Duration.between(order.getCreatedAt(), now).toHours();
                    long durationDays = java.time.Duration.between(order.getCreatedAt(), now).toDays();
                    return UninvoicedOrderSummaryResponse.builder()
                            .orderId(order.getId())
                            .orderNumber(order.getOrderNumber())
                            .createdAt(order.getCreatedAt())
                            .createdByUsername(order.getCreatedByUser() != null ? order.getCreatedByUser().getUsername() : null)
                            .createdByFullName(order.getCreatedByUser() != null ? order.getCreatedByUser().getFullName() : null)
                            .finalAmount(order.getFinalAmount())
                            .pendingDurationHours(durationHours)
                            .pendingDurationDays(durationDays)
                            .build();
                })
                .sorted(Comparator.comparing(UninvoicedOrderSummaryResponse::getPendingDurationHours).reversed())
                .collect(Collectors.toList());

        // 2. Pending Invoices (Hóa đơn đang treo chờ duyệt/cấp mã: WAITING_TAX_CODE và DRAFT - F-04)
        List<EInvoice> pendingRawInvoices = eInvoiceRepository.findByHouseholdIdAndStatusInAndCreatedAtBefore(
                householdId, List.of("WAITING_TAX_CODE", "DRAFT"), endOfDay);

        List<PendingTaxInvoiceSummaryResponse> pendingInvoices = pendingRawInvoices.stream()
                .map(inv -> {
                    long durationHours = java.time.Duration.between(inv.getCreatedAt(), now).toHours();
                    long durationDays = java.time.Duration.between(inv.getCreatedAt(), now).toDays();
                    return PendingTaxInvoiceSummaryResponse.builder()
                            .invoiceId(inv.getId())
                            .invoiceNumber(inv.getInvoiceNumber())
                            .orderNumber(inv.getOrder() != null ? inv.getOrder().getOrderNumber() : null)
                            .createdAt(inv.getCreatedAt())
                            .createdByUsername(inv.getCreatedByUser() != null ? inv.getCreatedByUser().getUsername() : null)
                            .createdByFullName(inv.getCreatedByUser() != null ? inv.getCreatedByUser().getFullName() : null)
                            .finalAmount(inv.getFinalAmount())
                            .status(inv.getStatus())
                            .pendingDurationHours(durationHours)
                            .pendingDurationDays(durationDays)
                            .build();
                })
                .sorted(Comparator.comparing(PendingTaxInvoiceSummaryResponse::getPendingDurationHours).reversed())
                .collect(Collectors.toList());

        // 3. Failed Invoices (Hóa đơn gửi lỗi: SEND_ERROR hoặc MANUAL_PROCESSING)
        List<EInvoice> failedRawInvoices = eInvoiceRepository.findByHouseholdIdAndStatusInAndCreatedAtBefore(
                householdId, List.of("SEND_ERROR", "MANUAL_PROCESSING"), endOfDay);

        List<FailedInvoiceSummaryResponse> failedInvoices = failedRawInvoices.stream()
                .map(inv -> {
                    long durationHours = java.time.Duration.between(inv.getCreatedAt(), now).toHours();
                    long durationDays = java.time.Duration.between(inv.getCreatedAt(), now).toDays();
                    return FailedInvoiceSummaryResponse.builder()
                            .invoiceId(inv.getId())
                            .invoiceNumber(inv.getInvoiceNumber())
                            .orderNumber(inv.getOrder() != null ? inv.getOrder().getOrderNumber() : null)
                            .createdAt(inv.getCreatedAt())
                            .createdByUsername(inv.getCreatedByUser() != null ? inv.getCreatedByUser().getUsername() : null)
                            .createdByFullName(inv.getCreatedByUser() != null ? inv.getCreatedByUser().getFullName() : null)
                            .finalAmount(inv.getFinalAmount())
                            .status(inv.getStatus())
                            .taxAuthorityResponse(inv.getTaxAuthorityResponse())
                            .errorCategory(inv.getErrorCategory())
                            .retryCount(inv.getRetryCount())
                            .pendingDurationHours(durationHours)
                            .pendingDurationDays(durationDays)
                            .build();
                })
                .sorted(Comparator.comparing(FailedInvoiceSummaryResponse::getPendingDurationHours).reversed())
                .collect(Collectors.toList());

        boolean isClean = uninvoicedOrders.isEmpty() && pendingInvoices.isEmpty() && failedInvoices.isEmpty();

        return DailyInvoiceControlResponse.builder()
                .controlDate(controlDate)
                .isCleanDay(isClean)
                .totalUninvoicedOrders(uninvoicedOrders.size())
                .totalPendingInvoices(pendingInvoices.size())
                .totalFailedInvoices(failedInvoices.size())
                .uninvoicedOrders(uninvoicedOrders)
                .pendingInvoices(pendingInvoices)
                .failedInvoices(failedInvoices)
                .build();
    }

    @Override
    @Transactional
    public byte[] exportInvoicesToExcel(String currentUsername, String status, LocalDate fromDate, LocalDate toDate, String search, String clientIp, String userAgent) {
        User currentUser = getAuthenticatedUser(currentUsername);
        String role = currentUser.getRole().getCode();
        if (!"VT-01".equals(role) && !"VT-03".equals(role)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Specification<EInvoice> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("household").get("id"), household.getId()));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (status != null && !status.isEmpty() && !"ALL".equalsIgnoreCase(status)) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), toDate.atTime(LocalTime.MAX)));
            }
            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate numberPredicate = cb.like(cb.lower(root.get("invoiceNumber")), searchPattern);
                Predicate lookupPredicate = cb.like(cb.lower(root.get("lookupCode")), searchPattern);
                predicates.add(cb.or(numberPredicate, lookupPredicate));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<EInvoice> invoices = eInvoiceRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"));
        if (invoices.isEmpty()) {
            throw new AppException(ErrorCode.NO_DATA_TO_EXPORT);
        }

        try (org.apache.poi.ss.usermodel.Workbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {

            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Danh Sách Hóa Đơn");

            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            org.apache.poi.ss.usermodel.Row titleRow = sheet.createRow(0);
            org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("DANH SÁCH HÓA ĐƠN ĐIỆN TỬ - " + household.getName().toUpperCase());
            titleCell.setCellStyle(headerStyle);

            String[] columns = {"STT", "Mã Hóa Đơn", "Mẫu Số", "Ký Hiệu", "Số HĐ", "Ngày Tạo", "Ngày Cấp Mã", "Mã CQT", "Người Mua", "MST Người Mua", "Tiền Trước Thuế", "Tiền Thuế", "Giảm Giá", "Tổng Tiền", "Trạng Thái"};
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(2);
            for (int i = 0; i < columns.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            BigDecimal totalBeforeTax = BigDecimal.ZERO;
            BigDecimal totalTax = BigDecimal.ZERO;
            BigDecimal totalDiscount = BigDecimal.ZERO;
            BigDecimal totalFinal = BigDecimal.ZERO;

            int rowIdx = 3;
            int stt = 1;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

            for (EInvoice inv : invoices) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(stt++);
                row.createCell(1).setCellValue(inv.getId());
                row.createCell(2).setCellValue(inv.getInvoicePattern() != null ? inv.getInvoicePattern() : "");
                row.createCell(3).setCellValue(inv.getInvoiceSymbol() != null ? inv.getInvoiceSymbol() : "");
                row.createCell(4).setCellValue(inv.getInvoiceNumber() != null ? inv.getInvoiceNumber() : "");
                row.createCell(5).setCellValue(inv.getCreatedAt() != null ? inv.getCreatedAt().format(formatter) : "");
                row.createCell(6).setCellValue(inv.getTaxResponseAt() != null ? inv.getTaxResponseAt().format(formatter) : "");
                row.createCell(7).setCellValue(inv.getTaxAuthorityCode() != null ? inv.getTaxAuthorityCode() : "");
                row.createCell(8).setCellValue(inv.getBuyerName() != null ? inv.getBuyerName() : "");
                row.createCell(9).setCellValue(inv.getBuyerTaxCode() != null ? inv.getBuyerTaxCode() : "");
                row.createCell(10).setCellValue(inv.getTotalAmountBeforeTax() != null ? inv.getTotalAmountBeforeTax().doubleValue() : 0.0);
                row.createCell(11).setCellValue(inv.getTaxAmount() != null ? inv.getTaxAmount().doubleValue() : 0.0);
                row.createCell(12).setCellValue(inv.getDiscountAmount() != null ? inv.getDiscountAmount().doubleValue() : 0.0);
                row.createCell(13).setCellValue(inv.getFinalAmount() != null ? inv.getFinalAmount().doubleValue() : 0.0);
                row.createCell(14).setCellValue(inv.getStatus() != null ? inv.getStatus() : "");

                if (inv.getTotalAmountBeforeTax() != null) totalBeforeTax = totalBeforeTax.add(inv.getTotalAmountBeforeTax());
                if (inv.getTaxAmount() != null) totalTax = totalTax.add(inv.getTaxAmount());
                if (inv.getDiscountAmount() != null) totalDiscount = totalDiscount.add(inv.getDiscountAmount());
                if (inv.getFinalAmount() != null) totalFinal = totalFinal.add(inv.getFinalAmount());
            }

            // Summary Row (Dòng Tổng Cộng)
            org.apache.poi.ss.usermodel.Row totalRow = sheet.createRow(rowIdx);
            org.apache.poi.ss.usermodel.Cell totalLabelCell = totalRow.createCell(0);
            totalLabelCell.setCellValue("TỔNG CỘNG");
            totalLabelCell.setCellStyle(headerStyle);

            totalRow.createCell(10).setCellValue(totalBeforeTax.doubleValue());
            totalRow.createCell(11).setCellValue(totalTax.doubleValue());
            totalRow.createCell(12).setCellValue(totalDiscount.doubleValue());
            totalRow.createCell(13).setCellValue(totalFinal.doubleValue());

            for (int i = 10; i <= 13; i++) {
                totalRow.getCell(i).setCellStyle(headerStyle);
            }

            workbook.write(out);
            byte[] excelContent = out.toByteArray();

            // Log activity (QTN-09: ghi nhận đầy đủ phạm vi lọc)
            Map<String, Object> filterMap = new java.util.HashMap<>();
            filterMap.put("status", status != null ? status : "ALL");
            filterMap.put("fromDate", fromDate != null ? fromDate.toString() : "ALL");
            filterMap.put("toDate", toDate != null ? toDate.toString() : "ALL");
            filterMap.put("search", search != null ? search : "");
            filterMap.put("totalExported", invoices.size());
            logActivity(household, currentUser, "EXPORT_INVOICES", null, null, filterMap);

            log.info("Exported {} invoices to Excel by user [{}]", invoices.size(), currentUsername);
            return excelContent;
        } catch (AppException ae) {
            throw ae;
        } catch (Exception e) {
            log.error("Lỗi khi xuất file Excel danh sách hóa đơn", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceRepresentationResponse getInvoiceRepresentation(String currentUsername, String invoiceId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        String watermarkText = null;
        boolean isDraft = false;
        boolean isCanceled = false;
        boolean isAdjusted = "ADJUSTED".equals(invoice.getStatus());

        if ("CANCELED".equals(invoice.getStatus())) {
            watermarkText = "HÓA ĐƠN ĐÃ HỦY";
            isCanceled = true;
        } else if (!"ISSUED".equals(invoice.getStatus()) || invoice.getInvoiceNumber() == null) {
            watermarkText = "BẢN NHÁP - CHƯA CÓ GIÁ TRỊ PHÁP LÝ";
            isDraft = true;
        }

        String referenceNote = null;
        String origId = null;
        if (invoice.getOriginalInvoice() != null) {
            EInvoice orig = invoice.getOriginalInvoice();
            origId = orig.getId();
            referenceNote = "Hóa đơn này điều chỉnh cho hóa đơn số " + (orig.getInvoiceNumber() != null ? orig.getInvoiceNumber() : "N/A") + " (Mã tra cứu: " + orig.getLookupCode() + ")";
        }

        String amountWords = convertAmountToWords(invoice.getFinalAmount());
        BusinessHousehold hh = invoice.getHousehold();

        StringBuilder html = new StringBuilder();
        html.append("<div style=\"font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; position: relative;\">");
        if (watermarkText != null) {
            html.append("<div style=\"position: absolute; top: 40%; left: 10%; right: 10%; transform: rotate(-30deg); font-size: 36px; font-weight: bold; color: rgba(220, 53, 69, 0.25); text-align: center; border: 3px dashed rgba(220, 53, 69, 0.3); padding: 15px; text-transform: uppercase;\">")
                .append(watermarkText)
                .append("</div>");
        }
        html.append("<h2 style=\"text-align: center; margin-bottom: 5px;\">").append(escHtml(invoice.getTitle())).append("</h2>");
        if (isDraft) {
            html.append("<p style=\"text-align: center; color: red; font-weight: bold;\">(BẢN NHÁP - CHƯA CÓ GIÁ TRỊ PHÁP LÝ)</p>");
        } else if (isCanceled) {
            html.append("<p style=\"text-align: center; color: red; font-weight: bold;\">(ĐÃ HỦY)</p>");
        }
        html.append("<p style=\"text-align: center; font-size: 13px;\">Ký hiệu: ").append(escHtml(invoice.getInvoiceSymbol())).append(" | Mẫu số: ").append(escHtml(invoice.getInvoicePattern())).append(" | Số: ").append(invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "-------").append("</p>");
        html.append("<hr/>");
        html.append("<div><strong>Đơn vị bán hàng:</strong> ").append(escHtml(hh.getName())).append("<br/>");
        html.append("<strong>Mã số thuế:</strong> ").append(escHtml(hh.getTaxCode())).append("<br/>");
        html.append("<strong>Địa chỉ:</strong> ").append(escHtml(hh.getAddress())).append("</div>");
        html.append("<hr/>");
        html.append("<div><strong>Người mua hàng:</strong> ").append(escHtml(invoice.getBuyerName() != null ? invoice.getBuyerName() : "Khách lẻ")).append("<br/>");
        if (invoice.getBuyerTaxCode() != null) html.append("<strong>Mã số thuế:</strong> ").append(escHtml(invoice.getBuyerTaxCode())).append("<br/>");
        if (invoice.getBuyerAddress() != null) html.append("<strong>Địa chỉ:</strong> ").append(escHtml(invoice.getBuyerAddress())).append("<br/>");
        html.append("</div>");
        if (referenceNote != null) {
            html.append("<div style=\"margin-top: 10px; font-style: italic; color: #555;\">Ghi chú: ").append(escHtml(referenceNote)).append("</div>");
        }
        html.append("<br/><table style=\"width: 100%; border-collapse: collapse; text-align: left;\" border=\"1\">");
        html.append("<tr style=\"background: #f2f2f2;\"><th>STT</th><th>Tên hàng hóa, dịch vụ</th><th>Đơn vị tính</th><th>Số lượng</th><th>Đơn giá</th><th>Thành tiền</th></tr>");
        int idx = 1;
        for (EInvoiceItem item : invoice.getItems()) {
            html.append("<tr>")
                .append("<td>").append(idx++).append("</td>")
                .append("<td>").append(escHtml(item.getProductName())).append("</td>")
                .append("<td>").append(escHtml(item.getUnit())).append("</td>")
                .append("<td>").append(item.getQuantity()).append("</td>")
                .append("<td>").append(item.getUnitPrice()).append("</td>")
                .append("<td>").append(item.getSubtotal()).append("</td>")
                .append("</tr>");
        }
        html.append("</table><br/>");
        html.append("<div><strong>Cộng tiền hàng:</strong> ").append(invoice.getTotalAmountBeforeTax()).append(" VNĐ<br/>");
        html.append("<strong>Tiền thuế GTGT:</strong> ").append(invoice.getTaxAmount()).append(" VNĐ<br/>");
        html.append("<strong>Tổng cộng tiền thanh toán:</strong> <strong>").append(invoice.getFinalAmount()).append(" VNĐ</strong><br/>");
        html.append("<strong>Số tiền bằng chữ:</strong> <em>").append(amountWords).append("</em></div>");
        html.append("<hr/>");
        if (invoice.getTaxAuthorityCode() != null) {
            html.append("<div><strong>Mã cơ quan thuế cấp:</strong> ").append(escHtml(invoice.getTaxAuthorityCode())).append("</div>");
        }
        html.append("<div><strong>Mã tra cứu:</strong> ").append(escHtml(invoice.getLookupCode())).append("</div>");
        html.append("</div>");

        return InvoiceRepresentationResponse.builder()
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoicePattern(invoice.getInvoicePattern())
                .invoiceSymbol(invoice.getInvoiceSymbol())
                .title(invoice.getTitle())
                .status(invoice.getStatus())
                .watermarkText(watermarkText)
                .isDraft(isDraft)
                .isCanceled(isCanceled)
                .isAdjusted(isAdjusted)
                .householdName(hh.getName())
                .householdTaxCode(hh.getTaxCode())
                .householdAddress(hh.getAddress())
                .householdPhone(hh.getPhoneNumber())
                .buyerName(invoice.getBuyerName())
                .buyerTaxCode(invoice.getBuyerTaxCode())
                .buyerAddress(invoice.getBuyerAddress())
                .buyerPhone(invoice.getBuyerPhone())
                .buyerEmail(invoice.getBuyerEmail())
                .totalAmountBeforeTax(invoice.getTotalAmountBeforeTax())
                .taxAmount(invoice.getTaxAmount())
                .discountAmount(invoice.getDiscountAmount())
                .finalAmount(invoice.getFinalAmount())
                .amountInWords(amountWords)
                .taxAuthorityCode(invoice.getTaxAuthorityCode())
                .lookupCode(invoice.getLookupCode())
                .issuedAt(invoice.getCreatedAt())
                .referenceNote(referenceNote)
                .originalInvoiceId(origId)
                .htmlRepresentation(html.toString())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadInvoicePdf(String currentUsername, String invoiceId) {
        InvoiceRepresentationResponse rep = getInvoiceRepresentation(currentUsername, invoiceId);
        return rep.getHtmlRepresentation().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] downloadInvoiceRepresentation(String currentUsername, String invoiceId) {
        return downloadInvoicePdf(currentUsername, invoiceId);
    }

    private String convertAmountToWords(BigDecimal amount) {
        return com.sales.utils.VietnameseNumberToWordsUtil.convert(amount);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FailedCustomerDeliveryInvoiceResponse> getFailedCustomerDeliveries(String currentUsername, int page, int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<EInvoice> failedPage = eInvoiceRepository.findByHouseholdIdAndCustomerDeliveryStatusAndDeletedAtIsNull(
                household.getId(), "FAILED", pageable);

        List<EInvoice> invoices = failedPage.getContent();
        List<String> invoiceIds = invoices.stream().map(EInvoice::getId).collect(Collectors.toList());

        Map<String, List<InvoiceDeliveryLog>> logsByInvoice = invoiceIds.isEmpty()
                ? Collections.emptyMap()
                : invoiceDeliveryLogRepository.findByInvoiceIdInOrderBySentAtDesc(invoiceIds).stream()
                        .filter(log -> log.getInvoice() != null && log.getInvoice().getId() != null)
                        .collect(Collectors.groupingBy(log -> log.getInvoice().getId()));

        List<FailedCustomerDeliveryInvoiceResponse> content = invoices.stream().map(inv -> {
            List<InvoiceDeliveryLog> logs = logsByInvoice.getOrDefault(inv.getId(), Collections.emptyList());
            InvoiceDeliveryLog lastLog = logs.isEmpty() ? null : logs.get(0);
            long attemptCount = logs.size();

            return FailedCustomerDeliveryInvoiceResponse.builder()
                    .invoiceId(inv.getId())
                    .invoiceNumber(inv.getInvoiceNumber())
                    .lookupCode(inv.getLookupCode())
                    .buyerName(inv.getBuyerName())
                    .buyerPhone(inv.getBuyerPhone())
                    .buyerEmail(inv.getBuyerEmail())
                    .finalAmount(inv.getFinalAmount())
                    .status(inv.getStatus())
                    .customerDeliveryStatus(inv.getCustomerDeliveryStatus())
                    .lastChannel(lastLog != null ? lastLog.getChannel() : null)
                    .lastRecipientAddress(lastLog != null ? lastLog.getRecipientAddress() : null)
                    .lastErrorMessage(lastLog != null ? lastLog.getErrorMessage() : null)
                    .deliveryAttemptCount(attemptCount)
                    .lastSentAt(lastLog != null ? lastLog.getSentAt() : null)
                    .createdAt(inv.getCreatedAt())
                    .build();
        }).collect(Collectors.toList());

        return PageResponse.<FailedCustomerDeliveryInvoiceResponse>builder()
                .content(content)
                .pageNumber(failedPage.getNumber())
                .pageSize(failedPage.getSize())
                .totalElements(failedPage.getTotalElements())
                .totalPages(failedPage.getTotalPages())
                .last(failedPage.isLast())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse resendCustomerDelivery(String currentUsername, String invoiceId, ResendCustomerDeliveryRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        if (!"ISSUED".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_DELIVERY_NOT_ALLOWED);
        }

        String channel = request.getChannel().toUpperCase();
        String recipient = request.getRecipientAddress() != null ? request.getRecipientAddress().trim() : "";

        if ("EMAIL".equalsIgnoreCase(channel)) {
            if (recipient.isBlank() || !recipient.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }
            if (Boolean.TRUE.equals(request.getUpdateCustomerDefaultChannel())) {
                updateCustomerDeliveryInfo(invoice, channel, recipient, currentUser);
            }

            invoice.setCustomerDeliveryStatus("PENDING");
            eInvoiceRepository.save(invoice);

            InvoiceDeliveryLog deliveryLog = InvoiceDeliveryLog.builder()
                    .invoice(invoice)
                    .channel("EMAIL")
                    .recipientAddress(recipient)
                    .status("PENDING")
                    .build();
            InvoiceDeliveryLog savedLog = invoiceDeliveryLogRepository.save(deliveryLog);

            String lookupUrl = (frontendUrl != null ? frontendUrl : "http://localhost:3000") + "/lookup-invoice?code=" + invoice.getLookupCode();
            String householdName = invoice.getHousehold() != null ? invoice.getHousehold().getName() : "";
            String lookupCode = invoice.getLookupCode();
            BigDecimal finalAmount = invoice.getFinalAmount();

            if (TransactionSynchronizationManager.isActualTransactionActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        emailService.sendInvoiceEmailAsync(savedLog.getId(), recipient, lookupUrl, householdName, lookupCode, finalAmount);
                    }
                });
            } else {
                emailService.sendInvoiceEmailAsync(savedLog.getId(), recipient, lookupUrl, householdName, lookupCode, finalAmount);
            }
        } else if ("ZALO".equalsIgnoreCase(channel)) {
            if (recipient.isBlank()) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }

            boolean isValidZaloPhone = recipient.matches("^[0-9]{9,15}$");
            if (!isValidZaloPhone) {
                invoice.setCustomerDeliveryStatus("FAILED");
                eInvoiceRepository.save(invoice);

                InvoiceDeliveryLog deliveryLog = InvoiceDeliveryLog.builder()
                        .invoice(invoice)
                        .channel("ZALO")
                        .recipientAddress(recipient)
                        .status("FAILED")
                        .errorMessage("Số điện thoại Zalo không hợp lệ")
                        .build();
                invoiceDeliveryLogRepository.save(deliveryLog);
            } else {
                if (Boolean.TRUE.equals(request.getUpdateCustomerDefaultChannel())) {
                    updateCustomerDeliveryInfo(invoice, channel, recipient, currentUser);
                }

                invoice.setCustomerDeliveryStatus("SUCCESS");
                eInvoiceRepository.save(invoice);

                InvoiceDeliveryLog deliveryLog = InvoiceDeliveryLog.builder()
                        .invoice(invoice)
                        .channel("ZALO")
                        .recipientAddress(recipient)
                        .status("SUCCESS")
                        .build();
                invoiceDeliveryLogRepository.save(deliveryLog);
            }
        } else if ("QR".equalsIgnoreCase(channel)) {
            String qrRecipient = !recipient.isBlank() ? recipient : ((frontendUrl != null ? frontendUrl : "http://localhost:3000") + "/lookup-invoice?code=" + invoice.getLookupCode());
            if (Boolean.TRUE.equals(request.getUpdateCustomerDefaultChannel())) {
                updateCustomerDeliveryInfo(invoice, channel, null, currentUser);
            }

            invoice.setCustomerDeliveryStatus("SUCCESS");
            eInvoiceRepository.save(invoice);

            InvoiceDeliveryLog deliveryLog = InvoiceDeliveryLog.builder()
                    .invoice(invoice)
                    .channel("QR")
                    .recipientAddress(qrRecipient)
                    .status("SUCCESS")
                    .build();
            invoiceDeliveryLogRepository.save(deliveryLog);
        } else if ("PRINT".equalsIgnoreCase(channel)) {
            String printRecipient = !recipient.isBlank() ? recipient : "K80";
            if (Boolean.TRUE.equals(request.getUpdateCustomerDefaultChannel())) {
                updateCustomerDeliveryInfo(invoice, channel, null, currentUser);
            }

            invoice.setCustomerDeliveryStatus("SUCCESS");
            eInvoiceRepository.save(invoice);

            InvoiceDeliveryLog deliveryLog = InvoiceDeliveryLog.builder()
                    .invoice(invoice)
                    .channel("PRINT")
                    .recipientAddress(printRecipient)
                    .status("SUCCESS")
                    .build();
            invoiceDeliveryLogRepository.save(deliveryLog);
        } else {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        Map<String, Object> logPayload = new HashMap<>();
        logPayload.put("channel", channel);
        logPayload.put("recipient", recipient);
        logPayload.put("customerDeliveryStatus", invoice.getCustomerDeliveryStatus());
        logActivity(invoice.getHousehold(), currentUser, "RESEND_CUSTOMER_DELIVERY", invoice.getId(), null, logPayload);

        return mapToInvoiceResponse(invoice);
    }

    private void updateCustomerDeliveryInfo(EInvoice invoice, String channel, String recipientAddress, User currentUser) {
        Customer customerToUpdate = null;
        if (invoice.getOrder() != null && invoice.getOrder().getCustomer() != null) {
            customerToUpdate = invoice.getOrder().getCustomer();
        } else if (invoice.getHousehold() != null && invoice.getBuyerPhone() != null && !invoice.getBuyerPhone().isBlank()) {
            customerToUpdate = customerRepository.findByPhoneNumberAndHouseholdIdAndDeletedAtIsNull(
                    invoice.getBuyerPhone(), invoice.getHousehold().getId()).orElse(null);
        }
        if (customerToUpdate != null) {
            Map<String, Object> oldLogMap = new HashMap<>();
            oldLogMap.put("defaultDeliveryChannel", customerToUpdate.getDefaultDeliveryChannel());
            oldLogMap.put("defaultDeliveryAddress", customerToUpdate.getDefaultDeliveryAddress());

            customerToUpdate.setDefaultDeliveryChannel(channel);
            if (recipientAddress != null && !recipientAddress.isBlank()) {
                customerToUpdate.setDefaultDeliveryAddress(recipientAddress);
            } else {
                customerToUpdate.setDefaultDeliveryAddress(null);
            }
            customerToUpdate = customerRepository.save(customerToUpdate);

            Map<String, Object> newLogMap = new HashMap<>();
            newLogMap.put("defaultDeliveryChannel", customerToUpdate.getDefaultDeliveryChannel());
            newLogMap.put("defaultDeliveryAddress", customerToUpdate.getDefaultDeliveryAddress());

            logActivity(invoice.getHousehold(), currentUser, "UPDATE_CUSTOMER_DELIVERY_CHANNEL", "customers", customerToUpdate.getId(), oldLogMap, newLogMap);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDeliveryLogResponse> getInvoiceDeliveryHistory(String currentUsername, String invoiceId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        List<InvoiceDeliveryLog> logs = invoiceDeliveryLogRepository.findByInvoiceIdOrderBySentAtDesc(invoiceId);
        return logs.stream().map(logRecord -> InvoiceDeliveryLogResponse.builder()
                .id(logRecord.getId())
                .invoiceId(invoice.getId())
                .channel(logRecord.getChannel())
                .recipientAddress(logRecord.getRecipientAddress())
                .status(logRecord.getStatus())
                .errorMessage(logRecord.getErrorMessage())
                .sentAt(logRecord.getSentAt())
                .createdAt(logRecord.getCreatedAt())
                .build()).collect(Collectors.toList());
    }
}
