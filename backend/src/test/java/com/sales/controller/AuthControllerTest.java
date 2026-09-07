package com.sales.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.LoginRequest;
import com.sales.dto.request.RegisterRequest;
import com.sales.entity.User;
import com.sales.repository.UserRepository;
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

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.sales.repository.PasswordResetOtpRepository otpRepository;

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

    @Test
    public void login_success() throws Exception {
        // Register a user first
        RegisterRequest registerReq = RegisterRequest.builder()
                .householdName("Hộ Kinh Doanh Login")
                .taxCode("1212121212")
                .householdAddress("Hà Nội")
                .householdPhone("0989998887")
                .username("username_login_success")
                .password("secret123")
                .fullName("Chủ Hộ Login")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk());

        // Perform login
        LoginRequest loginReq = LoginRequest.builder()
                .username("username_login_success")
                .password("secret123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.message").value("Đăng nhập thành công"))
                .andExpect(jsonPath("$.result.token").exists())
                .andExpect(jsonPath("$.result.username").value("username_login_success"))
                .andExpect(jsonPath("$.result.roleCode").value("VT-01"));
    }

    @Test
    public void login_wrongPassword_fails() throws Exception {
        // Register a user first
        RegisterRequest registerReq = RegisterRequest.builder()
                .householdName("Hộ Kinh Doanh Password Fail")
                .taxCode("1313131313")
                .householdAddress("Hải Phòng")
                .householdPhone("0989998886")
                .username("username_pw_fail")
                .password("secret123")
                .fullName("Chủ Hộ Pw Fail")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk());

        // Perform login with wrong password
        LoginRequest loginReq = LoginRequest.builder()
                .username("username_pw_fail")
                .password("wrong_password")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2007))
                .andExpect(jsonPath("$.message").value("Mật khẩu không chính xác"));
    }

    @Test
    public void login_userNotFound_fails() throws Exception {
        LoginRequest loginReq = LoginRequest.builder()
                .username("non_existing_user")
                .password("some_password")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(2001))
                .andExpect(jsonPath("$.message").value("Người dùng không tồn tại"));
    }

    @Test
    public void login_userBlocked_fails() throws Exception {
        // Register a user first
        RegisterRequest registerReq = RegisterRequest.builder()
                .householdName("Hộ Kinh Doanh Blocked")
                .taxCode("1414141414")
                .householdAddress("Đà Nẵng")
                .householdPhone("0989998885")
                .username("username_blocked")
                .password("secret123")
                .fullName("Chủ Hộ Blocked")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk());

        // Block the user in database
        User user = userRepository.findByUsername("username_blocked")
                .orElseThrow(() -> new AssertionError("User should have been created"));
        user.setIsActive(false);
        userRepository.saveAndFlush(user);

        // Perform login
        LoginRequest loginReq = LoginRequest.builder()
                .username("username_blocked")
                .password("secret123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(2008))
                .andExpect(jsonPath("$.message").value("Tài khoản đã bị khóa. Vui lòng liên hệ chủ hộ kinh doanh để được hỗ trợ"));
    }

    @Test
    public void forgotPassword_and_resetPassword_flow_success() throws Exception {
        // 1. Đăng ký tài khoản
        RegisterRequest registerReq = RegisterRequest.builder()
                .householdName("Hộ Kinh Doanh Reset Test")
                .taxCode("9876543210")
                .householdAddress("Hà Nội")
                .householdPhone("0912345679")
                .username("user_reset_test")
                .password("oldPassword123")
                .fullName("Chủ Hộ Reset")
                .phone("0912345679")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk());

        // Đăng nhập trước khi đổi mật khẩu để lấy oldToken
        LoginRequest loginInitialReq = LoginRequest.builder()
                .username("user_reset_test")
                .password("oldPassword123")
                .build();

        String loginInitialResp = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginInitialReq)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String oldToken = objectMapper.readTree(loginInitialResp).path("result").path("token").asText();

        // Kiểm tra oldToken hoạt động bình thường
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/employees")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isOk());

        // 2. Gửi yêu cầu quên mật khẩu
        com.sales.dto.request.ForgotPasswordRequest forgotReq = com.sales.dto.request.ForgotPasswordRequest.builder()
                .phoneNumber("0912345679")
                .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.phoneNumber").value("0912345679"))
                .andExpect(jsonPath("$.result.otpCode").doesNotExist());

        // Lấy OTP từ cơ sở dữ liệu (mô phỏng người dùng nhận qua tin nhắn SMS)
        String otpCode = otpRepository.findTopByPhoneNumberAndIsUsedFalseOrderByCreatedAtDesc("0912345679")
                .orElseThrow(() -> new AssertionError("OTP record should exist in database"))
                .getOtpCode();

        // 3. Xác thực OTP
        com.sales.dto.request.VerifyOtpRequest verifyReq = com.sales.dto.request.VerifyOtpRequest.builder()
                .phoneNumber("0912345679")
                .otpCode(otpCode)
                .build();

        mockMvc.perform(post("/api/v1/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.valid").value(true));

        // 4. Đặt lại mật khẩu mới
        com.sales.dto.request.ResetPasswordRequest resetReq = com.sales.dto.request.ResetPasswordRequest.builder()
                .phoneNumber("0912345679")
                .otpCode(otpCode)
                .newPassword("newPassword456")
                .confirmPassword("newPassword456")
                .build();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));

        // 5. Kiểm tra NCL-01-CN-005-TC-01: oldToken phải bị vô hiệu hóa ngay lập tức
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get("/api/v1/employees")
                        .header("Authorization", "Bearer " + oldToken))
                .andExpect(status().isUnauthorized());

        // 6. Đăng nhập bằng mật khẩu mới thành công
        LoginRequest loginNewReq = LoginRequest.builder()
                .username("user_reset_test")
                .password("newPassword456")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginNewReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.token").isNotEmpty());

        // 7. Đăng nhập bằng mật khẩu cũ thất bại
        LoginRequest loginOldReq = LoginRequest.builder()
                .username("user_reset_test")
                .password("oldPassword123")
                .build();

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginOldReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(2007));
    }

    @Test
    public void forgotPassword_and_resetPassword_flow_email_success() throws Exception {
        RegisterRequest registerReq = RegisterRequest.builder()
                .householdName("Hộ Email Reset Test")
                .taxCode("9876543211")
                .householdAddress("TP.HCM")
                .householdPhone("0934567890")
                .username("user_email_test")
                .password("oldPassword123")
                .fullName("Chủ Hộ Email Test")
                .phone("0934567890")
                .build();

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk());

        User user = userRepository.findByUsername("user_email_test")
                .orElseThrow(() -> new AssertionError("Registered user should exist"));
        user.setEmail("test.reset@gmail.com");
        userRepository.save(user);

        // 2. Gửi yêu cầu quên mật khẩu qua Gmail
        com.sales.dto.request.ForgotPasswordRequest forgotReq = com.sales.dto.request.ForgotPasswordRequest.builder()
                .email("test.reset@gmail.com")
                .build();

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(forgotReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.email").value("test.reset@gmail.com"))
                .andExpect(jsonPath("$.result.otpCode").doesNotExist());

        // Lấy OTP từ cơ sở dữ liệu (mô phỏng người dùng nhận qua Gmail)
        String otpCode = otpRepository.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc("test.reset@gmail.com", "PASSWORD_RESET")
                .orElseThrow(() -> new AssertionError("OTP record for email should exist in database"))
                .getOtpCode();

        // 3. Xác thực OTP
        com.sales.dto.request.VerifyOtpRequest verifyReq = com.sales.dto.request.VerifyOtpRequest.builder()
                .email("test.reset@gmail.com")
                .otpCode(otpCode)
                .build();

        mockMvc.perform(post("/api/v1/auth/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.valid").value(true));

        // 4. Đặt lại mật khẩu mới
        com.sales.dto.request.ResetPasswordRequest resetReq = com.sales.dto.request.ResetPasswordRequest.builder()
                .email("test.reset@gmail.com")
                .otpCode(otpCode)
                .newPassword("newPassword789")
                .confirmPassword("newPassword789")
                .build();

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resetReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }
}
