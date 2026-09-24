package com.sales.modules.order.service.impl;
import com.sales.modules.auth.entity.BusinessHouseholdSettings;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdSettingsRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.customer.entity.Customer;
import com.sales.modules.invoice.entity.EInvoice;
import com.sales.modules.invoice.entity.EInvoiceItem;
import com.sales.modules.invoice.entity.InvoiceStatusLog;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.modules.invoice.repository.InvoiceStatusLogRepository;
import com.sales.modules.order.dto.response.ExchangeEligibilityResponse;
import com.sales.modules.order.dto.response.ProductExchangeItemResponse;
import com.sales.modules.order.dto.response.ProductExchangeResponse;
import com.sales.modules.order.dto.response.ReturnedQuantityProjection;
import com.sales.modules.order.entity.Order;
import com.sales.modules.order.entity.ProductExchangeItem;
import com.sales.modules.order.entity.ProductExchangeTicket;
import com.sales.modules.order.repository.ProductExchangeItemRepository;
import com.sales.modules.order.repository.ProductExchangeTicketRepository;
import com.sales.modules.order.repository.ReturnTicketItemRepository;
import com.sales.modules.order.repository.ReturnTicketRepository;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.order.dto.request.CheckExchangeEligibilityRequest;
import com.sales.modules.order.dto.request.CreateProductExchangeRequest;
import com.sales.modules.order.dto.request.ExchangeNewItemRequest;
import com.sales.modules.order.dto.request.ExchangeReturnItemRequest;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.order.service.ProductExchangeService;
import com.sales.modules.order.specification.ProductExchangeSpecification;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
public class ProductExchangeServiceImpl implements ProductExchangeService {

    @Value("${app.return-ticket.max-days:7}")
    private int maxReturnDays = 7;

    private final ProductExchangeTicketRepository productExchangeTicketRepository;
    private final ProductExchangeItemRepository productExchangeItemRepository;
    private final ReturnTicketRepository returnTicketRepository;
    private final ReturnTicketItemRepository returnTicketItemRepository;
    private final EInvoiceRepository eInvoiceRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final InvoiceStatusLogRepository invoiceStatusLogRepository;
    private final ActivityLogHelper activityLogHelper;
    private final BusinessHouseholdSettingsRepository settingsRepository;
    private final com.sales.modules.invoice.service.InvoiceNumberRangeService invoiceNumberRangeService;

    private int resolveMaxReturnDays(String householdId) {
        if (householdId == null || settingsRepository == null) {
            return maxReturnDays;
        }
        return settingsRepository.findByHouseholdId(householdId)
                .map(BusinessHouseholdSettings::getReturnDaysLimit)
                .filter(limit -> limit != null && limit > 0)
                .orElse(maxReturnDays);
    }

    @Override
    @Transactional(readOnly = true)
    public ExchangeEligibilityResponse checkEligibility(CheckExchangeEligibilityRequest request, String currentUsername) {
        User user = getUserByUsername(currentUsername);
        validateStaffOrOwnerRole(user);

        EInvoice invoice;
        try {
            invoice = getEligibleInvoice(request.getOriginalInvoiceId(), user.getHousehold().getId());
        } catch (AppException e) {
            return ExchangeEligibilityResponse.builder()
                    .isEligible(false)
                    .exchangeType("INELIGIBLE")
                    .totalReturnAmount(BigDecimal.ZERO)
                    .totalExchangeAmount(BigDecimal.ZERO)
                    .differenceAmount(BigDecimal.ZERO)
                    .requireNewInvoice(false)
                    .redirectToReturnFlow(false)
                    .message(e.getMessage())
                    .build();
        }

        // Validate items and calculate amounts
        ExchangeCalculationResult calculation = calculateExchange(
                invoice,
                request.getReturnItems(),
                request.getExchangeItems(),
                user.getHousehold().getId()
        );

        BigDecimal diff = calculation.getDifferenceAmount();
        String exchangeType;
        boolean isEligible;
        boolean requireNewInvoice = false;
        boolean redirectToReturnFlow = false;
        BigDecimal suggestedRefund = null;
        String message;

        if (diff.compareTo(BigDecimal.ZERO) == 0) {
            exchangeType = "EQUAL_VALUE";
            isEligible = true;
            message = "Hợp lệ để thực hiện đổi hàng ngang giá (không phát sinh hóa đơn điều chỉnh)";
        } else if (diff.compareTo(BigDecimal.ZERO) > 0) {
            exchangeType = "HIGHER_VALUE";
            isEligible = true;
            requireNewInvoice = true;
            message = "Món đổi sang có giá trị cao hơn. Khách hàng cần thanh toán thêm phần chênh lệch và hệ thống sẽ xuất hóa đơn mới";
        } else {
            exchangeType = "LOWER_VALUE";
            isEligible = false;
            redirectToReturnFlow = true;
            suggestedRefund = diff.abs();
            message = "Món đổi sang có giá trị thấp hơn. Vui lòng chuyển sang luồng Trả hàng để được hoàn tiền theo quy định";
        }

        return ExchangeEligibilityResponse.builder()
                .isEligible(isEligible)
                .exchangeType(exchangeType)
                .totalReturnAmount(calculation.getTotalReturnAmount())
                .totalExchangeAmount(calculation.getTotalExchangeAmount())
                .differenceAmount(diff)
                .requireNewInvoice(requireNewInvoice)
                .redirectToReturnFlow(redirectToReturnFlow)
                .suggestedRefundAmount(suggestedRefund)
                .message(message)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ProductExchangeResponse createProductExchange(CreateProductExchangeRequest request, String currentUsername) {
        User user = getUserByUsername(currentUsername);
        validateStaffOrOwnerRole(user);

        EInvoice invoice = getEligibleInvoice(request.getOriginalInvoiceId(), user.getHousehold().getId());

        if (request.getReturnItems() == null || request.getReturnItems().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_EXCHANGE_RETURN_ITEMS);
        }
        if (request.getExchangeItems() == null || request.getExchangeItems().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_EXCHANGE_NEW_ITEMS);
        }

