package com.sales.modules.customer.controller;
import com.sales.common.dto.PageResponse;
import com.sales.modules.customer.dto.response.CustomerLoyaltySummaryResponse;
import com.sales.modules.customer.dto.response.LoyaltyProgramConfigResponse;
import com.sales.modules.customer.dto.response.PointTransactionResponse;
import com.sales.modules.order.dto.response.OrderResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.customer.dto.request.AdjustPointsRequest;
import com.sales.modules.customer.dto.request.ApplyLoyaltyPointsRequest;
import com.sales.modules.customer.dto.request.LoyaltyProgramConfigRequest;
import com.sales.modules.customer.service.LoyaltyService;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class LoyaltyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LoyaltyService loyaltyService;

    @Test
    @DisplayName("Chưa đăng nhập -> Trả về 401 Unauthorized")
    void unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/loyalty-program/config"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/loyalty-program/config: Lấy cấu hình thành công (200 OK)")
    @WithMockUser(username = "chuho", roles = {"VT-01"})
    void getProgramConfig_Success() throws Exception {
        LoyaltyProgramConfigResponse response = LoyaltyProgramConfigResponse.builder()
                .id("cfg-001")
                .householdId("house-001")
                .isEnabled(true)
                .spendAmountPerPoint(new BigDecimal("10000.00"))
                .pointValue(new BigDecimal("1000.00"))
                .minPointsToRedeem(50)
                .maxRedeemRatePerOrder(new BigDecimal("100.00"))
                .pointExpiryDays(365)
                .build();

        when(loyaltyService.getProgramConfig("chuho")).thenReturn(response);

        mockMvc.perform(get("/api/v1/loyalty-program/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("cfg-001"))
                .andExpect(jsonPath("$.result.spendAmountPerPoint").value(10000.00))
                .andExpect(jsonPath("$.result.minPointsToRedeem").value(50));
    }

    @Test
    @DisplayName("PUT /api/v1/loyalty-program/config: Cập nhật cấu hình thành công bởi Chủ hộ (200 OK)")
    @WithMockUser(username = "chuho", roles = {"VT-01"})
    void updateProgramConfig_Success() throws Exception {
        LoyaltyProgramConfigRequest request = LoyaltyProgramConfigRequest.builder()
                .isEnabled(true)
                .spendAmountPerPoint(new BigDecimal("20000.00"))
                .pointValue(new BigDecimal("2000.00"))
                .minPointsToRedeem(30)
                .maxRedeemRatePerOrder(new BigDecimal("50.00"))
                .pointExpiryDays(180)
                .build();

        LoyaltyProgramConfigResponse response = LoyaltyProgramConfigResponse.builder()
                .id("cfg-001")
                .householdId("house-001")
                .isEnabled(true)
                .spendAmountPerPoint(new BigDecimal("20000.00"))
                .pointValue(new BigDecimal("2000.00"))
                .minPointsToRedeem(30)
                .maxRedeemRatePerOrder(new BigDecimal("50.00"))
                .pointExpiryDays(180)
                .build();

        when(loyaltyService.updateProgramConfig(eq("chuho"), any(LoyaltyProgramConfigRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/api/v1/loyalty-program/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.spendAmountPerPoint").value(20000.00))
                .andExpect(jsonPath("$.result.minPointsToRedeem").value(30));
    }

    @Test
    @DisplayName("PUT /api/v1/loyalty-program/config: Nhân viên bán hàng bị từ chối 403 Forbidden")
    @WithMockUser(username = "nhanvien", roles = {"VT-02"})
    void updateProgramConfig_ForbiddenForSales() throws Exception {
        LoyaltyProgramConfigRequest request = LoyaltyProgramConfigRequest.builder()
                .isEnabled(true)
                .spendAmountPerPoint(new BigDecimal("20000.00"))
                .pointValue(new BigDecimal("2000.00"))
                .minPointsToRedeem(30)
                .maxRedeemRatePerOrder(new BigDecimal("50.00"))
                .pointExpiryDays(180)
                .build();

        mockMvc.perform(put("/api/v1/loyalty-program/config")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/orders/{orderId}/apply-points: Đổi điểm thành công (200 OK)")
    @WithMockUser(username = "nhanvien", roles = {"VT-02"})
    void applyPointsToOrder_Success() throws Exception {
        ApplyLoyaltyPointsRequest request = ApplyLoyaltyPointsRequest.builder()
                .pointsToRedeem(50)
                .build();

        OrderResponse orderResponse = OrderResponse.builder()
                .id("ord-001")
                .pointDiscountAmount(new BigDecimal("50000.00"))
                .pointsRedeemed(50)
                .finalAmount(new BigDecimal("150000.00"))
                .build();

        when(loyaltyService.applyPointsToOrder(eq("nhanvien"), eq("ord-001"), any(ApplyLoyaltyPointsRequest.class)))
                .thenReturn(orderResponse);

        mockMvc.perform(post("/api/v1/orders/ord-001/apply-points")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.pointDiscountAmount").value(50000.00))
                .andExpect(jsonPath("$.result.pointsRedeemed").value(50))
                .andExpect(jsonPath("$.result.finalAmount").value(150000.00));
    }

    @Test
    @DisplayName("DELETE /api/v1/orders/{orderId}/remove-points: Hủy đổi điểm thành công (200 OK)")
    @WithMockUser(username = "nhanvien", roles = {"VT-02"})
    void removePointsFromOrder_Success() throws Exception {
        OrderResponse orderResponse = OrderResponse.builder()
                .id("ord-001")
                .pointDiscountAmount(BigDecimal.ZERO)
                .pointsRedeemed(0)
                .finalAmount(new BigDecimal("200000.00"))
                .build();

        when(loyaltyService.removePointsFromOrder("nhanvien", "ord-001"))
                .thenReturn(orderResponse);

        mockMvc.perform(delete("/api/v1/orders/ord-001/remove-points"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.pointDiscountAmount").value(0))
                .andExpect(jsonPath("$.result.pointsRedeemed").value(0))
                .andExpect(jsonPath("$.result.finalAmount").value(200000.00));
    }

    @Test
    @DisplayName("GET /api/v1/customers/{customerId}/loyalty-summary: Lấy tóm tắt điểm thành công (200 OK)")
    @WithMockUser(username = "nhanvien", roles = {"VT-02"})
    void getCustomerLoyaltySummary_Success() throws Exception {
        CustomerLoyaltySummaryResponse summary = CustomerLoyaltySummaryResponse.builder()
                .customerId("cust-001")
                .customerName("Nguyễn Văn A")
                .phoneNumber("0912345678")
                .availablePoints(100)
                .monetaryEquivalent(new BigDecimal("100000.00"))
                .isEligibleToRedeem(true)
                .minPointsToRedeem(50)
                .totalPointsEarned(150)
                .totalPointsRedeemed(50)
                .totalPointsDeductedOnReturn(0)
                .nearestExpiringDate(LocalDate.now().plusMonths(6))
                .pointsExpiringSoon(20)
                .build();

        when(loyaltyService.getCustomerLoyaltySummary("nhanvien", "cust-001"))
                .thenReturn(summary);

        mockMvc.perform(get("/api/v1/customers/cust-001/loyalty-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.availablePoints").value(100))
                .andExpect(jsonPath("$.result.isEligibleToRedeem").value(true))
                .andExpect(jsonPath("$.result.monetaryEquivalent").value(100000.00));
    }

    @Test
    @DisplayName("GET /api/v1/customers/{customerId}/loyalty-transactions: Lấy lịch sử biến động thành công (200 OK)")
    @WithMockUser(username = "ketoan", roles = {"VT-03"})
    void getCustomerPointTransactions_Success() throws Exception {
        PointTransactionResponse tx = PointTransactionResponse.builder()
                .id("tx-001")
                .customerId("cust-001")
                .customerName("Nguyễn Văn A")
                .orderId("ord-001")
                .orderNumber("ORD-260913-0001")
                .type("EARN")
                .pointsChange(25)
                .balanceAfter(100)
                .monetaryEquivalent(new BigDecimal("25000.00"))
                .description("Tích điểm từ đơn hàng ORD-260913-0001")
                .createdAt(LocalDateTime.now())
                .build();

        PageResponse<PointTransactionResponse> pageResponse = PageResponse.<PointTransactionResponse>builder()
                .content(List.of(tx))
                .pageNumber(0)
                .pageSize(20)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(loyaltyService.getCustomerPointTransactions("ketoan", "cust-001", 0, 20, null))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/customers/cust-001/loyalty-transactions")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].id").value("tx-001"))
                .andExpect(jsonPath("$.result.content[0].type").value("EARN"))
                .andExpect(jsonPath("$.result.content[0].pointsChange").value(25));
    }

    @Test
    @DisplayName("POST /api/v1/customers/{customerId}/adjust-points: Điều chỉnh điểm thủ công thành công bởi Chủ hộ (200 OK)")
    @WithMockUser(username = "chuho", roles = {"VT-01"})
    void adjustPointsManually_Success() throws Exception {
        AdjustPointsRequest request = AdjustPointsRequest.builder()
                .pointsChange(15)
                .reason("Bồi thường quà tặng")
                .build();

        PointTransactionResponse tx = PointTransactionResponse.builder()
                .id("tx-adj")
                .customerId("cust-001")
                .type("ADJUST")
                .pointsChange(15)
                .balanceAfter(115)
                .description("Bồi thường quà tặng")
                .build();

        when(loyaltyService.adjustPointsManually(eq("chuho"), eq("cust-001"), any(AdjustPointsRequest.class)))
                .thenReturn(tx);

        mockMvc.perform(post("/api/v1/customers/cust-001/adjust-points")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.type").value("ADJUST"))
                .andExpect(jsonPath("$.result.pointsChange").value(15))
                .andExpect(jsonPath("$.result.balanceAfter").value(115));
    }
}
