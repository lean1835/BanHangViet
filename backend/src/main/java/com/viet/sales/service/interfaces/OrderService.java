package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.*;
import com.viet.sales.dto.response.OrderResponse;

public interface OrderService {
    OrderResponse createOrder(String currentUsername, CreateOrderRequest request);
    OrderResponse addOrderItem(String currentUsername, String orderId, CreateOrderItemRequest request);
    OrderResponse updateOrderItem(String currentUsername, String orderId, String itemId, UpdateOrderItemRequest request);
    OrderResponse deleteOrderItem(String currentUsername, String orderId, String itemId);
    OrderResponse applyDiscount(String currentUsername, String orderId, ApplyDiscountRequest request);
    OrderResponse setPaymentMethod(String currentUsername, String orderId, OrderPaymentRequest request);
    OrderResponse completeOrder(String currentUsername, String orderId, CompleteOrderRequest request);
    OrderResponse getOrder(String currentUsername, String orderId);
}
