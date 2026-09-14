package com.sales.service.interfaces;

import com.sales.dto.request.AdjustPointsRequest;
import com.sales.dto.request.ApplyLoyaltyPointsRequest;
import com.sales.dto.request.LoyaltyProgramConfigRequest;
import com.sales.dto.response.CustomerLoyaltySummaryResponse;
import com.sales.dto.response.LoyaltyProgramConfigResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PointTransactionResponse;
import com.sales.entity.Order;
import com.sales.entity.ReturnTicket;
import com.sales.entity.User;

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
