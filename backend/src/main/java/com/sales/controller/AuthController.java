package com.sales.controller;

import com.sales.dto.ApiResponse;
import com.sales.dto.request.LoginRequest;
import com.sales.dto.request.RegisterRequest;
import com.sales.dto.response.LoginResponse;
import com.sales.dto.response.RegisterResponse;
import com.sales.service.interfaces.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

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
}
