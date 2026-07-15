package com.viet.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void register_success() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .householdName("Cửa Hàng Thực Phẩm Sạch")
                .taxCode("0987654321")
                .householdAddress("789 Nguyễn Huệ, Quận 1, TP. HCM")
                .householdPhone("02838291234")
                .username("chuho_test_success")
                .password("password123")
                .fullName("Trần Văn Test")
                .phone("0987654321")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Đăng ký hộ kinh doanh thành công"))
                .andExpect(jsonPath("$.result.taxCode").value("0987654321"))
                .andExpect(jsonPath("$.result.username").value("chuho_test_success"))
                .andExpect(jsonPath("$.result.roleCode").value("VT-01"));
    }

    @Test
    public void register_duplicateTaxCode_fails() throws Exception {
        RegisterRequest request1 = RegisterRequest.builder()
                .householdName("Cửa Hàng A")
                .taxCode("1112223334")
                .householdAddress("Địa chỉ A")
                .householdPhone("0123456789")
                .username("username_a")
                .password("password123")
                .fullName("Họ và Tên A")
                .build();

        // Register first time
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        // Register second time with same tax code but different username
        RegisterRequest request2 = RegisterRequest.builder()
                .householdName("Cửa Hàng B")
                .taxCode("1112223334") // Same tax code
                .householdAddress("Địa chỉ B")
                .householdPhone("0987654321")
                .username("username_b")
                .password("password123")
                .fullName("Họ và Tên B")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2003)) // TAX_CODE_ALREADY_EXISTS code
                .andExpect(jsonPath("$.message").value("Mã số thuế đã tồn tại trên hệ thống"));
    }

    @Test
    public void register_duplicateUsername_fails() throws Exception {
        RegisterRequest request1 = RegisterRequest.builder()
                .householdName("Cửa Hàng C")
                .taxCode("2223334445")
                .householdAddress("Địa chỉ C")
                .householdPhone("0123456789")
                .username("username_c")
                .password("password123")
                .fullName("Họ và Tên C")
                .build();

        // Register first time
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        // Register second time with same username but different tax code
        RegisterRequest request2 = RegisterRequest.builder()
                .householdName("Cửa Hàng D")
                .taxCode("2223334446") // Different tax code
                .householdAddress("Địa chỉ D")
                .householdPhone("0987654321")
                .username("username_c") // Same username
                .password("password123")
                .fullName("Họ và Tên D")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2004)) // USERNAME_ALREADY_EXISTS code
                .andExpect(jsonPath("$.message").value("Tên đăng nhập đã tồn tại trên hệ thống"));
    }
}
