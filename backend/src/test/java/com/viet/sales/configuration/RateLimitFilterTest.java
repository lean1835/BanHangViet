package com.viet.sales.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.ApiResponse;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.times;

public class RateLimitFilterTest {

    private RateLimitFilter rateLimitFilter;
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setUp() {
        objectMapper = new ObjectMapper();
        rateLimitFilter = new RateLimitFilter(objectMapper);
    }

    @Test
    public void doFilter_AllowedPath_PassesThrough() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/invoices");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = Mockito.mock(FilterChain.class);

        rateLimitFilter.doFilter(request, response, filterChain);

        Mockito.verify(filterChain, times(1)).doFilter(request, response);
        assertEquals(200, response.getStatus());
    }

    @Test
    public void doFilter_PublicInvoices_WithinLimit_PassesThrough() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/public/invoices/lookup");
        request.setRemoteAddr("192.168.1.100");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain filterChain = Mockito.mock(FilterChain.class);

        for (int i = 0; i < 5; i++) {
            rateLimitFilter.doFilter(request, response, filterChain);
        }

        Mockito.verify(filterChain, times(5)).doFilter(request, response);
    }

    @Test
    public void doFilter_PublicInvoices_ExceedsLimit_Returns429WithApiResponse() throws Exception {
        FilterChain filterChain = Mockito.mock(FilterChain.class);
        String testIp = "10.0.0.50";

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/v1/public/invoices/download");
            request.setRemoteAddr(testIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilter(request, response, filterChain);
        }

        // 11th request should be rate limited
        MockHttpServletRequest rateLimitedReq = new MockHttpServletRequest();
        rateLimitedReq.setRequestURI("/api/v1/public/invoices/download");
        rateLimitedReq.setRemoteAddr(testIp);
        MockHttpServletResponse rateLimitedResp = new MockHttpServletResponse();

        rateLimitFilter.doFilter(rateLimitedReq, rateLimitedResp, filterChain);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), rateLimitedResp.getStatus());
        assertEquals("application/json;charset=UTF-8", rateLimitedResp.getContentType());
        
        String jsonContent = rateLimitedResp.getContentAsString();
        ApiResponse<?> apiResponse = objectMapper.readValue(jsonContent, ApiResponse.class);
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), apiResponse.getCode());
        assertEquals("Too many requests. Please try again after 1 minute.", apiResponse.getMessage());

        // Verify filterChain was NOT called for 11th request (called 10 times total)
        Mockito.verify(filterChain, times(10)).doFilter(Mockito.any(), Mockito.any());
    }

    @Test
    public void doFilter_ExtractsXForwardedForClientIp() throws Exception {
        FilterChain filterChain = Mockito.mock(FilterChain.class);
        String proxyIp = "203.0.113.195, 70.41.3.18, 150.172.238.178";

        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/v1/public/invoices/lookup");
            request.addHeader("X-Forwarded-For", proxyIp);
            request.setRemoteAddr("127.0.0.1");
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilter(request, response, filterChain);
        }

        // 11th request with same XFF header
        MockHttpServletRequest rateLimitedReq = new MockHttpServletRequest();
        rateLimitedReq.setRequestURI("/api/v1/public/invoices/lookup");
        rateLimitedReq.addHeader("X-Forwarded-For", proxyIp);
        rateLimitedReq.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse rateLimitedResp = new MockHttpServletResponse();

        rateLimitFilter.doFilter(rateLimitedReq, rateLimitedResp, filterChain);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), rateLimitedResp.getStatus());
    }

    @Test
    public void doFilter_IgnoresXForwardedForFromUntrustedProxy() throws Exception {
        FilterChain filterChain = Mockito.mock(FilterChain.class);
        String untrustedRemoteIp = "198.51.100.22";

        // Attacker attempts 10 requests sending different fake XFF headers each time
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/v1/public/invoices/lookup");
            request.addHeader("X-Forwarded-For", "1.2.3." + i);
            request.setRemoteAddr(untrustedRemoteIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilter(request, response, filterChain);
        }

        // 11th request from same untrustedRemoteIp with another fake XFF header
        MockHttpServletRequest rateLimitedReq = new MockHttpServletRequest();
        rateLimitedReq.setRequestURI("/api/v1/public/invoices/lookup");
        rateLimitedReq.addHeader("X-Forwarded-For", "9.9.9.9");
        rateLimitedReq.setRemoteAddr(untrustedRemoteIp);
        MockHttpServletResponse rateLimitedResp = new MockHttpServletResponse();

        rateLimitFilter.doFilter(rateLimitedReq, rateLimitedResp, filterChain);

        // Since untrustedRemoteIp was used 10 times, the 11th request is blocked despite fake XFF!
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), rateLimitedResp.getStatus());
    }

    @Test
    public void doFilter_RightToLeftParsingPreventsSpoofingBehindProxy() throws Exception {
        FilterChain filterChain = Mockito.mock(FilterChain.class);
        String realClientIp = "203.0.113.88";

        // Hacker attempts 10 requests changing the spoofed front IP: "1.1.1.0, 203.0.113.88", "1.1.1.1, 203.0.113.88"
        // Nginx at 127.0.0.1 appended the realClientIp at the right end.
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            request.setRequestURI("/api/v1/public/invoices/lookup");
            request.addHeader("X-Forwarded-For", "1.1.1." + i + ", " + realClientIp);
            request.setRemoteAddr("127.0.0.1");
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitFilter.doFilter(request, response, filterChain);
        }

        // 11th request from same realClientIp behind proxy with another fake front IP
        MockHttpServletRequest rateLimitedReq = new MockHttpServletRequest();
        rateLimitedReq.setRequestURI("/api/v1/public/invoices/lookup");
        rateLimitedReq.addHeader("X-Forwarded-For", "9.9.9.9, " + realClientIp);
        rateLimitedReq.setRemoteAddr("127.0.0.1");
        MockHttpServletResponse rateLimitedResp = new MockHttpServletResponse();

        rateLimitFilter.doFilter(rateLimitedReq, rateLimitedResp, filterChain);

        // Right-to-left parsing identifies 203.0.113.88 as client IP, blocking 11th request
        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), rateLimitedResp.getStatus());
    }
}
