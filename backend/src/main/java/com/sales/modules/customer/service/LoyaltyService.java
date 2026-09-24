package com.sales.modules.customer.service;
import com.sales.modules.customer.dto.request.AdjustPointsRequest;
import com.sales.modules.customer.dto.request.ApplyLoyaltyPointsRequest;
import com.sales.modules.customer.dto.request.LoyaltyProgramConfigRequest;
import com.sales.modules.customer.dto.response.CustomerLoyaltySummaryResponse;
import com.sales.modules.customer.dto.response.LoyaltyProgramConfigResponse;
import com.sales.modules.order.dto.response.OrderResponse;
import com.sales.common.dto.PageResponse;
import com.sales.modules.customer.dto.response.PointTransactionResponse;
import com.sales.modules.order.entity.Order;
import com.sales.modules.order.entity.ReturnTicket;
import com.sales.modules.auth.entity.User;

public interface LoyaltyService {

    LoyaltyProgramConfigResponse getProgramConfig(String currentUsername);

    LoyaltyProgramConfigResponse updateProgramConfig(String currentUsername, LoyaltyProgramConfigRequest request);

    CustomerLoyaltySummaryResponse getCustomerLoyaltySummary(String currentUsername, String customerId);

    PageResponse<PointTransactionResponse> getCustomerPointTransactions(
            String currentUsername, String customerId, int page, int size, String type);

    OrderResponse applyPointsToOrder(String currentUsername, String orderId, ApplyLoyaltyPointsRequest request);

    OrderResponse removePointsFromOrder(String currentUsername, String orderId);

    void processPointsRedeemed(Order order, User currentUser);

    void earnPointsForCompletedOrder(Order order, User currentUser);

    void deductPointsForReturnTicket(ReturnTicket returnTicket, User currentUser);

    PointTransactionResponse adjustPointsManually(String currentUsername, String customerId, AdjustPointsRequest request);
}
