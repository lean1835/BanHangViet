package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PaymentMethodConstant;
import com.sales.constant.PointTransactionType;
import com.sales.dto.request.AdjustPointsRequest;
import com.sales.dto.request.ApplyLoyaltyPointsRequest;
import com.sales.dto.request.LoyaltyProgramConfigRequest;
import com.sales.dto.response.CustomerLoyaltySummaryResponse;
import com.sales.dto.response.LoyaltyProgramConfigResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PointTransactionResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.LoyaltyServiceImpl;
import com.sales.service.interfaces.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoyaltyServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private LoyaltyProgramConfigRepository configRepository;

    @Mock
    private CustomerPointTransactionRepository transactionRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ReturnTicketRepository returnTicketRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private org.springframework.beans.factory.ObjectProvider<OrderService> orderServiceProvider;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private LoyaltyServiceImpl loyaltyService;

    private User ownerUser;
    private User salesUser;
    private BusinessHousehold household;
    private Customer testCustomer;
    private LoyaltyProgramConfig testConfig;

    @BeforeEach
    void setUp() {
        lenient().when(orderServiceProvider.getObject()).thenReturn(orderService);
        lenient().doAnswer(i -> {
            Order o = i.getArgument(0);
            BigDecimal pt = o.getPointDiscountAmount() != null ? o.getPointDiscountAmount() : BigDecimal.ZERO;
            o.setFinalAmount(new BigDecimal("200000.00").subtract(pt));
            return null;
        }).when(orderService).recalculateOrderTotals(any(Order.class));

        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();
        Role salesRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .name("Tạp Hóa Việt")
                .build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("chuho")
                .role(ownerRole)
                .household(household)
                .build();

        salesUser = User.builder()
                .id("user-sales")
                .username("nhanvien")
                .role(salesRole)
                .household(household)
                .build();

        testCustomer = Customer.builder()
                .id("cust-001")
                .household(household)
                .name("Nguyễn Văn A")
                .phoneNumber("0912345678")
                .loyaltyPoints(100)
                .build();

        testConfig = LoyaltyProgramConfig.builder()
                .id("cfg-001")
                .household(household)
                .isEnabled(true)
                .spendAmountPerPoint(new BigDecimal("10000.00"))
                .pointValue(new BigDecimal("1000.00"))
                .minPointsToRedeem(50)
                .maxRedeemRatePerOrder(new BigDecimal("100.00"))
                .pointExpiryDays(365)
                .build();
    }

    @Test
    @DisplayName("Lấy cấu hình thành công khi đã có trong DB")
    void testGetProgramConfig_Existing() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(configRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(testConfig));

        LoyaltyProgramConfigResponse response = loyaltyService.getProgramConfig("chuho");

        assertNotNull(response);
        assertEquals(testConfig.getId(), response.getId());
        assertEquals(new BigDecimal("10000.00"), response.getSpendAmountPerPoint());
        assertEquals(50, response.getMinPointsToRedeem());
    }

    @Test
    @DisplayName("Tự động tạo cấu hình mặc định khi chưa có trong DB")
    void testGetProgramConfig_CreateDefault() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(configRepository.findByHouseholdId("house-001")).thenReturn(Optional.empty());
        when(configRepository.save(any(LoyaltyProgramConfig.class))).thenAnswer(i -> i.getArgument(0));

        LoyaltyProgramConfigResponse response = loyaltyService.getProgramConfig("chuho");

        assertNotNull(response);
        assertTrue(response.getIsEnabled());
        assertEquals(new BigDecimal("10000.00"), response.getSpendAmountPerPoint());
        assertEquals(50, response.getMinPointsToRedeem());
        verify(configRepository).save(any(LoyaltyProgramConfig.class));
    }

    @Test
    @DisplayName("Cập nhật cấu hình thành công bởi Chủ hộ (VT-01)")
    void testUpdateProgramConfig_Success() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(configRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(testConfig));
        when(configRepository.save(any(LoyaltyProgramConfig.class))).thenAnswer(i -> i.getArgument(0));

        LoyaltyProgramConfigRequest request = LoyaltyProgramConfigRequest.builder()
                .isEnabled(true)
                .spendAmountPerPoint(new BigDecimal("20000.00"))
                .pointValue(new BigDecimal("2000.00"))
                .minPointsToRedeem(30)
                .maxRedeemRatePerOrder(new BigDecimal("50.00"))
                .pointExpiryDays(180)
                .build();

        LoyaltyProgramConfigResponse response = loyaltyService.updateProgramConfig("chuho", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("20000.00"), response.getSpendAmountPerPoint());
        assertEquals(30, response.getMinPointsToRedeem());
        verify(configRepository).save(any(LoyaltyProgramConfig.class));
    }

    @Test
    @DisplayName("Cập nhật cấu hình bị từ chối nếu không phải chủ hộ")
    void testUpdateProgramConfig_ForbiddenForNonOwner() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salesUser));

        LoyaltyProgramConfigRequest request = LoyaltyProgramConfigRequest.builder()
                .isEnabled(true)
                .spendAmountPerPoint(new BigDecimal("20000.00"))
                .pointValue(new BigDecimal("2000.00"))
                .minPointsToRedeem(30)
                .maxRedeemRatePerOrder(new BigDecimal("50.00"))
                .pointExpiryDays(180)
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> loyaltyService.updateProgramConfig("nhanvien", request));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật cấu hình với giá trị không hợp lệ ném INVALID_LOYALTY_CONFIG")
    void testUpdateProgramConfig_InvalidInput() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));

        LoyaltyProgramConfigRequest request = LoyaltyProgramConfigRequest.builder()
                .isEnabled(true)
                .spendAmountPerPoint(BigDecimal.ZERO)
                .pointValue(new BigDecimal("1000.00"))
                .minPointsToRedeem(50)
                .maxRedeemRatePerOrder(new BigDecimal("100.00"))
                .pointExpiryDays(365)
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> loyaltyService.updateProgramConfig("chuho", request));
        assertEquals(ErrorCode.INVALID_LOYALTY_CONFIG, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lấy tóm tắt điểm khách hàng thành công")
    void testGetCustomerLoyaltySummary_Success() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salesUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));
        when(configRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(testConfig));
        when(transactionRepository.sumPointsEarnedByCustomer("house-001", "cust-001")).thenReturn(150);
        when(transactionRepository.sumPointsRedeemedByCustomer("house-001", "cust-001")).thenReturn(50);
        when(transactionRepository.sumPointsDeductedByCustomer("house-001", "cust-001")).thenReturn(0);
        when(transactionRepository.findNearestExpiringDate(eq("house-001"), eq("cust-001"), any(LocalDate.class)))
                .thenReturn(Optional.of(LocalDate.now().plusMonths(6)));
        when(transactionRepository.sumPointsExpiringSoon(eq("house-001"), eq("cust-001"), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(20);

        CustomerLoyaltySummaryResponse summary = loyaltyService.getCustomerLoyaltySummary("nhanvien", "cust-001");

        assertNotNull(summary);
        assertEquals("cust-001", summary.getCustomerId());
        assertEquals(100, summary.getAvailablePoints());
        assertEquals(new BigDecimal("100000.00"), summary.getMonetaryEquivalent());
        assertTrue(summary.getIsEligibleToRedeem());
        assertEquals(150, summary.getTotalPointsEarned());
        assertEquals(50, summary.getTotalPointsRedeemed());
        assertEquals(20, summary.getPointsExpiringSoon());
    }

    @Test
    @DisplayName("Lấy lịch sử giao dịch điểm phân trang thành công")
    void testGetCustomerPointTransactions_Success() {
        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salesUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));

        CustomerPointTransaction tx = CustomerPointTransaction.builder()
                .id("tx-001")
                .household(household)
                .customer(testCustomer)
                .type(PointTransactionType.EARN)
                .pointsChange(25)
                .balanceAfter(100)
                .monetaryEquivalent(new BigDecimal("25000.00"))
                .description("Tích điểm từ đơn hàng")
                .createdByUser(salesUser)
                .build();

        Page<CustomerPointTransaction> page = new PageImpl<>(List.of(tx));
        when(transactionRepository.findAllByHouseholdIdAndCustomerIdOrderByCreatedAtDesc(
                eq("house-001"), eq("cust-001"), any(Pageable.class))).thenReturn(page);

        PageResponse<PointTransactionResponse> result = loyaltyService.getCustomerPointTransactions(
                "nhanvien", "cust-001", 0, 10, null);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("tx-001", result.getContent().get(0).getId());
        assertEquals(25, result.getContent().get(0).getPointsChange());
        assertEquals("EARN", result.getContent().get(0).getType());
    }

    @Test
    @DisplayName("Áp dụng đổi điểm trên đơn thành công (AC-03, QTN-26)")
    void testApplyPointsToOrder_Success() {
        Order order = Order.builder()
                .id("ord-001")
                .household(household)
                .customer(testCustomer)
                .status("CREATING")
                .totalAmount(new BigDecimal("200000.00"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("200000.00"))
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salesUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-001", "house-001"))
                .thenReturn(Optional.of(order));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));
        when(configRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(testConfig));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse mockOrderResponse = OrderResponse.builder()
                .id("ord-001")
                .pointDiscountAmount(new BigDecimal("50000.00"))
                .pointsRedeemed(50)
                .finalAmount(new BigDecimal("150000.00"))
                .build();
        when(orderService.getOrder("nhanvien", "ord-001")).thenReturn(mockOrderResponse);

        ApplyLoyaltyPointsRequest request = ApplyLoyaltyPointsRequest.builder()
                .pointsToRedeem(50)
                .build();

        OrderResponse response = loyaltyService.applyPointsToOrder("nhanvien", "ord-001", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("50000.00"), response.getPointDiscountAmount());
        assertEquals(50, response.getPointsRedeemed());
        assertEquals(new BigDecimal("150000.00"), response.getFinalAmount());
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("Áp đổi điểm bị từ chối nếu không đủ điểm tối thiểu (MIN_POINTS_TO_REDEEM_NOT_REACHED)")
    void testApplyPointsToOrder_MinPointsNotReached() {
        Order order = Order.builder()
                .id("ord-001")
                .household(household)
                .customer(testCustomer)
                .status("CREATING")
                .totalAmount(new BigDecimal("200000.00"))
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salesUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-001", "house-001"))
                .thenReturn(Optional.of(order));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));
        when(configRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(testConfig));

        ApplyLoyaltyPointsRequest request = ApplyLoyaltyPointsRequest.builder()
                .pointsToRedeem(30) // min is 50
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> loyaltyService.applyPointsToOrder("nhanvien", "ord-001", request));
        assertEquals(ErrorCode.MIN_POINTS_TO_REDEEM_NOT_REACHED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Áp đổi điểm bị từ chối nếu vượt quá điểm khả dụng (INSUFFICIENT_LOYALTY_POINTS)")
    void testApplyPointsToOrder_InsufficientPoints() {
        Order order = Order.builder()
                .id("ord-001")
                .household(household)
                .customer(testCustomer) // has 100 points
                .status("CREATING")
                .totalAmount(new BigDecimal("200000.00"))
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salesUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-001", "house-001"))
                .thenReturn(Optional.of(order));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));
        when(configRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(testConfig));

        ApplyLoyaltyPointsRequest request = ApplyLoyaltyPointsRequest.builder()
                .pointsToRedeem(150) // customer only has 100
                .build();

        AppException ex = assertThrows(AppException.class,
                () -> loyaltyService.applyPointsToOrder("nhanvien", "ord-001", request));
        assertEquals(ErrorCode.INSUFFICIENT_LOYALTY_POINTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Hủy áp dụng đổi điểm trên đơn thành công")
    void testRemovePointsFromOrder_Success() {
        Order order = Order.builder()
                .id("ord-001")
                .household(household)
                .customer(testCustomer)
                .status("CREATING")
                .pointDiscountAmount(new BigDecimal("50000.00"))
                .pointsRedeemed(50)
                .finalAmount(new BigDecimal("150000.00"))
                .build();

        when(userRepository.findByUsername("nhanvien")).thenReturn(Optional.of(salesUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-001", "house-001"))
                .thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse mockOrderResponse = OrderResponse.builder()
                .id("ord-001")
                .pointDiscountAmount(BigDecimal.ZERO)
                .pointsRedeemed(0)
                .finalAmount(new BigDecimal("200000.00"))
                .build();
        when(orderService.getOrder("nhanvien", "ord-001")).thenReturn(mockOrderResponse);

        OrderResponse response = loyaltyService.removePointsFromOrder("nhanvien", "ord-001");

        assertNotNull(response);
        assertEquals(BigDecimal.ZERO, order.getPointDiscountAmount());
        assertEquals(0, order.getPointsRedeemed());
        assertEquals(new BigDecimal("200000.00"), order.getFinalAmount());
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("Xử lý trừ điểm đã đổi khi hoàn tất đơn hàng (processPointsRedeemed)")
    void testProcessPointsRedeemed_Success() {
        Order order = Order.builder()
                .id("ord-001")
                .orderNumber("ORD-001")
                .household(household)
                .customer(testCustomer)
                .pointsRedeemed(50)
                .pointDiscountAmount(new BigDecimal("50000.00"))
                .build();

        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));

        loyaltyService.processPointsRedeemed(order, salesUser);

        assertEquals(50, testCustomer.getLoyaltyPoints()); // 100 - 50 = 50
        verify(customerRepository).save(testCustomer);
        verify(transactionRepository).save(argThat(tx ->
                tx.getType().equals(PointTransactionType.REDEEM) &&
                tx.getPointsChange() == -50 &&
                tx.getBalanceAfter() == 50
        ));
    }

    @Test
    @DisplayName("Tích điểm khi hoàn tất đơn hàng chỉ tính trên tiền thực trả (TC-01, bỏ qua DEBT)")
    void testEarnPointsForCompletedOrder_CashAndDebt() {
        List<OrderPayment> payments = new ArrayList<>();
        payments.add(OrderPayment.builder()
                .paymentMethod(PaymentMethodConstant.CASH)
                .amount(new BigDecimal("100000.00"))
                .isConfirmed(true)
                .build());
        payments.add(OrderPayment.builder()
                .paymentMethod(PaymentMethodConstant.DEBT)
                .amount(new BigDecimal("150000.00"))
                .isConfirmed(true)
                .build());

        Order order = Order.builder()
                .id("ord-001")
                .orderNumber("ORD-001")
                .household(household)
                .customer(testCustomer) // currently 100 points
                .payments(payments)
                .finalAmount(new BigDecimal("250000.00"))
                .build();

        when(configRepository.findByHouseholdId("house-001")).thenReturn(Optional.of(testConfig));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));

        loyaltyService.earnPointsForCompletedOrder(order, salesUser);

        // 100,000 CASH / 10,000 spend_amount_per_point = 10 points (DEBT 150k is ignored!)
        assertEquals(10, order.getPointsEarned());
        assertEquals(110, testCustomer.getLoyaltyPoints());
        verify(customerRepository).save(testCustomer);
        verify(transactionRepository).save(argThat(tx ->
                tx.getType().equals(PointTransactionType.EARN) &&
                tx.getPointsChange() == 10 &&
                tx.getBalanceAfter() == 110
        ));
    }

    @Test
    @DisplayName("Thu hồi điểm khi duyệt phiếu trả hàng (TC-02)")
    void testDeductPointsForReturnTicket_Success() {
        Order originalOrder = Order.builder()
                .id("ord-orig")
                .orderNumber("ORD-ORIG-001")
                .household(household)
                .customer(testCustomer)
                .finalAmount(new BigDecimal("200000.00"))
                .pointsEarned(20)
                .build();

        ReturnTicket ticket = ReturnTicket.builder()
                .id("rt-001")
                .ticketNumber("RT-001")
                .household(household)
                .customer(testCustomer) // has 100 points
                .originalOrder(originalOrder)
                .totalReturnAmount(new BigDecimal("100000.00")) // 50% return
                .build();

        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));

        loyaltyService.deductPointsForReturnTicket(ticket, ownerUser);

        // 50% of 20 points = 10 points deducted
        assertEquals(10, ticket.getPointsDeducted());
        assertEquals(90, testCustomer.getLoyaltyPoints()); // 100 - 10 = 90
        verify(customerRepository).save(testCustomer);
        verify(transactionRepository).save(argThat(tx ->
                tx.getType().equals(PointTransactionType.RETURN_DEDUCTION) &&
                tx.getPointsChange() == -10 &&
                tx.getBalanceAfter() == 90
        ));
    }

    @Test
    @DisplayName("Điều chỉnh điểm thủ công thành công bởi Chủ hộ (VT-01)")
    void testAdjustPointsManually_Success() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));
        when(transactionRepository.save(any(CustomerPointTransaction.class))).thenAnswer(i -> {
            CustomerPointTransaction cpt = i.getArgument(0);
            cpt.setId("tx-adj");
            return cpt;
        });

        AdjustPointsRequest request = AdjustPointsRequest.builder()
                .pointsChange(15)
                .reason("Bồi thường sự cố thanh toán")
                .build();

        PointTransactionResponse response = loyaltyService.adjustPointsManually("chuho", "cust-001", request);

        assertNotNull(response);
        assertEquals(115, testCustomer.getLoyaltyPoints()); // 100 + 15 = 115
        assertEquals(15, response.getPointsChange());
        assertEquals(115, response.getBalanceAfter());
        assertEquals("ADJUST", response.getType());
    }

    @Test
    @DisplayName("NCL-10-CN-008-TC-02: Thu hồi điểm nhiều lần không vượt quá số điểm còn lại có thể thu hồi")
    void testDeductPointsForReturnTicket_MultipleReturns_Capped() {
        Order originalOrder = Order.builder()
                .id("ord-multi")
                .orderNumber("ORD-MULTI")
                .pointsEarned(50) // Gốc tích 50 điểm
                .finalAmount(new BigDecimal("500000.00"))
                .build();

        ReturnTicket ticket2 = ReturnTicket.builder()
                .id("rt-002")
                .ticketNumber("RT-002")
                .household(household)
                .customer(testCustomer)
                .originalOrder(originalOrder)
                .totalReturnAmount(new BigDecimal("300000.00")) // Tính ra 30 điểm
                .build();

        // Đã thu hồi 40 điểm ở phiếu trước
        when(transactionRepository.sumPointsDeductedByOrderId("ord-multi")).thenReturn(40);
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-001", "house-001"))
                .thenReturn(Optional.of(testCustomer));

        loyaltyService.deductPointsForReturnTicket(ticket2, ownerUser);

        // maxCanDeduct = 50 - 40 = 10, dù 300k/500k = 30 điểm thì cũng chỉ thu hồi tối đa 10 điểm còn lại
        assertEquals(10, ticket2.getPointsDeducted());
        verify(returnTicketRepository).save(ticket2);
    }
}
