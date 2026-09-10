package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateDiningTableRequest;
import com.sales.dto.request.UpdateDiningTableRequest;
import com.sales.dto.response.DiningTableResponse;
import com.sales.service.interfaces.DiningTableService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class DiningTableControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DiningTableService diningTableService;

    @Test
    @DisplayName("GET /api/v1/dining-tables - Chưa đăng nhập trả về 401")
    void getTables_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/dining-tables"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "thungan1", roles = {"VT-02"})
    @DisplayName("GET /api/v1/dining-tables - Thu ngân (VT-02) có quyền xem danh sách bàn ăn")
    void getTables_cashier_success() throws Exception {
        when(diningTableService.getTables(eq("thungan1"), any(), any()))
                .thenReturn(List.of(
                        DiningTableResponse.builder()
                                .id("table-001")
                                .name("Bàn 1")
                                .area("Tầng 1")
                                .isOccupied(false)
                                .build()
                ));

        mockMvc.perform(get("/api/v1/dining-tables"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].name").value("Bàn 1"));
    }

    @Test
    @WithMockUser(username = "chuhuyen", roles = {"VT-01"})
    @DisplayName("POST /api/v1/dining-tables - Chủ hộ (VT-01) tạo bàn ăn thành công")
    void createTable_owner_success() throws Exception {
        CreateDiningTableRequest request = CreateDiningTableRequest.builder()
                .name("Bàn 5")
                .area("Sân vườn")
                .seatCapacity(6)
                .build();

        when(diningTableService.createTable(eq("chuhuyen"), any(CreateDiningTableRequest.class)))
                .thenReturn(DiningTableResponse.builder()
                        .id("table-005")
                        .name("Bàn 5")
                        .area("Sân vườn")
                        .seatCapacity(6)
                        .build());

        mockMvc.perform(post("/api/v1/dining-tables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.id").value("table-005"))
                .andExpect(jsonPath("$.result.name").value("Bàn 5"));
    }

    @Test
    @WithMockUser(username = "thungan1", roles = {"VT-02"})
    @DisplayName("POST /api/v1/dining-tables - Thu ngân (VT-02) tạo bàn bị chặn 403 Forbidden")
    void createTable_cashier_forbidden() throws Exception {
        CreateDiningTableRequest request = CreateDiningTableRequest.builder()
                .name("Bàn 5")
                .build();

        mockMvc.perform(post("/api/v1/dining-tables")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "chuhuyen", roles = {"VT-01"})
    @DisplayName("PUT /api/v1/dining-tables/{id} - Chủ hộ cập nhật bàn ăn thành công")
    void updateTable_owner_success() throws Exception {
        UpdateDiningTableRequest request = UpdateDiningTableRequest.builder()
                .name("Bàn 1 VIP")
                .area("Tầng 1")
                .seatCapacity(4)
                .build();

        when(diningTableService.updateTable(eq("chuhuyen"), eq("table-001"), any(UpdateDiningTableRequest.class)))
                .thenReturn(DiningTableResponse.builder()
                        .id("table-001")
                        .name("Bàn 1 VIP")
                        .build());

        mockMvc.perform(put("/api/v1/dining-tables/table-001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.name").value("Bàn 1 VIP"));
    }

    @Test
    @WithMockUser(username = "chuhuyen", roles = {"VT-01"})
    @DisplayName("DELETE /api/v1/dining-tables/{id} - Chủ hộ xóa bàn ăn thành công")
    void deleteTable_owner_success() throws Exception {
        mockMvc.perform(delete("/api/v1/dining-tables/table-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }
}
