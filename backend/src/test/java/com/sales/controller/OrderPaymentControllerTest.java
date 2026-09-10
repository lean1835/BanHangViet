package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PaymentMethodConstant;
import com.sales.dto.request.ConfirmBankTransferRequest;
import com.sales.dto.response.OrderPaymentResponse;
import com.sales.service.interfaces.OrderPaymentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class OrderPaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderPaymentService orderPaymentService;

    @Test
    @DisplayName("GET /api/v1/orders/{orderId}/payments - Chưa đăng nhập trả về 401")
    void getOrderPayments_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/orders/order-101/payments"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "thungan01", roles = {"VT-02"})
    @DisplayName("GET /api/v1/orders/{orderId}/payments - Thu ngân lấy danh sách thanh toán thành công")
    void getOrderPayments_success() throws Exception {
        OrderPaymentResponse payment1 = OrderPaymentResponse.builder()
                .id("pay-01")
                .orderId("order-101")
                .paymentMethod(PaymentMethodConstant.CASH)
                .amount(new BigDecimal("100000.00"))
                .amountGiven(new BigDecimal("150000.00"))
                .changeAmount(new BigDecimal("50000.00"))
                .isConfirmed(true)
                .build();

        OrderPaymentResponse payment2 = OrderPaymentResponse.builder()
                .id("pay-02")
                .orderId("order-101")
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("250000.00"))
                .transactionCode("VCB.123456")
                .isConfirmed(true)
                .build();

        when(orderPaymentService.getOrderPayments(eq("thungan01"), eq("order-101")))
                .thenReturn(List.of(payment1, payment2));

        mockMvc.perform(get("/api/v1/orders/order-101/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result").isArray())
                .andExpect(jsonPath("$.result.length()").value(2))
                .andExpect(jsonPath("$.result[0].paymentMethod").value("CASH"))
                .andExpect(jsonPath("$.result[0].amount").value(100000.00))
                .andExpect(jsonPath("$.result[0].changeAmount").value(50000.00))
                .andExpect(jsonPath("$.result[1].paymentMethod").value("BANK_TRANSFER"))
                .andExpect(jsonPath("$.result[1].amount").value(250000.00));
    }

    @Test
    @WithMockUser(username = "thungan01", roles = {"VT-02"})
    @DisplayName("PUT /api/v1/orders/{orderId}/payments/{paymentId}/confirm-bank-transfer - Xác nhận chuyển khoản thành công")
    void confirmBankTransfer_success() throws Exception {
        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("BIDV.888999")
                .notes("Đã nhận đủ tiền từ khách")
                .build();

        OrderPaymentResponse paymentResponse = OrderPaymentResponse.builder()
                .id("pay-02")
                .orderId("order-101")
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("250000.00"))
                .transactionCode("BIDV.888999")
                .isConfirmed(true)
                .confirmedAt(LocalDateTime.now())
                .confirmedByUsername("thungan01")
                .build();

        when(orderPaymentService.confirmBankTransfer(eq("thungan01"), eq("order-101"), eq("pay-02"), any()))
                .thenReturn(paymentResponse);

        mockMvc.perform(put("/api/v1/orders/order-101/payments/pay-02/confirm-bank-transfer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.isConfirmed").value(true))
                .andExpect(jsonPath("$.result.transactionCode").value("BIDV.888999"));
    }
}
