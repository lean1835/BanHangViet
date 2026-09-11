package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.ChangePasswordRequest;
import com.sales.dto.request.UpdatePhoneSendOtpRequest;
import com.sales.dto.request.UpdatePhoneVerifyOtpRequest;
import com.sales.dto.request.UpdateProfileRequest;
import com.sales.dto.response.ChangePasswordResponse;
import com.sales.dto.response.UpdatePhoneSendOtpResponse;
import com.sales.dto.response.UserProfileResponse;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.service.interfaces.JwtService;
import com.sales.service.interfaces.ProfileService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ProfileService profileService;

    @Test
    @DisplayName("GET /api/v1/profile - Chưa đăng nhập trả về 401 UNAUTHORIZED")
    public void getProfile_Unauthenticated() throws Exception {
        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value(2002));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("GET /api/v1/profile - Đã đăng nhập lấy thông tin thành công")
    public void getProfile_Authenticated_Success() throws Exception {
        UserProfileResponse mockResponse = UserProfileResponse.builder()
                .id("u-123")
                .username("nhanvien_test")
                .fullName("Trần Thị B")
                .phoneNumber("0907654321")
                .roleCode("VT-02")
                .roleName("Nhân viên bán hàng")
                .householdName("Hộ Tạp Hóa")
                .isActive(true)
                .build();

        when(profileService.getProfile("nhanvien_test")).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.username").value("nhanvien_test"))
                .andExpect(jsonPath("$.result.fullName").value("Trần Thị B"))
                .andExpect(jsonPath("$.result.roleCode").value("VT-02"));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("PUT /api/v1/profile - Cập nhật họ tên thành công")
    public void updateProfile_Success() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Trần Thị Cẩm Tú")
                .build();

        UserProfileResponse mockResponse = UserProfileResponse.builder()
                .id("u-123")
                .username("nhanvien_test")
                .fullName("Trần Thị Cẩm Tú")
                .phoneNumber("0907654321")
                .roleCode("VT-02")
                .build();

        when(profileService.updateProfile(eq("nhanvien_test"), any(UpdateProfileRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(put("/api/v1/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.fullName").value("Trần Thị Cẩm Tú"));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("POST /api/v1/profile/change-password - Đổi mật khẩu thành công")
    public void changePassword_Success() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPass@123")
                .newPassword("NewPass@456")
                .confirmPassword("NewPass@456")
                .build();

        ChangePasswordResponse mockResponse = ChangePasswordResponse.builder()
                .token("mock-new-jwt-token")
                .build();

        when(profileService.changePassword(eq("nhanvien_test"), any(ChangePasswordRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/profile/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.token").value("mock-new-jwt-token"))
                .andExpect(jsonPath("$.message").value("Đổi mật khẩu thành công. Các phiên làm việc khác đã được đăng xuất."));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("POST /api/v1/profile/change-password - Mật khẩu mới trùng mật khẩu cũ trả về 400")
    public void changePassword_SamePassword_BadRequest() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
                .currentPassword("OldPass@123")
                .newPassword("OldPass@123")
                .confirmPassword("OldPass@123")
                .build();

        doThrow(new AppException(ErrorCode.NEW_PASSWORD_SAME_AS_CURRENT))
                .when(profileService).changePassword(eq("nhanvien_test"), any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/v1/profile/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2042));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("POST /api/v1/profile/phone/send-otp - Gửi OTP thành công")
    public void sendUpdatePhoneOtp_Success() throws Exception {
        UpdatePhoneSendOtpRequest request = UpdatePhoneSendOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .build();

        UpdatePhoneSendOtpResponse mockResponse = UpdatePhoneSendOtpResponse.builder()
                .phoneNumber("0987654321")
                .expiresInSeconds(300)
                .message("Mã xác thực đã được gửi tới số điện thoại mới")
                .build();

        when(profileService.sendUpdatePhoneOtp(eq("nhanvien_test"), any(UpdatePhoneSendOtpRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/profile/phone/send-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.phoneNumber").value("0987654321"));
    }

    @Test
    @WithMockUser(username = "nhanvien_test", roles = {"VT-02"})
    @DisplayName("POST /api/v1/profile/phone/verify-otp - Xác thực OTP và cập nhật SĐT thành công")
    public void verifyAndUpdatePhone_Success() throws Exception {
        UpdatePhoneVerifyOtpRequest request = UpdatePhoneVerifyOtpRequest.builder()
                .newPhoneNumber("0987654321")
                .otpCode("654321")
                .build();

        UserProfileResponse mockResponse = UserProfileResponse.builder()
                .id("u-123")
                .username("nhanvien_test")
                .phoneNumber("0987654321")
                .roleCode("VT-02")
                .build();

        when(profileService.verifyAndUpdatePhone(eq("nhanvien_test"), any(UpdatePhoneVerifyOtpRequest.class)))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/profile/phone/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.phoneNumber").value("0987654321"));
    }
}
