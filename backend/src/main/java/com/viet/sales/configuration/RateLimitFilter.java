package com.viet.sales.configuration;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class RateLimitFilter implements Filter {

    private static class RequestCount {
        final AtomicInteger count = new AtomicInteger(0);
        final AtomicLong resetTime = new AtomicLong(0);
    }

    private final Cache<String, RequestCount> ipRequestCache = CacheBuilder.newBuilder()
            .expireAfterWrite(1, TimeUnit.MINUTES)
            .build();

    private static final int MAX_REQUESTS = 10;
    private static final long TIME_LIMIT_MS = 60000; // 1 minute

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;

        String path = request.getRequestURI();
        if (path.startsWith("/api/v1/public/invoices/")) {
            String ip = request.getRemoteAddr();
            // In case of proxy, check X-Forwarded-For
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isEmpty()) {
                ip = xff.split(",")[0].trim();
            }

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
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"code\":429,\"message\":\"Too many requests. Please try again after 1 minute.\",\"result\":null}");
                    return;
                }
            }
        }

        filterChain.doFilter(servletRequest, servletResponse);
    }
}
