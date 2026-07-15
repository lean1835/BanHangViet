package com.viet.sales.service.interfaces;

import com.viet.sales.dto.request.RegisterRequest;
import com.viet.sales.dto.response.RegisterResponse;

public interface AuthService {
    RegisterResponse register(RegisterRequest request);
}
