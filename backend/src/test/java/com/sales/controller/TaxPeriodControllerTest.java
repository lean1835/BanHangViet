package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.GenerateTaxPurchaseRegisterRequest;
import com.sales.dto.request.GenerateTaxRegisterRequest;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.TaxPeriodResponse;
import com.sales.dto.response.TaxPurchaseRegisterItemResponse;
import com.sales.dto.response.TaxPurchaseRegisterSummaryResponse;
import com.sales.dto.response.TaxRevenueSummaryResponse;
import com.sales.dto.response.TaxSalesRegisterResponse;
import com.sales.service.interfaces.TaxPeriodService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    @Test
    @DisplayName("Lấy tổng hợp doanh thu chịu thuế thành công với vai trò VT-01 (Chủ hộ)")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void getTaxRevenueSummary_success_owner() throws Exception {
        TaxRevenueSummaryResponse response = TaxRevenueSummaryResponse.builder()
                .periodId("period-123")
                .periodName("Tháng 09/2026")
                .totalRevenue(new java.math.BigDecimal("184000000.00"))
                .totalTaxAmount(new java.math.BigDecimal("12200000.00"))
                .taxRateSummaries(Collections.emptyList())
                .build();

        when(taxPeriodService.getTaxRevenueSummary(eq("owner_test"), eq("period-123")))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/tax-periods/period-123/tax-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.periodId").value("period-123"))
                .andExpect(jsonPath("$.result.totalRevenue").value(184000000.00));
    }

    @Test
    @DisplayName("Lấy tổng hợp doanh thu chịu thuế thất bại (403) với vai trò VT-02 (Nhân viên bán hàng)")
    @WithMockUser(username = "sales_test", roles = {"VT-02"})
    public void getTaxRevenueSummary_forbidden_salesStaff() throws Exception {
        mockMvc.perform(get("/api/v1/tax-periods/period-123/tax-summary"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Xuất tờ khai thuế mô phỏng thành công với vai trò VT-01 (Chủ hộ)")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void exportTaxDeclaration_success_owner() throws Exception {
        byte[] sampleExcel = new byte[]{1, 2, 3, 4, 5};
        org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(sampleExcel);

        when(taxPeriodService.exportTaxDeclaration(eq("owner_test"), eq("period-123")))
                .thenReturn(ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"To_khai_thue_QUARTERLY_2026_3.xlsx\"")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .contentLength(sampleExcel.length)
                        .body(resource));

        mockMvc.perform(get("/api/v1/tax-periods/period-123/export-declaration"))
                .andExpect(status().isOk())
                .andExpect(header().string(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"To_khai_thue_QUARTERLY_2026_3.xlsx\""))
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(content().bytes(sampleExcel));
    }

    @Test
    @DisplayName("Xuất tờ khai thuế mô phỏng thành công với vai trò VT-03 (Kế toán)")
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    public void exportTaxDeclaration_success_accountant() throws Exception {
        byte[] sampleExcel = new byte[]{10, 20, 30};
        org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(sampleExcel);

        when(taxPeriodService.exportTaxDeclaration(eq("accountant_test"), eq("period-123")))
                .thenReturn(ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"To_khai_thue_QUARTERLY_2026_3.xlsx\"")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .contentLength(sampleExcel.length)
                        .body(resource));

        mockMvc.perform(get("/api/v1/tax-periods/period-123/export-declaration"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(content().bytes(sampleExcel));
    }

    @Test
    @DisplayName("Xuất tờ khai thuế mô phỏng thất bại (403) với vai trò VT-02 (Nhân viên bán hàng)")
    @WithMockUser(username = "sales_test", roles = {"VT-02"})
    public void exportTaxDeclaration_forbidden_salesStaff() throws Exception {
        mockMvc.perform(get("/api/v1/tax-periods/period-123/export-declaration"))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // TESTS FOR NCL-12-CN-004: Chốt kỳ kê khai và khóa số liệu
    // =========================================================================

    @Test
    @DisplayName("Chốt kỳ kê khai thuế thành công (200) với vai trò VT-01 (Chủ hộ)")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void lockTaxPeriod_success_owner() throws Exception {
        TaxPeriodResponse response = TaxPeriodResponse.builder()
                .id("period-123")
                .periodName("Bảng kê hóa đơn bán ra Quý 3 năm 2026")
                .status("LOCKED")
                .lockedByName("Chủ Hộ")
                .lockedAt(java.time.LocalDateTime.now())
                .build();

        when(taxPeriodService.lockTaxPeriod(eq("owner_test"), eq("period-123")))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/tax-periods/period-123/lock"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("period-123"))
                .andExpect(jsonPath("$.result.status").value("LOCKED"));
    }

    @Test
    @DisplayName("Chốt kỳ kê khai thuế thất bại (403) với vai trò VT-03 (Kế toán)")
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    public void lockTaxPeriod_forbidden_accountant() throws Exception {
        mockMvc.perform(post("/api/v1/tax-periods/period-123/lock"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Chốt kỳ kê khai thuế thất bại (403) với vai trò VT-02 (Nhân viên bán hàng)")
    @WithMockUser(username = "sales_test", roles = {"VT-02"})
    public void lockTaxPeriod_forbidden_salesStaff() throws Exception {
        mockMvc.perform(post("/api/v1/tax-periods/period-123/lock"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Mở lại kỳ kê khai thuế thành công (200) với vai trò VT-01 (Chủ hộ)")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void unlockTaxPeriod_success_owner() throws Exception {
        com.sales.dto.request.UnlockTaxPeriodRequest request = com.sales.dto.request.UnlockTaxPeriodRequest.builder()
                .reason("Cần điều chỉnh bổ sung hóa đơn")
                .build();

        TaxPeriodResponse response = TaxPeriodResponse.builder()
                .id("period-123")
                .periodName("Bảng kê hóa đơn bán ra Quý 3 năm 2026")
                .status("GENERATED")
                .build();

        when(taxPeriodService.unlockTaxPeriod(eq("owner_test"), eq("period-123"), any(com.sales.dto.request.UnlockTaxPeriodRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/tax-periods/period-123/unlock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("period-123"))
                .andExpect(jsonPath("$.result.status").value("GENERATED"));
    }

    @Test
    @DisplayName("Mở lại kỳ kê khai thuế thất bại (403) với vai trò VT-03 (Kế toán)")
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    public void unlockTaxPeriod_forbidden_accountant() throws Exception {
        com.sales.dto.request.UnlockTaxPeriodRequest request = com.sales.dto.request.UnlockTaxPeriodRequest.builder()
                .reason("Cần điều chỉnh bổ sung hóa đơn")
                .build();

        mockMvc.perform(post("/api/v1/tax-periods/period-123/unlock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // TESTS FOR NCL-12-CN-006: Bảng kê hàng hóa mua vào theo kỳ
    // =========================================================================

    @Test
    @DisplayName("Lập bảng kê hàng hóa mua vào thành công (200) với vai trò VT-01 (Chủ hộ)")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void generatePurchaseRegister_success_owner() throws Exception {
        GenerateTaxPurchaseRegisterRequest request = GenerateTaxPurchaseRegisterRequest.builder()
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(3)
                .build();

        TaxPurchaseRegisterSummaryResponse response = TaxPurchaseRegisterSummaryResponse.builder()
                .periodId("period-p123")
                .periodName("Quý 3/2026")
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(3)
                .status("GENERATED")
                .grandTotalAmount(new java.math.BigDecimal("150000000.00"))
                .totalReceiptCount(5)
                .build();

        when(taxPeriodService.generatePurchaseRegister(eq("owner_test"), any(GenerateTaxPurchaseRegisterRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/tax-periods/generate-purchase-register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.periodId").value("period-p123"))
                .andExpect(jsonPath("$.result.grandTotalAmount").value(150000000.00))
                .andExpect(jsonPath("$.result.totalReceiptCount").value(5));
    }

    @Test
    @DisplayName("Lập bảng kê hàng hóa mua vào thành công (200) với vai trò VT-03 (Kế toán)")
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    public void generatePurchaseRegister_success_accountant() throws Exception {
        GenerateTaxPurchaseRegisterRequest request = GenerateTaxPurchaseRegisterRequest.builder()
                .periodType("MONTHLY")
                .year(2026)
                .periodNumber(9)
                .build();

        TaxPurchaseRegisterSummaryResponse response = TaxPurchaseRegisterSummaryResponse.builder()
                .periodId("period-m123")
                .periodName("Tháng 09/2026")
                .status("GENERATED")
                .build();

        when(taxPeriodService.generatePurchaseRegister(eq("accountant_test"), any(GenerateTaxPurchaseRegisterRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/tax-periods/generate-purchase-register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.periodId").value("period-m123"));
    }

    @Test
    @DisplayName("Lập bảng kê hàng hóa mua vào thất bại (403) với vai trò VT-02 (Nhân viên bán hàng)")
    @WithMockUser(username = "sales_test", roles = {"VT-02"})
    public void generatePurchaseRegister_forbidden_salesStaff() throws Exception {
        GenerateTaxPurchaseRegisterRequest request = GenerateTaxPurchaseRegisterRequest.builder()
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(3)
                .build();

        mockMvc.perform(post("/api/v1/tax-periods/generate-purchase-register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Lập bảng kê hàng hóa mua vào thất bại (403) với vai trò VT-04 (Quản trị nền tảng) theo HIGH-01")
    @WithMockUser(username = "admin_test", roles = {"VT-04"})
    public void generatePurchaseRegister_forbidden_platformAdmin() throws Exception {
        GenerateTaxPurchaseRegisterRequest request = GenerateTaxPurchaseRegisterRequest.builder()
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(3)
                .build();

        mockMvc.perform(post("/api/v1/tax-periods/generate-purchase-register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Lấy tổng hợp bảng kê mua vào thành công (200) với vai trò VT-01 (Chủ hộ)")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void getPurchaseRegisterSummary_success_owner() throws Exception {
        TaxPurchaseRegisterSummaryResponse summary = TaxPurchaseRegisterSummaryResponse.builder()
                .periodId("period-p123")
                .periodName("Quý 3/2026")
                .grandTotalAmount(new java.math.BigDecimal("150000000.00"))
                .totalReceiptCount(5)
                .hasMissingSupplierReceipts(false)
                .validSuppliers(Collections.emptyList())
                .build();

        when(taxPeriodService.getPurchaseRegisterSummary(eq("owner_test"), eq("period-p123")))
                .thenReturn(summary);

        mockMvc.perform(get("/api/v1/tax-periods/period-p123/purchase-register"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.periodId").value("period-p123"))
                .andExpect(jsonPath("$.result.grandTotalAmount").value(150000000.00))
                .andExpect(jsonPath("$.result.totalReceiptCount").value(5))
                .andExpect(jsonPath("$.result.hasMissingSupplierReceipts").value(false));
    }

    @Test
    @DisplayName("Lấy tổng hợp bảng kê mua vào thất bại (403) với vai trò VT-02 (Nhân viên bán hàng)")
    @WithMockUser(username = "sales_test", roles = {"VT-02"})
    public void getPurchaseRegisterSummary_forbidden_salesStaff() throws Exception {
        mockMvc.perform(get("/api/v1/tax-periods/period-p123/purchase-register"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Lấy danh sách dòng chi tiết bảng kê mua vào thành công (200) với phân trang")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void getPurchaseRegisterItems_success() throws Exception {
        TaxPurchaseRegisterItemResponse item = TaxPurchaseRegisterItemResponse.builder()
                .id("reg-item-1")
                .receiptNumber("PNK-202609-001")
                .productName("Xi măng Holcim PCB40")
                .baseQuantity(new java.math.BigDecimal("50.00"))
                .basePurchasePrice(new java.math.BigDecimal("85000.00"))
                .totalAmount(new java.math.BigDecimal("4250000.00"))
                .build();

        PageResponse<TaxPurchaseRegisterItemResponse> pageResponse = PageResponse.<TaxPurchaseRegisterItemResponse>builder()
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .content(List.of(item))
                .build();

        when(taxPeriodService.getPurchaseRegisterItems(eq("owner_test"), eq("period-p123"), eq(0), eq(10), any()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/tax-periods/period-p123/purchase-register/items?page=0&size=10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].id").value("reg-item-1"))
                .andExpect(jsonPath("$.result.content[0].productName").value("Xi măng Holcim PCB40"))
                .andExpect(jsonPath("$.result.content[0].totalAmount").value(4250000.00));
    }

    @Test
    @DisplayName("Lấy danh sách dòng chi tiết bảng kê mua vào thất bại (403) với vai trò VT-02")
    @WithMockUser(username = "sales_test", roles = {"VT-02"})
    public void getPurchaseRegisterItems_forbidden_salesStaff() throws Exception {
        mockMvc.perform(get("/api/v1/tax-periods/period-p123/purchase-register/items?page=0&size=10"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Xuất Excel bảng kê hàng hóa mua vào thành công (200) với vai trò VT-01 (Chủ hộ)")
    @WithMockUser(username = "owner_test", roles = {"VT-01"})
    public void exportPurchaseRegister_success_owner() throws Exception {
        byte[] sampleExcel = new byte[]{1, 2, 3, 4, 5, 6, 7};
        org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(sampleExcel);

        when(taxPeriodService.exportPurchaseRegister(eq("owner_test"), eq("period-p123")))
                .thenReturn(ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Bang_ke_mua_vao_QUARTERLY_2026_3.xlsx\"")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .contentLength(sampleExcel.length)
                        .body(resource));

        mockMvc.perform(get("/api/v1/tax-periods/period-p123/export-purchase-register"))
                .andExpect(status().isOk())
                .andExpect(header().string(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Bang_ke_mua_vao_QUARTERLY_2026_3.xlsx\""))
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(content().bytes(sampleExcel));
    }

    @Test
    @DisplayName("Xuất Excel bảng kê hàng hóa mua vào thành công (200) với vai trò VT-03 (Kế toán)")
    @WithMockUser(username = "accountant_test", roles = {"VT-03"})
    public void exportPurchaseRegister_success_accountant() throws Exception {
        byte[] sampleExcel = new byte[]{9, 8, 7};
        org.springframework.core.io.ByteArrayResource resource = new org.springframework.core.io.ByteArrayResource(sampleExcel);

        when(taxPeriodService.exportPurchaseRegister(eq("accountant_test"), eq("period-p123")))
                .thenReturn(ResponseEntity.ok()
                        .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Bang_ke_mua_vao_QUARTERLY_2026_3.xlsx\"")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .contentLength(sampleExcel.length)
                        .body(resource));

        mockMvc.perform(get("/api/v1/tax-periods/period-p123/export-purchase-register"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andExpect(content().bytes(sampleExcel));
    }

    @Test
    @DisplayName("Xuất Excel bảng kê hàng hóa mua vào thất bại (403) với vai trò VT-02 (Nhân viên bán hàng)")
    @WithMockUser(username = "sales_test", roles = {"VT-02"})
    public void exportPurchaseRegister_forbidden_salesStaff() throws Exception {
        mockMvc.perform(get("/api/v1/tax-periods/period-p123/export-purchase-register"))
                .andExpect(status().isForbidden());
    }
}


