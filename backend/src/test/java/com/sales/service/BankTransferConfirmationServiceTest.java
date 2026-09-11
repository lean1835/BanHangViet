package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PaymentMethodConstant;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CompleteOrderRequest;
import com.sales.dto.request.ConfirmBankTransferRequest;
import com.sales.dto.request.SwitchPaymentMethodRequest;
import com.sales.dto.response.BankTransferReconciliationResponse;
import com.sales.dto.response.OrderPaymentResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.OrderPaymentServiceImpl;
import com.sales.service.classes.OrderServiceImpl;
import com.sales.service.classes.ShiftServiceImpl;
import com.sales.service.interfaces.PosInventoryService;
import com.sales.service.interfaces.ProductPriceTierService;
import com.sales.service.interfaces.PromotionService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BankTransferConfirmationServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderItemRepository orderItemRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CustomerRepository customerRepository;
    @Mock
    private ShiftRepository shiftRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ActivityLogHelper activityLogHelper;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private CustomerDebtRepository customerDebtRepository;
    @Mock
    private PromotionService promotionService;
    @Mock
    private PromotionRepository promotionRepository;
    @Mock
    private PosInventoryRepository posInventoryRepository;
    @Mock
    private PosInventoryService posInventoryService;
    @Mock
    private ProductUnitConversionRepository productUnitConversionRepository;
    @Mock
    private ProductPriceTierService productPriceTierService;
    @Mock
    private DiningTableRepository diningTableRepository;
    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;
    @Mock
    private OrderPaymentRepository orderPaymentRepository;
    @Mock
    private PointOfSaleRepository pointOfSaleRepository;
    @Mock
    private HttpServletRequest httpServletRequest;

    @InjectMocks
    private OrderServiceImpl orderService;

    private OrderPaymentServiceImpl orderPaymentService;
    private ShiftServiceImpl shiftService;

    private BusinessHousehold household;
    private User cashierUser;
    private Role cashierRole;
    private Shift activeShift;
    private Customer testCustomer;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("household-01")
                .name("Cửa hàng Tiện Lợi Việt")
                .build();

        cashierRole = Role.builder()
                .id(2)
                .code("VT-02")
                .name("Thu ngân")
                .build();

        cashierUser = User.builder()
                .id("user-02")
                .username("thungan01")
                .fullName("Nguyễn Thu Ngân")
                .household(household)
                .role(cashierRole)
                .build();

        activeShift = Shift.builder()
                .id("shift-01")
                .household(household)
                .user(cashierUser)
                .status(ShiftStatus.OPEN)
                .openingCash(new BigDecimal("500000"))
                .openedAt(LocalDateTime.now())
                .build();

        testCustomer = Customer.builder()
                .id("cust-01")
                .name("Nguyễn Văn Khách")
                .household(household)
                .creditLimit(new BigDecimal("5000000"))
                .currentDebt(BigDecimal.ZERO)
                .build();

        orderPaymentService = new OrderPaymentServiceImpl(
                orderPaymentRepository,
                orderRepository,
                userRepository,
                settingsRepository,
                activityLogHelper,
                objectMapper,
                httpServletRequest
        );

        shiftService = new ShiftServiceImpl(
                shiftRepository,
                userRepository,
                activityLogHelper,
                orderRepository,
                pointOfSaleRepository,
                objectMapper,
                orderPaymentRepository,
                settingsRepository
        );
    }

    private Order createMockCreatingBankOrder(BigDecimal amount) {
        Order order = Order.builder()
                .id("order-bank-01")
                .orderNumber("DH-20260909-001")
                .household(household)
                .shift(activeShift)
                .createdByUser(cashierUser)
                .totalAmount(amount)
                .finalAmount(amount)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .paymentStatus("PENDING")
                .status("CREATING")
                .items(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();

        Product product = Product.builder()
                .id("prod-01")
                .name("Nước tăng lực")
                .price(amount)
                .household(household)
                .build();

        OrderItem item = OrderItem.builder()
                .id("item-01")
                .order(order)
                .product(product)
                .quantity(BigDecimal.ONE)
                .unitPrice(amount)
                .subtotal(amount)
                .build();

        order.getItems().add(item);
        return order;
    }

    @Test
    @DisplayName("AC-01: Xác nhận chuyển khoản thành công - Lưu vết mã giao dịch và thời gian")
    void testConfirmOrderBankTransfer_Success_AC01() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));
        OrderPayment pendingPayment = OrderPayment.builder()
                .id("pay-01")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("350000.00"))
                .isConfirmed(false)
                .createdAt(LocalDateTime.now().minusMinutes(2))
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));
        when(orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod("order-bank-01", "household-01", PaymentMethodConstant.BANK_TRANSFER))
                .thenReturn(Optional.of(pendingPayment));
        when(orderPaymentRepository.save(any(OrderPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("FT260909123456")
                .notes("Khách quét mã VietQR thành công")
                .build();

        OrderPaymentResponse response = orderPaymentService.confirmOrderBankTransfer("thungan01", "order-bank-01", request);

        assertNotNull(response);
        assertTrue(response.getIsConfirmed());
        assertEquals("FT260909123456", response.getTransactionCode());
        assertEquals(cashierUser.getId(), response.getConfirmedByUserId());
        assertNotNull(response.getConfirmedAt());
        assertFalse(response.getIsTransferOverdue());
        verify(orderPaymentRepository, times(1)).save(any(OrderPayment.class));
    }

    @Test
    @DisplayName("AC-01 Validation: Thiếu mã giao dịch khi xác nhận thì ném lỗi PAYMENT_TRANSACTION_CODE_REQUIRED")
    void testConfirmOrderBankTransfer_EmptyTransactionCode_ThrowsException() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));

        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("   ")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                orderPaymentService.confirmOrderBankTransfer("thungan01", "order-bank-01", request));

        assertEquals(ErrorCode.PAYMENT_TRANSACTION_CODE_REQUIRED, ex.getErrorCode());
        verify(orderPaymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Ngoại lệ: Khoản thanh toán đã xác nhận trước đó thì ném lỗi PAYMENT_ALREADY_CONFIRMED")
    void testConfirmOrderBankTransfer_AlreadyConfirmed_ThrowsException() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));
        OrderPayment alreadyConfirmedPayment = OrderPayment.builder()
                .id("pay-01")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("350000.00"))
                .isConfirmed(true)
                .transactionCode("FT999")
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));
        when(orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod("order-bank-01", "household-01", PaymentMethodConstant.BANK_TRANSFER))
                .thenReturn(Optional.of(alreadyConfirmedPayment));

        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("FTNEW123")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                orderPaymentService.confirmOrderBankTransfer("thungan01", "order-bank-01", request));

        assertEquals(ErrorCode.PAYMENT_ALREADY_CONFIRMED, ex.getErrorCode());
        verify(orderPaymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("AC-02 & QTN-03: Chặn chốt đơn khi tiền chuyển khoản chưa xác nhận - Giữ đơn ở CREATING")
    void testCompleteOrder_BankTransferNotConfirmed_BlocksOrder_AC02() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));
        OrderPayment unconfirmedPayment = OrderPayment.builder()
                .id("pay-01")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("350000.00"))
                .isConfirmed(false)
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));
        when(orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod("order-bank-01", "household-01", "BANK_TRANSFER"))
                .thenReturn(Optional.of(unconfirmedPayment));

        CompleteOrderRequest request = new CompleteOrderRequest();

        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-bank-01", request));

        assertEquals(ErrorCode.BANK_TRANSFER_NOT_CONFIRMED, ex.getErrorCode());
        assertEquals("CREATING", order.getStatus());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("AC-01: Sau khi đã xác nhận tiền về -> Cho phép chốt đơn thành công sang COMPLETED")
    void testCompleteOrder_BankTransferConfirmed_Success_AC01() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));
        OrderPayment confirmedPayment = OrderPayment.builder()
                .id("pay-01")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("350000.00"))
                .isConfirmed(true)
                .transactionCode("FT260909123456")
                .confirmedAt(LocalDateTime.now())
                .confirmedByUser(cashierUser)
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));
        when(orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod("order-bank-01", "household-01", "BANK_TRANSFER"))
                .thenReturn(Optional.of(confirmedPayment));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));


        CompleteOrderRequest request = new CompleteOrderRequest();

        OrderResponse response = orderService.completeOrder("thungan01", "order-bank-01", request);

        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
        assertEquals("PAID", response.getPaymentStatus());
        assertEquals(PaymentMethodConstant.BANK_TRANSFER, response.getPaymentMethod());
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    @DisplayName("AC-03: Khách hủy chuyển khoản -> Đổi sang Tiền mặt (CASH) an toàn, giữ nguyên giỏ hàng")
    void testSwitchPaymentMethod_FromBankTransferToCash_Success_AC03() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));
        OrderPayment oldBankPayment = OrderPayment.builder()
                .id("pay-old-01")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("350000.00"))
                .isConfirmed(false)
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SwitchPaymentMethodRequest request = SwitchPaymentMethodRequest.builder()
                .newPaymentMethod("CASH")
                .amountGiven(new BigDecimal("400000.00"))
                .notes("Khách đổi sang tiền mặt do ngân hàng bảo trì")
                .build();

        OrderResponse response = orderService.switchPaymentMethod("thungan01", "order-bank-01", request);

        assertNotNull(response);
        assertEquals("CASH", response.getPaymentMethod());
        assertEquals("CREATING", response.getStatus());
        // Giỏ hàng giữ nguyên 1 sản phẩm
        assertEquals(1, response.getItems().size());
        assertTrue(order.getPayments().isEmpty());
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    @DisplayName("AC-03: Khách hủy chuyển khoản -> Đổi sang Ghi nợ (DEBT) có kiểm tra hạn mức tín dụng")
    void testSwitchPaymentMethod_FromBankTransferToDebt_Success_AC03() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-01", "household-01"))
                .thenReturn(Optional.of(testCustomer));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SwitchPaymentMethodRequest request = SwitchPaymentMethodRequest.builder()
                .newPaymentMethod("DEBT")
                .customerId("cust-01")
                .notes("Khách quen ghi nợ")
                .build();

        OrderResponse response = orderService.switchPaymentMethod("thungan01", "order-bank-01", request);

        assertNotNull(response);
        assertEquals("DEBT", response.getPaymentMethod());
        assertEquals("DEBT", response.getPaymentStatus());
        assertEquals("cust-01", response.getCustomerId());
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    @DisplayName("Ngoại lệ: Đơn hàng đã hoàn thành thì chặn không cho đổi phương thức thanh toán")
    void testSwitchPaymentMethod_OrderAlreadyCompleted_ThrowsException() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));
        order.setStatus("COMPLETED");

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));

        SwitchPaymentMethodRequest request = SwitchPaymentMethodRequest.builder()
                .newPaymentMethod("CASH")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                orderService.switchPaymentMethod("thungan01", "order-bank-01", request));

        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CHANGE_PAYMENT, ex.getErrorCode());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("QTN-16: Đối soát chuyển khoản đóng ca - Tổng hợp đầy đủ tiền đã xác nhận và chưa xác nhận")
    void testBankTransferReconciliation_ShiftClose_Success_QTN16() {
        Order order1 = createMockCreatingBankOrder(new BigDecimal("300000.00"));
        order1.setStatus("COMPLETED");
        OrderPayment p1 = OrderPayment.builder()
                .id("pay-01")
                .order(order1)
                .amount(new BigDecimal("300000.00"))
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .transactionCode("FT001")
                .isConfirmed(true)
                .confirmedAt(LocalDateTime.now().minusHours(1))
                .confirmedByUser(cashierUser)
                .build();

        Order order2 = createMockCreatingBankOrder(new BigDecimal("200000.00"));
        OrderPayment p2 = OrderPayment.builder()
                .id("pay-02")
                .order(order2)
                .amount(new BigDecimal("200000.00"))
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .isConfirmed(false)
                .createdAt(LocalDateTime.now().minusMinutes(30))
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(shiftRepository.findByIdAndHouseholdId("shift-01", "household-01"))
                .thenReturn(Optional.of(activeShift));
        when(orderPaymentRepository.findBankTransfersByShiftIdAndHouseholdId("shift-01", "household-01"))
                .thenReturn(List.of(p1, p2));

        BusinessHouseholdSettings settings = BusinessHouseholdSettings.builder()
                .bankTransferTimeoutMinutes(15)
                .build();
        when(settingsRepository.findByHouseholdId("household-01")).thenReturn(Optional.of(settings));

        BankTransferReconciliationResponse response = shiftService.getBankTransferReconciliation("thungan01", "shift-01");

        assertNotNull(response);
        assertEquals("shift-01", response.getShiftId());
        assertEquals(2, response.getTotalTransactions());
        assertEquals(new BigDecimal("300000.00"), response.getTotalConfirmedAmount());
        assertEquals(1, response.getUnconfirmedTransactionsCount());
        assertEquals(new BigDecimal("200000.00"), response.getTotalUnconfirmedAmount());
        assertEquals(2, response.getTransactions().size());
        // p2 đã tạo cách đây 30 phút, timeout là 15 phút -> isTransferOverdue phải là true
        assertTrue(response.getTransactions().get(1).getIsTransferOverdue());
        // Kiểm tra confirmedByUsername và confirmedByFullName
        assertEquals("thungan01", response.getTransactions().get(0).getConfirmedByUsername());
        assertEquals("Nguyễn Thu Ngân", response.getTransactions().get(0).getConfirmedByFullName());
    }

    @Test
    @DisplayName("P1 Fix: Chặn xác nhận chuyển khoản khi đơn hàng đã bị HỦY (CANCELED)")
    void testConfirmOrderBankTransfer_OrderCancelled_ThrowsException() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));
        order.setStatus("CANCELED");

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));

        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("FT260909999")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                orderPaymentService.confirmOrderBankTransfer("thungan01", "order-bank-01", request));

        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CHANGE_PAYMENT, ex.getErrorCode());
        verify(orderPaymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("P1 Fix: Chặn xác nhận chuyển khoản khi ca bán hàng của đơn đã ĐÓNG (CLOSED)")
    void testConfirmOrderBankTransfer_ShiftClosed_ThrowsException() {
        Order order = createMockCreatingBankOrder(new BigDecimal("350000.00"));
        Shift closedShift = Shift.builder()
                .id("shift-old")
                .household(household)
                .user(cashierUser)
                .status(ShiftStatus.CLOSED)
                .build();
        order.setShift(closedShift);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));

        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("FT260909888")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                orderPaymentService.confirmOrderBankTransfer("thungan01", "order-bank-01", request));

        assertEquals(ErrorCode.ACTIVE_SHIFT_NOT_FOUND, ex.getErrorCode());
        verify(orderPaymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("P1 Fix: Tự động tạo bản ghi Payment phải lấy finalAmount khi đơn có giảm giá (QTN-07)")
    void testConfirmOrderBankTransfer_AutoCreatePayment_UsesFinalAmount_WhenDiscountExists() {
        Order order = createMockCreatingBankOrder(new BigDecimal("500000.00"));
        order.setTotalAmount(new BigDecimal("500000.00"));
        order.setDiscountAmount(new BigDecimal("100000.00"));
        order.setFinalAmount(new BigDecimal("400000.00")); // Tiền khách phải trả sau giảm

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-bank-01", "household-01"))
                .thenReturn(Optional.of(order));
        when(orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod("order-bank-01", "household-01", PaymentMethodConstant.BANK_TRANSFER))
                .thenReturn(Optional.empty()); // Chưa có bản ghi payment
        when(orderPaymentRepository.save(any(OrderPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("FT260909777")
                .build();

        OrderPaymentResponse response = orderPaymentService.confirmOrderBankTransfer("thungan01", "order-bank-01", request);

        assertNotNull(response);
        assertTrue(response.getIsConfirmed());
        // Số tiền thanh toán phải là 400.000đ (finalAmount), KHÔNG PHẢI 500.000đ (totalAmount)
        assertEquals(new BigDecimal("400000.00"), response.getAmount());
        assertEquals("FT260909777", response.getTransactionCode());
        verify(orderPaymentRepository, times(2)).save(any(OrderPayment.class));
    }
}
