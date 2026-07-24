package com.viet.sales.event;

import com.viet.sales.entity.EInvoice;
import com.viet.sales.entity.InvoiceTemplate;
import com.viet.sales.entity.Order;
import com.viet.sales.entity.User;
import com.viet.sales.repository.EInvoiceRepository;
import com.viet.sales.repository.InvoiceTemplateRepository;
import com.viet.sales.repository.OrderRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.interfaces.EInvoiceService;
import com.viet.sales.dto.response.InvoiceResponse;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderSyncedEventListener {

    private final EInvoiceService eInvoiceService;
    private final EInvoiceRepository eInvoiceRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final InvoiceTemplateRepository invoiceTemplateRepository;

    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleOrderSyncedEvent(OrderSyncedEvent event) {
        log.info("Starting automatic invoice generation for order ID: {}", event.getOrderId());
        String invoiceDraftId = null;
        try {
            InvoiceResponse invoiceDraft = eInvoiceService.createInvoiceDraft(event.getUsername(), event.getOrderId());
            if (invoiceDraft != null) {
                invoiceDraftId = invoiceDraft.getId();
            }
            eInvoiceService.submitToTax(event.getUsername(), invoiceDraftId);
            log.info("Successfully issued invoice for order ID: {}", event.getOrderId());
        } catch (Exception e) {
            log.error("Failed to automatically issue electronic invoice for synced order ID: {}", event.getOrderId(), e);
            if (e instanceof AppException && ((AppException) e).getErrorCode() == ErrorCode.FEATURE_NOT_ENABLED) {
                return;
            }
            try {
                Optional<EInvoice> invoiceOpt = Optional.empty();
                if (invoiceDraftId != null) {
                    invoiceOpt = eInvoiceRepository.findById(invoiceDraftId);
                }
                if (invoiceOpt.isEmpty()) {
                    invoiceOpt = eInvoiceRepository.findByOrderIdAndDeletedAtIsNull(event.getOrderId());
                }

                String errorMsg = e.getMessage() != null ? e.getMessage() : e.toString();
                if (errorMsg.length() > 1000) {
                    errorMsg = errorMsg.substring(0, 1000);
                }

                if (invoiceOpt.isPresent()) {
                    EInvoice invoice = invoiceOpt.get();
                    invoice.setStatus("SEND_ERROR");
                    invoice.setTaxAuthorityResponse("Lỗi tự động phát hành HĐĐT: " + errorMsg);
                    eInvoiceRepository.save(invoice);
                    log.info("Updated status to SEND_ERROR for invoice ID: {} (Order ID: {})", invoice.getId(), event.getOrderId());
                } else {
                    Order order = orderRepository.findById(event.getOrderId()).orElse(null);
                    User user = userRepository.findByUsername(event.getUsername()).orElse(null);
                    if (order != null && user != null) {
                        String lookupCode;
                        do {
                            lookupCode = java.util.UUID.randomUUID().toString().replaceAll("-", "").substring(0, 10).toUpperCase();
                        } while (eInvoiceRepository.existsByLookupCodeAndDeletedAtIsNull(lookupCode));

                        String pattern = "1";
                        String symbol = "C26TNV";
                        if (order.getHousehold() != null) {
                            Optional<InvoiceTemplate> templateOpt = invoiceTemplateRepository.findByHouseholdId(order.getHousehold().getId());
                            if (templateOpt.isPresent()) {
                                pattern = templateOpt.get().getInvoicePattern();
                                symbol = templateOpt.get().getInvoiceSymbol();
                            }
                        }

                        EInvoice invoice = EInvoice.builder()
                                .household(order.getHousehold())
                                .order(order)
                                .createdByUser(user)
                                .invoicePattern(pattern)
                                .invoiceSymbol(symbol)
                                .buyerName(order.getCustomer() != null ? order.getCustomer().getName() : "Khách mua lẻ")
                                .buyerPhone(order.getCustomer() != null ? order.getCustomer().getPhoneNumber() : null)
                                .buyerEmail(order.getCustomer() != null ? order.getCustomer().getEmail() : null)
                                .buyerAddress(order.getCustomer() != null ? order.getCustomer().getAddress() : null)
                                .discountAmount(order.getDiscountAmount() != null ? order.getDiscountAmount() : java.math.BigDecimal.ZERO)
                                .finalAmount(order.getFinalAmount() != null ? order.getFinalAmount() : java.math.BigDecimal.ZERO)
                                .status("SEND_ERROR")
                                .lookupCode(lookupCode)
                                .taxAuthorityResponse("Lỗi tự động phát hành HĐĐT: " + errorMsg)
                                .build();

                        eInvoiceRepository.save(invoice);
                        log.info("Actively created SEND_ERROR invoice for order ID: {}", event.getOrderId());
                    }
                }
            } catch (Exception ex) {
                log.error("Failed to set error status for invoice of order ID: {}", event.getOrderId(), ex);
            }
        }
    }
}

