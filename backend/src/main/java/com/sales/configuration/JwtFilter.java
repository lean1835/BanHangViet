package com.sales.configuration;

import com.sales.service.interfaces.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final com.sales.service.interfaces.UserSessionService userSessionService;
    private final com.sales.repository.UserRepository userRepository;
    private final com.sales.repository.BusinessHouseholdRepository businessHouseholdRepository;
    private final com.sales.repository.HouseholdAccountantAssignmentRepository assignmentRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String username = jwtService.extractUsername(token);

                if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    if (jwtService.isTokenValid(token, userDetails)) {
                        String sessionId = jwtService.extractSessionId(token);
                        if (sessionId != null && !userSessionService.validateSession(sessionId)) {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"code\":2049,\"message\":\"Phiên đăng nhập của bạn đã bị đăng xuất từ xa hoặc đã hết hạn\"}");
                            return;
                        }

                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (Exception e) {
                logger.warn("JWT validation failed: " + e.getMessage());
            }
        }

        // Multi-tenancy context isolation: check X-Household-Context header for authenticated accountant
        try {
            String householdContextId = request.getHeader("X-Household-Context");
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (householdContextId != null && !householdContextId.isBlank() && authentication != null && authentication.isAuthenticated()) {
                String authUsername = authentication.getName();
                userRepository.findByUsername(authUsername).ifPresent(user -> {
                    if (user.getRole() != null && "VT-03".equals(user.getRole().getCode())) {
                        boolean hasAssignment = assignmentRepository.existsByHouseholdIdAndAccountantUserIdAndStatus(
                                householdContextId.trim(), user.getId(), com.sales.constant.AccountantAssignmentStatus.ACTIVE);
                        if (hasAssignment) {
                            businessHouseholdRepository.findById(householdContextId.trim())
                                    .ifPresent(com.sales.security.HouseholdContextHolder::setHousehold);
                        }
                    }
                });
            }
            filterChain.doFilter(request, response);
        } finally {
            com.sales.security.HouseholdContextHolder.clear();
        }
    }
}
