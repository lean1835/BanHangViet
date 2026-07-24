package com.viet.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.viet.sales.dto.request.CollectDebtRequest;
import com.viet.sales.dto.response.CustomerDebtResponse;
import com.viet.sales.dto.response.DebtSummaryResponse;
import com.viet.sales.entity.*;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.ActivityLogRepository;
import com.viet.sales.repository.CustomerDebtRepository;
import com.viet.sales.repository.CustomerRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.classes.CustomerDebtServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomerDebtServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerDebtRepository customerDebtRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private CustomerDebtServiceImpl customerDebtService;

    private User currentUser;
    private BusinessHousehold household;
    private Customer customer;

    @BeforeEach
    void setUp() {
        Role staffRole = Role.builder().code("VT-02").name("Bán hàng").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .name("Tạp Hóa Việt")
                .taxCode("0123456789")
                .build();

        currentUser = User.builder()
                .id("user-001")
                .username("nhanvien")
                .role(staffRole)
                .household(household)
                .build();

        customer = Customer.builder()
                .id("cust-001")
                .household(household)
                .name("Nguyễn Thị Lan")
                .phoneNumber("0988888888")
                .creditLimit(new BigDecimal("5000000.00"))
                .currentDebt(new BigDecimal("150000.00"))
                .build();
    }

    @Test
    @DisplayName("Ghi nhận thu nợ thành công - Trả hết nợ (Full Payment)")
    void collectDebt_FullPayment_Success() {
        CollectDebtRequest request = CollectDebtRequest.builder()
                .customerId("cust-001")
                .amount(new BigDecimal("150000.00"))
                .notes("Trả hết nợ")
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        CustomerDebt debt1 = CustomerDebt.builder()
                .id("debt-001")
                .household(household)
                .customer(customer)
                .amount(new BigDecimal("100000.00"))
                .remainingAmount(new BigDecimal("100000.00"))
                .type("DEBT_CREATED")
                .status("PENDING")
                .createdByUser(currentUser)
                .createdAt(LocalDateTime.now().minusDays(10))
                .build();

        CustomerDebt debt2 = CustomerDebt.builder()
                .id("debt-002")
                .household(household)
                .customer(customer)
                .amount(new BigDecimal("50000.00"))
                .remainingAmount(new BigDecimal("50000.00"))
                .type("DEBT_CREATED")
                .status("PENDING")
                .createdByUser(currentUser)
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        List<CustomerDebt> activeDebts = List.of(debt1, debt2);
        when(customerDebtRepository.findByCustomerIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
                eq("cust-001"), eq("house-001"), any(), eq("DEBT_CREATED")))
                .thenReturn(activeDebts);

        when(customerDebtRepository.save(any(CustomerDebt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerDebtResponse response = customerDebtService.collectDebt("nhanvien", request);

        assertNotNull(response);
        assertEquals("DEBT_PAID", response.getType());
        assertEquals("PAID", response.getStatus());
        assertEquals(0, response.getAmount().compareTo(new BigDecimal("150000.00")));
        assertEquals(0, customer.getCurrentDebt().compareTo(BigDecimal.ZERO));
        assertEquals(0, debt1.getRemainingAmount().compareTo(BigDecimal.ZERO));
        assertEquals("PAID", debt1.getStatus());
        assertEquals(0, debt2.getRemainingAmount().compareTo(BigDecimal.ZERO));
        assertEquals("PAID", debt2.getStatus());

        verify(customerRepository, times(1)).save(customer);
        verify(customerDebtRepository, times(1)).saveAll(any());
        verify(customerDebtRepository, times(1)).save(any(CustomerDebt.class));
    }

    @Test
    @DisplayName("Ghi nhận thu nợ thành công - Trả một phần nợ lũy kế FIFO (Partial Payment)")
    void collectDebt_PartialPayment_Success() {
        CollectDebtRequest request = CollectDebtRequest.builder()
                .customerId("cust-001")
                .amount(new BigDecimal("120000.00"))
                .notes("Trả một phần")
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        CustomerDebt debt1 = CustomerDebt.builder()
                .id("debt-001")
                .household(household)
                .customer(customer)
                .amount(new BigDecimal("100000.00"))
                .remainingAmount(new BigDecimal("100000.00"))
                .type("DEBT_CREATED")
                .status("PENDING")
                .createdByUser(currentUser)
                .createdAt(LocalDateTime.now().minusDays(10))
                .build();

        CustomerDebt debt2 = CustomerDebt.builder()
                .id("debt-002")
                .household(household)
                .customer(customer)
                .amount(new BigDecimal("50000.00"))
                .remainingAmount(new BigDecimal("50000.00"))
                .type("DEBT_CREATED")
                .status("PENDING")
                .createdByUser(currentUser)
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        List<CustomerDebt> activeDebts = List.of(debt1, debt2);
        when(customerDebtRepository.findByCustomerIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
                eq("cust-001"), eq("house-001"), any(), eq("DEBT_CREATED")))
                .thenReturn(activeDebts);

        when(customerDebtRepository.save(any(CustomerDebt.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CustomerDebtResponse response = customerDebtService.collectDebt("nhanvien", request);

        assertNotNull(response);
        assertEquals(0, customer.getCurrentDebt().compareTo(new BigDecimal("30000.00")));
        assertEquals(0, debt1.getRemainingAmount().compareTo(BigDecimal.ZERO));
        assertEquals("PAID", debt1.getStatus());
        assertEquals(0, debt2.getRemainingAmount().compareTo(new BigDecimal("30000.00")));
        assertEquals("PENDING", debt2.getStatus());

        verify(customerRepository, times(1)).save(customer);
        verify(customerDebtRepository, times(1)).saveAll(any());
        verify(customerDebtRepository, times(1)).save(any(CustomerDebt.class));
    }

    @Test
    @DisplayName("Trả nợ vượt quá dư nợ hiện tại ném ngoại lệ INVALID_DEBT_PAYMENT_AMOUNT")
    void collectDebt_ExceedsCurrentDebt_ThrowsException() {
        CollectDebtRequest request = CollectDebtRequest.builder()
                .customerId("cust-001")
                .amount(new BigDecimal("200000.00")) // Vượt quá 150000.00 dư nợ
                .notes("Trả dư")
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        AppException exception = assertThrows(AppException.class, () ->
                customerDebtService.collectDebt("nhanvien", request)
        );

        assertEquals(ErrorCode.INVALID_DEBT_PAYMENT_AMOUNT, exception.getErrorCode());
        verify(customerRepository, never()).save(any());
        verify(customerDebtRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Trả nợ vượt quá tổng nợ chi tiết thực tế của các hóa đơn chưa trả ném ngoại lệ INVALID_DEBT_PAYMENT_AMOUNT")
    void collectDebt_ExceedsTotalActiveDebt_ThrowsException() {
        CollectDebtRequest request = CollectDebtRequest.builder()
                .customerId("cust-001")
                .amount(new BigDecimal("120000.00")) // Hợp lệ so với currentDebt (150000.00)
                .notes("Trả quá nợ chi tiết")
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(customer));

        CustomerDebt debt1 = CustomerDebt.builder()
                .id("debt-001")
                .household(household)
                .customer(customer)
                .amount(new BigDecimal("50000.00"))
                .remainingAmount(new BigDecimal("50000.00")) // Tổng nợ chi tiết thực tế chỉ có 50000.00
                .type("DEBT_CREATED")
                .status("PENDING")
                .createdByUser(currentUser)
                .build();

        when(customerDebtRepository.findByCustomerIdAndHouseholdIdAndStatusInAndTypeOrderByCreatedAtAsc(
                eq("cust-001"), eq("house-001"), any(), eq("DEBT_CREATED")))
                .thenReturn(List.of(debt1));

        AppException exception = assertThrows(AppException.class, () ->
                customerDebtService.collectDebt("nhanvien", request)
        );

        assertEquals(ErrorCode.INVALID_DEBT_PAYMENT_AMOUNT, exception.getErrorCode());
        verify(customerRepository, never()).save(any());
        verify(customerDebtRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Lấy danh sách nhắc nợ thành công")
    void getDebtReminders_Success() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(currentUser));

        CustomerDebt pendingDebt = CustomerDebt.builder()
                .id("debt-pending")
                .household(household)
                .customer(customer)
                .amount(new BigDecimal("100000.00"))
                .remainingAmount(new BigDecimal("100000.00"))
                .type("DEBT_CREATED")
                .status("PENDING")
                .createdByUser(currentUser)
                .dueDate(LocalDateTime.now().plusDays(5))
                .build();

        List<CustomerDebt> remindersList = List.of(pendingDebt);

        when(customerDebtRepository.findByHouseholdIdAndStatusInAndTypeOrderByDueDateAscWithRelations(
                eq("house-001"), eq(List.of("PENDING", "OVERDUE")), eq("DEBT_CREATED")))
                .thenReturn(remindersList);

        List<CustomerDebtResponse> responses = customerDebtService.getDebtReminders("nhanvien", null);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("PENDING", responses.get(0).getStatus());

        verify(customerDebtRepository, never()).saveAll(any());
    }
}
