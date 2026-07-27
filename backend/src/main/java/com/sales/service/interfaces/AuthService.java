package com.sales.service.interfaces;

import com.sales.dto.request.LoginRequest;
import com.sales.dto.request.RegisterRequest;
import com.sales.dto.response.LoginResponse;
import com.sales.dto.response.RegisterResponse;

public interface AuthService {
    RegisterResponse register(RegisterRequest request);
    LoginResponse login(LoginRequest request);
}
