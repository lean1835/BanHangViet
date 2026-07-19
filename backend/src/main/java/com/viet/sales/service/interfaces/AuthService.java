package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.LoginRequest;
import com.viet.sales.dto.request.RegisterRequest;
import com.viet.sales.dto.response.LoginResponse;
import com.viet.sales.dto.response.RegisterResponse;

public interface AuthService {
    RegisterResponse register(RegisterRequest request);
    LoginResponse login(LoginRequest request);
}
