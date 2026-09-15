package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateSupplierReturnItemRequest;
import com.sales.dto.request.CreateSupplierReturnRequest;
import com.sales.dto.response.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.service.interfaces.SupplierReturnService;
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
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SupplierReturnControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SupplierReturnService supplierReturnService;

    @Test
    @DisplayName("GET /api/v1/supplier-returns/check-receipt/{receiptId} - Thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void checkReceiptReturnable_success() throws Exception {
        ReceiptReturnableCheckResponse response = ReceiptReturnableCheckResponse.builder()
                .receiptId("gr-001")
                .receiptNumber("NK-001")
                .supplierName("Công ty ABC")
                .items(List.of(
                        ReceiptReturnableItemResponse.builder()
                                .receiptDetailId("grd-001")
                                .productId("prod-001")
                                .productName("Coca Cola")
                                .importedQuantity(new BigDecimal("24.000"))
                                .previouslyReturnedQuantity(BigDecimal.ZERO)
                                .remainingReturnableQuantity(new BigDecimal("24.000"))
                                .currentStockQuantity(new BigDecimal("24.000"))
                                .maxAllowedReturnQuantity(new BigDecimal("24.000"))
                                .purchasePrice(new BigDecimal("10000.00"))
                                .build()
                ))
                .build();

        when(supplierReturnService.checkReceiptReturnable(eq("owner_test"), eq("gr-001"))).thenReturn(response);

        mockMvc.perform(get("/api/v1/supplier-returns/check-receipt/gr-001")
                        .principal(() -> "owner_test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.receiptId").value("gr-001"))
                .andExpect(jsonPath("$.result.items[0].productName").value("Coca Cola"))
                .andExpect(jsonPath("$.result.items[0].maxAllowedReturnQuantity").value(24.0));
    }

    @Test
    @DisplayName("POST /api/v1/supplier-returns - Thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void createSupplierReturn_success() throws Exception {
        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Hàng hỏng")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("2.000"))
                                .build()
                ))
                .build();

        SupplierReturnResponse response = SupplierReturnResponse.builder()
                .id("sr-001")
                .returnNumber("TH-NCC-20260914-001")
                .receiptId("gr-001")
                .receiptNumber("NK-001")
                .totalReturnAmount(new BigDecimal("20000.00"))
                .reason("Hàng hỏng")
                .build();

        when(supplierReturnService.createSupplierReturn(eq("owner_test"), any(CreateSupplierReturnRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/supplier-returns")
                        .with(csrf())
                        .principal(() -> "owner_test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("sr-001"))
                .andExpect(jsonPath("$.result.returnNumber").value("TH-NCC-20260914-001"))
                .andExpect(jsonPath("$.result.totalReturnAmount").value(20000.00));
    }

    @Test
    @DisplayName("POST /api/v1/supplier-returns - Validation thất bại khi thiếu items")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void createSupplierReturn_validationFailed() throws Exception {
        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Hàng hỏng")
                .items(Collections.emptyList())
                .build();

        mockMvc.perform(post("/api/v1/supplier-returns")
                        .with(csrf())
                        .principal(() -> "owner_test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/supplier-returns - Lấy danh sách thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getSupplierReturns_success() throws Exception {
        PageResponse<SupplierReturnResponse> pageResponse = PageResponse.<SupplierReturnResponse>builder()
                .content(List.of(
                        SupplierReturnResponse.builder()
                                .id("sr-001")
                                .returnNumber("TH-NCC-20260914-001")
                                .build()
                ))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(supplierReturnService.getSupplierReturns(eq("owner_test"), any(), any(), any(), any(), eq(0), eq(10)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/supplier-returns")
                        .principal(() -> "owner_test")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].id").value("sr-001"));
    }

    @Test
    @DisplayName("GET /api/v1/supplier-returns/{id} - Lấy chi tiết thành công")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    void getSupplierReturnById_success() throws Exception {
        SupplierReturnDetailResponse response = SupplierReturnDetailResponse.builder()
                .id("sr-001")
                .returnNumber("TH-NCC-20260914-001")
                .reason("Hàng hỏng")
                .totalReturnAmount(new BigDecimal("20000.00"))
                .build();

        when(supplierReturnService.getSupplierReturnById(eq("owner_test"), eq("sr-001")))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/supplier-returns/sr-001")
                        .principal(() -> "owner_test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("sr-001"))
                .andExpect(jsonPath("$.result.reason").value("Hàng hỏng"));
    }

    @Test
    @DisplayName("POST /api/v1/supplier-returns - Nhân viên (VT-02) bị chặn 403 Forbidden")
    @WithMockUser(username = "employee_test", roles = {"VT-02"})
    void createSupplierReturn_forbiddenForEmployee() throws Exception {
        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Hàng hỏng")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("2.000"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/supplier-returns")
                        .with(csrf())
                        .principal(() -> "employee_test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
