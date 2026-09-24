package com.sales.common.security;
import com.sales.modules.auth.entity.User;
import org.springframework.security.core.userdetails.UserDetails;

public interface JwtService {
    String generateToken(User user);
    String generateToken(User user, String sessionId);
    String extractUsername(String token);
    String extractSessionId(String token);
    boolean isTokenValid(String token, UserDetails userDetails);
    String extractRole(String token);
}
