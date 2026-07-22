package com.viet.sales.service.classes;

import com.viet.sales.dto.request.CancelInvoiceRequest;
import com.viet.sales.dto.request.UpdateInvoiceRequest;
import com.viet.sales.dto.response.InvoiceItemResponse;
import com.viet.sales.dto.response.InvoiceResponse;
import com.viet.sales.dto.response.PageResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.*;
import com.viet.sales.service.interfaces.EInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EInvoiceServiceImpl implements EInvoiceService {

    private final EInvoiceRepository eInvoiceRepository;
    private final EInvoiceItemRepository eInvoiceItemRepository;
    private final InvoiceTemplateRepository invoiceTemplateRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InvoiceStatusLogRepository invoiceStatusLogRepository;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void checkInvoiceOwnership(EInvoice invoice, User currentUser) {
        if (currentUser.getHousehold() == null || 
            !currentUser.getHousehold().getId().equals(invoice.getHousehold().getId())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

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
        return mapToResponse(savedInvoice);
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
        return mapToResponse(saved);
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
        return mapToResponse(saved);
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
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(String currentUsername, String invoiceId) {
        User currentUser = getAuthenticatedUser(currentUsername);
        EInvoice invoice = eInvoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        checkInvoiceOwnership(invoice, currentUser);
        return mapToResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InvoiceResponse> getInvoices(String currentUsername, String status, LocalDate fromDate, LocalDate toDate, int page, int size) {
        User currentUser = getAuthenticatedUser(currentUsername);
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

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size);
        Page<EInvoice> pageData = eInvoiceRepository.findAll(spec, pageable);
        List<InvoiceResponse> content = pageData.getContent().stream()
                .map(this::mapToResponse)
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
        Pageable pageable = PageRequest.of(page, size);
        Page<EInvoice> pageData = eInvoiceRepository.findAll(spec, pageable);
        List<InvoiceResponse> content = pageData.getContent().stream()
                .map(this::mapToResponse)
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
        Specification<EInvoice> spec = (root, query, cb) -> cb.and(
                cb.or(
                        cb.equal(root.get("status"), "ISSUED"),
                        cb.equal(root.get("status"), "SEND_ERROR")
                ),
                cb.isNull(root.get("deletedAt"))
        );
        Pageable pageable = PageRequest.of(page, size, org.springframework.data.domain.Sort.by("updatedAt").descending());
        Page<EInvoice> pageData = eInvoiceRepository.findAll(spec, pageable);
        List<InvoiceResponse> content = pageData.getContent().stream()
                .map(this::mapToResponse)
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
        return mapToResponse(saved);
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
        return mapToResponse(saved);
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
        return mapToResponse(saved);
    }

    private InvoiceResponse mapToResponse(EInvoice invoice) {
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
                .items(items)
                .build();
    }
}
