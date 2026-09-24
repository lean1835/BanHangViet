package com.sales.modules.order.service;
import com.sales.modules.order.dto.request.ConfirmBankTransferRequest;
import com.sales.modules.order.dto.response.OrderPaymentResponse;

import java.util.List;

public interface OrderPaymentService {

    List<OrderPaymentResponse> getOrderPayments(String currentUsername, String orderId);

    OrderPaymentResponse confirmBankTransfer(String currentUsername, String orderId, String paymentId, ConfirmBankTransferRequest request);

    OrderPaymentResponse confirmOrderBankTransfer(String currentUsername, String orderId, ConfirmBankTransferRequest request);
}

