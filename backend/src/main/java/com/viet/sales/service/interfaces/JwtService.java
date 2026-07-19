package com.viet.sales.service.interfaces;

import com.viet.sales.entity.User;
import org.springframework.security.core.userdetails.UserDetails;

public interface JwtService {
    String generateToken(User user);
    String extractUsername(String token);
    boolean isTokenValid(String token, UserDetails userDetails);
    String extractRole(String token);
}
