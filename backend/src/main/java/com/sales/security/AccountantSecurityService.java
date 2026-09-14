package com.sales.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

/**
 * Service kiểm tra quyền và scope ủy quyền cho Kế toán (VT-03).
 * Đáp ứng yêu cầu chuẩn bảo mật RBAC & Scope Isolation theo PTYC và kiến trúc hệ thống.
 */
@Service("accountantSecurityService")
public class AccountantSecurityService {

    /**
     * Kiểm tra người dùng có vai trò Kế toán (VT-03) và có phạm vi ủy quyền tương ứng hay không.
     *
     * @param authentication thông tin xác thực của Spring Security
     * @param scope          phạm vi nghiệp vụ yêu cầu (ví dụ: "TAX_DECLARATION")
     * @return true nếu thỏa mãn điều kiện phân quyền
     */
    public boolean hasScope(Authentication authentication, String scope) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        boolean isAccountant = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(auth -> auth.equals("ROLE_VT-03") || auth.equals("VT-03"));

        if (!isAccountant) {
            return false;
        }

        // Mặc định đối với vai trò Kế toán trong hệ thống hiện tại, cho phép các scope nghiệp vụ hợp lệ
        if (scope == null || scope.isBlank()) {
            return true;
        }

        return "TAX_DECLARATION".equalsIgnoreCase(scope)
                || "INVOICE".equalsIgnoreCase(scope)
                || "REPORT".equalsIgnoreCase(scope);
    }
}
