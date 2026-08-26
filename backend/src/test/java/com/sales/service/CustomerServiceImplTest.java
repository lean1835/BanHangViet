package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateCustomerRequest;
import com.sales.dto.request.UpdateCustomerRequest;
import com.sales.dto.response.CustomerResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Customer;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.CustomerDebtRepository;
import com.sales.repository.CustomerRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.CustomerServiceImpl;
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
    private ActivityLogHelper activityLogHelper;

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
                .reminderDaysBefore(3)
                .reminderDaysAfter(3)
                .build();

        customerNoDebt = Customer.builder()
                .id("cust-002")
                .household(household)
                .name("Trần Thị B")
                .phoneNumber("0987654321")
                .currentDebt(BigDecimal.ZERO)
                .reminderDaysBefore(3)
                .reminderDaysAfter(3)
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

    @Test
    @DisplayName("Tạo khách hàng mới thành công với các giá trị mặc định của reminderDays")
    void createCustomer_DefaultReminderDays_Success() {
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("Nguyễn Văn C")
                .phoneNumber("0934567890")
                .email("vanc@gmail.com")
                .address("Hà Nội")
                .creditLimit(new BigDecimal("5000000.00"))
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByPhoneNumberAndHouseholdIdAndDeletedAtIsNull("0934567890", "house-001"))
                .thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer c = invocation.getArgument(0);
            c.setId("cust-003");
            return c;
        });

        CustomerResponse response = customerService.createCustomer("chuho", request);

        assertEquals("Nguyễn Văn C", response.getName());
        assertEquals("0934567890", response.getPhoneNumber());
        assertEquals(3, response.getReminderDaysBefore());
        assertEquals(3, response.getReminderDaysAfter());
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    @DisplayName("Tạo khách hàng mới thành công với các giá trị reminderDays tự chọn")
    void createCustomer_CustomReminderDays_Success() {
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("Nguyễn Văn D")
                .phoneNumber("0945678901")
                .email("vand@gmail.com")
                .address("Đà Nẵng")
                .creditLimit(new BigDecimal("10000000.00"))
                .reminderDaysBefore(7)
                .reminderDaysAfter(15)
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByPhoneNumberAndHouseholdIdAndDeletedAtIsNull("0945678901", "house-001"))
                .thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> {
            Customer c = invocation.getArgument(0);
            c.setId("cust-004");
            return c;
        });

        CustomerResponse response = customerService.createCustomer("chuho", request);

        assertEquals("Nguyễn Văn D", response.getName());
        assertEquals(7, response.getReminderDaysBefore());
        assertEquals(15, response.getReminderDaysAfter());
    }

    @Test
    @DisplayName("Cập nhật thông tin khách hàng thành công bao gồm các trường nhắc nợ")
    void updateCustomer_Success() {
        UpdateCustomerRequest request = UpdateCustomerRequest.builder()
                .name("Nguyễn Văn A Mod")
                .phoneNumber("0912345678")
                .email("vamod@gmail.com")
                .address("TP HCM")
                .creditLimit(new BigDecimal("6000000.00"))
                .reminderDaysBefore(1)
                .reminderDaysAfter(5)
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-001", "house-001"))
                .thenReturn(Optional.of(customerWithDebt));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerResponse response = customerService.updateCustomer("chuho", "cust-001", request);

        assertEquals("Nguyễn Văn A Mod", response.getName());
        assertEquals(1, response.getReminderDaysBefore());
        assertEquals(5, response.getReminderDaysAfter());
    }

    @Test
    @DisplayName("NCL-15-CN-003: Chủ hộ cài đặt mức chiết khấu riêng cho khách hàng thân thiết thành công")
    void createCustomer_WithVipDiscount_ByOwner_Success() {
        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("Khách quen VIP")
                .phoneNumber("0999888777")
                .discountRate(new BigDecimal("10.00"))
                .discountType("PERCENTAGE")
                .isVip(true)
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByPhoneNumberAndHouseholdIdAndDeletedAtIsNull("0999888777", "house-001"))
                .thenReturn(Optional.empty());
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerResponse response = customerService.createCustomer("chuho", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("10.00"), response.getDiscountRate());
        assertTrue(response.getIsVip());
    }

    @Test
    @DisplayName("NCL-15-CN-003 (TC-03): Nhân viên cố đặt mức chiết khấu riêng cho khách bị chặn (FORBIDDEN)")
    void createCustomer_WithVipDiscount_ByStaff_ThrowsForbidden() {
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên").build();
        User staffUser = User.builder()
                .id("user-002")
                .username("nhanvien")
                .role(staffRole)
                .household(household)
                .build();

        CreateCustomerRequest request = CreateCustomerRequest.builder()
                .name("Khách hàng")
                .phoneNumber("0999888777")
                .discountRate(new BigDecimal("10.00"))
                .isVip(true)
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));
        when(customerRepository.findByPhoneNumberAndHouseholdIdAndDeletedAtIsNull("0999888777", "house-001"))
                .thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () ->
                customerService.createCustomer("nhanvien", request)
        );

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    @DisplayName("NCL-15-CN-003 (TC-03): Nhân viên cố sửa mức chiết khấu riêng cho khách bị hệ thống chặn")
    void updateCustomer_WithVipDiscount_ByStaff_ThrowsForbidden() {
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên").build();
        User staffUser = User.builder()
                .id("user-002")
                .username("nhanvien")
                .role(staffRole)
                .household(household)
                .build();

        UpdateCustomerRequest request = UpdateCustomerRequest.builder()
                .name("Trần Thị B Mod")
                .phoneNumber("0987654321")
                .discountRate(new BigDecimal("15.00"))
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-002", "house-001"))
                .thenReturn(Optional.of(customerNoDebt));

        AppException exception = assertThrows(AppException.class, () ->
                customerService.updateCustomer("nhanvien", "cust-002", request)
        );

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }

    @Test
    @DisplayName("NCL-15-CN-003 (SEC-01): Nhân viên cố sửa loại chiết khấu (discountType) cho khách bị hệ thống chặn FORBIDDEN")
    void updateCustomer_WithDiscountType_ByStaff_ThrowsForbidden() {
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên").build();
        User staffUser = User.builder()
                .id("user-002")
                .username("nhanvien")
                .role(staffRole)
                .household(household)
                .build();

        Customer customer = Customer.builder()
                .id("cust-002")
                .household(household)
                .name("Trần Thị B")
                .phoneNumber("0987654321")
                .discountType("PERCENTAGE")
                .currentDebt(BigDecimal.ZERO)
                .build();

        UpdateCustomerRequest request = UpdateCustomerRequest.builder()
                .name("Trần Thị B")
                .phoneNumber("0987654321")
                .discountType("CASH")
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-002", "house-001"))
                .thenReturn(Optional.of(customer));

        AppException exception = assertThrows(AppException.class, () ->
                customerService.updateCustomer("nhanvien", "cust-002", request)
        );

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
    }
}
