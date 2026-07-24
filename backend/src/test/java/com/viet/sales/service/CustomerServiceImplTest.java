package com.viet.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Customer;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.CustomerDebtRepository;
import com.viet.sales.repository.CustomerRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.classes.CustomerServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private CustomerDebtRepository customerDebtRepository;

    @InjectMocks
    private CustomerServiceImpl customerService;

    private User currentUser;
    private BusinessHousehold household;
    private Customer customerWithDebt;
    private Customer customerNoDebt;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .name("Tạp Hóa Việt")
                .build();

        currentUser = User.builder()
                .id("user-001")
                .username("chuho")
                .role(ownerRole)
                .household(household)
                .build();

        customerWithDebt = Customer.builder()
                .id("cust-001")
                .household(household)
                .name("Nguyễn Văn A")
                .phoneNumber("0912345678")
                .currentDebt(new BigDecimal("100000.00"))
                .build();

        customerNoDebt = Customer.builder()
                .id("cust-002")
                .household(household)
                .name("Trần Thị B")
                .phoneNumber("0987654321")
                .currentDebt(BigDecimal.ZERO)
                .build();
    }

    @Test
    @DisplayName("Xóa khách hàng thành công khi không có dư nợ")
    void deleteCustomer_NoDebt_Success() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-002", "house-001"))
                .thenReturn(Optional.of(customerNoDebt));
        when(customerDebtRepository.existsByCustomerIdAndHouseholdIdAndStatusIn(
                eq("cust-002"), eq("house-001"), any()))
                .thenReturn(false);

        assertDoesNotThrow(() -> customerService.deleteCustomer("chuho", "cust-002"));

        assertNotNull(customerNoDebt.getDeletedAt());
        verify(customerRepository, times(1)).save(customerNoDebt);
    }

    @Test
    @DisplayName("Xóa khách hàng thất bại ném ngoại lệ khi có dư nợ")
    void deleteCustomer_WithDebt_ThrowsException() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-001", "house-001"))
                .thenReturn(Optional.of(customerWithDebt));

        AppException exception = assertThrows(AppException.class, () ->
                customerService.deleteCustomer("chuho", "cust-001")
        );

        assertEquals(ErrorCode.CUSTOMER_HAS_OUTSTANDING_DEBT, exception.getErrorCode());
        assertNull(customerWithDebt.getDeletedAt());
        verify(customerRepository, never()).save(customerWithDebt);
    }

    @Test
    @DisplayName("Xóa khách hàng thất bại ném ngoại lệ khi có dư nợ âm (trả thừa)")
    void deleteCustomer_WithNegativeDebt_ThrowsException() {
        Customer customerNegativeDebt = Customer.builder()
                .id("cust-003")
                .household(household)
                .name("Lê Văn C")
                .currentDebt(new BigDecimal("-50000.00"))
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-003", "house-001"))
                .thenReturn(Optional.of(customerNegativeDebt));

        AppException exception = assertThrows(AppException.class, () ->
                customerService.deleteCustomer("chuho", "cust-003")
        );

        assertEquals(ErrorCode.CUSTOMER_HAS_OUTSTANDING_DEBT, exception.getErrorCode());
        assertNull(customerNegativeDebt.getDeletedAt());
        verify(customerRepository, never()).save(customerNegativeDebt);
    }

    @Test
    @DisplayName("Xóa khách hàng thất bại ném ngoại lệ khi có các bản ghi công nợ chưa khép")
    void deleteCustomer_WithActiveDebtRecords_ThrowsException() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-002", "house-001"))
                .thenReturn(Optional.of(customerNoDebt));
        when(customerDebtRepository.existsByCustomerIdAndHouseholdIdAndStatusIn(
                eq("cust-002"), eq("house-001"), any()))
                .thenReturn(true); // Có bản ghi nợ chưa khép

        AppException exception = assertThrows(AppException.class, () ->
                customerService.deleteCustomer("chuho", "cust-002")
        );

        assertEquals(ErrorCode.CUSTOMER_HAS_OUTSTANDING_DEBT, exception.getErrorCode());
        assertNull(customerNoDebt.getDeletedAt());
        verify(customerRepository, never()).save(customerNoDebt);
    }
}
