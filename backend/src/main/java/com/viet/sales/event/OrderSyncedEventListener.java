package com.viet.sales.event;

import com.viet.sales.service.interfaces.EInvoiceService;
import com.viet.sales.dto.response.InvoiceResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class OrderSyncedEventListener {

    private final EInvoiceService eInvoiceService;

    @Async("taskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleOrderSyncedEvent(OrderSyncedEvent event) {
        log.info("Starting automatic invoice generation for order ID: {}", event.getOrderId());
        try {
            InvoiceResponse invoiceDraft = eInvoiceService.createInvoiceDraft(event.getUsername(), event.getOrderId());
            eInvoiceService.submitToTax(event.getUsername(), invoiceDraft.getId());
            log.info("Successfully issued invoice for order ID: {}", event.getOrderId());
        } catch (Exception e) {
            log.error("Failed to automatically issue electronic invoice for synced order ID: {}", event.getOrderId(), e);
        }
    }
}
