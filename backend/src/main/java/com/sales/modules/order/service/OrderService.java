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
    com.sales.modules.product.dto.response.CalculateWeightResponse calculateWeight(String currentUsername, CalculateWeightRequest request);
    OrderResponse cancelOrder(String currentUsername, String orderId, CancelOrderRequest request);
    List<com.sales.modules.order.dto.response.OrderCancelReasonDto> getCancelReasons();
    com.sales.modules.order.dto.response.CanceledOrderStatisticsResponse getCanceledOrderStatistics(
            String currentUsername,
            String shiftId,
            java.time.LocalDateTime fromDate,
            java.time.LocalDateTime toDate
    );

    // NCL-03-CN-010 Đặt tên nhận diện và treo nhiều đơn theo bàn hoặc khách
    OrderResponse holdOrder(String currentUsername, String orderId, HoldOrderRequest request);
    OrderResponse updateOrderLabel(String currentUsername, String orderId, UpdateOrderLabelRequest request);
    OrderResponse switchDiningTable(String currentUsername, String orderId, SwitchDiningTableRequest request);
    List<com.sales.modules.order.dto.response.HeldOrderSummaryResponse> getHeldOrders(String currentUsername);

    // NCL-03-CN-012 Đổi phương thức thanh toán linh hoạt
    OrderResponse switchPaymentMethod(String currentUsername, String orderId, SwitchPaymentMethodRequest request);

    // QTN-07 Tính toán lại tổng tiền, giảm giá, thuế và tiền thanh toán cuối cùng
    void recalculateOrderTotals(com.sales.modules.order.entity.Order order);
}