        ExchangeCalculationResult calculation = calculateExchange(
                invoice,
                request.getReturnItems(),
                request.getExchangeItems(),
                user.getHousehold().getId()
        );

        BigDecimal diff = calculation.getDifferenceAmount();
        String exchangeType;
        EInvoice additionalInvoice = null;

        if (diff.compareTo(BigDecimal.ZERO) < 0) {
            // NCL-11-CN-005-TC-03: Món đổi sang rẻ hơn -> Chuyển sang luồng trả hàng
            throw new AppException(ErrorCode.EXCHANGE_LOWER_VALUE_REDIRECT);
        } else if (diff.compareTo(BigDecimal.ZERO) > 0) {
            // NCL-11-CN-005-TC-02: Món đổi sang đắt hơn -> Thu thêm phần chênh và lập hóa đơn mới
            exchangeType = "HIGHER_VALUE";
            if (request.getExtraPaymentMethod() == null || request.getExtraPaymentMethod().isBlank()) {
                throw new AppException(ErrorCode.EXTRA_PAYMENT_REQUIRED);
            }
            additionalInvoice = createAdditionalInvoiceForDifference(invoice, diff, request.getExtraPaymentMethod(), user, calculation);
        } else {
            // NCL-11-CN-005-TC-01: Ngang giá
            exchangeType = "EQUAL_VALUE";
        }

        String ticketNumber = generateTicketNumber(user.getHousehold().getId());
        Order originalOrder = invoice.getOrder();
        Customer customer = originalOrder != null ? originalOrder.getCustomer() : null;

        ProductExchangeTicket ticket = ProductExchangeTicket.builder()
                .household(user.getHousehold())
                .originalInvoice(invoice)
                .originalOrder(originalOrder)
                .customer(customer)
                .ticketNumber(ticketNumber)
                .createdByUser(user)
                .exchangeType(exchangeType)
                .totalReturnAmount(calculation.getTotalReturnAmount())
                .totalExchangeAmount(calculation.getTotalExchangeAmount())
                .differenceAmount(diff)
                .extraPaymentMethod(request.getExtraPaymentMethod())
                .additionalInvoice(additionalInvoice)
                .status("COMPLETED")
                .reason(request.getReason())
                .notes(request.getNotes())
                .build();

        List<ProductExchangeItem> exchangeItemsList = new ArrayList<>();
        Map<String, Product> productsToUpdate = new HashMap<>();

        // 1. Cập nhật các món trả lại (RETURN_ITEM) -> Hoàn lại tồn kho món cũ
        for (ExchangeCalculationResult.ReturnItemDetail retDetail : calculation.getReturnItemDetails()) {
            ProductExchangeItem item = ProductExchangeItem.builder()
                    .exchangeTicket(ticket)
                    .itemType("RETURN_ITEM")
                    .product(retDetail.getProduct())
                    .invoiceItemId(retDetail.getInvoiceItemId())
                    .productName(retDetail.getProductName())
                    .unit(retDetail.getUnit())
                    .quantity(retDetail.getQuantity())
                    .unitPrice(retDetail.getUnitPrice())
                    .taxRatePercentage(retDetail.getTaxRatePercentage())
                    .taxAmount(retDetail.getTaxAmount())
                    .subtotal(retDetail.getSubtotal())
                    .build();
            exchangeItemsList.add(item);

            // Hoàn tồn kho sản phẩm cũ
            Product p = retDetail.getProduct();
            p.setStockQuantity(p.getStockQuantity().add(retDetail.getQuantity()));
            productsToUpdate.put(p.getId(), p);
        }

