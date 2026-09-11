package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.AdminResetEmployeePasswordRequest;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.EmployeeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeResetPasswordTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private CacheManager cacheManager;

    @Mock
    private Cache userCache;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    private User owner;
    private User employee;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder().id("hh-1").name("Hộ kinh doanh Test").build();
        Role ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        Role empRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();

        owner = User.builder()
                .id("u-owner")
                .username("chuho")
                .household(household)
                .role(ownerRole)
                .isActive(true)
                .build();

        employee = User.builder()
                .id("u-emp")
                .username("nhanvien1")
                .household(household)
                .role(empRole)
                .passwordHash("old_hash")
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Chủ hộ đặt lại mật khẩu cho nhân viên thành công")
    void testResetEmployeePassword_Success() {
        AdminResetEmployeePasswordRequest request = AdminResetEmployeePasswordRequest.builder()
                .newPassword("empNewPass123")
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(owner));
        when(userRepository.findById("u-emp")).thenReturn(Optional.of(employee));
        when(passwordEncoder.encode("empNewPass123")).thenReturn("encoded_empNewPass123");
        when(cacheManager.getCache("users")).thenReturn(userCache);

        employeeService.resetEmployeePassword("chuho", "u-emp", request);

        assertEquals("encoded_empNewPass123", employee.getPasswordHash());
        assertTrue(employee.getMustChangePassword());
        assertNotNull(employee.getPasswordChangedAt());
        verify(userRepository, times(1)).save(employee);
        verify(userCache, times(1)).evict("nhanvien1");
    }

    @Test
    @DisplayName("Nhân viên thường không có quyền đặt lại mật khẩu cho nhân viên khác")
    void testResetEmployeePassword_NotOwner_ThrowsForbidden() {
        AdminResetEmployeePasswordRequest request = AdminResetEmployeePasswordRequest.builder()
                .newPassword("empNewPass123")
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(employee));

        AppException exception = assertThrows(AppException.class,
                () -> employeeService.resetEmployeePassword("nhanvien1", "u-emp", request));

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Chủ hộ không thể đặt lại mật khẩu của nhân viên thuộc hộ khác")
    void testResetEmployeePassword_CrossHousehold_ThrowsUnauthorized() {
        BusinessHousehold otherHousehold = BusinessHousehold.builder().id("hh-other").build();
        employee.setHousehold(otherHousehold);

        AdminResetEmployeePasswordRequest request = AdminResetEmployeePasswordRequest.builder()
                .newPassword("empNewPass123")
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(owner));
        when(userRepository.findById("u-emp")).thenReturn(Optional.of(employee));

        AppException exception = assertThrows(AppException.class,
                () -> employeeService.resetEmployeePassword("chuho", "u-emp", request));

        assertEquals(ErrorCode.UNAUTHORIZED, exception.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
    }
}
