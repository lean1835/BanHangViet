package com.sales.service.classes;

import com.sales.dto.request.CreateReturnTicketItemRequest;
import com.sales.dto.request.CreateReturnTicketRequest;
import com.sales.dto.request.RejectReturnTicketRequest;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.interfaces.ReturnTicketService;
import com.sales.specification.ReturnTicketSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReturnTicketServiceImpl implements ReturnTicketService {

    @Value("${app.return-ticket.max-days:7}")
    private int maxReturnDays = 7;

    private final ReturnTicketRepository returnTicketRepository;
    private final ReturnTicketItemRepository returnTicketItemRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final CustomerRepository customerRepository;
    private final CustomerDebtRepository customerDebtRepository;
    private final ActivityLogHelper activityLogHelper;


    @Override
    @Transactional(readOnly = true)
    public InvoiceReturnableCheckResponse checkInvoiceReturnable(String invoiceId, String currentUsername) {
        User user = getUserByUsername(currentUsername);
        validateStaffOrOwnerRole(user);

        EInvoice invoice = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(invoiceId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        boolean isEligible = true;
        String ineligibilityReason = null;

        if (!"ISSUED".equals(invoice.getStatus()) && !"ADJUSTED".equals(invoice.getStatus())) {
            isEligible = false;
            ineligibilityReason = "Hóa đơn gốc chưa được cấp mã hoặc đã bị hủy";
        }

        LocalDateTime issueTime = invoice.getCreatedAt();
        long daysSinceIssued = ChronoUnit.DAYS.between(issueTime, LocalDateTime.now());
        boolean isExpired = daysSinceIssued > maxReturnDays;

        if (isExpired && isEligible) {
            ineligibilityReason = "Hóa đơn đã quá thời hạn trả hàng " + maxReturnDays + " ngày theo quy định";
        }

        // Tính toán số lượng khả dụng của từng sản phẩm trong hóa đơn gốc
        Map<String, BigDecimal> returnedQtyMap = getAlreadyReturnedQuantities(invoice.getId());

        List<ReturnableItemDto> itemDtos = new ArrayList<>();
        for (EInvoiceItem item : invoice.getItems()) {
            String prodKey = item.getProduct() != null ? item.getProduct().getId() : item.getProductName();
            BigDecimal boughtQty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
            BigDecimal returnedQty = returnedQtyMap.getOrDefault(item.getId(), returnedQtyMap.getOrDefault(prodKey, BigDecimal.ZERO));
            BigDecimal returnableQty = boughtQty.subtract(returnedQty);

            if (returnableQty.compareTo(BigDecimal.ZERO) < 0) {
                returnableQty = BigDecimal.ZERO;
            }

            itemDtos.add(ReturnableItemDto.builder()
                    .invoiceItemId(item.getId())
                    .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                    .productName(item.getProductName())
                    .unit(item.getUnit())
                    .boughtQuantity(boughtQty)
                    .alreadyReturnedQuantity(returnedQty)
                    .returnableQuantity(returnableQty)
                    .unitPrice(item.getUnitPrice())
                    .taxRatePercentage(item.getTaxRatePercentage())
                    .build());
        }

        return InvoiceReturnableCheckResponse.builder()
                .invoiceId(invoice.getId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .invoiceDate(invoice.getCreatedAt())
                .buyerName(invoice.getBuyerName())
                .isEligibleForReturn(isEligible)
                .isExpired(isExpired)
                .daysSinceIssued(daysSinceIssued)
                .maxReturnDays(maxReturnDays)
                .ineligibilityReason(ineligibilityReason)
                .items(itemDtos)
                .build();
    }

    @Override
    @Transactional
    public ReturnTicketResponse createReturnTicket(CreateReturnTicketRequest request, String currentUsername) {
        User user = getUserByUsername(currentUsername);
        validateStaffOrOwnerRole(user);

        EInvoice invoice = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(request.getOriginalInvoiceId(), user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        if (!"ISSUED".equals(invoice.getStatus()) && !"ADJUSTED".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_ELIGIBLE_FOR_RETURN);
        }

        long daysSinceIssued = ChronoUnit.DAYS.between(invoice.getCreatedAt(), LocalDateTime.now());
        boolean isExpired = daysSinceIssued > maxReturnDays;
        boolean isOwner = user.getRole() != null && "VT-01".equals(user.getRole().getCode());

        // QTN-18: Cảnh báo quá hạn và chỉ cho lập khi chủ hộ đồng ý ngoại lệ (allowOverdueOverride == true)
        if (isExpired) {
            if (!isOwner || !Boolean.TRUE.equals(request.getAllowOverdueOverride())) {
                throw new AppException(ErrorCode.RETURN_PERIOD_EXPIRED);
            }
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_RETURN_TICKET_ITEMS);
        }

        // Tính toán số lượng còn được phép trả
        Map<String, BigDecimal> returnedQtyMap = getAlreadyReturnedQuantities(invoice.getId());
        
        Map<String, EInvoiceItem> invoiceItemByIdMap = new HashMap<>();
        Map<String, EInvoiceItem> invoiceItemByProductIdMap = new HashMap<>();
        Map<String, EInvoiceItem> invoiceItemByProductNameMap = new HashMap<>();
        for (EInvoiceItem item : invoice.getItems()) {
            invoiceItemByIdMap.put(item.getId(), item);
            if (item.getProduct() != null) {
                invoiceItemByProductIdMap.put(item.getProduct().getId(), item);
            }
            if (item.getProductName() != null) {
                invoiceItemByProductNameMap.put(item.getProductName(), item);
            }
        }

        List<ReturnTicketItem> ticketItems = new ArrayList<>();
        BigDecimal totalReturnAmount = BigDecimal.ZERO;

        for (CreateReturnTicketItemRequest itemReq : request.getItems()) {
            EInvoiceItem originalItem = null;
            if (itemReq.getInvoiceItemId() != null) {
                originalItem = invoiceItemByIdMap.get(itemReq.getInvoiceItemId());
            }
            if (originalItem == null && itemReq.getProductId() != null) {
                originalItem = invoiceItemByProductIdMap.get(itemReq.getProductId());
            }
            if (originalItem == null && itemReq.getProductName() != null) {
                originalItem = invoiceItemByProductNameMap.get(itemReq.getProductName());
            }

            if (originalItem == null) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }

            BigDecimal reqQty = itemReq.getQuantity();
            if (reqQty == null || reqQty.compareTo(BigDecimal.ZERO) <= 0) {
                throw new AppException(ErrorCode.INVALID_INPUT);
            }

            String prodKey = originalItem.getProduct() != null ? originalItem.getProduct().getId() : originalItem.getProductName();
            BigDecimal alreadyReturned = returnedQtyMap.getOrDefault(originalItem.getId(), returnedQtyMap.getOrDefault(prodKey, BigDecimal.ZERO));
            BigDecimal availableReturnable = originalItem.getQuantity().subtract(alreadyReturned);

            // QTN-19: Số lượng trả không được vượt quá số lượng còn lại có thể trả
            if (reqQty.compareTo(availableReturnable) > 0) {
                throw new AppException(ErrorCode.EXCEEDED_RETURNABLE_QUANTITY);
            }

            BigDecimal boughtQty = originalItem.getQuantity();
            BigDecimal unitPrice = originalItem.getUnitPrice();
            BigDecimal taxRatePct = originalItem.getTaxRatePercentage() != null ? originalItem.getTaxRatePercentage() : BigDecimal.ZERO;
            BigDecimal itemDiscount = originalItem.getDiscountAmount() != null ? originalItem.getDiscountAmount() : BigDecimal.ZERO;

            // Tính phân bổ chiết khấu cho lượng trả lại (prorated line discount)
            BigDecimal lineDiscount = BigDecimal.ZERO;
            if (itemDiscount.compareTo(BigDecimal.ZERO) > 0 && boughtQty.compareTo(BigDecimal.ZERO) > 0) {
                lineDiscount = itemDiscount.multiply(reqQty).divide(boughtQty, 2, RoundingMode.HALF_UP);
            }

            // Tính tổng tiền chưa thuế của dòng trả
            BigDecimal lineNetTotal = reqQty.multiply(unitPrice).subtract(lineDiscount);
            if (lineNetTotal.compareTo(BigDecimal.ZERO) < 0) {
                lineNetTotal = BigDecimal.ZERO;
            }

            // Tính tiền thuế của dòng trả
            BigDecimal lineTaxAmount = lineNetTotal.multiply(taxRatePct).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal lineSubtotal = lineNetTotal.add(lineTaxAmount);

            totalReturnAmount = totalReturnAmount.add(lineSubtotal);

            ReturnTicketItem ticketItem = ReturnTicketItem.builder()
                    .invoiceItemId(originalItem.getId())
                    .product(originalItem.getProduct())
                    .productName(originalItem.getProductName())
                    .unit(originalItem.getUnit())
                    .quantity(reqQty)
                    .unitPrice(unitPrice)
                    .taxRatePercentage(taxRatePct)
                    .taxAmount(lineTaxAmount)
                    .subtotal(lineSubtotal)
                    .build();

            ticketItems.add(ticketItem);
        }

        String ticketNumber = generateTicketNumber(user.getHousehold().getId());
        Order originalOrder = invoice.getOrder();
        Customer customer = originalOrder != null ? originalOrder.getCustomer() : null;

        ReturnTicket ticket = ReturnTicket.builder()
                .household(user.getHousehold())
                .originalInvoice(invoice)
                .originalOrder(originalOrder)
                .customer(customer)
                .ticketNumber(ticketNumber)
                .createdByUser(user)
                .totalReturnAmount(totalReturnAmount)
                .refundPaymentMethod(request.getRefundPaymentMethod() != null ? request.getRefundPaymentMethod() : "CASH")
                .status("PENDING")
                .reason(request.getReason())
                .build();

        for (ReturnTicketItem item : ticketItems) {
            item.setReturnTicket(ticket);
        }
        ticket.setItems(ticketItems);

        ReturnTicket savedTicket = returnTicketRepository.save(ticket);
        log.info("Created return ticket {} for invoice {} by user {}", savedTicket.getTicketNumber(), invoice.getInvoiceNumber(), currentUsername);

        return mapToResponse(savedTicket);
    }

    @Override
    @Transactional
    public ReturnTicketResponse approveReturnTicket(String ticketId, String currentUsername) {
        User user = getUserByUsername(currentUsername);
        validateOwnerOrAccountantRole(user);

        ReturnTicket ticket = returnTicketRepository.findByIdAndHouseholdId(ticketId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.RETURN_TICKET_NOT_FOUND));

        if (!"PENDING".equals(ticket.getStatus())) {
            throw new AppException(ErrorCode.RETURN_TICKET_ALREADY_PROCESSED);
        }

        ticket.setStatus("APPROVED");
        ticket.setApprovedByUser(user);
        ticket.setApprovedAt(LocalDateTime.now());

        // 1. Hoàn tồn kho nguyên tử cho các sản phẩm trong dòng trả (Atomic Update)
        if (ticket.getItems() != null) {
            for (ReturnTicketItem item : ticket.getItems()) {
                Product product = item.getProduct();
                if (product != null) {
                    productRepository.addStock(product.getId(), user.getHousehold().getId(), item.getQuantity());
                }
            }
        }

        // 2. Ghi nhận hoàn tiền / giảm trừ công nợ nếu áp dụng
        if ("DEBT_REDUCTION".equals(ticket.getRefundPaymentMethod()) && ticket.getCustomer() != null) {
            Customer customer = ticket.getCustomer();
            BigDecimal currentDebt = customer.getCurrentDebt() != null ? customer.getCurrentDebt() : BigDecimal.ZERO;
            BigDecimal newDebt = currentDebt.subtract(ticket.getTotalReturnAmount());
            if (newDebt.compareTo(BigDecimal.ZERO) < 0) {
                newDebt = BigDecimal.ZERO;
            }
            customer.setCurrentDebt(newDebt);
            customerRepository.save(customer);

            CustomerDebt debtRecord = CustomerDebt.builder()
                    .household(user.getHousehold())
                    .customer(customer)
                    .order(ticket.getOriginalOrder())
                    .amount(ticket.getTotalReturnAmount())
                    .type("DEBT_PAID")
                    .status("PAID")
                    .dueDate(LocalDateTime.now())
                    .notes("Giảm trừ công nợ từ phiếu trả hàng " + ticket.getTicketNumber())
                    .createdByUser(user)
                    .build();
            customerDebtRepository.save(debtRecord);
        }

        ReturnTicket savedTicket = returnTicketRepository.save(ticket);
        log.info("Approved return ticket {} for invoice {} by user {}", savedTicket.getTicketNumber(), savedTicket.getOriginalInvoice().getInvoiceNumber(), currentUsername);

        // 3. Ghi log hoạt động hệ thống
        if (activityLogHelper != null) {
            activityLogHelper.logActivityInNewTransaction(
                    user.getHousehold(),
                    user,
                    "APPROVE_RETURN_TICKET",
                    "return_tickets",
                    savedTicket.getId(),
                    "PENDING",
                    "APPROVED",
                    null,
                    null
            );
        }

        return mapToResponse(savedTicket);
    }

    @Override
    @Transactional
    public ReturnTicketResponse rejectReturnTicket(String ticketId, RejectReturnTicketRequest request, String currentUsername) {
        User user = getUserByUsername(currentUsername);
        validateOwnerOrAccountantRole(user);

        if (request == null || request.getRejectReason() == null || request.getRejectReason().trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        ReturnTicket ticket = returnTicketRepository.findByIdAndHouseholdId(ticketId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.RETURN_TICKET_NOT_FOUND));

        if (!"PENDING".equals(ticket.getStatus())) {
            throw new AppException(ErrorCode.RETURN_TICKET_ALREADY_PROCESSED);
        }

        ticket.setStatus("REJECTED");
        ticket.setApprovedByUser(user);
        ticket.setRejectedAt(LocalDateTime.now());
        ticket.setRejectReason(request.getRejectReason().trim());

        ReturnTicket savedTicket = returnTicketRepository.save(ticket);
        log.info("Rejected return ticket {} for invoice {} by user {}", savedTicket.getTicketNumber(), savedTicket.getOriginalInvoice().getInvoiceNumber(), currentUsername);

        // Ghi log hoạt động hệ thống
        if (activityLogHelper != null) {
            activityLogHelper.logActivityInNewTransaction(
                    user.getHousehold(),
                    user,
                    "REJECT_RETURN_TICKET",
                    "return_tickets",
                    savedTicket.getId(),
                    "PENDING",
                    "REJECTED",
                    null,
                    null
            );
        }

        return mapToResponse(savedTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public ReturnTicketResponse getReturnTicketDetail(String ticketId, String currentUsername) {
        User user = getUserByUsername(currentUsername);
        ReturnTicket ticket = returnTicketRepository.findByIdAndHouseholdId(ticketId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.RETURN_TICKET_NOT_FOUND));

        return mapToResponse(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReturnTicketResponse> getReturnTickets(
            String currentUsername,
            String status,
            LocalDate fromDate,
            LocalDate toDate,
            String search,
            int page,
            int size) {
        User user = getUserByUsername(currentUsername);
        String filterUserId = null;

        // Nếu là nhân viên bán hàng (VT-02), chỉ cho phép xem các phiếu do mình tạo
        if (user.getRole() != null && "VT-02".equals(user.getRole().getCode())) {
            filterUserId = user.getId();
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var spec = ReturnTicketSpecification.filterTickets(
                user.getHousehold().getId(),
                filterUserId,
                fromDate,
                toDate,
                status,
                search
        );

        Page<ReturnTicket> ticketPage = returnTicketRepository.findAll(spec, pageable);
        List<ReturnTicketResponse> content = ticketPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PageResponse.<ReturnTicketResponse>builder()
                .content(content)
                .pageNumber(ticketPage.getNumber())
                .pageSize(ticketPage.getSize())
                .totalElements(ticketPage.getTotalElements())
                .totalPages(ticketPage.getTotalPages())
                .last(ticketPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public ReturnTicketResponse createDecreaseAdjustmentInvoice(String ticketId, String currentUsername) {
        User user = getUserByUsername(currentUsername);
        validateOwnerOrAccountantRole(user);

        ReturnTicket ticket = returnTicketRepository.findByIdAndHouseholdId(ticketId, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.RETURN_TICKET_NOT_FOUND));

        if (!"APPROVED".equals(ticket.getStatus())) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        // Kiểm tra xem đã có hóa đơn điều chỉnh giảm cho phiếu trả hàng này chưa
        boolean alreadyAdjusted = eInvoiceRepository.findAll().stream()
                .anyMatch(inv -> inv.getReturnTicket() != null && ticketId.equals(inv.getReturnTicket().getId()));
        if (alreadyAdjusted) {
            throw new AppException(ErrorCode.ADJUSTMENT_INVOICE_ALREADY_EXISTS);
        }

        EInvoice origInvoice = ticket.getOriginalInvoice();

        // Sinh mã tra cứu hóa đơn ngẫu nhiên duy nhất
        String lookupCode;
        do {
            lookupCode = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10).toUpperCase();
        } while (eInvoiceRepository.existsByLookupCodeAndDeletedAtIsNull(lookupCode));

        List<EInvoiceItem> adjItems = new ArrayList<>();
        BigDecimal totalBeforeTax = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        if (ticket.getItems() != null) {
            for (ReturnTicketItem ticketItem : ticket.getItems()) {
                BigDecimal lineBeforeTax = ticketItem.getQuantity().multiply(ticketItem.getUnitPrice());
                totalBeforeTax = totalBeforeTax.add(lineBeforeTax);
                totalTax = totalTax.add(ticketItem.getTaxAmount() != null ? ticketItem.getTaxAmount() : BigDecimal.ZERO);

                EInvoiceItem adjItem = EInvoiceItem.builder()
                        .product(ticketItem.getProduct())
                        .productName(ticketItem.getProductName())
                        .unit(ticketItem.getUnit())
                        .quantity(ticketItem.getQuantity())
                        .unitPrice(ticketItem.getUnitPrice())
                        .taxRatePercentage(ticketItem.getTaxRatePercentage())
                        .taxAmount(ticketItem.getTaxAmount())
                        .subtotal(ticketItem.getSubtotal())
                        .build();
                adjItems.add(adjItem);
            }
        }

        BigDecimal finalAmount = totalBeforeTax.add(totalTax);

        EInvoice adjInvoice = EInvoice.builder()
                .household(user.getHousehold())
                .order(ticket.getOriginalOrder())
                .originalInvoice(origInvoice)
                .returnTicket(ticket)
                .createdByUser(user)
                .title("HÓA ĐƠN ĐIỀU CHỈNH GIẢM")
                .invoicePattern(origInvoice.getInvoicePattern())
                .invoiceSymbol(origInvoice.getInvoiceSymbol())
                .buyerName(origInvoice.getBuyerName())
                .buyerTaxCode(origInvoice.getBuyerTaxCode())
                .buyerAddress(origInvoice.getBuyerAddress())
                .buyerPhone(origInvoice.getBuyerPhone())
                .buyerEmail(origInvoice.getBuyerEmail())
                .totalAmountBeforeTax(totalBeforeTax)
                .taxAmount(totalTax)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(finalAmount)
                .status("ISSUED")
                .lookupCode(lookupCode)
                .build();

        for (EInvoiceItem item : adjItems) {
            item.setInvoice(adjInvoice);
        }
        adjInvoice.setItems(adjItems);

        eInvoiceRepository.save(adjInvoice);

        // Cập nhật trạng thái hóa đơn gốc thành ADJUSTED theo QTN-20
        origInvoice.setStatus("ADJUSTED");
        eInvoiceRepository.save(origInvoice);

        log.info("Created decrease adjustment invoice {} for return ticket {} by user {}", adjInvoice.getLookupCode(), ticket.getTicketNumber(), currentUsername);

        if (activityLogHelper != null) {
            activityLogHelper.logActivityInNewTransaction(
                    user.getHousehold(),
                    user,
                    "CREATE_ADJUSTMENT_INVOICE",
                    "e_invoices",
                    adjInvoice.getId(),
                    null,
                    "ISSUED",
                    null,
                    null
            );
        }

        return mapToResponse(ticket);
    }

    // ==================== HELPER METHODS ====================

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void validateStaffOrOwnerRole(User user) {
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }
        if (user.getRole() != null && "VT-06".equals(user.getRole().getCode())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_RETURN_ACTION);
        }
    }

    private void validateOwnerRole(User user) {
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }
        if (user.getRole() == null || !"VT-01".equals(user.getRole().getCode())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_RETURN_ACTION);
        }
    }

    private void validateOwnerOrAccountantRole(User user) {
        if (user.getHousehold() == null) {
            throw new AppException(ErrorCode.HOUSEHOLD_NOT_FOUND);
        }
        if (user.getRole() == null || "VT-06".equals(user.getRole().getCode()) || "VT-02".equals(user.getRole().getCode())) {
            throw new AppException(ErrorCode.UNAUTHORIZED_RETURN_ACTION);
        }
    }


    private Map<String, BigDecimal> getAlreadyReturnedQuantities(String invoiceId) {
        List<ReturnedQuantityProjection> projections = returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(
                invoiceId, List.of("PENDING", "APPROVED")
        );

        Map<String, BigDecimal> returnedQtyMap = new HashMap<>();
        for (ReturnedQuantityProjection proj : projections) {
            BigDecimal qty = proj.getTotalReturned() != null ? proj.getTotalReturned() : BigDecimal.ZERO;
            String key = null;
            if (proj.getInvoiceItemId() != null) {
                key = proj.getInvoiceItemId();
            } else if (proj.getProductId() != null) {
                key = proj.getProductId();
            } else if (proj.getProductName() != null) {
                key = proj.getProductName();
            }
            if (key != null) {
                returnedQtyMap.merge(key, qty, BigDecimal::add);
            }
        }
        return returnedQtyMap;
    }

    private synchronized String generateTicketNumber(String householdId) {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "PTH-" + dateStr + "-";
        Optional<String> maxTicketNum = returnTicketRepository.findMaxTicketNumberByPrefix(householdId, prefix);

        int seq = 1;
        if (maxTicketNum.isPresent()) {
            String lastNum = maxTicketNum.get();
            try {
                String seqStr = lastNum.substring(prefix.length());
                seq = Integer.parseInt(seqStr) + 1;
            } catch (Exception e) {
                seq = 1;
            }
        }
        return String.format("%s%04d", prefix, seq);
    }

    private ReturnTicketResponse mapToResponse(ReturnTicket ticket) {
        List<ReturnTicketItemResponse> itemResponses = ticket.getItems().stream()
                .map(item -> ReturnTicketItemResponse.builder()
                        .id(item.getId())
                        .invoiceItemId(item.getInvoiceItemId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .unit(item.getUnit())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxRatePercentage(item.getTaxRatePercentage())
                        .taxAmount(item.getTaxAmount())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return ReturnTicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .householdId(ticket.getHousehold().getId())
                .originalInvoiceId(ticket.getOriginalInvoice().getId())
                .originalInvoiceNumber(ticket.getOriginalInvoice().getInvoiceNumber())
                .originalOrderId(ticket.getOriginalOrder() != null ? ticket.getOriginalOrder().getId() : null)
                .customerId(ticket.getCustomer() != null ? ticket.getCustomer().getId() : null)
                .customerName(ticket.getCustomer() != null ? ticket.getCustomer().getName() : null)
                .createdByUserId(ticket.getCreatedByUser().getId())
                .createdByUserName(ticket.getCreatedByUser().getFullName())
                .approvedByUserId(ticket.getApprovedByUser() != null ? ticket.getApprovedByUser().getId() : null)
                .approvedByUserName(ticket.getApprovedByUser() != null ? ticket.getApprovedByUser().getFullName() : null)
                .totalReturnAmount(ticket.getTotalReturnAmount())
                .refundPaymentMethod(ticket.getRefundPaymentMethod())
                .status(ticket.getStatus())
                .reason(ticket.getReason())
                .rejectReason(ticket.getRejectReason())
                .approvedAt(ticket.getApprovedAt())
                .rejectedAt(ticket.getRejectedAt())
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .items(itemResponses)
                .build();
    }
}
