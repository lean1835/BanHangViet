package com.sales.modules.auth.controller;
import com.sales.common.dto.ApiResponse;
import com.sales.modules.auth.dto.request.LoginRequest;
import com.sales.modules.auth.dto.request.RegisterRequest;
import com.sales.modules.auth.dto.request.ForgotPasswordRequest;
import com.sales.modules.auth.dto.request.ResetPasswordRequest;
import com.sales.modules.auth.dto.request.VerifyOtpRequest;
import com.sales.modules.auth.dto.response.ForgotPasswordResponse;
import com.sales.modules.auth.dto.response.LoginResponse;
import com.sales.modules.auth.dto.response.RegisterResponse;
import com.sales.modules.auth.dto.response.VerifyOtpResponse;
import com.sales.modules.auth.service.AuthService;
import com.sales.modules.auth.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse result = authService.register(request);
        ApiResponse<RegisterResponse> response = ApiResponse.<RegisterResponse>builder()
                .code(1000)
                .message("Đăng ký hộ kinh doanh thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse result = authService.login(request);
        ApiResponse<LoginResponse> response = ApiResponse.<LoginResponse>builder()
                .code(1000)
                .message("Đăng nhập thành công")
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<ForgotPasswordResponse>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        ForgotPasswordResponse result = passwordResetService.sendResetOtp(request);
        ApiResponse<ForgotPasswordResponse> response = ApiResponse.<ForgotPasswordResponse>builder()
                .code(1000)
                .message(result.getMessage())
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<VerifyOtpResponse>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        VerifyOtpResponse result = passwordResetService.verifyOtp(request);
        ApiResponse<VerifyOtpResponse> response = ApiResponse.<VerifyOtpResponse>builder()
                .code(1000)
                .message(result.getMessage())
                .result(result)
                .build();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        ApiResponse<Void> response = ApiResponse.<Void>builder()
                .code(1000)
                .message("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.")
                .build();
        return ResponseEntity.ok(response);
    }
}
