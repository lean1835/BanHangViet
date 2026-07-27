package com.sales.event;

import com.sales.entity.EInvoice;
import com.sales.entity.InvoiceTemplate;
import com.sales.entity.Order;
import com.sales.entity.User;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceTemplateRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.EInvoiceService;
import com.sales.dto.response.InvoiceResponse;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
                        String symbol = "1C26TAA";
                        String title = "HÓA ĐƠN GIÁ TRỊ GIA TĂNG";
                        String footerNote = null;
                        if (order.getHousehold() != null) {
                            Optional<InvoiceTemplate> templateOpt = invoiceTemplateRepository.findByHouseholdId(order.getHousehold().getId());
                            if (templateOpt.isPresent()) {
                                pattern = templateOpt.get().getInvoicePattern();
                                symbol = templateOpt.get().getInvoiceSymbol();
                                if (templateOpt.get().getTitle() != null) {
                                    title = templateOpt.get().getTitle();
                                }
                                footerNote = templateOpt.get().getFooterNote();
                            }
                        }

                        EInvoice invoice = EInvoice.builder()
                                .household(order.getHousehold())
                                .order(order)
                                .createdByUser(user)
                                .invoicePattern(pattern)
                                .invoiceSymbol(symbol)
                                .title(title)
                                .footerNote(footerNote)
                                .buyerName(order.getCustomer() != null ? order.getCustomer().getName() : "Khách mua lẻ")
                                .buyerPhone(order.getCustomer() != null ? order.getCustomer().getPhoneNumber() : null)
                                .buyerEmail(order.getCustomer() != null ? order.getCustomer().getEmail() : null)
                                .buyerAddress(order.getCustomer() != null ? order.getCustomer().getAddress() : null)
                                .discountAmount(order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO)
                                .finalAmount(order.getFinalAmount() != null ? order.getFinalAmount() : BigDecimal.ZERO)
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

