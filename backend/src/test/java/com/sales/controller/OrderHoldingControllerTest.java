package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.HoldOrderRequest;
import com.sales.dto.request.SwitchDiningTableRequest;
import com.sales.dto.request.UpdateOrderLabelRequest;
import com.sales.dto.response.HeldOrderSummaryResponse;
import com.sales.dto.response.OrderResponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class OrderHoldingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private OrderService orderService;

    @Test
    @DisplayName("GET /api/v1/orders/held - Chưa đăng nhập trả về 401")
    void getHeldOrders_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/orders/held"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "thungan1", roles = {"VT-02"})
    @DisplayName("GET /api/v1/orders/held - Thu ngân lấy danh sách đơn treo thành công")
    void getHeldOrders_cashier_success() throws Exception {
        when(orderService.getHeldOrders(eq("thungan1")))
                .thenReturn(List.of(
                        HeldOrderSummaryResponse.builder()
                                .id("order-001")
                                .orderNumber("OD-1001")
                                .orderLabel("Bàn 1 ngoài sân")
                                .diningTableName("Bàn 1")
                                .itemCount(2)
                                .totalAmount(BigDecimal.valueOf(120000))
                                .createdAt(LocalDateTime.now())
                                .holdingDurationMinutes(30L)
                                .isOverdue(false)
                                .build()
                ));

        mockMvc.perform(get("/api/v1/orders/held"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].orderNumber").value("OD-1001"))
                .andExpect(jsonPath("$.result[0].orderLabel").value("Bàn 1 ngoài sân"));
    }

    @Test
    @WithMockUser(username = "thungan1", roles = {"VT-02"})
    @DisplayName("PUT /api/v1/orders/{orderId}/hold - Treo đơn kèm tên nhận diện và bàn ăn thành công")
    void holdOrder_success() throws Exception {
        HoldOrderRequest request = HoldOrderRequest.builder()
                .orderLabel("Khách bàn 2")
                .diningTableId("table-002")
                .build();

        when(orderService.holdOrder(eq("thungan1"), eq("order-001"), any(HoldOrderRequest.class)))
                .thenReturn(OrderResponse.builder()
                        .id("order-001")
                        .orderNumber("OD-1001")
                        .status("CREATING")
                        .orderLabel("Khách bàn 2")
                        .diningTableId("table-002")
                        .diningTableName("Bàn 2")
                        .build());

        mockMvc.perform(put("/api/v1/orders/order-001/hold")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.orderLabel").value("Khách bàn 2"))
                .andExpect(jsonPath("$.result.diningTableName").value("Bàn 2"));
    }

    @Test
    @WithMockUser(username = "thungan1", roles = {"VT-02"})
    @DisplayName("PUT /api/v1/orders/{orderId}/order-label - Cập nhật tên nhận diện thành công")
    void updateOrderLabel_success() throws Exception {
        UpdateOrderLabelRequest request = UpdateOrderLabelRequest.builder()
                .orderLabel("Bác Nam đổi bàn")
                .build();

        when(orderService.updateOrderLabel(eq("thungan1"), eq("order-001"), any(UpdateOrderLabelRequest.class)))
                .thenReturn(OrderResponse.builder()
                        .id("order-001")
                        .orderLabel("Bác Nam đổi bàn")
                        .build());

        mockMvc.perform(put("/api/v1/orders/order-001/order-label")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.orderLabel").value("Bác Nam đổi bàn"));
    }

    @Test
    @WithMockUser(username = "thungan1", roles = {"VT-02"})
    @DisplayName("PUT /api/v1/orders/{orderId}/switch-table - Chuyển bàn thành công")
    void switchDiningTable_success() throws Exception {
        SwitchDiningTableRequest request = SwitchDiningTableRequest.builder()
                .newDiningTableId("table-005")
                .build();

        when(orderService.switchDiningTable(eq("thungan1"), eq("order-001"), any(SwitchDiningTableRequest.class)))
                .thenReturn(OrderResponse.builder()
                        .id("order-001")
                        .diningTableId("table-005")
                        .diningTableName("Bàn 5")
                        .build());

        mockMvc.perform(put("/api/v1/orders/order-001/switch-table")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.diningTableId").value("table-005"))
                .andExpect(jsonPath("$.result.diningTableName").value("Bàn 5"));
    }
}
