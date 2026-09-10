package com.sales.service.interfaces;

import com.sales.dto.request.ConfirmBankTransferRequest;
import com.sales.dto.response.OrderPaymentResponse;

import java.util.List;

public interface OrderPaymentService {

    List<OrderPaymentResponse> getOrderPayments(String currentUsername, String orderId);

    OrderPaymentResponse confirmBankTransfer(String currentUsername, String orderId, String paymentId, ConfirmBankTransferRequest request);

    OrderPaymentResponse confirmOrderBankTransfer(String currentUsername, String orderId, ConfirmBankTransferRequest request);
}

