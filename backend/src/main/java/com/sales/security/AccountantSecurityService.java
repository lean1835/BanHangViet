package com.sales.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AccountantAssignmentStatus;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.HouseholdAccountantAssignment;
import com.sales.entity.User;
import com.sales.repository.HouseholdAccountantAssignmentRepository;
import com.sales.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service("accountantSecurityService")
@RequiredArgsConstructor
@Slf4j
public class AccountantSecurityService {

    private final UserRepository userRepository;
    private final HouseholdAccountantAssignmentRepository assignmentRepository;
    private final ObjectMapper objectMapper;

    /**
     * Kiểm tra xem kế toán viên (VT-03) hiện tại có scope quyền (INVOICE, REPORT, TAX_DECLARATION)
     * đối với hộ kinh doanh đang thao tác hay không.
     * Đối với các vai trò khác (như Chủ hộ VT-01), phương thức trả về true.
     */
    public boolean hasScope(Authentication authentication, String requiredScope) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        String username = authentication.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        if (user.getRole() == null) {
            return false;
        }

        // Nếu không phải là vai trò kế toán (VT-03), không chặn scope của kế toán
        if (!"VT-03".equals(user.getRole().getCode())) {
            return true;
        }

        // Xác định hộ kinh doanh active context (ưu tiên ThreadLocal header context, fallback về user.household)
        BusinessHousehold currentHousehold = HouseholdContextHolder.getHousehold();
        if (currentHousehold == null) {
            currentHousehold = user.getHousehold();
        }

        if (currentHousehold == null) {
            log.warn("Accountant {} has no active household context", username);
            return false;
        }

        Optional<HouseholdAccountantAssignment> assignmentOpt = assignmentRepository
                .findByHouseholdIdAndAccountantUserIdAndStatus(
                        currentHousehold.getId(),
                        user.getId(),
                        AccountantAssignmentStatus.ACTIVE);

        if (assignmentOpt.isEmpty()) {
            // Trường hợp kế toán viên nội bộ trực tiếp thuộc hộ (không qua cơ chế phân quyền kế toán dịch vụ thuê ngoài)
            boolean hasAssignmentForThisHousehold = assignmentRepository
                    .findByHouseholdIdAndAccountantUserId(currentHousehold.getId(), user.getId())
                    .isPresent();
            if (!hasAssignmentForThisHousehold && user.getHousehold() != null && user.getHousehold().getId().equals(currentHousehold.getId())) {
                return true;
            }

            log.warn("Accountant {} is not actively assigned to household {}", username, currentHousehold.getId());
            return false;
        }

        HouseholdAccountantAssignment assignment = assignmentOpt.get();
        if (assignment.getAccessExpiresAt() != null && assignment.getAccessExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("Accountant assignment {} for household {} has expired", assignment.getId(), currentHousehold.getId());
            return false;
        }

        List<String> scopes = parsePermissions(assignment.getScopePermissions());
        boolean allowed = scopes.contains(requiredScope);
        if (!allowed) {
            log.warn("Accountant {} lacks required scope {} for household {} (current scopes: {})",
                    username, requiredScope, currentHousehold.getId(), scopes);
        }
        return allowed;
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
}