        // 2. Cập nhật các món đổi sang (EXCHANGE_ITEM) -> Trừ tồn kho món mới
        for (ExchangeCalculationResult.NewItemDetail newDetail : calculation.getNewItemDetails()) {
            ProductExchangeItem item = ProductExchangeItem.builder()
                    .exchangeTicket(ticket)
                    .itemType("EXCHANGE_ITEM")
                    .product(newDetail.getProduct())
                    .productName(newDetail.getProductName())
                    .unit(newDetail.getUnit())
                    .quantity(newDetail.getQuantity())
                    .unitPrice(newDetail.getUnitPrice())
                    .taxRatePercentage(newDetail.getTaxRatePercentage())
                    .taxAmount(newDetail.getTaxAmount())
                    .subtotal(newDetail.getSubtotal())
                    .build();
            exchangeItemsList.add(item);

            // Trừ tồn kho sản phẩm mới
            Product p = newDetail.getProduct();
            p.setStockQuantity(p.getStockQuantity().subtract(newDetail.getQuantity()));
            productsToUpdate.put(p.getId(), p);
        }

        if (!productsToUpdate.isEmpty()) {
            productRepository.saveAll(productsToUpdate.values());
        }

        ticket.setItems(exchangeItemsList);
        ProductExchangeTicket savedTicket = productExchangeTicketRepository.save(ticket);

        // Ghi log trạng thái hóa đơn gốc
        if (invoiceStatusLogRepository != null) {
            invoiceStatusLogRepository.save(InvoiceStatusLog.builder()
                    .invoice(invoice)
                    .fromStatus(invoice.getStatus())
                    .toStatus(invoice.getStatus())
                    .changedByUser(user)
                    .notes("Đổi hàng thành công theo phiếu số " + ticketNumber + " (Loại: " + exchangeType + ")")
                    .build());
        }

        // Ghi activity log
        if (activityLogHelper != null) {
            try {
                activityLogHelper.logActivityInNewTransaction(
                        user.getHousehold(),
                        user,
                        "CREATE_PRODUCT_EXCHANGE",
                        "product_exchange_tickets",
                        savedTicket.getId(),
                        null,
                        savedTicket.getTicketNumber(),
                        null,
                        null
                );
            } catch (Exception e) {
                log.error("Lỗi khi ghi activity log cho createProductExchange", e);
            }
        }

        log.info("Created product exchange ticket {} for invoice {} by user {}",
                savedTicket.getTicketNumber(), invoice.getInvoiceNumber(), currentUsername);

