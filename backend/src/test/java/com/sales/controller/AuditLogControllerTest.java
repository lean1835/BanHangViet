package com.sales.controller;

import com.sales.dto.response.ActivityLogResponse;
import com.sales.dto.response.AuditIntegrityResponse;
import com.sales.dto.response.PageResponse;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.service.interfaces.AuditLogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuditLogService auditLogService;

    @Test
    @WithMockUser(username = "owner1", roles = {"VT-01"})
    @DisplayName("GET /api/v1/audit-logs - Chủ hộ lấy danh sách nhật ký thành công 200 OK")
    void testGetAuditLogs_OwnerRole_Success() throws Exception {
        ActivityLogResponse item = ActivityLogResponse.builder()
                .id("log-1")
                .sequenceNumber(1L)
                .action("CANCEL_INVOICE")
                .targetTable("e_invoices")
                .previousHash("0000000000000000000000000000000000000000000000000000000000000000")
                .hash("abc123hash")
                .createdAt(LocalDateTime.now())
                .build();

        PageResponse<ActivityLogResponse> pageResponse = PageResponse.<ActivityLogResponse>builder()
                .content(List.of(item))
                .pageNumber(0)
                .pageSize(10)
                .totalElements(1L)
                .totalPages(1)
                .last(true)
                .build();

        when(auditLogService.getAuditLogs(eq("owner1"), any(), any(), any()))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/audit-logs")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].action").value("CANCEL_INVOICE"));
    }

    @Test
    @WithMockUser(username = "owner1", roles = {"VT-01"})
    @DisplayName("GET /api/v1/audit-logs/verify-integrity - Kiểm tra tính toàn vẹn Hash Chain 200 OK")
    void testVerifyIntegrity_Success() throws Exception {
        AuditIntegrityResponse response = AuditIntegrityResponse.builder()
                .isValid(true)
                .totalRecordsChecked(15L)
                .verifiedAt(LocalDateTime.now())
                .build();

        when(auditLogService.verifyIntegrity("owner1")).thenReturn(response);

        mockMvc.perform(get("/api/v1/audit-logs/verify-integrity"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.valid").value(true))
                .andExpect(jsonPath("$.result.totalRecordsChecked").value(15));
    }

    @Test
    @WithMockUser(username = "owner1", roles = {"VT-01"})
    @DisplayName("GET /api/v1/audit-logs/export - Xuất tệp báo cáo Excel 200 OK")
    void testExportAuditLogs_Success() throws Exception {
        byte[] fakeBytes = "excel_content_dummy".getBytes();
        when(auditLogService.exportAuditLogsToExcel(eq("owner1"), any(), any(), any()))
                .thenReturn(fakeBytes);

        mockMvc.perform(get("/api/v1/audit-logs/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=nhat_ky_kiem_toan.xlsx"));
    }

    @Test
    @WithMockUser(username = "owner1", roles = {"VT-01"})
    @DisplayName("PUT/DELETE /api/v1/audit-logs - Nhật ký kiểm toán là bất biến (QTN-25 & AUDIT_LOG_IMMUTABLE)")
    void testModificationBlocked() throws Exception {
        mockMvc.perform(delete("/api/v1/audit-logs/log-1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(6001));

        mockMvc.perform(put("/api/v1/audit-logs/log-1"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(6001));
    }
}
