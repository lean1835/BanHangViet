package com.sales.service.classes;

import com.sales.entity.User;
import com.sales.service.interfaces.JwtService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtServiceImpl implements JwtService {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.expiration-ms}")
    private long expirationMs;

    private SecretKey getSignKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Override
    public String generateToken(User user) {
        return generateToken(user, null);
    }

    @Override
    public String generateToken(User user, String sessionId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getId());
        claims.put("role", user.getRole().getCode());
        claims.put("fullName", user.getFullName());
        claims.put("householdId", user.getHousehold() != null ? user.getHousehold().getId() : null);
        claims.put("pwdAt", user.getPasswordChangedAt() != null ? user.getPasswordChangedAt().toString() : "");
        if (sessionId != null) {
            claims.put("sid", sessionId);
        }

        var builder = Jwts.builder()
                .claims(claims)
                .subject(user.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSignKey());

        if (sessionId != null) {
            builder.id(sessionId);
        }

        return builder.compact();
    }

    @Override
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    @Override
    public String extractSessionId(String token) {
        return extractClaim(token, claims -> {
            String sid = claims.get("sid", String.class);
            return sid != null ? sid : claims.getId();
        });
    }

    @Override
    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    @Override
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        if (!username.equals(userDetails.getUsername()) || isTokenExpired(token) || !userDetails.isEnabled()) {
            return false;
        }

        if (userDetails instanceof com.sales.security.CustomUserDetails customUserDetails) {
            java.time.LocalDateTime passwordChangedAt = customUserDetails.getPasswordChangedAt();
            String userPwdAt = passwordChangedAt != null ? passwordChangedAt.toString() : "";
            String tokenPwdAt = extractClaim(token, claims -> claims.get("pwdAt", String.class));
            if (tokenPwdAt == null) {
                tokenPwdAt = "";
            }
            if (!userPwdAt.equals(tokenPwdAt)) {
                return false;
            }
        }
        return true;
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}
