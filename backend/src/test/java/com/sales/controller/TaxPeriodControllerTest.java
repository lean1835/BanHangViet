package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.GenerateTaxRegisterRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.TaxPeriodResponse;
import com.sales.dto.response.TaxSalesRegisterResponse;
import com.sales.service.interfaces.TaxPeriodService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class TaxPeriodControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TaxPeriodService taxPeriodService;

    @Test
    @DisplayName("Lập bảng kê hóa đơn bán ra thành công với vai trò VT-01 (Chủ hộ)")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void generateSalesRegister_success_owner() throws Exception {
        GenerateTaxRegisterRequest request = GenerateTaxRegisterRequest.builder()
                .periodType("MONTHLY")
                .year(2026)
                .periodNumber(9)
                .build();

        TaxPeriodResponse response = TaxPeriodResponse.builder()
                .id("period-123")
                .periodName("Tháng 09/2026")
                .status("GENERATED")
                .build();

        when(taxPeriodService.generateSalesRegister(eq("owner_test"), any(GenerateTaxRegisterRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/tax-periods/generate-sales-register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("period-123"));
    }

    @Test
    @DisplayName("Lập bảng kê hóa đơn bán ra thành công với vai trò VT-03 (Kế toán)")
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    public void generateSalesRegister_success_accountant() throws Exception {
        GenerateTaxRegisterRequest request = GenerateTaxRegisterRequest.builder()
                .periodType("MONTHLY")
                .year(2026)
                .periodNumber(9)
                .build();

        TaxPeriodResponse response = TaxPeriodResponse.builder()
                .id("period-123")
                .periodName("Tháng 09/2026")
                .status("GENERATED")
                .build();

        when(taxPeriodService.generateSalesRegister(eq("accountant_test"), any(GenerateTaxRegisterRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/tax-periods/generate-sales-register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @DisplayName("Lập bảng kê hóa đơn bán ra thất bại (403) với vai trò VT-02 (Nhân viên bán hàng)")
    @WithMockUser(username = "sales_test", roles = {"VT-02"})
    public void generateSalesRegister_forbidden_salesStaff() throws Exception {
        GenerateTaxRegisterRequest request = GenerateTaxRegisterRequest.builder()
                .periodType("MONTHLY")
                .year(2026)
                .periodNumber(9)
                .build();

        mockMvc.perform(post("/api/v1/tax-periods/generate-sales-register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Lấy danh sách dòng bảng kê hóa đơn bán ra thành công với vai trò VT-01")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void getSalesRegisterItems_success() throws Exception {
        PageResponse<TaxSalesRegisterResponse> pageResponse = PageResponse.<TaxSalesRegisterResponse>builder()
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .content(Collections.emptyList())
                .build();

        when(taxPeriodService.getSalesRegisterItems(eq("owner_test"), eq("period-123"), anyInt(), anyInt()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/tax-periods/period-123/sales-register?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.pageNumber").value(0));
    }

    @Test
    @DisplayName("Lấy thông tin chi tiết kỳ kê khai thuế thành công với vai trò VT-03")
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    public void getTaxPeriodDetail_success() throws Exception {
        TaxPeriodResponse response = TaxPeriodResponse.builder()
                .id("period-123")
                .periodName("Tháng 09/2026")
                .build();

        when(taxPeriodService.getTaxPeriodDetail(eq("accountant_test"), eq("period-123")))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/tax-periods/period-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("period-123"));
    }

    @Test
    @DisplayName("Lấy danh sách các kỳ kê khai thuế thành công với vai trò VT-01")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void getAllTaxPeriods_success() throws Exception {
        TaxPeriodResponse response = TaxPeriodResponse.builder()
                .id("period-123")
                .periodName("Tháng 09/2026")
                .build();

        when(taxPeriodService.getAllTaxPeriods(eq("owner_test")))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/api/v1/tax-periods"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].id").value("period-123"));
    }
}
