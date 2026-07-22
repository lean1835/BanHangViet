package com.viet.sales.service.classes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CancelInvoiceRequest;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceItemRequest;
import com.viet.sales.dto.request.CreateAdjustmentInvoiceRequest;
import com.viet.sales.dto.request.UpdateInvoiceRequest;
import com.viet.sales.dto.response.EInvoiceItemResponse;
import com.viet.sales.dto.response.EInvoiceResponse;
import com.viet.sales.dto.response.InvoiceItemResponse;
import com.viet.sales.dto.response.InvoiceResponse;
import com.viet.sales.dto.response.InvoiceStatusLogResponse;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.*;
import com.viet.sales.service.interfaces.EInvoiceService;
import com.viet.sales.specification.EInvoiceSpecification;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
    private final ActivityLogRepository activityLogRepository;
    private final ProductRepository productRepository;
    private final InvoiceTemplateRepository invoiceTemplateRepository;
    private final OrderRepository orderRepository;
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
                    .targetTable("e_invoices")
                    .targetId(targetId)
                    .oldValue(oldStr)
                    .newValue(newStr)
                    .clientIp(clientIp)
                    .userAgent(userAgent)
                    .build();

            activityLogRepository.save(logRecord);
        } catch (Exception e) {
            log.error("Failed to write activity log for invoice", e);
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
        map.put("originalInvoiceId", invoice.getOriginalInvoice() != null ? invoice.getOriginalInvoice().getId() : null);
        return map;
    }

    private boolean checkDataDifference(EInvoice original, CreateAdjustmentInvoiceRequest request) {
        // Kiểm tra thông tin người mua
        if (!Objects.equals(original.getBuyerName(), request.getBuyerName())) return true;
        if (!Objects.equals(original.getBuyerTaxCode(), request.getBuyerTaxCode())) return true;
        if (!Objects.equals(original.getBuyerAddress(), request.getBuyerAddress())) return true;
        if (!Objects.equals(original.getBuyerPhone(), request.getBuyerPhone())) return true;
        if (!Objects.equals(original.getBuyerEmail(), request.getBuyerEmail())) return true;

        // Kiểm tra danh sách hàng hóa
        List<EInvoiceItem> originalItems = original.getItems();
        List<CreateAdjustmentInvoiceItemRequest> reqItems = request.getItems();

        if (originalItems.size() != reqItems.size()) return true;

        // So sánh từng cặp sản phẩm (để đơn giản và chính xác, chúng ta sort theo productId hoặc productName nếu productId null)
        List<EInvoiceItem> sortedOriginal = new ArrayList<>(originalItems);
        sortedOriginal.sort(Comparator.comparing(item -> item.getProductName() + "_" + (item.getProduct() != null ? item.getProduct().getId() : "")));

        List<CreateAdjustmentInvoiceItemRequest> sortedReq = new ArrayList<>(reqItems);
        sortedReq.sort(Comparator.comparing(item -> item.getProductName() + "_" + (item.getProductId() != null ? item.getProductId() : "")));

        for (int i = 0; i < sortedOriginal.size(); i++) {
            EInvoiceItem origItem = sortedOriginal.get(i);
            CreateAdjustmentInvoiceItemRequest reqItem = sortedReq.get(i);

            String origProdId = origItem.getProduct() != null ? origItem.getProduct().getId() : null;
            String reqProdId = reqItem.getProductId();
            if (!Objects.equals(origProdId, reqProdId)) return true;
            if (!Objects.equals(origItem.getProductName(), reqItem.getProductName())) return true;
            if (!Objects.equals(origItem.getUnit(), reqItem.getUnit())) return true;
            if (origItem.getQuantity().compareTo(reqItem.getQuantity()) != 0) return true;
            if (origItem.getUnitPrice().compareTo(reqItem.getUnitPrice()) != 0) return true;
            if (origItem.getTaxRatePercentage().compareTo(reqItem.getTaxRatePercentage()) != 0) return true;
            
            BigDecimal reqDiscount = reqItem.getDiscountAmount() != null ? reqItem.getDiscountAmount() : BigDecimal.ZERO;
            if (origItem.getDiscountAmount().compareTo(reqDiscount) != 0) return true;
        }

        return false;
    }

    private EInvoiceResponse mapToResponse(EInvoice invoice) {
        List<EInvoiceItemResponse> itemResponses = invoice.getItems().stream().map(item -> EInvoiceItemResponse.builder()
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
                .build()
        ).collect(Collectors.toList());

        return EInvoiceResponse.builder()
                .id(invoice.getId())
                .householdId(invoice.getHousehold().getId())
                .orderId(invoice.getOrder() != null ? invoice.getOrder().getId() : null)
                .originalInvoiceId(invoice.getOriginalInvoice() != null ? invoice.getOriginalInvoice().getId() : null)
                .createdByUserId(invoice.getCreatedByUser().getId())
                .createdByFullName(invoice.getCreatedByUser().getFullName())
                .canceledByUserId(invoice.getCanceledByUser() != null ? invoice.getCanceledByUser().getId() : null)
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
                .items(itemResponses)
                .build();
    }

    private InvoiceResponse mapToInvoiceResponse(EInvoice invoice) {
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
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .householdId(invoice.getHousehold().getId())
                .householdName(invoice.getHousehold().getName())
                .orderId(invoice.getOrder() != null ? invoice.getOrder().getId() : null)
                .orderNumber(invoice.getOrder() != null ? invoice.getOrder().getOrderNumber() : null)
                .originalInvoiceId(invoice.getOriginalInvoice() != null ? invoice.getOriginalInvoice().getId() : null)
                .createdByUserId(invoice.getCreatedByUser().getId())
                .createdByUsername(invoice.getCreatedByUser().getUsername())
                .canceledByUserId(invoice.getCanceledByUser() != null ? invoice.getCanceledByUser().getId() : null)
                .canceledByUsername(invoice.getCanceledByUser() != null ? invoice.getCanceledByUser().getUsername() : null)
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoicePattern(invoice.getInvoicePattern())
                .invoiceSymbol(invoice.getInvoiceSymbol())
                .buyerName(invoice.getBuyerName())
                .buyerTaxCode(invoice.getBuyerTaxCode())
                .buyerPhone(invoice.getBuyerPhone())
                .buyerEmail(invoice.getBuyerEmail())
                .buyerAddress(invoice.getBuyerAddress())
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
                .items(items)
                .build();
    }

    // ==========================================
    // NGHIỆP VỤ ĐIỀU CHỈNH HÓA ĐƠN (Của chúng ta)
    // ==========================================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public EInvoiceResponse createAdjustmentInvoice(String currentUsername, String originalInvoiceId, CreateAdjustmentInvoiceRequest request) {
        User user = getAuthenticatedUser(currentUsername);
        String role = user.getRole().getCode();

        // Quyền hạn chính: Chỉ chủ hộ kinh doanh (VT-01) hoặc Kế toán (VT-03) được phép
        if (!"VT-01".equals(role) && !"VT-03".equals(role)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        BusinessHousehold household = user.getHousehold();

        // 1. Tìm hóa đơn gốc
        EInvoice original = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(originalInvoiceId, household.getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        // 2. Kiểm tra hóa đơn gốc đã được cấp mã chưa (trạng thái phải là ISSUED)
        if (!"ISSUED".equals(original.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_ISSUED);
        }

        // 3. Kiểm tra hóa đơn gốc đã bị điều chỉnh hoặc hủy trước đó chưa
        if ("ADJUSTED".equals(original.getStatus()) || "CANCELED".equals(original.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_ADJUSTED_OR_CANCELED);
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
            BigDecimal discountAmt = itemReq.getDiscountAmount() != null ? itemReq.getDiscountAmount() : BigDecimal.ZERO;
            BigDecimal taxRate = itemReq.getTaxRatePercentage() != null ? itemReq.getTaxRatePercentage() : BigDecimal.ZERO;

            BigDecimal itemAmount = quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxableAmount = itemAmount.subtract(discountAmt).setScale(2, RoundingMode.HALF_UP);
            BigDecimal taxAmount = taxableAmount.multiply(taxRate.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal subtotal = taxableAmount.add(taxAmount).setScale(2, RoundingMode.HALF_UP);

            totalAmountBeforeTax = totalAmountBeforeTax.add(taxableAmount);
            totalTaxAmount = totalTaxAmount.add(taxAmount);
            totalDiscountAmount = totalDiscountAmount.add(discountAmt);
            finalAmount = finalAmount.add(subtotal);

            Product product = itemReq.getProductId() != null ? productMap.get(itemReq.getProductId()) : null;

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
        String lookupCode = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        
        EInvoice adjustmentInvoice = EInvoice.builder()
                .household(household)
                .order(original.getOrder())
                .originalInvoice(original)
                .createdByUser(user)
                .invoicePattern(original.getInvoicePattern())
                .invoiceSymbol(original.getInvoiceSymbol())
                .buyerName(request.getBuyerName() != null ? request.getBuyerName() : original.getBuyerName())
                .buyerTaxCode(request.getBuyerTaxCode() != null ? request.getBuyerTaxCode() : original.getBuyerTaxCode())
                .buyerAddress(request.getBuyerAddress() != null ? request.getBuyerAddress() : original.getBuyerAddress())
                .buyerPhone(request.getBuyerPhone() != null ? request.getBuyerPhone() : original.getBuyerPhone())
                .buyerEmail(request.getBuyerEmail() != null ? request.getBuyerEmail() : original.getBuyerEmail())
                .totalAmountBeforeTax(totalAmountBeforeTax)
                .taxAmount(totalTaxAmount)
                .discountAmount(totalDiscountAmount)
                .finalAmount(finalAmount)
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
        InvoiceStatusLog originalLog = InvoiceStatusLog.builder()
                .invoice(original)
                .fromStatus(oldStatus)
                .toStatus("ADJUSTED")
                .changedByUser(user)
                .notes("Bị điều chỉnh bởi hóa đơn ID: " + savedAdjustment.getId() + ". Lý do: " + request.getAdjustmentReason())
                .build();
        invoiceStatusLogRepository.save(originalLog);

        InvoiceStatusLog adjustmentLog = InvoiceStatusLog.builder()
                .invoice(savedAdjustment)
                .fromStatus("NONE")
                .toStatus("DRAFT")
                .changedByUser(user)
                .notes("Khởi tạo hóa đơn điều chỉnh. Lý do điều chỉnh: " + request.getAdjustmentReason())
                .build();
        invoiceStatusLogRepository.save(adjustmentLog);

        // 9. Ghi nhật ký hệ thống
        logActivity(household, user, "ADJUST_INVOICE", original.getId(), buildInvoiceLogMap(original), buildInvoiceLogMap(savedAdjustment));

        return mapToResponse(savedAdjustment);
    }

    @Override
    @Transactional(readOnly = true)
    public EInvoiceResponse getInvoiceById(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        // Bảo mật cách ly dữ liệu: Nhân viên VT-02 chỉ được xem hóa đơn do chính mình tạo
        if ("VT-02".equals(user.getRole().getCode())) {
            if (!invoice.getCreatedByUser().getId().equals(user.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }

        return mapToResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceStatusLogResponse> getInvoiceLogs(String currentUsername, String id) {
        User user = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(id, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        // Bảo mật cách ly dữ liệu: Nhân viên VT-02 chỉ được xem log trạng thái hóa đơn của chính mình
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
                .build()
        ).collect(Collectors.toList());
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
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_TEMPLATE_NOT_FOUND));

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
                .buyerName(order.getCustomer() != null ? order.getCustomer().getName() : "Khách mua lẻ")
                .buyerPhone(order.getCustomer() != null ? order.getCustomer().getPhoneNumber() : null)
                .buyerEmail(order.getCustomer() != null ? order.getCustomer().getEmail() : null)
                .buyerAddress(order.getCustomer() != null ? order.getCustomer().getAddress() : null)
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
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
                    .unit(orderItem.getProduct() != null ? orderItem.getProduct().getUnit() : "Cái")
                    .quantity(qty)
                    .unitPrice(price)
                    .taxRatePercentage(taxRate)
                    .taxAmount(taxAmt)
                    .discountAmount(disc)
                    .subtotal(orderItem.getSubtotal())
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

        log.info("Khởi tạo HĐĐT nháp thành công. ID={}, LookupCode={}", savedInvoice.getId(), savedInvoice.getLookupCode());
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

        String oldStatus = invoice.getStatus();
        invoice.setStatus("WAITING_TAX_CODE");
        invoice.setSentToTaxAt(LocalDateTime.now());
        
        EInvoice saved = eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus(oldStatus)
                .toStatus("WAITING_TAX_CODE")
                .changedByUser(currentUser)
                .notes("Đẩy hóa đơn vào hàng đợi chờ cơ quan thuế cấp mã")
                .build());

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

        if (!"SEND_ERROR".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        String oldStatus = invoice.getStatus();
        invoice.setStatus("WAITING_TAX_CODE");
        invoice.setSentToTaxAt(LocalDateTime.now());
        invoice.setTaxAuthorityResponse(null);

        EInvoice saved = eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus(oldStatus)
                .toStatus("WAITING_TAX_CODE")
                .changedByUser(currentUser)
                .notes("Gửi lại hóa đơn bị lỗi lên cơ quan thuế")
                .build());

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

        // Bảo mật cách ly dữ liệu: Nhân viên VT-02 chỉ được xem hóa đơn do chính mình tạo
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
                .map(this::mapToInvoiceResponse)
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
        Specification<EInvoice> spec = (root, query, cb) -> cb.and(
                cb.equal(root.get("status"), "WAITING_TAX_CODE"),
                cb.isNull(root.get("deletedAt"))
        );
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<EInvoice> pageData = eInvoiceRepository.findAll(spec, pageable);
        List<InvoiceResponse> content = pageData.getContent().stream()
                .map(this::mapToInvoiceResponse)
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
    public InvoiceResponse approveInvoiceByTax(String invoiceId, String taxCode) {
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        if (!"WAITING_TAX_CODE".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        String invoiceNum = String.format("%07d", (int)(Math.random() * 10000000));
        
        invoice.setStatus("ISSUED");
        invoice.setInvoiceNumber(invoiceNum);
        invoice.setTaxAuthorityCode(taxCode != null ? taxCode : "CQT-" + UUID.randomUUID().toString().substring(0, 15).toUpperCase());
        invoice.setTaxResponseAt(LocalDateTime.now());

        EInvoice saved = eInvoiceRepository.save(invoice);
        
        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus("WAITING_TAX_CODE")
                .toStatus("ISSUED")
                .changedByUser(invoice.getCreatedByUser())
                .notes("Cơ quan Thuế phê duyệt cấp mã HĐĐT: " + saved.getTaxAuthorityCode())
                .build());

        log.info("Thuế duyệt cấp mã hóa đơn thành công. ID={}, Số HĐ={}, Mã CQT={}", 
                invoiceId, saved.getInvoiceNumber(), saved.getTaxAuthorityCode());
        return mapToInvoiceResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse rejectInvoiceByTax(String invoiceId, String errorMessage) {
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        if (!"WAITING_TAX_CODE".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_SEND_ERROR);
        }

        invoice.setStatus("SEND_ERROR");
        invoice.setTaxAuthorityResponse(errorMessage != null ? errorMessage : "Dữ liệu hóa đơn không hợp lệ theo quy định.");
        invoice.setTaxResponseAt(LocalDateTime.now());

        EInvoice saved = eInvoiceRepository.save(invoice);

        invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                .invoice(saved)
                .fromStatus("WAITING_TAX_CODE")
                .toStatus("SEND_ERROR")
                .changedByUser(invoice.getCreatedByUser())
                .notes("Cơ quan Thuế từ chối cấp mã. Lý do: " + saved.getTaxAuthorityResponse())
                .build());

        log.info("Thuế từ chối cấp mã hóa đơn. ID={}, Lý do={}", invoiceId, saved.getTaxAuthorityResponse());
        return mapToInvoiceResponse(saved);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public InvoiceResponse updateInvoice(String currentUsername, String invoiceId, UpdateInvoiceRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);

        if (!"DRAFT".equals(invoice.getStatus()) && !"SEND_ERROR".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_EDITABLE);
        }

        invoice.setBuyerName(request.getBuyerName());
        invoice.setBuyerTaxCode(request.getBuyerTaxCode());
        invoice.setBuyerAddress(request.getBuyerAddress());
        invoice.setBuyerPhone(request.getBuyerPhone());
        invoice.setBuyerEmail(request.getBuyerEmail());

        EInvoice saved = eInvoiceRepository.save(invoice);
        log.info("Cập nhật thông tin hóa đơn thành công. ID={}, Status={}", invoiceId, saved.getStatus());
        return mapToInvoiceResponse(saved);
    }
}
