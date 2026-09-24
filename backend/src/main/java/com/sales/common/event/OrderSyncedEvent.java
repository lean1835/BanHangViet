package com.sales.common.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

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
