package com.viet.sales.event;

import com.viet.sales.entity.EInvoice;
import com.viet.sales.repository.EInvoiceRepository;
import com.viet.sales.service.interfaces.EInvoiceService;
import com.viet.sales.dto.response.InvoiceResponse;
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
            try {
                Optional<EInvoice> invoiceOpt = Optional.empty();
                if (invoiceDraftId != null) {
                    invoiceOpt = eInvoiceRepository.findById(invoiceDraftId);
                }
                if (invoiceOpt.isEmpty()) {
                    invoiceOpt = eInvoiceRepository.findByOrderIdAndDeletedAtIsNull(event.getOrderId());
                }

                if (invoiceOpt.isPresent()) {
                    EInvoice invoice = invoiceOpt.get();
                    invoice.setStatus("SEND_ERROR");
                    String errorMsg = e.getMessage() != null ? e.getMessage() : e.toString();
                    if (errorMsg.length() > 1000) {
                        errorMsg = errorMsg.substring(0, 1000);
                    }
                    invoice.setTaxAuthorityResponse("Lỗi tự động phát hành HĐĐT: " + errorMsg);
                    eInvoiceRepository.save(invoice);
                    log.info("Updated status to SEND_ERROR for invoice ID: {} (Order ID: {})", invoice.getId(), event.getOrderId());
                }
            } catch (Exception ex) {
                log.error("Failed to set error status for invoice of order ID: {}", event.getOrderId(), ex);
            }
        }
    }
}

