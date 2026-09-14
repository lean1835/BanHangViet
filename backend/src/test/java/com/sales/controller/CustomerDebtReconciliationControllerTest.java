package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ReconciliationStatus;
import com.sales.dto.request.ConfirmDebtReconciliationRequest;
import com.sales.dto.request.CreateDebtAdjustmentRequest;
import com.sales.dto.request.CreateDebtReconciliationRequest;
import com.sales.dto.request.DebtReconciliationPreviewRequest;
import com.sales.dto.response.CustomerDebtResponse;
import com.sales.dto.response.DebtReconciliationItemResponse;
import com.sales.dto.response.DebtReconciliationResponse;
import com.sales.dto.response.DebtStatementPrintResponse;
import com.sales.service.interfaces.CustomerDebtReconciliationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class CustomerDebtReconciliationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CustomerDebtReconciliationService reconciliationService;

    @Test
    @DisplayName("Chưa đăng nhập -> Trả về 401 Unauthorized")
    void unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/v1/debts/reconciliations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /preview: Xem trước đối chiếu công nợ thành công (200 OK)")
    @WithMockUser(username = "chuhoviet", roles = {"VT-01"})
    void previewReconciliation_Success() throws Exception {
        DebtReconciliationPreviewRequest request = DebtReconciliationPreviewRequest.builder()
                .customerId("cust-001")
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().minusDays(1))
                .build();

        DebtReconciliationResponse response = DebtReconciliationResponse.builder()
                .customerId("cust-001")
                .customerName("Nguyễn Văn Ba")
                .openingDebtBalance(new BigDecimal("1500000.00"))
                .totalDebtIncurred(new BigDecimal("800000.00"))
                .totalDebtPaid(new BigDecimal("400000.00"))
                .closingDebtBalance(new BigDecimal("1900000.00"))
                .closingDebtInWords("Một triệu chín trăm nghìn đồng")
                .status(ReconciliationStatus.DRAFT)
                .hasTransactions(true)
                .items(List.of(
                        DebtReconciliationItemResponse.builder()
                                .referenceCode("HD-001")
                                .amount(new BigDecimal("500000.00"))
                                .runningBalance(new BigDecimal("2000000.00"))
                                .build()
                ))
                .build();

        when(reconciliationService.previewReconciliation(eq("chuhoviet"), any(DebtReconciliationPreviewRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/debts/reconciliations/preview")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.customerName").value("Nguyễn Văn Ba"))
                .andExpect(jsonPath("$.result.closingDebtBalance").value(1900000.00))
                .andExpect(jsonPath("$.result.closingDebtInWords").value("Một triệu chín trăm nghìn đồng"));
    }

    @Test
    @DisplayName("POST /reconciliations: Chủ hộ (VT-01) tạo biên bản thành công (201 Created)")
    @WithMockUser(username = "chuhoviet", roles = {"VT-01"})
    void createReconciliation_OwnerRole_Success() throws Exception {
        CreateDebtReconciliationRequest request = CreateDebtReconciliationRequest.builder()
                .customerId("cust-001")
                .startDate(LocalDate.now().minusDays(10))
                .endDate(LocalDate.now().minusDays(1))
                .notes("Lập đối chiếu")
                .confirmNow(false)
                .build();

        DebtReconciliationResponse response = DebtReconciliationResponse.builder()
                .id("rec-001")
                .code("DREC-260913-0001")
                .status(ReconciliationStatus.DRAFT)
                .closingDebtBalance(new BigDecimal("1900000.00"))
                .build();

        when(reconciliationService.createReconciliation(eq("chuhoviet"), any(CreateDebtReconciliationRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/debts/reconciliations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("rec-001"))
                .andExpect(jsonPath("$.result.status").value("DRAFT"));
    }

    @Test
    @DisplayName("POST /reconciliations: Nhân viên (VT-02) bị chặn quyền tạo đối chiếu (403 Forbidden)")
    @WithMockUser(username = "nhanvien", roles = {"VT-02"})
    void createReconciliation_StaffRole_Forbidden() throws Exception {
        CreateDebtReconciliationRequest request = CreateDebtReconciliationRequest.builder()
                .customerId("cust-001")
                .startDate(LocalDate.now().minusDays(5))
                .endDate(LocalDate.now().minusDays(1))
                .build();

        mockMvc.perform(post("/api/v1/debts/reconciliations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /reconciliations/{id}/confirm: Chủ hộ xác nhận chốt sổ thành công (200 OK)")
    @WithMockUser(username = "chuhoviet", roles = {"VT-01"})
    void confirmReconciliation_OwnerRole_Success() throws Exception {
        ConfirmDebtReconciliationRequest request = ConfirmDebtReconciliationRequest.builder()
                .notes("Khách hàng đã ký")
                .build();

        DebtReconciliationResponse response = DebtReconciliationResponse.builder()
                .id("rec-001")
                .status(ReconciliationStatus.CONFIRMED)
                .reconciledToDate(LocalDate.now().minusDays(1))
                .confirmedAt(LocalDateTime.now())
                .build();

        when(reconciliationService.confirmReconciliation(eq("chuhoviet"), eq("rec-001"), any(ConfirmDebtReconciliationRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/debts/reconciliations/rec-001/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.status").value("CONFIRMED"));
    }

    @Test
    @DisplayName("POST /reconciliations/{id}/confirm: Nhân viên (VT-02) bị chặn xác nhận chốt sổ (403 Forbidden)")
    @WithMockUser(username = "nhanvien", roles = {"VT-02"})
    void confirmReconciliation_StaffRole_Forbidden() throws Exception {
        mockMvc.perform(post("/api/v1/debts/reconciliations/rec-001/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /reconciliations/{id}/cancel: Hủy biên bản nháp thành công (200 OK)")
    @WithMockUser(username = "chuhoviet", roles = {"VT-01"})
    void cancelReconciliation_Success() throws Exception {
        doNothing().when(reconciliationService).cancelReconciliation("chuhoviet", "rec-001");

        mockMvc.perform(post("/api/v1/debts/reconciliations/rec-001/cancel"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    @DisplayName("GET /reconciliations/{id}: Xem chi tiết biên bản đối chiếu (200 OK)")
    @WithMockUser(username = "chuhoviet", roles = {"VT-01"})
    void getReconciliationById_Success() throws Exception {
        DebtReconciliationResponse response = DebtReconciliationResponse.builder()
                .id("rec-001")
                .code("DREC-260913-0001")
                .customerName("Nguyễn Văn Ba")
                .status(ReconciliationStatus.CONFIRMED)
                .build();

        when(reconciliationService.getReconciliationById("chuhoviet", "rec-001"))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/debts/reconciliations/rec-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.code").value("DREC-260913-0001"));
    }

    @Test
    @DisplayName("GET /reconciliations: Lấy danh sách lịch sử đối chiếu (200 OK)")
    @WithMockUser(username = "nhanvien", roles = {"VT-02"})
    void getReconciliations_Success() throws Exception {
        DebtReconciliationResponse rec = DebtReconciliationResponse.builder()
                .id("rec-001")
                .code("DREC-260913-0001")
                .build();

        when(reconciliationService.getReconciliations(any(), any(), any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(rec)));

        mockMvc.perform(get("/api/v1/debts/reconciliations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.content[0].code").value("DREC-260913-0001"));
    }

    @Test
    @DisplayName("GET /reconciliations/{id}/print: Lấy mẫu in Giấy Xác Nhận Nợ (200 OK)")
    @WithMockUser(username = "nhanvien", roles = {"VT-02"})
    void getPrintStatement_Success() throws Exception {
        DebtStatementPrintResponse response = DebtStatementPrintResponse.builder()
                .documentTitle("GIẤY ĐỐI CHIẾU VÀ XÁC NHẬN CÔNG NỢ")
                .reconciliationCode("DREC-260913-0001")
                .householdName("Tạp Hóa Việt Hưng")
                .customerName("Nguyễn Văn Ba")
                .closingDebtBalance(new BigDecimal("1900000.00"))
                .closingDebtInWords("Một triệu chín trăm nghìn đồng")
                .sellerSignTitle("ĐẠI DIỆN BÊN BÁN")
                .buyerSignTitle("ĐẠI DIỆN BÊN MUA")
                .build();

        when(reconciliationService.getPrintStatement("nhanvien", "rec-001"))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/debts/reconciliations/rec-001/print"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.documentTitle").value("GIẤY ĐỐI CHIẾU VÀ XÁC NHẬN CÔNG NỢ"))
                .andExpect(jsonPath("$.result.sellerSignTitle").value("ĐẠI DIỆN BÊN BÁN"));
    }

    @Test
    @DisplayName("POST /adjustments: Chủ hộ tạo bút toán điều chỉnh thành công (200 OK)")
    @WithMockUser(username = "chuhoviet", roles = {"VT-01"})
    void createDebtAdjustment_OwnerRole_Success() throws Exception {
        CreateDebtAdjustmentRequest request = CreateDebtAdjustmentRequest.builder()
                .customerId("cust-001")
                .adjustmentType("DEBT_INCREASE")
                .amount(new BigDecimal("50000.00"))
                .reason("Điều chỉnh tiền bao bì")
                .build();

        CustomerDebtResponse response = CustomerDebtResponse.builder()
                .id("adj-01")
                .amount(new BigDecimal("50000.00"))
                .type("DEBT_CREATED")
                .notes("[Bút toán điều chỉnh]: Điều chỉnh tiền bao bì")
                .build();

        when(reconciliationService.createDebtAdjustment(eq("chuhoviet"), any(CreateDebtAdjustmentRequest.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/debts/adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.amount").value(50000.00));
    }

    @Test
    @DisplayName("POST /adjustments: Nhân viên (VT-02) bị chặn tạo bút toán điều chỉnh (403 Forbidden)")
    @WithMockUser(username = "nhanvien", roles = {"VT-02"})
    void createDebtAdjustment_StaffRole_Forbidden() throws Exception {
        CreateDebtAdjustmentRequest request = CreateDebtAdjustmentRequest.builder()
                .customerId("cust-001")
                .adjustmentType("DEBT_DECREASE")
                .amount(new BigDecimal("50000.00"))
                .reason("Giảm nợ")
                .build();

        mockMvc.perform(post("/api/v1/debts/adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("P2: POST /reconciliations/{id}/confirm: Ghi chú vượt quá 1000 ký tự bị từ chối (400 Bad Request)")
    @WithMockUser(username = "chuhoviet", roles = {"VT-01"})
    void confirmReconciliation_NotesTooLong_BadRequest() throws Exception {
        ConfirmDebtReconciliationRequest request = ConfirmDebtReconciliationRequest.builder()
                .notes("a".repeat(1001))
                .build();

        mockMvc.perform(post("/api/v1/debts/reconciliations/rec-001/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("P2: POST /adjustments: Loại điều chỉnh không đúng pattern (DEBT_INCREASE/DEBT_DECREASE) bị từ chối (400 Bad Request)")
    @WithMockUser(username = "chuhoviet", roles = {"VT-01"})
    void createDebtAdjustment_InvalidPattern_BadRequest() throws Exception {
        CreateDebtAdjustmentRequest request = CreateDebtAdjustmentRequest.builder()
                .customerId("cust-001")
                .adjustmentType("INVALID_TYPE")
                .amount(new BigDecimal("50000.00"))
                .reason("Điều chỉnh lý do hợp lệ")
                .build();

        mockMvc.perform(post("/api/v1/debts/adjustments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }
}
