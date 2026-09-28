package com.sales.common.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.sales.common.dto.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {
    private static class RequestCount {
        private int count = 0;
        private long resetTime = 0;

        public synchronized boolean allowRequest(long now, long timeLimitMs, int maxRequests) {
            if (now > resetTime) {
                count = 1;
                resetTime = now + timeLimitMs;
                return true;
            } else {
                count++;
                return count <= maxRequests;
            }
        }
    }

    private final ObjectMapper objectMapper;

    private final Cache<String, RequestCount> ipRequestCache = CacheBuilder.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    private static final int MAX_REQUESTS = 10;
    private static final long TIME_LIMIT_MS = 60000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.startsWith("/api/v1/public/invoices/")) {
            String ip = getClientIp(request);

            long now = System.currentTimeMillis();
            RequestCount requestCount;
            try {
                requestCount = ipRequestCache.get(ip, () -> {
                    RequestCount rc = new RequestCount();
                    rc.resetTime = now + TIME_LIMIT_MS;
                    rc.count = 0;
                    return rc;
                });
            } catch (ExecutionException e) {
                requestCount = new RequestCount();
                requestCount.resetTime = now + TIME_LIMIT_MS;
            }

            boolean allowed = requestCount.allowRequest(now, TIME_LIMIT_MS, MAX_REQUESTS);
            if (!allowed) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");

                ApiResponse<Void> apiResponse = ApiResponse.<Void>builder()
                        .code(HttpStatus.TOO_MANY_REQUESTS.value())
                        .message("Too many requests. Please try again after 1 minute.")
                        .build();

                objectMapper.writeValue(response.getWriter(), apiResponse);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null || remoteAddr.isBlank()) {
            remoteAddr = "unknown";
        }

        if (isTrustedProxy(remoteAddr)) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.trim().isEmpty()) {
                String[] ips = xff.split(",");
                String fallbackClientIp = null;
                for (int i = ips.length - 1; i >= 0; i--) {
                    String candidate = ips[i].trim();
                    if (!candidate.isEmpty() && !"unknown".equalsIgnoreCase(candidate)) {
                        if (fallbackClientIp == null) {
                            fallbackClientIp = candidate;
                        }
                        if (!isTrustedProxy(candidate)) {
                            return candidate;
                        }
                    }
                }
                if (fallbackClientIp != null) {
                    return fallbackClientIp;
                }
            }

            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.trim().isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
                return xRealIp.trim();
            }
        }

        return remoteAddr;
    }

    private boolean isTrustedProxy(String ip) {
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            return false;
        }
        String cleanIp = ip.trim();
        if ("127.0.0.1".equals(cleanIp) || "0:0:0:0:0:0:0:1".equals(cleanIp) || "::1".equals(cleanIp) || "localhost".equalsIgnoreCase(cleanIp)) {
            return true;
        }

        if (cleanIp.startsWith("10.") || cleanIp.startsWith("192.168.")) {
            return true;
        }
        if (cleanIp.startsWith("172.")) {
            try {
                String[] parts = cleanIp.split("\\.");
                if (parts.length >= 2) {
                    int second = Integer.parseInt(parts[1]);
                    if (second >= 16 && second <= 31) {
                        return true;
                    }
                }
            } catch (NumberFormatException ignored) {}
        }

        String lowerIp = cleanIp.toLowerCase();
        if (lowerIp.startsWith("fe80:") || lowerIp.startsWith("fc00:") || lowerIp.startsWith("fd00:")) {
            return true;
        }
        return false;
    }
}
