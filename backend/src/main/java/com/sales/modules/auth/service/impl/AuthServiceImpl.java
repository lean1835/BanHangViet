package com.sales.modules.auth.service.impl;
import com.sales.modules.auth.dto.request.LoginRequest;
import com.sales.modules.auth.dto.request.RegisterRequest;
import com.sales.modules.auth.dto.response.LoginResponse;
import com.sales.modules.auth.dto.response.RegisterResponse;
import com.sales.common.constant.RoleCode;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.entity.UserSession;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.RoleRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.tax.service.AccountantService;
import com.sales.modules.auth.service.AuthService;
import com.sales.common.security.JwtService;
import com.sales.modules.auth.service.UserSessionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import com.sales.common.constant.HouseholdStatus;
import org.springframework.cache.CacheManager;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {
    private final BusinessHouseholdRepository householdRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UserSessionService userSessionService;
    @Lazy
    private final AccountantService accountantService;
    private final CacheManager cacheManager;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (householdRepository.existsByTaxCode(request.getTaxCode())) {
            throw new AppException(ErrorCode.TAX_CODE_ALREADY_EXISTS);
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USERNAME_ALREADY_EXISTS);
        }

        Role ownerRole = roleRepository.findByCode(RoleCode.VT_01.getCode())
                .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        BusinessHousehold household = BusinessHousehold.builder()
                .name(request.getHouseholdName())
                .taxCode(request.getTaxCode())
                .address(request.getHouseholdAddress())
                .phoneNumber(request.getHouseholdPhone())
                .representativeName(request.getFullName())
                .revenueThresholdEnabled(false)
                .build();

        household = householdRepository.save(household);

        User ownerUser = User.builder()
                .household(household)
                .role(ownerRole)
                .username(request.getUsername())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phoneNumber(request.getPhone() != null ? request.getPhone() : request.getHouseholdPhone())
                .isActive(true)
                .build();

        ownerUser = userRepository.save(ownerUser);

        return RegisterResponse.builder()
                .householdId(household.getId())
                .taxCode(household.getTaxCode())
                .householdName(household.getName())
                .householdAddress(household.getAddress())
                .householdPhone(household.getPhoneNumber())
                .userId(ownerUser.getId())
                .username(ownerUser.getUsername())
                .fullName(ownerUser.getFullName())
                .roleCode(ownerRole.getCode())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new AppException(ErrorCode.USER_BLOCKED);
        }

        if (user.getHousehold() != null && user.getHousehold().getStatus() == HouseholdStatus.LOCKED) {
            throw new AppException(ErrorCode.HOUSEHOLD_LOCKED);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AppException(ErrorCode.WRONG_PASSWORD);
        }

        String clientIp = null;
        String userAgent = null;
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest httpRequest = attributes.getRequest();
                String xForwardedFor = httpRequest.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                    clientIp = xForwardedFor.split(",")[0].trim();
                } else {
                    clientIp = httpRequest.getRemoteAddr();
                }
                userAgent = httpRequest.getHeader("User-Agent");
            }
        } catch (Exception ignored) {
        }

        UserSession session = userSessionService.createSession(user, clientIp, userAgent);

        if (cacheManager != null && cacheManager.getCache("users") != null) {
            cacheManager.getCache("users").evict(user.getUsername());
        }

        if (request.getInvitationToken() != null && !request.getInvitationToken().isBlank()) {
            try {
                accountantService.acceptInvitationWithToken(user, request.getInvitationToken().trim());
            } catch (Exception e) {
                log.warn("Lỗi khi kích hoạt lời mời kế toán từ token cho user {}: {}", user.getUsername(), e.getMessage());
            }
        }

        String token = jwtService.generateToken(user, session.getId());

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .email(user.getEmail())
                .roleCode(user.getRole().getCode())
                .householdId(user.getHousehold() != null ? user.getHousehold().getId() : null)
                .pointOfSaleId(user.getPointOfSale() != null ? user.getPointOfSale().getId() : null)
                .pointOfSaleName(user.getPointOfSale() != null ? user.getPointOfSale().getName() : null)
                .posCode(user.getPointOfSale() != null ? user.getPointOfSale().getPosCode() : null)
                .mustChangePassword(Boolean.TRUE.equals(user.getMustChangePassword()))
                .sessionId(session.getId())
                .build();
    }
}
