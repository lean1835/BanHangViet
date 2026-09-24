package com.sales.modules.order.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.order.dto.request.CheckExchangeEligibilityRequest;
import com.sales.modules.order.dto.request.CreateProductExchangeRequest;
import com.sales.modules.order.dto.request.ExchangeNewItemRequest;
import com.sales.modules.order.dto.request.ExchangeReturnItemRequest;
import com.sales.modules.order.dto.response.ExchangeEligibilityResponse;
import com.sales.modules.order.dto.response.ProductExchangeResponse;
import com.sales.common.security.AccountantSecurityService;
import com.sales.modules.order.service.ProductExchangeService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProductExchangeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProductExchangeService productExchangeService;

    @MockBean
    private AccountantSecurityService accountantSecurityService;

    @Test
    @DisplayName("POST /api/v1/product-exchanges/check-eligibility - Thành công với quyền VT-02")
    @WithMockUser(username = "staff_test", roles = {"VT-02"})
    void checkEligibility_success() throws Exception {
        ExchangeEligibilityResponse response = ExchangeEligibilityResponse.builder()
                .isEligible(true)
                .exchangeType("EQUAL_VALUE")
                .totalReturnAmount(new BigDecimal("50000.00"))
                .totalExchangeAmount(new BigDecimal("50000.00"))
                .differenceAmount(BigDecimal.ZERO)
                .requireNewInvoice(false)
                .redirectToReturnFlow(false)
                .message("Hợp lệ")
                .build();

        when(productExchangeService.checkEligibility(any(CheckExchangeEligibilityRequest.class), eq("staff_test")))
                .thenReturn(response);

        CheckExchangeEligibilityRequest request = CheckExchangeEligibilityRequest.builder()
                .originalInvoiceId("inv-001")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-2")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .build();

        mockMvc.perform(post("/api/v1/product-exchanges/check-eligibility")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.eligible").value(true))
                .andExpect(jsonPath("$.result.exchangeType").value("EQUAL_VALUE"))
                .andExpect(jsonPath("$.result.differenceAmount").value(0));
    }

    @Test
    @DisplayName("POST /api/v1/product-exchanges - Lập phiếu đổi hàng thành công với quyền VT-02")
    @WithMockUser(username = "staff_test", roles = {"VT-02"})
    void createProductExchange_success() throws Exception {
        ProductExchangeResponse response = ProductExchangeResponse.builder()
                .id("dx-001")
                .ticketNumber("DX-20260916-0001")
                .originalInvoiceId("inv-001")
                .originalInvoiceNumber("0000123")
                .exchangeType("EQUAL_VALUE")
                .totalReturnAmount(new BigDecimal("50000.00"))
                .totalExchangeAmount(new BigDecimal("50000.00"))
                .differenceAmount(BigDecimal.ZERO)
                .status("COMPLETED")
                .createdAt(LocalDateTime.now())
                .items(Collections.emptyList())
                .build();

        when(productExchangeService.createProductExchange(any(CreateProductExchangeRequest.class), eq("staff_test")))
                .thenReturn(response);

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-001")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-2")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .reason("Khách đổi mùi hương")
                .build();

        mockMvc.perform(post("/api/v1/product-exchanges")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.ticketNumber").value("DX-20260916-0001"))
                .andExpect(jsonPath("$.result.exchangeType").value("EQUAL_VALUE"))
                .andExpect(jsonPath("$.result.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("POST /api/v1/product-exchanges - Bị chặn 403 Forbidden khi người dùng là Khách hàng (VT-06)")
    @WithMockUser(username = "customer_test", roles = {"VT-06"})
    void createProductExchange_forbiddenForCustomer() throws Exception {
        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-001")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-2")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .build();

        mockMvc.perform(post("/api/v1/product-exchanges")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/product-exchanges/{id} - Lấy chi tiết phiếu đổi hàng thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getExchangeTicketById_success() throws Exception {
        ProductExchangeResponse response = ProductExchangeResponse.builder()
                .id("dx-001")
                .ticketNumber("DX-20260916-0001")
                .originalInvoiceId("inv-001")
                .exchangeType("EQUAL_VALUE")
                .status("COMPLETED")
                .createdAt(LocalDateTime.now())
                .items(Collections.emptyList())
                .build();

        when(productExchangeService.getExchangeTicketById("dx-001", "owner_test"))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/product-exchanges/dx-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("dx-001"))
                .andExpect(jsonPath("$.result.ticketNumber").value("DX-20260916-0001"));
    }

    @Test
    @DisplayName("GET /api/v1/product-exchanges - Lấy danh sách phiếu đổi hàng phân trang")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getExchangeTickets_success() throws Exception {
        ProductExchangeResponse item = ProductExchangeResponse.builder()
                .id("dx-001")
                .ticketNumber("DX-20260916-0001")
                .exchangeType("EQUAL_VALUE")
                .status("COMPLETED")
                .build();
        Page<ProductExchangeResponse> page = new PageImpl<>(List.of(item));

        when(productExchangeService.getExchangeTickets(any(), any(), any(), any(Pageable.class), eq("owner_test")))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/product-exchanges")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].ticketNumber").value("DX-20260916-0001"));
    }

    @Test
    @DisplayName("P3-1: GET /api/v1/product-exchanges với sort field không hợp lệ -> tự động fallback về createdAt")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getExchangeTickets_invalidSort_fallsBackToCreatedAt() throws Exception {
        Page<ProductExchangeResponse> page = new PageImpl<>(Collections.emptyList());
        org.mockito.ArgumentCaptor<Pageable> pageableCaptor = org.mockito.ArgumentCaptor.forClass(Pageable.class);

        when(productExchangeService.getExchangeTickets(any(), any(), any(), pageableCaptor.capture(), eq("owner_test")))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/product-exchanges")
                        .param("sort", "maliciousColumn;DROP TABLE,asc"))
                .andExpect(status().isOk());

        org.junit.jupiter.api.Assertions.assertEquals("createdAt",
                pageableCaptor.getValue().getSort().iterator().next().getProperty());
    }
}
