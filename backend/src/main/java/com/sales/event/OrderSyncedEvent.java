package com.sales.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@AllArgsConstructor
public class OrderSyncedEvent {
    private final String username;
    private final String orderId;
    private final boolean isInvoiceIssuedOffline;

    public OrderSyncedEvent(String username, String orderId) {
        this.username = username;
        this.orderId = orderId;
        this.isInvoiceIssuedOffline = false;
    }
}
