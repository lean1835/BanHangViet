package com.sales.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.AccountantAssignmentStatus;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.HouseholdAccountantAssignment;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.repository.HouseholdAccountantAssignmentRepository;
import com.sales.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountantSecurityServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private HouseholdAccountantAssignmentRepository assignmentRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AccountantSecurityService accountantSecurityService;

    private BusinessHousehold household;
    private Role accountantRole;
    private Role staffRole;
    private User accountantUser;
    private User staffUser;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ kinh doanh A")
                .build();

        accountantRole = Role.builder().code("VT-03").name("Kế toán").build();
        staffRole = Role.builder().code("VT-02").name("Nhân viên").build();

        accountantUser = User.builder()
                .id("user-acc")
                .username("accountant_user")
                .role(accountantRole)
                .household(household)
                .build();

        staffUser = User.builder()
                .id("user-staff")
                .username("staff_user")
                .role(staffRole)
                .household(household)
                .build();
    }

    @AfterEach
    void tearDown() {
        HouseholdContextHolder.clear();
    }

    @Test
    @DisplayName("Kế toán VT-03 với scope TAX_DECLARATION hợp lệ")
    void hasScope_Accountant_TaxDeclaration_Success() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "accountant_user",
                "password",
                List.of(new SimpleGrantedAuthority("ROLE_VT-03"))
        );

        when(userRepository.findByUsername("accountant_user")).thenReturn(Optional.of(accountantUser));

        HouseholdAccountantAssignment assignment = HouseholdAccountantAssignment.builder()
                .id("assign-1")
                .household(household)
                .accountantUser(accountantUser)
                .status(AccountantAssignmentStatus.ACTIVE)
                .accessExpiresAt(LocalDateTime.now().plusDays(10))
                .scopePermissions("[\"TAX_DECLARATION\", \"INVOICE\"]")
                .build();

        when(assignmentRepository.findByHouseholdIdAndAccountantUserIdAndStatus("hh-1", "user-acc", AccountantAssignmentStatus.ACTIVE))
                .thenReturn(Optional.of(assignment));

        assertTrue(accountantSecurityService.hasScope(auth, "TAX_DECLARATION"));
    }

    @Test
    @DisplayName("Kế toán VT-03 với scope REPORT hoặc INVOICE hợp lệ")
    void hasScope_Accountant_OtherValidScopes_Success() {
        Authentication auth = new UsernamePasswordAuthenticationToken(
                "accountant_user",
                "password",
                List.of(new SimpleGrantedAuthority("VT-03"))
        );

        when(userRepository.findByUsername("accountant_user")).thenReturn(Optional.of(accountantUser));

        HouseholdAccountantAssignment assignment = HouseholdAccountantAssignment.builder()
                .id("assign-1")
                .household(household)
                .accountantUser(accountantUser)
                .status(AccountantAssignmentStatus.ACTIVE)
                .accessExpiresAt(LocalDateTime.now().plusDays(10))
                .scopePermissions("[\"REPORT\", \"INVOICE\"]")
                .build();

        when(assignmentRepository.findByHouseholdIdAndAccountantUserIdAndStatus("hh-1", "user-acc", AccountantAssignmentStatus.ACTIVE))
                .thenReturn(Optional.of(assignment));

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

        when(userRepository.findByUsername("staff_user")).thenReturn(Optional.of(staffUser));

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
