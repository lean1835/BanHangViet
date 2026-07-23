package com.viet.sales.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.viet.sales.dto.ApiResponse;
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
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    private static class RequestCount {
        final AtomicInteger count = new AtomicInteger(0);
        final AtomicLong resetTime = new AtomicLong(0);
    }

    private final ObjectMapper objectMapper;

    private final Cache<String, RequestCount> ipRequestCache = CacheBuilder.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    private static final int MAX_REQUESTS = 10;
    private static final long TIME_LIMIT_MS = 60000; // 1 minute

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
                    rc.resetTime.set(now + TIME_LIMIT_MS);
                    rc.count.set(0);
                    return rc;
                });
            } catch (ExecutionException e) {
                requestCount = new RequestCount();
                requestCount.resetTime.set(now + TIME_LIMIT_MS);
            }

            long resetTime = requestCount.resetTime.get();
            if (now > resetTime) {
                // Time window expired, reset
                requestCount.count.set(1);
                requestCount.resetTime.set(now + TIME_LIMIT_MS);
            } else {
                int currentCount = requestCount.count.incrementAndGet();
                if (currentCount > MAX_REQUESTS) {
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
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (remoteAddr == null || remoteAddr.isBlank()) {
            remoteAddr = "unknown";
        }

        // Only inspect X-Forwarded-For if connection comes from a trusted reverse proxy
        if (isTrustedProxy(remoteAddr)) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.trim().isEmpty()) {
                String[] ips = xff.split(",");
                for (String rawIp : ips) {
                    String candidate = rawIp.trim();
                    if (!candidate.isEmpty() && !"unknown".equalsIgnoreCase(candidate)) {
                        return candidate;
                    }
                }
            }
        }

        return remoteAddr;
    }

    private boolean isTrustedProxy(String ip) {
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip)) {
            return false;
        }
        if ("127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip) || "localhost".equalsIgnoreCase(ip)) {
            return true;
        }
        // Check local private IP ranges: 10.x.x.x, 192.168.x.x, 172.16-31.x.x
        if (ip.startsWith("10.") || ip.startsWith("192.168.")) {
            return true;
        }
        if (ip.startsWith("172.")) {
            try {
                String[] parts = ip.split("\\.");
                if (parts.length >= 2) {
                    int second = Integer.parseInt(parts[1]);
                    if (second >= 16 && second <= 31) {
                        return true;
                    }
                }
            } catch (NumberFormatException ignored) {}
        }
        return false;
    }
}
