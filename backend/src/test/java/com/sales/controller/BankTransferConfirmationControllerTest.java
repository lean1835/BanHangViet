package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PaymentMethodConstant;
import com.sales.dto.request.ConfirmBankTransferRequest;
import com.sales.dto.request.SwitchPaymentMethodRequest;
import com.sales.dto.response.BankTransferItemResponse;
import com.sales.dto.response.BankTransferReconciliationResponse;
import com.sales.dto.response.OrderPaymentResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.service.interfaces.OrderPaymentService;
import com.sales.service.interfaces.OrderService;
import com.sales.service.interfaces.ShiftService;
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
public class BankTransferConfirmationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderPaymentService orderPaymentService;

    @MockBean
    private OrderService orderService;

    @MockBean
    private ShiftService shiftService;

    @Test
    @DisplayName("PUT /api/v1/orders/{orderId}/confirm-bank-transfer - Chưa xác thực trả về 401")
    void testConfirmBankTransfer_Unauthorized() throws Exception {
        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("FT123456")
                .build();

        mockMvc.perform(put("/api/v1/orders/order-01/confirm-bank-transfer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "thungan01", roles = {"VT-02"})
    @DisplayName("PUT /api/v1/orders/{orderId}/confirm-bank-transfer - Thu ngân xác nhận thành công (AC-01)")
    void testConfirmBankTransfer_Endpoint_Success() throws Exception {
        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("FT123456")
                .notes("Đã nhận đủ tiền từ ngân hàng")
                .build();

        OrderPaymentResponse paymentResponse = OrderPaymentResponse.builder()
                .id("pay-01")
                .orderId("order-01")
                .orderCode("DH-001")
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("350000.00"))
                .transactionCode("FT123456")
                .isConfirmed(true)
                .confirmedAt(LocalDateTime.now())
                .confirmedByUsername("thungan01")
                .isTransferOverdue(false)
                .build();

        when(orderPaymentService.confirmOrderBankTransfer(eq("thungan01"), eq("order-01"), any(ConfirmBankTransferRequest.class)))
                .thenReturn(paymentResponse);

        mockMvc.perform(put("/api/v1/orders/order-01/confirm-bank-transfer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.isConfirmed").value(true))
                .andExpect(jsonPath("$.result.transactionCode").value("FT123456"))
                .andExpect(jsonPath("$.result.amount").value(350000.00));
    }

    @Test
    @WithMockUser(username = "thungan01", roles = {"VT-02"})
    @DisplayName("PUT /api/v1/orders/{orderId}/payments/confirm-bank-transfer - Xác nhận qua route payments thành công")
    void testConfirmBankTransfer_ViaPaymentsPath_Success() throws Exception {
        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("FT123456")
                .build();

        OrderPaymentResponse paymentResponse = OrderPaymentResponse.builder()
                .id("pay-01")
                .orderId("order-01")
                .orderCode("DH-001")
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("350000.00"))
                .transactionCode("FT123456")
                .isConfirmed(true)
                .build();

        when(orderPaymentService.confirmOrderBankTransfer(eq("thungan01"), eq("order-01"), any(ConfirmBankTransferRequest.class)))
                .thenReturn(paymentResponse);

        mockMvc.perform(put("/api/v1/orders/order-01/payments/confirm-bank-transfer")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.isConfirmed").value(true));
    }

    @Test
    @WithMockUser(username = "thungan01", roles = {"VT-02"})
    @DisplayName("PUT /api/v1/orders/{orderId}/payment-method - Thu ngân đổi sang Tiền mặt thành công (AC-03)")
    void testSwitchPaymentMethod_Endpoint_Success() throws Exception {
        SwitchPaymentMethodRequest request = SwitchPaymentMethodRequest.builder()
                .newPaymentMethod("CASH")
                .amountGiven(new BigDecimal("500000.00"))
                .notes("Khách đổi từ chuyển khoản sang tiền mặt")
                .build();

        OrderResponse orderResponse = OrderResponse.builder()
                .id("order-01")
                .orderNumber("DH-001")
                .status("CREATING")
                .paymentMethod("CASH")
                .totalAmount(new BigDecimal("350000.00"))
                .finalAmount(new BigDecimal("350000.00"))
                .build();

        when(orderService.switchPaymentMethod(eq("thungan01"), eq("order-01"), any(SwitchPaymentMethodRequest.class)))
                .thenReturn(orderResponse);

        mockMvc.perform(put("/api/v1/orders/order-01/payment-method")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.paymentMethod").value("CASH"))
                .andExpect(jsonPath("$.result.status").value("CREATING"));
    }

    @Test
    @WithMockUser(username = "thungan01", roles = {"VT-02"})
    @DisplayName("GET /api/v1/shifts/{shiftId}/bank-transfer-reconciliation - Đối soát chuyển khoản đóng ca (QTN-16)")
    void testGetBankTransferReconciliation_Shift_Success() throws Exception {
        BankTransferItemResponse item = BankTransferItemResponse.builder()
                .paymentId("pay-01")
                .orderId("order-01")
                .orderCode("DH-001")
                .amount(new BigDecimal("350000.00"))
                .transactionCode("FT123456")
                .isConfirmed(true)
                .confirmedAt(LocalDateTime.now())
                .confirmedByUserName("Nguyễn Thu Ngân")
                .isTransferOverdue(false)
                .orderStatus("COMPLETED")
                .build();

        BankTransferReconciliationResponse reconciliationResponse = BankTransferReconciliationResponse.builder()
                .shiftId("shift-01")
                .shiftCode("shift-01")
                .totalTransactions(1)
                .totalConfirmedAmount(new BigDecimal("350000.00"))
                .unconfirmedTransactionsCount(0)
                .totalUnconfirmedAmount(BigDecimal.ZERO)
                .transactions(List.of(item))
                .build();

        when(shiftService.getBankTransferReconciliation(eq("thungan01"), eq("shift-01")))
                .thenReturn(reconciliationResponse);

        mockMvc.perform(get("/api/v1/shifts/shift-01/bank-transfer-reconciliation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.shiftId").value("shift-01"))
                .andExpect(jsonPath("$.result.totalTransactions").value(1))
                .andExpect(jsonPath("$.result.totalConfirmedAmount").value(350000.00))
                .andExpect(jsonPath("$.result.transactions[0].transactionCode").value("FT123456"));
    }
}
