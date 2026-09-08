package com.sales.service;

import com.sales.dto.response.DailyInvoiceControlResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.EInvoice;
import com.sales.entity.Order;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.EInvoiceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyInvoiceControlTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @InjectMocks
    private EInvoiceServiceImpl eInvoiceService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("house-001")
                .name("Hộ Tạp Hóa Việt")
                .taxCode("0123456789")
                .build();

        Role roleOwner = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        Role roleStaff = Role.builder().id(2).code("VT-02").name("Nhân viên").build();

        ownerUser = User.builder()
                .id("user-001")
                .username("chuho")
                .household(household)
                .role(roleOwner)
                .build();

        staffUser = User.builder()
                .id("user-002")
                .username("nhanvien")
                .household(household)
                .role(roleStaff)
                .build();
    }

    @Test
    @DisplayName("NCL-04-CN-008-TC-01: Chủ hộ đối chiếu có đơn chưa lập hóa đơn -> Liệt kê 3 nhóm bất thường")
    void getDailyInvoiceControl_Success_WithUninvoicedOrders() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));

        Order order = Order.builder()
                .id("order-101")
                .orderNumber("ORD-101")
                .household(household)
                .status("COMPLETED")
                .paymentStatus("PAID")
                .finalAmount(BigDecimal.valueOf(150000))
                .createdByUser(staffUser)
                .createdAt(LocalDateTime.now().minusHours(2))
                .build();

        when(orderRepository.findByHouseholdIdAndStatusAndPaymentStatusAndDeletedAtIsNull("house-001", "COMPLETED", "PAID"))
                .thenReturn(List.of(order));
        when(eInvoiceRepository.findByOrderIdAndDeletedAtIsNull("order-101")).thenReturn(Optional.empty());
        when(eInvoiceRepository.findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc("house-001"))
                .thenReturn(Collections.emptyList());

        DailyInvoiceControlResponse response = eInvoiceService.getDailyInvoiceControl("chuho", LocalDate.now());

        assertThat(response).isNotNull();
        assertThat(response.getIsCleanDay()).isFalse();
        assertThat(response.getTotalUninvoicedOrders()).isEqualTo(1);
        assertThat(response.getUninvoicedOrders().get(0).getOrderNumber()).isEqualTo("ORD-101");
    }

    @Test
    @DisplayName("NCL-04-CN-008-TC-02: Mọi đơn đã có hóa đơn -> Trả về isCleanDay = true")
    void getDailyInvoiceControl_CleanDay() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(orderRepository.findByHouseholdIdAndStatusAndPaymentStatusAndDeletedAtIsNull("house-001", "COMPLETED", "PAID"))
                .thenReturn(Collections.emptyList());
        when(eInvoiceRepository.findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc("house-001"))
                .thenReturn(Collections.emptyList());

        DailyInvoiceControlResponse response = eInvoiceService.getDailyInvoiceControl("chuho", LocalDate.now());

        assertThat(response).isNotNull();
        assertThat(response.getIsCleanDay()).isTrue();
        assertThat(response.getTotalUninvoicedOrders()).isEqualTo(0);
        assertThat(response.getTotalPendingInvoices()).isEqualTo(0);
        assertThat(response.getTotalFailedInvoices()).isEqualTo(0);
    }

    @Test
    @DisplayName("NCL-04-CN-008-TC-03: Nhân viên bán hàng (VT-02) truy cập -> Bị chặn với 403 FORBIDDEN")
    void getDailyInvoiceControl_StaffForbidden() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(staffUser));

        assertThatThrownBy(() -> eInvoiceService.getDailyInvoiceControl("nhanvien", LocalDate.now()))
                .isInstanceOf(AppException.class)
                .hasMessageContaining(ErrorCode.FORBIDDEN.getMessage());
    }
}
