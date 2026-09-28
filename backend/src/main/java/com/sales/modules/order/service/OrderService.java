package com.sales.modules.order.service;
import com.sales.modules.order.dto.request.ApplyDiscountRequest;
import com.sales.modules.order.dto.request.CancelOrderRequest;
import com.sales.modules.order.dto.request.CompleteOrderRequest;
import com.sales.modules.order.dto.request.CreateOrderItemRequest;
import com.sales.modules.order.dto.request.CreateOrderRequest;
import com.sales.modules.order.dto.request.HoldOrderRequest;
import com.sales.modules.order.dto.request.SetPaymentMethodRequest;
import com.sales.modules.order.dto.request.SwitchDiningTableRequest;
import com.sales.modules.order.dto.request.SwitchPaymentMethodRequest;
import com.sales.modules.order.dto.request.UpdateOrderItemRequest;
import com.sales.modules.order.dto.request.UpdateOrderLabelRequest;
import com.sales.modules.product.dto.request.CalculateWeightRequest;
import com.sales.modules.order.dto.response.OrderResponse;
import java.util.List;
import com.sales.modules.order.dto.response.CanceledOrderStatisticsResponse;
import com.sales.modules.order.dto.response.HeldOrderSummaryResponse;
import com.sales.modules.order.dto.response.OrderCancelReasonDto;
import com.sales.modules.order.entity.Order;
import com.sales.modules.product.dto.response.CalculateWeightResponse;
import java.time.LocalDateTime;

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
    CalculateWeightResponse calculateWeight(String currentUsername, CalculateWeightRequest request);
    OrderResponse cancelOrder(String currentUsername, String orderId, CancelOrderRequest request);
    List<OrderCancelReasonDto> getCancelReasons();
    CanceledOrderStatisticsResponse getCanceledOrderStatistics(
            String currentUsername,
            String shiftId,
            LocalDateTime fromDate,
            LocalDateTime toDate
    );

    OrderResponse holdOrder(String currentUsername, String orderId, HoldOrderRequest request);
    OrderResponse updateOrderLabel(String currentUsername, String orderId, UpdateOrderLabelRequest request);
    OrderResponse switchDiningTable(String currentUsername, String orderId, SwitchDiningTableRequest request);
    List<HeldOrderSummaryResponse> getHeldOrders(String currentUsername);

    OrderResponse switchPaymentMethod(String currentUsername, String orderId, SwitchPaymentMethodRequest request);

    void recalculateOrderTotals(Order order);
}
