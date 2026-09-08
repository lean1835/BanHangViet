package com.sales.controller;

import com.sales.dto.response.InvoiceAutoRetrySummaryResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.dto.response.PageResponse;
import com.sales.service.interfaces.EInvoiceAutoRetryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class EInvoiceAutoRetryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EInvoiceAutoRetryService autoRetryService;

    @Test
    @DisplayName("POST /trigger - Chưa đăng nhập trả về 401 UNAUTHORIZED")
    void triggerAutoRetry_Unauthenticated() throws Exception {
        mockMvc.perform(post("/api/v1/invoices/auto-retry/trigger"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("POST /trigger - VT-02 không có quyền kích hoạt trigger -> 403 FORBIDDEN")
    void triggerAutoRetry_ForbiddenForVT02() throws Exception {
        mockMvc.perform(post("/api/v1/invoices/auto-retry/trigger"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "chuho_test", roles = {"VT-01"})
    @DisplayName("POST /trigger - VT-01 kích hoạt thành công -> 200 OK")
    void triggerAutoRetry_SuccessForVT01() throws Exception {
        InvoiceAutoRetrySummaryResponse summary = InvoiceAutoRetrySummaryResponse.builder()
                .totalProcessed(1)
                .successCount(1)
                .failedCount(0)
                .movedToManualCount(0)
                .issuedInvoiceIds(List.of("inv-1"))
                .manualProcessingInvoiceIds(Collections.emptyList())
                .build();

        when(autoRetryService.processManualAutoRetryForUser("chuho_test")).thenReturn(summary);

        mockMvc.perform(post("/api/v1/invoices/auto-retry/trigger"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalProcessed").value(1))
                .andExpect(jsonPath("$.result.successCount").value(1));
    }

    @Test
    @WithMockUser(username = "ketoan_test", roles = {"VT-03"})
    @DisplayName("POST /trigger - VT-03 kích hoạt thành công -> 200 OK")
    void triggerAutoRetry_SuccessForVT03() throws Exception {
        InvoiceAutoRetrySummaryResponse summary = InvoiceAutoRetrySummaryResponse.builder()
                .totalProcessed(0)
                .successCount(0)
                .failedCount(0)
                .movedToManualCount(0)
                .issuedInvoiceIds(Collections.emptyList())
                .manualProcessingInvoiceIds(Collections.emptyList())
                .build();

        when(autoRetryService.processManualAutoRetryForUser("ketoan_test")).thenReturn(summary);

        mockMvc.perform(post("/api/v1/invoices/auto-retry/trigger"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("POST /{invoiceId}/resend - VT-02 có quyền gửi lại đơn lẻ -> 200 OK")
    void retrySingleInvoice_SuccessForVT02() throws Exception {
        InvoiceResponse response = InvoiceResponse.builder()
                .id("inv-100")
                .status("WAITING_TAX_CODE")
                .build();

        when(autoRetryService.retryInvoiceSingle("nhanvien_test", "inv-100")).thenReturn(response);

        mockMvc.perform(post("/api/v1/invoices/auto-retry/inv-100/resend"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("inv-100"))
                .andExpect(jsonPath("$.result.status").value("WAITING_TAX_CODE"));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("GET /manual-processing - VT-02 xem danh sách xử lý thủ công thành công -> 200 OK")
    void getManualProcessingInvoices_SuccessForVT02() throws Exception {
        PageResponse<InvoiceResponse> pageResponse = PageResponse.<InvoiceResponse>builder()
                .content(List.of(InvoiceResponse.builder().id("inv-1").status("MANUAL_PROCESSING").build()))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1)
                .totalPages(1)
                .last(true)
                .build();

        when(autoRetryService.getManualProcessingInvoices(anyString(), anyInt(), anyInt()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/invoices/auto-retry/manual-processing"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].id").value("inv-1"))
                .andExpect(jsonPath("$.result.content[0].status").value("MANUAL_PROCESSING"));
    }
}