        return mapToResponse(savedTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductExchangeResponse getExchangeTicketById(String id, String currentUsername) {
        User user = getUserByUsername(currentUsername);
        ProductExchangeTicket ticket = productExchangeTicketRepository.findByIdAndHouseholdId(id, user.getHousehold().getId())
                .orElseThrow(() -> new AppException(ErrorCode.EXCHANGE_TICKET_NOT_FOUND));

        return mapToResponse(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductExchangeResponse> getExchangeTickets(
            String invoiceId,
            String exchangeType,
            String status,
            Pageable pageable,
            String currentUsername) {
        User user = getUserByUsername(currentUsername);

        Specification<ProductExchangeTicket> spec = ProductExchangeSpecification.filterTickets(
                user.getHousehold().getId(),
                invoiceId,
                exchangeType,
                status,
                null,
                null,
                null
        );

        return productExchangeTicketRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    // =========================================================================
    // HELPER METHODS & VALIDATIONS
    // =========================================================================

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void validateStaffOrOwnerRole(User user) {
        if (user.getRole() == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        String roleCode = user.getRole().getCode();
        if (!"VT-01".equals(roleCode) && !"VT-02".equals(roleCode)) {
            throw new AppException(ErrorCode.UNAUTHORIZED_RETURN_ACTION);
        }
    }

    private EInvoice getEligibleInvoice(String invoiceId, String householdId) {
        EInvoice invoice = eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(invoiceId, householdId)
                .orElseThrow(() -> new AppException(ErrorCode.INVOICE_NOT_FOUND));

        if (!"ISSUED".equals(invoice.getStatus()) && !"ADJUSTED".equals(invoice.getStatus())) {
            throw new AppException(ErrorCode.INVOICE_NOT_ELIGIBLE_FOR_EXCHANGE);
        }

        // 1. Không cho phép đổi trên hóa đơn con / bổ sung / điều chỉnh từ đổi trả
        if (invoice.getOriginalInvoice() != null || invoice.getReturnTicket() != null
                || (invoice.getTitle() != null && (invoice.getTitle().toUpperCase().contains("ĐỔI HÀNG") || invoice.getTitle().toUpperCase().contains("ĐIỀU CHỈNH")))
                || productExchangeTicketRepository.findByAdditionalInvoiceId(invoice.getId()).isPresent()) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_EXCHANGED_OR_RETURNED);
        }

        // 2. Không cho phép đổi nếu hóa đơn gốc đã từng thực hiện đổi hàng
        boolean alreadyExchanged = productExchangeTicketRepository.existsByOriginalInvoiceIdAndStatusIn(
                invoice.getId(), List.of("COMPLETED", "PENDING")
        );
        if (!alreadyExchanged && invoice.getOrder() != null) {
            alreadyExchanged = productExchangeTicketRepository.existsByOriginalOrderIdAndStatusIn(
                    invoice.getOrder().getId(), List.of("COMPLETED", "PENDING")
            );
        }
        if (alreadyExchanged) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_EXCHANGED_OR_RETURNED);
        }

        // 3. Không cho phép đổi nếu hóa đơn gốc đã từng thực hiện trả hàng
        boolean alreadyReturned = returnTicketRepository.existsByOriginalInvoiceIdAndStatusIn(
                invoice.getId(), List.of("PENDING", "APPROVED")
        );
        if (!alreadyReturned && invoice.getOrder() != null) {
            alreadyReturned = returnTicketRepository.existsByOriginalOrderIdAndStatusIn(
                    invoice.getOrder().getId(), List.of("PENDING", "APPROVED")
            );
        }
        if (alreadyReturned) {
            throw new AppException(ErrorCode.INVOICE_ALREADY_EXCHANGED_OR_RETURNED);
        }

        int allowedDays = resolveMaxReturnDays(householdId);
        LocalDateTime issueTime = invoice.getCreatedAt();
        long daysSinceIssued = ChronoUnit.DAYS.between(issueTime, LocalDateTime.now());
        if (daysSinceIssued > allowedDays) {
            throw new AppException(ErrorCode.EXCHANGE_PERIOD_EXPIRED);
        }

        return invoice;
    }

    private ExchangeCalculationResult calculateExchange(
            EInvoice invoice,
            List<ExchangeReturnItemRequest> returnItemRequests,
            List<ExchangeNewItemRequest> exchangeItemRequests,
            String householdId) {

        // Validate duplicate products in return items (P1-3 / QTN-19)
        if (returnItemRequests != null) {
            Set<String> seenReturnProductIds = new HashSet<>();
            for (ExchangeReturnItemRequest req : returnItemRequests) {
                if (req.getProductId() != null && !seenReturnProductIds.add(req.getProductId())) {
                    throw new AppException(ErrorCode.DUPLICATE_EXCHANGE_ITEM);
                }
            }
        }

        // Validate duplicate products in exchange new items
        if (exchangeItemRequests != null) {
            Set<String> seenExchangeProductIds = new HashSet<>();
            for (ExchangeNewItemRequest req : exchangeItemRequests) {
                if (req.getProductId() != null && !seenExchangeProductIds.add(req.getProductId())) {
                    throw new AppException(ErrorCode.DUPLICATE_EXCHANGE_ITEM);
                }
            }
        }

        // Batch pre-fetch products for return items (P1-2: Eliminate N+1 query)
        Set<String> returnProductIds = returnItemRequests != null
                ? returnItemRequests.stream().map(ExchangeReturnItemRequest::getProductId).filter(Objects::nonNull).collect(Collectors.toSet())
                : Collections.emptySet();
        Map<String, Product> returnProductMap = new HashMap<>();
        if (!returnProductIds.isEmpty()) {
            List<Product> products = productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(returnProductIds, householdId);
            if (products != null) {
                for (Product p : products) {
                    returnProductMap.put(p.getId(), p);
                }
            }
            for (String pid : returnProductIds) {
                if (!returnProductMap.containsKey(pid)) {
                    productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(pid, householdId)
                            .ifPresent(p -> returnProductMap.put(p.getId(), p));
                }
            }
        }

        // 1. Tính toán cho các món trả lại
        BigDecimal totalReturnAmount = BigDecimal.ZERO;
        List<ExchangeCalculationResult.ReturnItemDetail> returnDetails = new ArrayList<>();

        // Map đã trả qua phiếu trả hàng
        List<ReturnedQuantityProjection> returnProjections = returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(
                invoice.getId(), List.of("PENDING", "APPROVED")
        );
        Map<String, BigDecimal> alreadyReturnedMap = new HashMap<>();
        for (ReturnedQuantityProjection p : returnProjections) {
            if (p.getProductId() != null) {
                alreadyReturnedMap.merge(p.getProductId(), p.getTotalReturned(), BigDecimal::add);
            }
        }

        // Map đã đổi qua phiếu đổi hàng (Batch pre-fetch để loại bỏ N+1 query - P2-1)
        Map<String, BigDecimal> prevExchangedMap = new HashMap<>();
        try {
            List<Object[]> exchangedList = productExchangeItemRepository.sumReturnedQuantitiesByInvoiceGroupByProduct(invoice.getId());
            if (exchangedList != null) {
                for (Object[] row : exchangedList) {
                    if (row != null && row.length >= 2 && row[0] != null && row[1] != null) {
                        prevExchangedMap.put((String) row[0], (BigDecimal) row[1]);
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Fallback to single queries for exchanged quantities: {}", e.getMessage());
        }

        for (ExchangeReturnItemRequest req : returnItemRequests) {
            Product product = returnProductMap.get(req.getProductId());
            if (product == null) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }

            // Tìm dòng trong hóa đơn gốc
            EInvoiceItem matchingInvoiceItem = null;
            if (req.getInvoiceItemId() != null) {
                matchingInvoiceItem = invoice.getItems().stream()
                        .filter(i -> req.getInvoiceItemId().equals(i.getId()))
                        .findFirst()
                        .orElse(null);
            }
            if (matchingInvoiceItem == null) {
                matchingInvoiceItem = invoice.getItems().stream()
                        .filter(i -> i.getProduct() != null && product.getId().equals(i.getProduct().getId()))
                        .findFirst()
                        .orElse(null);
            }

            if (matchingInvoiceItem == null) {
                throw new AppException(ErrorCode.INVOICE_NOT_ELIGIBLE_FOR_EXCHANGE);
            }

            // P2-2: Tính tổng số lượng đã bán của sản phẩm trên toàn hóa đơn gốc để xử lý đúng trường hợp HĐ có nhiều dòng cùng 1 SP
            BigDecimal totalSoldQuantity = invoice.getItems().stream()
                    .filter(it -> it.getProduct() != null && product.getId().equals(it.getProduct().getId()))
                    .map(EInvoiceItem::getQuantity)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal prevReturnedFromReturnTickets = alreadyReturnedMap.getOrDefault(product.getId(), BigDecimal.ZERO);
            BigDecimal prevReturnedFromExchanges = prevExchangedMap.get(product.getId());
            if (prevReturnedFromExchanges == null) {
                prevReturnedFromExchanges = productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct(invoice.getId(), product.getId());
                if (prevReturnedFromExchanges == null) {
                    prevReturnedFromExchanges = BigDecimal.ZERO;
                }
            }

            BigDecimal totalPrevReturned = prevReturnedFromReturnTickets.add(prevReturnedFromExchanges);
            BigDecimal returnableQty = totalSoldQuantity.subtract(totalPrevReturned);

            if (req.getQuantity().compareTo(returnableQty) > 0) {
                throw new AppException(ErrorCode.EXCEEDED_EXCHANGE_RETURNABLE_QUANTITY);
            }

            BigDecimal unitPrice = matchingInvoiceItem.getUnitPrice();
            BigDecimal subtotal = unitPrice.multiply(req.getQuantity()).setScale(2, RoundingMode.HALF_UP);
            totalReturnAmount = totalReturnAmount.add(subtotal);

            BigDecimal taxRate = matchingInvoiceItem.getTaxRatePercentage() != null
                    ? matchingInvoiceItem.getTaxRatePercentage()
                    : (product.getTaxRate() != null && product.getTaxRate().getRatePercentage() != null
                            ? product.getTaxRate().getRatePercentage()
                            : BigDecimal.ZERO);
            BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            returnDetails.add(ExchangeCalculationResult.ReturnItemDetail.builder()
                    .product(product)
                    .invoiceItemId(matchingInvoiceItem.getId())
                    .productName(matchingInvoiceItem.getProductName())
                    .unit(matchingInvoiceItem.getUnit())
                    .quantity(req.getQuantity())
                    .unitPrice(unitPrice)
                    .taxRatePercentage(taxRate)
                    .taxAmount(taxAmount)
                    .subtotal(subtotal)
                    .build());
        }

        // 2. Tính toán cho các món nhận đổi sang
        BigDecimal totalExchangeAmount = BigDecimal.ZERO;
        List<ExchangeCalculationResult.NewItemDetail> newDetails = new ArrayList<>();

        // Batch pre-fetch products for exchange items (P1-2: Eliminate N+1 query)
        Set<String> exchangeProductIds = exchangeItemRequests != null
                ? exchangeItemRequests.stream().map(ExchangeNewItemRequest::getProductId).filter(Objects::nonNull).collect(Collectors.toSet())
                : Collections.emptySet();
        Map<String, Product> exchangeProductMap = new HashMap<>();
        if (!exchangeProductIds.isEmpty()) {
            List<Product> products = productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(exchangeProductIds, householdId);
            if (products != null) {
                for (Product p : products) {
                    exchangeProductMap.put(p.getId(), p);
                }
            }
            for (String pid : exchangeProductIds) {
                if (!exchangeProductMap.containsKey(pid)) {
                    productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(pid, householdId)
                            .ifPresent(p -> exchangeProductMap.put(p.getId(), p));
                }
            }
        }

        for (ExchangeNewItemRequest req : exchangeItemRequests) {
            Product product = exchangeProductMap.get(req.getProductId());
            if (product == null) {
                throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
            }

            if (product.getStockQuantity() == null || product.getStockQuantity().compareTo(req.getQuantity()) < 0) {
                throw new AppException(ErrorCode.INSUFFICIENT_STOCK_FOR_EXCHANGE);
            }

            BigDecimal unitPrice = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
            BigDecimal subtotal = unitPrice.multiply(req.getQuantity()).setScale(2, RoundingMode.HALF_UP);
            totalExchangeAmount = totalExchangeAmount.add(subtotal);

            BigDecimal taxRate = (product.getTaxRate() != null && product.getTaxRate().getRatePercentage() != null)
                    ? product.getTaxRate().getRatePercentage()
                    : BigDecimal.ZERO;
            BigDecimal taxAmount = subtotal.multiply(taxRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            newDetails.add(ExchangeCalculationResult.NewItemDetail.builder()
                    .product(product)
                    .productName(product.getName())
                    .unit(product.getUnit())
                    .quantity(req.getQuantity())
                    .unitPrice(unitPrice)
                    .taxRatePercentage(taxRate)
                    .taxAmount(taxAmount)
                    .subtotal(subtotal)
                    .build());
        }

        BigDecimal differenceAmount = totalExchangeAmount.subtract(totalReturnAmount);

        return ExchangeCalculationResult.builder()
                .totalReturnAmount(totalReturnAmount)
                .totalExchangeAmount(totalExchangeAmount)
                .differenceAmount(differenceAmount)
                .returnItemDetails(returnDetails)
                .newItemDetails(newDetails)
                .build();
    }

    private EInvoice createAdditionalInvoiceForDifference(
            EInvoice origInvoice,
            BigDecimal differenceAmount,
            String paymentMethod,
            User user,
            ExchangeCalculationResult calculation) {

        String lookupCode;
        do {
            lookupCode = UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10).toUpperCase();
        } while (eInvoiceRepository.existsByLookupCodeAndDeletedAtIsNull(lookupCode));

        String householdId = user.getHousehold().getId();
        String pattern = origInvoice.getInvoicePattern() != null ? origInvoice.getInvoicePattern() : "1";
        String symbol = origInvoice.getInvoiceSymbol() != null ? origInvoice.getInvoiceSymbol() : "1C26TAA";
        String invoiceNum = null;

        if (invoiceNumberRangeService != null) {
            try {
                invoiceNum = invoiceNumberRangeService.allocateNextInvoiceNumber(householdId, pattern, symbol);
            } catch (AppException e) {
                if (ErrorCode.INVOICE_RANGE_EXHAUSTED.equals(e.getErrorCode())) {
                    throw e;
                }
                invoiceNum = fallbackNextInvoiceNumber(householdId, pattern, symbol);
            }
        } else {
            invoiceNum = fallbackNextInvoiceNumber(householdId, pattern, symbol);
        }

        String taxAuthCode = "CQT-" + UUID.randomUUID().toString().substring(0, 15).toUpperCase();

        List<ExchangeCalculationResult.NewItemDetail> newItemDetails = calculation != null ? calculation.getNewItemDetails() : Collections.emptyList();
        List<ExchangeCalculationResult.ReturnItemDetail> returnItemDetails = calculation != null ? calculation.getReturnItemDetails() : Collections.emptyList();

        BigDecimal totalReturnAmount = calculation != null && calculation.getTotalReturnAmount() != null
                ? calculation.getTotalReturnAmount()
                : BigDecimal.ZERO;

        BigDecimal newTax = BigDecimal.ZERO;
        if (newItemDetails != null) {
            for (ExchangeCalculationResult.NewItemDetail itemDetail : newItemDetails) {
                if (itemDetail.getTaxAmount() != null) {
                    newTax = newTax.add(itemDetail.getTaxAmount());
                }
            }
        }

        BigDecimal returnTax = BigDecimal.ZERO;
        if (returnItemDetails != null) {
            for (ExchangeCalculationResult.ReturnItemDetail retDetail : returnItemDetails) {
                if (retDetail.getTaxAmount() != null) {
                    returnTax = returnTax.add(retDetail.getTaxAmount());
                }
            }
        }

        BigDecimal totalTax = newTax.subtract(returnTax);
        BigDecimal finalAmount = differenceAmount.add(totalTax);

        EInvoice additionalInvoice = EInvoice.builder()
                .household(user.getHousehold())
                .order(origInvoice.getOrder())
                .originalInvoice(origInvoice)
                .createdByUser(user)
                .invoiceNumber(invoiceNum)
                .invoicePattern(pattern)
                .invoiceSymbol(symbol)
                .title("HÓA ĐƠN BÁN HÀNG BỔ SUNG ĐỔI HÀNG")
                .buyerName(origInvoice.getBuyerName())
                .buyerTaxCode(origInvoice.getBuyerTaxCode())
                .buyerAddress(origInvoice.getBuyerAddress())
                .buyerPhone(origInvoice.getBuyerPhone())
                .buyerEmail(origInvoice.getBuyerEmail())
                .paymentMethod(paymentMethod)
                .totalAmountBeforeTax(differenceAmount)
                .taxAmount(totalTax)
                .finalAmount(finalAmount)
                .status("ISSUED")
                .taxAuthorityCode(taxAuthCode)
                .lookupCode(lookupCode)
                .sentToTaxAt(LocalDateTime.now())
                .taxResponseAt(LocalDateTime.now())
                .footerNote(null)
                .build();

        List<EInvoiceItem> items = new ArrayList<>();
        if (newItemDetails != null) {
            for (ExchangeCalculationResult.NewItemDetail newDetail : newItemDetails) {
                EInvoiceItem item = EInvoiceItem.builder()
                        .invoice(additionalInvoice)
                        .product(newDetail.getProduct())
                        .productName(newDetail.getProductName())
                        .unit(newDetail.getUnit())
                        .quantity(newDetail.getQuantity())
                        .unitPrice(newDetail.getUnitPrice())
                        .taxRatePercentage(newDetail.getTaxRatePercentage() != null ? newDetail.getTaxRatePercentage() : BigDecimal.ZERO)
                        .taxAmount(newDetail.getTaxAmount() != null ? newDetail.getTaxAmount() : BigDecimal.ZERO)
                        .subtotal(newDetail.getSubtotal())
                        .build();
                items.add(item);
            }
        }

        if (returnItemDetails != null && !returnItemDetails.isEmpty()) {
            for (ExchangeCalculationResult.ReturnItemDetail retDetail : returnItemDetails) {
                BigDecimal retTaxRate = retDetail.getTaxRatePercentage() != null ? retDetail.getTaxRatePercentage() : BigDecimal.ZERO;
                BigDecimal retTaxAmount = retDetail.getTaxAmount() != null ? retDetail.getTaxAmount().negate() : BigDecimal.ZERO;

                EInvoiceItem deductionItem = EInvoiceItem.builder()
                        .invoice(additionalInvoice)
                        .product(retDetail.getProduct())
                        .productName("Đổi trả: " + retDetail.getProductName())
                        .unit(retDetail.getUnit() != null ? retDetail.getUnit() : "Lần")
                        .quantity(retDetail.getQuantity() != null ? retDetail.getQuantity() : BigDecimal.ONE)
                        .unitPrice(retDetail.getUnitPrice() != null ? retDetail.getUnitPrice().negate() : BigDecimal.ZERO)
                        .discountAmount(BigDecimal.ZERO)
                        .taxRatePercentage(retTaxRate)
                        .taxAmount(retTaxAmount)
                        .subtotal(retDetail.getSubtotal() != null ? retDetail.getSubtotal().negate() : BigDecimal.ZERO)
                        .build();
                items.add(deductionItem);
            }
        } else if (totalReturnAmount.compareTo(BigDecimal.ZERO) > 0) {
            EInvoiceItem deductionItem = EInvoiceItem.builder()
                    .invoice(additionalInvoice)
                    .productName("Hàng đổi trả")
                    .unit("Lần")
                    .quantity(BigDecimal.ONE)
                    .unitPrice(totalReturnAmount.negate())
                    .discountAmount(BigDecimal.ZERO)
                    .taxRatePercentage(BigDecimal.ZERO)
                    .taxAmount(BigDecimal.ZERO)
                    .subtotal(totalReturnAmount.negate())
                    .build();
            items.add(deductionItem);
        }

        additionalInvoice.setItems(items);

        return eInvoiceRepository.save(additionalInvoice);
    }

    private String fallbackNextInvoiceNumber(String householdId, String pattern, String symbol) {
        Optional<String> maxNumOpt = eInvoiceRepository.findMaxInvoiceNumber(householdId, pattern, symbol);
        int nextNum = 1;
        int length = 7;
        if (maxNumOpt.isPresent() && maxNumOpt.get() != null) {
            String maxNumStr = maxNumOpt.get();
            length = Math.max(maxNumStr.length(), 7);
            try {
                nextNum = Integer.parseInt(maxNumStr) + 1;
            } catch (NumberFormatException e) {
                nextNum = 1;
            }
        }
        return String.format("%0" + length + "d", nextNum);
    }

    private synchronized String generateTicketNumber(String householdId) {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String prefix = "DX-" + dateStr + "-";
        Optional<String> maxTicketNum = productExchangeTicketRepository.findMaxTicketNumberByPrefix(householdId, prefix);

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

    private ProductExchangeResponse mapToResponse(ProductExchangeTicket ticket) {
        List<ProductExchangeItemResponse> itemResponses = ticket.getItems().stream()
                .map(item -> ProductExchangeItemResponse.builder()
                        .id(item.getId())
                        .itemType(item.getItemType())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .invoiceItemId(item.getInvoiceItemId())
                        .productName(item.getProductName())
                        .unit(item.getUnit())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .taxRatePercentage(item.getTaxRatePercentage())
                        .taxAmount(item.getTaxAmount())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return ProductExchangeResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .originalInvoiceId(ticket.getOriginalInvoice().getId())
                .originalInvoiceNumber(ticket.getOriginalInvoice().getInvoiceNumber())
                .originalOrderId(ticket.getOriginalOrder() != null ? ticket.getOriginalOrder().getId() : null)
                .customerId(ticket.getCustomer() != null ? ticket.getCustomer().getId() : null)
                .customerName(ticket.getCustomer() != null ? ticket.getCustomer().getName() : null)
                .createdById(ticket.getCreatedByUser().getId())
                .createdByName(ticket.getCreatedByUser().getFullName())
                .exchangeType(ticket.getExchangeType())
                .totalReturnAmount(ticket.getTotalReturnAmount())
                .totalExchangeAmount(ticket.getTotalExchangeAmount())
                .differenceAmount(ticket.getDifferenceAmount())
                .extraPaymentMethod(ticket.getExtraPaymentMethod())
                .additionalInvoiceId(ticket.getAdditionalInvoice() != null ? ticket.getAdditionalInvoice().getId() : null)
                .additionalInvoiceNumber(ticket.getAdditionalInvoice() != null ? ticket.getAdditionalInvoice().getInvoiceNumber() : null)
                .status(ticket.getStatus())
                .reason(ticket.getReason())
                .notes(ticket.getNotes())
                .createdAt(ticket.getCreatedAt())
                .items(itemResponses)
                .build();
    }

    // Inner calculation helper class
    @lombok.Data
    @lombok.Builder
    private static class ExchangeCalculationResult {
        private BigDecimal totalReturnAmount;
        private BigDecimal totalExchangeAmount;
        private BigDecimal differenceAmount;
        private List<ReturnItemDetail> returnItemDetails;
        private List<NewItemDetail> newItemDetails;

        @lombok.Data
        @lombok.Builder
        static class ReturnItemDetail {
            private Product product;
            private String invoiceItemId;
            private String productName;
            private String unit;
            private BigDecimal quantity;
            private BigDecimal unitPrice;
            private BigDecimal taxRatePercentage;
            private BigDecimal taxAmount;
            private BigDecimal subtotal;
        }

        @lombok.Data
        @lombok.Builder
        static class NewItemDetail {
            private Product product;
            private String productName;
            private String unit;
            private BigDecimal quantity;
            private BigDecimal unitPrice;
            private BigDecimal taxRatePercentage;
            private BigDecimal taxAmount;
            private BigDecimal subtotal;
        }
    }
}
