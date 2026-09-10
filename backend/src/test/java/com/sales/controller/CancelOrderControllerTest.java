package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CancelOrderRequest;
import com.sales.dto.response.CanceledOrderStatisticsResponse;
import com.sales.dto.response.OrderCancelReasonDto;
import com.sales.dto.response.OrderResponse;
import com.sales.entity.OrderCancelReason;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.service.interfaces.OrderService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class CancelOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("POST /api/v1/orders/{orderId}/cancel - Chưa đăng nhập trả về 401 UNAUTHORIZED")
    void cancelOrder_Unauthenticated() throws Exception {
        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .build();

        mockMvc.perform(post("/api/v1/orders/order-001/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "thungan_test", roles = {"VT-02"})
    @DisplayName("POST /api/v1/orders/{orderId}/cancel - Hủy đơn thành công trả về 200 OK (Minh chứng TC-01)")
    void cancelOrder_Authenticated_Success() throws Exception {
        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .build();

        OrderResponse mockResponse = OrderResponse.builder()
                .id("order-001")
                .orderNumber("ORD-20260908-0001")
                .status("CANCELED")
                .cancelReason("CUSTOMER_CHANGED_MIND")
                .cancelReasonDescription("Khách đổi ý")
                .canceledByFullName("Nguyễn Văn A")
                .canceledAt(LocalDateTime.now())
                .totalAmount(new BigDecimal("150000.00"))
                .finalAmount(new BigDecimal("150000.00"))
                .build();

        when(orderService.cancelOrder(eq("thungan_test"), eq("order-001"), any(CancelOrderRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/orders/order-001/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("order-001"))
                .andExpect(jsonPath("$.result.status").value("CANCELED"))
                .andExpect(jsonPath("$.result.cancelReason").value("CUSTOMER_CHANGED_MIND"))
                .andExpect(jsonPath("$.result.cancelReasonDescription").value("Khách đổi ý"));
    }

    @Test
    @WithMockUser(username = "thungan_test", roles = {"VT-02"})
    @DisplayName("POST /api/v1/orders/{orderId}/cancel - Thiếu cancelReason trả về 400 Bad Request (Minh chứng TC-02)")
    void cancelOrder_MissingReason_ReturnsBadRequest() throws Exception {
        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(null)
                .build();

        mockMvc.perform(post("/api/v1/orders/order-001/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "thungan_test", roles = {"VT-02"})
    @DisplayName("POST /api/v1/orders/{orderId}/cancel - Đơn đã thanh toán bị từ chối với mã 3110 (Minh chứng TC-03)")
    void cancelOrder_AlreadyCompleted_Returns3110() throws Exception {
        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .build();

        when(orderService.cancelOrder(eq("thungan_test"), eq("order-001"), any(CancelOrderRequest.class)))
                .thenThrow(new AppException(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CANCEL));

        mockMvc.perform(post("/api/v1/orders/order-001/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(3110));
    }

    @Test
    @WithMockUser(username = "thungan_test", roles = {"VT-02"})
    @DisplayName("GET /api/v1/orders/cancel-reasons - Lấy danh mục lý do trả về 200 OK")
    void getCancelReasons_Success() throws Exception {
        List<OrderCancelReasonDto> mockReasons = List.of(
                OrderCancelReasonDto.builder().code("CUSTOMER_CHANGED_MIND").description("Khách đổi ý").requiresNote(false).build(),
                OrderCancelReasonDto.builder().code("OUT_OF_STOCK").description("Hết hàng").requiresNote(false).build(),
                OrderCancelReasonDto.builder().code("STAFF_INPUT_ERROR").description("Nhân viên nhập nhầm").requiresNote(false).build(),
                OrderCancelReasonDto.builder().code("OTHER").description("Lý do khác").requiresNote(true).build()
        );

        when(orderService.getCancelReasons()).thenReturn(mockReasons);

        mockMvc.perform(get("/api/v1/orders/cancel-reasons"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.length()").value(4))
                .andExpect(jsonPath("$.result[0].code").value("CUSTOMER_CHANGED_MIND"));
    }

    @Test
    @WithMockUser(username = "chuho_test", roles = {"VT-01"})
    @DisplayName("GET /api/v1/orders/canceled-statistics - Thống kê đơn hủy trả về 200 OK (Minh chứng TC-04)")
    void getCanceledOrderStatistics_Success() throws Exception {
        CanceledOrderStatisticsResponse mockStats = CanceledOrderStatisticsResponse.builder()
                .totalCanceledOrders(5)
                .totalCanceledAmount(new BigDecimal("750000.00"))
                .shiftId("shift-001")
                .byReason(List.of())
                .byEmployee(List.of())
                .recentCanceledOrders(List.of())
                .build();

        when(orderService.getCanceledOrderStatistics(eq("chuho_test"), any(), any(), any()))
                .thenReturn(mockStats);

        mockMvc.perform(get("/api/v1/orders/canceled-statistics")
                        .param("shiftId", "shift-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalCanceledOrders").value(5))
                .andExpect(jsonPath("$.result.totalCanceledAmount").value(750000.00));
    }
}
