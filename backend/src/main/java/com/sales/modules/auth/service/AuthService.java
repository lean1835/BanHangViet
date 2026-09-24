package com.sales.modules.auth.service;
import com.sales.modules.auth.dto.request.LoginRequest;
import com.sales.modules.auth.dto.request.RegisterRequest;
import com.sales.modules.auth.dto.response.LoginResponse;
import com.sales.modules.auth.dto.response.RegisterResponse;

public interface AuthService {
    RegisterResponse register(RegisterRequest request);
    LoginResponse login(LoginRequest request);
}
