package com.sales.service.interfaces;

import com.sales.dto.request.*;
import com.sales.dto.response.OrderResponse;
import java.util.List;


public interface OrderService {
    OrderResponse createOrder(String currentUsername, CreateOrderRequest request);
    OrderResponse addOrderItem(String currentUsername, String orderId, CreateOrderItemRequest request);
    OrderResponse updateOrderItem(String currentUsername, String orderId, String itemId, UpdateOrderItemRequest request);
    OrderResponse deleteOrderItem(String currentUsername, String orderId, String itemId);
    OrderResponse applyDiscount(String currentUsername, String orderId, ApplyDiscountRequest request);
    OrderResponse setPaymentMethod(String currentUsername, String orderId, SetPaymentMethodRequest request);
    OrderResponse completeOrder(String currentUsername, String orderId, CompleteOrderRequest request);
    OrderResponse getOrder(String currentUsername, String orderId);
    List<OrderResponse> getOrdersHistory(String currentUsername);
    com.sales.dto.response.CalculateWeightResponse calculateWeight(String currentUsername, CalculateWeightRequest request);
    OrderResponse cancelOrder(String currentUsername, String orderId, CancelOrderRequest request);
    List<com.sales.dto.response.OrderCancelReasonDto> getCancelReasons();
    com.sales.dto.response.CanceledOrderStatisticsResponse getCanceledOrderStatistics(
            String currentUsername,
            String shiftId,
            java.time.LocalDateTime fromDate,
            java.time.LocalDateTime toDate
    );

    // NCL-03-CN-010 Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
    OrderResponse holdOrder(String currentUsername, String orderId, HoldOrderRequest request);
    OrderResponse updateOrderLabel(String currentUsername, String orderId, UpdateOrderLabelRequest request);
    OrderResponse switchDiningTable(String currentUsername, String orderId, SwitchDiningTableRequest request);
    List<com.sales.dto.response.HeldOrderSummaryResponse> getHeldOrders(String currentUsername);

    // NCL-03-CN-012 Đổi phương thức thanh toán linh hoạt
    OrderResponse switchPaymentMethod(String currentUsername, String orderId, SwitchPaymentMethodRequest request);
}


