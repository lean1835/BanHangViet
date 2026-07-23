package com.viet.sales.event;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class OrderSyncedEvent {
    private final String username;
    private final String orderId;
}
