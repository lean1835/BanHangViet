package com.sales.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AccountantSecurityServiceTest {

    private final AccountantSecurityService accountantSecurityService = new AccountantSecurityService();

    @Test
    @DisplayName("Kế toán VT-03 với scope TAX_DECLARATION hợp lệ")
    void hasScope_Accountant_TaxDeclaration_Success() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "accountant_user",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_VT-03"))
        );

        assertTrue(accountantSecurityService.hasScope(auth, "TAX_DECLARATION"));
        assertTrue(accountantSecurityService.hasScope(auth, "tax_declaration"));
    }

    @Test
    @DisplayName("Kế toán VT-03 với scope REPORT hoặc INVOICE hợp lệ")
    void hasScope_Accountant_OtherValidScopes_Success() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "accountant_user",
                "password",
                List.of(new SimpleGrantedAuthority("VT-03"))
        );

        assertTrue(accountantSecurityService.hasScope(auth, "REPORT"));
        assertTrue(accountantSecurityService.hasScope(auth, "INVOICE"));
    }

    @Test
    @DisplayName("Người dùng không có vai trò VT-03 bị từ chối")
    void hasScope_NonAccountant_Rejected() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "staff_user",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_VT-02"))
        );

        assertFalse(accountantSecurityService.hasScope(auth, "TAX_DECLARATION"));
    }

    @Test
    @DisplayName("Chưa xác thực hoặc null bị từ chối")
    void hasScope_Unauthenticated_Rejected() {
        assertFalse(accountantSecurityService.hasScope(null, "TAX_DECLARATION"));

        Authentication unauth = new UsernamePasswordAuthenticationToken("anon", "password");
        assertFalse(accountantSecurityService.hasScope(unauth, "TAX_DECLARATION"));
    }
}
