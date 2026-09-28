package com.sales.common.configuration;
import com.sales.common.security.JwtService;
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
import com.sales.common.constant.AccountantAssignmentStatus;
import com.sales.common.security.HouseholdContextHolder;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.auth.service.UserSessionService;
import com.sales.modules.tax.repository.HouseholdAccountantAssignmentRepository;

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final UserSessionService userSessionService;
    private final UserRepository userRepository;
    private final BusinessHouseholdRepository businessHouseholdRepository;
    private final HouseholdAccountantAssignmentRepository assignmentRepository;

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

        try {
            String householdContextId = request.getHeader("X-Household-Context");
            var authentication = SecurityContextHolder.getContext().getAuthentication();
            if (householdContextId != null && !householdContextId.isBlank() && authentication != null && authentication.isAuthenticated()) {
                String authUsername = authentication.getName();
                userRepository.findByUsername(authUsername).ifPresent(user -> {
                    if (user.getRole() != null && "VT-03".equals(user.getRole().getCode())) {
                        boolean hasAssignment = assignmentRepository.existsByHouseholdIdAndAccountantUserIdAndStatus(
                                householdContextId.trim(), user.getId(), AccountantAssignmentStatus.ACTIVE);
                        if (hasAssignment) {
                            businessHouseholdRepository.findById(householdContextId.trim())
                                    .ifPresent(HouseholdContextHolder::setHousehold);
                        }
                    }
                });
            }
            filterChain.doFilter(request, response);
        } finally {
            HouseholdContextHolder.clear();
        }
    }
}
