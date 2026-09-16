package com.sales.service.classes;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AccountantAssignmentStatus;
import com.sales.constant.AccountantInvitationStatus;
import com.sales.dto.request.AcceptInvitationRequest;
import com.sales.dto.request.InviteAccountantRequest;
import com.sales.dto.request.RevokeAccountantAssignmentRequest;
import com.sales.dto.response.AccountantAssignmentResponse;
import com.sales.dto.response.AccountantInvitationResponse;
import com.sales.dto.response.AssignedHouseholdResponse;
import com.sales.entity.AccountantInvitation;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.HouseholdAccountantAssignment;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.AccountantInvitationRepository;
import com.sales.repository.HouseholdAccountantAssignmentRepository;
import com.sales.repository.UserRepository;
import com.sales.repository.UserSessionRepository;
import com.sales.service.interfaces.AccountantService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AccountantServiceImpl implements AccountantService {

    private final UserRepository userRepository;
    private final AccountantInvitationRepository invitationRepository;
    private final HouseholdAccountantAssignmentRepository assignmentRepository;
    private final UserSessionRepository userSessionRepository;
    private final ActivityLogHelper activityLogHelper;
    private final ObjectMapper objectMapper;
    private final com.sales.service.interfaces.JwtService jwtService;
    private final com.sales.service.interfaces.EmailService emailService;
    private final com.sales.repository.RoleRepository roleRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private void logActivity(BusinessHousehold household, User actor, String action, String targetId, Object oldValue, Object newValue) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
            String clientIp = request != null ? request.getRemoteAddr() : null;
            String userAgent = request != null ? request.getHeader("User-Agent") : null;
            String oldStr = oldValue != null ? objectMapper.writeValueAsString(oldValue) : null;
            String newStr = newValue != null ? objectMapper.writeValueAsString(newValue) : null;
            activityLogHelper.logActivityInNewTransaction(household, actor, action, "accountant_assignments", targetId, oldStr, newStr, clientIp, userAgent);
        } catch (Exception e) {
            log.error("Failed to write activity log for accountant", e);
        }
    }

    private List<String> parsePermissions(String json) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private String serializePermissions(List<String> perms) {
        try {
            return objectMapper.writeValueAsString(perms != null ? perms : Collections.emptyList());
        } catch (Exception e) {
            return "[]";
        }
    }

    private AccountantInvitationResponse mapInvitationToResponse(AccountantInvitation inv) {
        AccountantInvitationStatus status = inv.getStatus();
        if (status == AccountantInvitationStatus.PENDING && inv.getInvitationExpiresAt() != null && inv.getInvitationExpiresAt().isBefore(LocalDateTime.now())) {
            status = AccountantInvitationStatus.EXPIRED;
        }

        String accName = null;
        if (inv.getAcceptedByUser() != null) {
            accName = inv.getAcceptedByUser().getFullName();
        } else if (inv.getAccountantPhone() != null) {
            accName = userRepository.findByPhoneNumberAndDeletedAtIsNull(inv.getAccountantPhone())
                    .map(User::getFullName)
                    .orElse(null);
        }

        return AccountantInvitationResponse.builder()
                .id(inv.getId())
                .householdId(inv.getHousehold().getId())
                .householdName(inv.getHousehold().getName())
                .householdTaxCode(inv.getHousehold().getTaxCode())
                .invitationToken(inv.getInvitationToken())
                .accountantName(accName)
                .accountantPhone(inv.getAccountantPhone())
                .accountantEmail(inv.getAccountantEmail())
                .invitedByUsername(inv.getInvitedByUser().getUsername())
                .accessDurationDays(inv.getAccessDurationDays())
                .scopePermissions(parsePermissions(inv.getScopePermissions()))
                .status(status)
                .invitationExpiresAt(inv.getInvitationExpiresAt())
                .acceptedAt(inv.getAcceptedAt())
                .rejectedAt(inv.getRejectedAt())
                .createdAt(inv.getCreatedAt())
                .build();
    }

    private AccountantAssignmentResponse mapAssignmentToResponse(HouseholdAccountantAssignment assign) {
        AccountantAssignmentStatus status = assign.getStatus();
        if (status == AccountantAssignmentStatus.ACTIVE && assign.getAccessExpiresAt() != null && assign.getAccessExpiresAt().isBefore(LocalDateTime.now())) {
            status = AccountantAssignmentStatus.EXPIRED;
        }

        return AccountantAssignmentResponse.builder()
                .id(assign.getId())
                .householdId(assign.getHousehold().getId())
                .householdName(assign.getHousehold().getName())
                .householdTaxCode(assign.getHousehold().getTaxCode())
                .accountantUserId(assign.getAccountantUser().getId())
                .accountantUsername(assign.getAccountantUser().getUsername())
                .accountantFullName(assign.getAccountantUser().getFullName())
                .accountantPhone(assign.getAccountantUser().getPhoneNumber())
                .accountantEmail(assign.getAccountantUser().getEmail())
                .scopePermissions(parsePermissions(assign.getScopePermissions()))
                .status(status)
                .accessExpiresAt(assign.getAccessExpiresAt())
                .revokedAt(assign.getRevokedAt())
                .revokeReason(assign.getRevokeReason())
                .createdAt(assign.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AccountantInvitationResponse inviteAccountant(String currentUsername, InviteAccountantRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        String token = UUID.randomUUID().toString();
        // Lời mời có hạn chấp nhận 72 giờ (3 ngày)
        LocalDateTime expiresAt = LocalDateTime.now().plusHours(72);

        String accName = (request.getAccountantName() != null && !request.getAccountantName().trim().isEmpty())
                ? request.getAccountantName().trim()
                : "Kế toán viên";

        // Kiểm tra xem kế toán đã có tài khoản trên hệ thống chưa (theo SĐT hoặc Email)
        Optional<User> existingUserOpt = userRepository.findByPhoneNumberAndDeletedAtIsNull(request.getAccountantPhone());
        if (existingUserOpt.isEmpty() && request.getAccountantEmail() != null && !request.getAccountantEmail().trim().isEmpty()) {
            existingUserOpt = userRepository.findByEmailAndDeletedAtIsNull(request.getAccountantEmail().trim());
        }

        boolean isNewAccount = false;
        String provisionedUsername;
        String temporaryPassword = null;

        if (existingUserOpt.isEmpty()) {
            // Kế toán CHƯA CÓ tài khoản: Tự động khởi tạo tài khoản với vai trò VT-03 (Kế toán)
            isNewAccount = true;

            // 1. Xác định username duy nhất
            String baseUsername = "ketoan_" + request.getAccountantPhone();
            if (request.getAccountantEmail() != null && request.getAccountantEmail().contains("@")) {
                String prefix = request.getAccountantEmail().split("@")[0].toLowerCase().replaceAll("[^a-z0-9_]", "");
                if (prefix.length() >= 3) {
                    baseUsername = prefix;
                }
            }
            provisionedUsername = baseUsername;
            if (userRepository.existsByUsername(provisionedUsername)) {
                provisionedUsername = baseUsername + "_" + (1000 + new java.util.Random().nextInt(9000));
            }

            // 2. Xác định mật khẩu (tự động sinh hoặc chủ hộ đặt)
            if ("MANUAL_PASSWORD".equalsIgnoreCase(request.getCreateAccountMode())
                    && request.getInitialPassword() != null
                    && !request.getInitialPassword().trim().isEmpty()) {
                temporaryPassword = request.getInitialPassword().trim();
            } else {
                temporaryPassword = "Kt@" + (100000 + new java.util.Random().nextInt(900000));
            }

            // 3. Lấy vai trò Kế toán (VT-03)
            com.sales.entity.Role accountantRole = roleRepository.findByCode("VT-03")
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

            User newAccountant = User.builder()
                    .username(provisionedUsername)
                    .passwordHash(passwordEncoder.encode(temporaryPassword))
                    .fullName(accName)
                    .phoneNumber(request.getAccountantPhone())
                    .email(request.getAccountantEmail())
                    .role(accountantRole)
                    .household(household)
                    .isActive(true)
                    .mustChangePassword(true)
                    .build();

            userRepository.save(newAccountant);
            log.info("Auto-provisioned new accountant user '{}' for invitation to household '{}'", provisionedUsername, household.getName());
        } else {
            provisionedUsername = existingUserOpt.get().getUsername();
            accName = existingUserOpt.get().getFullName();
        }

        AccountantInvitation invitation = AccountantInvitation.builder()
                .household(household)
                .invitationToken(token)
                .accountantPhone(request.getAccountantPhone())
                .accountantEmail(request.getAccountantEmail())
                .invitedByUser(currentUser)
                .accessDurationDays(request.getAccessDurationDays() != null ? request.getAccessDurationDays() : 30)
                .scopePermissions(serializePermissions(request.getScopePermissions()))
                .status(AccountantInvitationStatus.PENDING)
                .invitationExpiresAt(expiresAt)
                .build();

        invitation = invitationRepository.save(invitation);
        logActivity(household, currentUser, "INVITE_ACCOUNTANT", invitation.getId(), null, invitation.getAccountantPhone());

        // Gửi email thông báo bất đồng bộ kèm thông tin đăng nhập và liên kết kích hoạt
        if (request.getAccountantEmail() != null && !request.getAccountantEmail().trim().isEmpty()) {
            emailService.sendAccountantInvitationEmailAsync(
                    request.getAccountantEmail().trim(),
                    accName,
                    household.getName(),
                    household.getTaxCode(),
                    request.getScopePermissions(),
                    invitation.getAccessDurationDays(),
                    provisionedUsername,
                    temporaryPassword,
                    isNewAccount,
                    token
            );
        }

        AccountantInvitationResponse response = mapInvitationToResponse(invitation);
        response.setAccountantName(accName);
        response.setIsNewAccountCreated(isNewAccount);
        response.setAccountantUsername(provisionedUsername);
        response.setTemporaryPassword(temporaryPassword);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountantInvitationResponse> getInvitations(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return invitationRepository.findByHouseholdIdOrderByCreatedAtDesc(household.getId())
                .stream()
                .map(this::mapInvitationToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AccountantAssignmentResponse acceptInvitation(String currentUsername, String token, AcceptInvitationRequest request) {
        User accountant = getAuthenticatedUser(currentUsername);
        AccountantInvitation invitation = invitationRepository.findByInvitationToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNTANT_INVITATION_NOT_FOUND));

        if (invitation.getStatus() != AccountantInvitationStatus.PENDING) {
            throw new AppException(ErrorCode.INVITATION_ALREADY_PROCESSED);
        }

        if (invitation.getInvitationExpiresAt().isBefore(LocalDateTime.now())) {
            invitation.setStatus(AccountantInvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new AppException(ErrorCode.INVITATION_EXPIRED);
        }

        BusinessHousehold targetHousehold = invitation.getHousehold();
        if (targetHousehold != null && targetHousehold.getStatus() == com.sales.constant.HouseholdStatus.LOCKED) {
            throw new AppException(ErrorCode.HOUSEHOLD_LOCKED);
        }

        // Cập nhật trạng thái lời mời
        invitation.setStatus(AccountantInvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitation.setAcceptedByUser(accountant);
        invitationRepository.save(invitation);

        LocalDateTime accessExpiresAt = LocalDateTime.now().plusDays(invitation.getAccessDurationDays());

        // Tạo hoặc cập nhật phân công cho kế toán
        HouseholdAccountantAssignment assignment = assignmentRepository
                .findByHouseholdIdAndAccountantUserId(targetHousehold.getId(), accountant.getId())
                .orElse(HouseholdAccountantAssignment.builder()
                        .household(targetHousehold)
                        .accountantUser(accountant)
                        .build());

        assignment.setInvitation(invitation);
        assignment.setScopePermissions(invitation.getScopePermissions());
        assignment.setStatus(AccountantAssignmentStatus.ACTIVE);
        assignment.setAccessExpiresAt(accessExpiresAt);
        assignment.setRevokedAt(null);
        assignment.setRevokedByUser(null);
        assignment.setRevokeReason(null);

        assignment = assignmentRepository.save(assignment);

        // Nếu kế toán chưa chọn hộ nào làm việc, tự động gán hộ này làm active context
        if (accountant.getHousehold() == null) {
            accountant.setHousehold(targetHousehold);
            userRepository.save(accountant);
        }

        logActivity(targetHousehold, accountant, "ACCEPT_ACCOUNTANT_INVITATION", assignment.getId(), null, "Chấp nhận lời mời kế toán");

        return mapAssignmentToResponse(assignment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccountantAssignmentResponse> getAssignments(String currentUsername) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        return assignmentRepository.findByHouseholdIdOrderByCreatedAtDesc(household.getId())
                .stream()
                .map(this::mapAssignmentToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void revokeAssignment(String currentUsername, String assignmentId, RevokeAccountantAssignmentRequest request) {
        User currentUser = getAuthenticatedUser(currentUsername);
        BusinessHousehold household = currentUser.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        HouseholdAccountantAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElse(null);

        String reason = (request != null && request.getReason() != null && !request.getReason().trim().isEmpty())
                ? request.getReason().trim()
                : "Chủ hộ thu hồi quyền truy cập";

        if (assignment != null) {
            if (!assignment.getHousehold().getId().equals(household.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }

            assignment.setStatus(AccountantAssignmentStatus.REVOKED);
            assignment.setRevokedAt(LocalDateTime.now());
            assignment.setRevokedByUser(currentUser);
            assignment.setRevokeReason(reason);
            assignmentRepository.save(assignment);

            // QTN-10 & TC-03: Cắt phiên kế toán với hộ này ngay lập tức
            userSessionRepository.revokeAllActiveSessionsForUserAndHousehold(
                    assignment.getAccountantUser().getId(),
                    household.getId(),
                    LocalDateTime.now(),
                    currentUser,
                    reason);

            // Nếu kế toán đang chọn active context là hộ này, reset active context
            User accountantUser = assignment.getAccountantUser();
            if (accountantUser.getHousehold() != null && accountantUser.getHousehold().getId().equals(household.getId())) {
                accountantUser.setHousehold(null);
                userRepository.save(accountantUser);
            }

            logActivity(household, currentUser, "REVOKE_ACCOUNTANT_ACCESS", assignment.getId(), null, reason);
            return;
        }

        // Nếu là lời mời đang chờ chấp nhận (AccountantInvitation), hủy lời mời
        Optional<AccountantInvitation> invitationOpt = invitationRepository.findById(assignmentId);
        if (invitationOpt.isPresent()) {
            AccountantInvitation inv = invitationOpt.get();
            if (!inv.getHousehold().getId().equals(household.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            inv.setStatus(AccountantInvitationStatus.REVOKED);
            invitationRepository.save(inv);
            logActivity(household, currentUser, "REVOKE_ACCOUNTANT_INVITATION", inv.getId(), null, reason);
            return;
        }

        throw new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AssignedHouseholdResponse> getAssignedHouseholds(String currentUsername) {
        User accountant = getAuthenticatedUser(currentUsername);
        String currentHouseholdId = accountant.getHousehold() != null ? accountant.getHousehold().getId() : null;

        List<HouseholdAccountantAssignment> assignments = assignmentRepository.findByAccountantUserId(accountant.getId());

        LocalDateTime now = LocalDateTime.now();

        return assignments.stream()
                .filter(a -> a.getStatus() == AccountantAssignmentStatus.ACTIVE && a.getAccessExpiresAt().isAfter(now))
                .map(a -> {
                    BusinessHousehold h = a.getHousehold();
                    boolean isActiveContext = h.getId().equals(currentHouseholdId);
                    return AssignedHouseholdResponse.builder()
                            .assignmentId(a.getId())
                            .householdId(h.getId())
                            .householdName(h.getName())
                            .householdTaxCode(h.getTaxCode())
                            .representativeName(h.getRepresentativeName())
                            .phoneNumber(h.getPhoneNumber())
                            .address(h.getAddress())
                            .scopePermissions(parsePermissions(a.getScopePermissions()))
                            .accessExpiresAt(a.getAccessExpiresAt())
                            .isCurrentActive(isActiveContext)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public AssignedHouseholdResponse switchActiveHousehold(String currentUsername, String householdId) {
        User accountant = getAuthenticatedUser(currentUsername);

        HouseholdAccountantAssignment assignment = assignmentRepository
                .findByHouseholdIdAndAccountantUserIdAndStatus(householdId, accountant.getId(), AccountantAssignmentStatus.ACTIVE)
                .orElseThrow(() -> new AppException(ErrorCode.ACCOUNTANT_NOT_ASSIGNED_TO_HOUSEHOLD));

        if (assignment.getAccessExpiresAt().isBefore(LocalDateTime.now())) {
            assignment.setStatus(AccountantAssignmentStatus.EXPIRED);
            assignmentRepository.save(assignment);
            throw new AppException(ErrorCode.ACCOUNTANT_NOT_ASSIGNED_TO_HOUSEHOLD);
        }

        BusinessHousehold targetHousehold = assignment.getHousehold();
        if (targetHousehold != null && targetHousehold.getStatus() == com.sales.constant.HouseholdStatus.LOCKED) {
            throw new AppException(ErrorCode.HOUSEHOLD_LOCKED);
        }
        accountant.setHousehold(targetHousehold);
        userRepository.save(accountant);

        // Quản lý active context theo UserSession hiện tại để cách ly nhiều phiên/tab
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null && jwtService != null) {
                HttpServletRequest req = attributes.getRequest();
                String authHeader = req.getHeader("Authorization");
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);
                    String sessionId = jwtService.extractSessionId(token);
                    if (sessionId != null) {
                        userSessionRepository.findById(sessionId).ifPresent(session -> {
                            session.setHousehold(targetHousehold);
                            userSessionRepository.save(session);
                        });
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Không thể cập nhật active context vào UserSession: {}", e.getMessage());
        }

        return AssignedHouseholdResponse.builder()
                .assignmentId(assignment.getId())
                .householdId(targetHousehold.getId())
                .householdName(targetHousehold.getName())
                .householdTaxCode(targetHousehold.getTaxCode())
                .representativeName(targetHousehold.getRepresentativeName())
                .phoneNumber(targetHousehold.getPhoneNumber())
                .address(targetHousehold.getAddress())
                .scopePermissions(parsePermissions(assignment.getScopePermissions()))
                .accessExpiresAt(assignment.getAccessExpiresAt())
                .isCurrentActive(true)
                .build();
    }
}
