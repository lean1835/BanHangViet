package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PaymentMethodConstant;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CompleteOrderRequest;
import com.sales.dto.request.ConfirmBankTransferRequest;
import com.sales.dto.request.OrderPaymentRequest;
import com.sales.dto.response.OrderPaymentResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.OrderPaymentServiceImpl;
import com.sales.service.classes.OrderServiceImpl;
import com.sales.service.interfaces.PosInventoryService;
import com.sales.service.interfaces.ProductPriceTierService;
import com.sales.service.interfaces.PromotionService;
import com.sales.service.classes.ActivityLogHelper;
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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CombinedPaymentServiceTest {

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

    @InjectMocks
    private OrderServiceImpl orderService;

    @Mock
    private jakarta.servlet.http.HttpServletRequest httpServletRequest;

    private OrderPaymentServiceImpl orderPaymentService;

    private BusinessHousehold household;
    private User cashierUser;
    private Role cashierRole;
    private Shift activeShift;
    private Customer vipCustomer;

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

        vipCustomer = Customer.builder()
                .id("cust-vip-01")
                .name("Anh Tuấn VIP")
                .household(household)
                .creditLimit(new BigDecimal("2000000"))
                .currentDebt(BigDecimal.ZERO)
                .build();

        orderPaymentService = new OrderPaymentServiceImpl(
                orderPaymentRepository,
                orderRepository,
                userRepository,
                activityLogHelper,
                objectMapper,
                httpServletRequest
        );
    }

    private Order createMockCreatingOrder(BigDecimal totalAndFinalAmount, Customer customer) {
        Order order = Order.builder()
                .id("order-101")
                .household(household)
                .orderNumber("HD-20260909-0001")
                .createdByUser(cashierUser)
                .shift(activeShift)
                .customer(customer)
                .status("CREATING")
                .paymentMethod("CASH")
                .paymentStatus("PENDING")
                .totalAmount(totalAndFinalAmount)
                .finalAmount(totalAndFinalAmount)
                .items(new ArrayList<>())
                .payments(new ArrayList<>())
                .build();

        Product product = Product.builder()
                .id("prod-01")
                .name("Nước tăng lực RedBull")
                .price(totalAndFinalAmount)
                .stockQuantity(new BigDecimal("100"))
                .build();

        OrderItem item = OrderItem.builder()
                .id("item-01")
                .order(order)
                .product(product)
                .productName(product.getName())
                .quantity(BigDecimal.ONE)
                .unitPrice(totalAndFinalAmount)
                .subtotal(totalAndFinalAmount)
                .build();

        order.getItems().add(item);
        return order;
    }

    @Test
    @DisplayName("TC-01: Thanh toán kết hợp Tiền mặt (100k, đưa 150k, thối 50k) + Chuyển khoản (250k) cho đơn 350k")
    void testCompleteOrder_CombinedCashAndBankTransfer_Success() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("350000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderPayment existingBankPayment = OrderPayment.builder()
                .id("pay-bank-01")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("250000.00"))
                .transactionCode("VCB.123456")
                .isConfirmed(true)
                .confirmedAt(LocalDateTime.now().minusMinutes(5))
                .confirmedByUser(cashierUser)
                .build();
        when(orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod("order-101", "household-01", PaymentMethodConstant.BANK_TRANSFER))
                .thenReturn(Optional.of(existingBankPayment));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Arrays.asList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(new BigDecimal("100000.00"))
                                .amountGiven(new BigDecimal("150000.00"))
                                .build(),
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                                .amount(new BigDecimal("250000.00"))
                                .transactionCode("VCB.123456")
                                .isConfirmed(true)
                                .build()
                ))
                .build();

        // Act
        OrderResponse response = orderService.completeOrder("thungan01", "order-101", request);

        // Assert
        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
        assertEquals("COMBINED", response.getPaymentMethod());
        assertEquals("PAID", response.getPaymentStatus());
        assertEquals(new BigDecimal("50000.00"), response.getChangeAmount());
        assertNotNull(response.getPayments());
        assertEquals(2, response.getPayments().size());
        assertTrue(response.getIsBankTransferConfirmed());

        verify(orderPaymentRepository).saveAll(anyList());
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("TC-02: Thanh toán kết hợp Chuyển khoản (500k) + Ghi nợ (300k) cho đơn 800k (QTN-13)")
    void testCompleteOrder_CombinedBankTransferAndDebt_Success() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("800000.00");
        Order order = createMockCreatingOrder(finalAmount, vipCustomer);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-vip-01", "household-01"))
                .thenReturn(Optional.of(vipCustomer));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderPayment existingBankPayment = OrderPayment.builder()
                .id("pay-bank-02")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("500000.00"))
                .transactionCode("MB.778899")
                .isConfirmed(true)
                .confirmedAt(LocalDateTime.now().minusMinutes(5))
                .confirmedByUser(cashierUser)
                .build();
        when(orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod("order-101", "household-01", PaymentMethodConstant.BANK_TRANSFER))
                .thenReturn(Optional.of(existingBankPayment));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .dueDate(LocalDateTime.now().plusDays(10))
                .payments(Arrays.asList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                                .amount(new BigDecimal("500000.00"))
                                .transactionCode("MB.778899")
                                .isConfirmed(true)
                                .build(),
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.DEBT)
                                .amount(new BigDecimal("300000.00"))
                                .build()
                ))
                .build();

        // Act
        OrderResponse response = orderService.completeOrder("thungan01", "order-101", request);

        // Assert
        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
        assertEquals("COMBINED", response.getPaymentMethod());
        assertEquals("DEBT", response.getPaymentStatus());
        assertEquals(new BigDecimal("300000.00"), vipCustomer.getCurrentDebt());
        assertEquals(2, order.getPayments().size());

        verify(customerRepository, times(2)).save(vipCustomer);
        verify(customerDebtRepository).save(any(CustomerDebt.class));
        verify(orderPaymentRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("TC-03: Dòng BANK_TRANSFER chưa xác nhận (isConfirmed = false) -> Bị chặn")
    void testCompleteOrder_BankTransferNotConfirmed_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("200000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Collections.singletonList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                                .amount(new BigDecimal("200000.00"))
                                .isConfirmed(false)
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.BANK_TRANSFER_NOT_CONFIRMED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-04: Lệch tổng tiền (thiếu tiền): 200k + 200k cho đơn 500k -> Bị chặn QTN-03")
    void testCompleteOrder_TotalPaymentMismatch_Insufficient_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("500000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Arrays.asList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(new BigDecimal("200000.00"))
                                .build(),
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                                .amount(new BigDecimal("200000.00"))
                                .isConfirmed(true)
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.PAYMENT_TOTAL_MISMATCH, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-05: Lệch tổng tiền (thừa tiền): 300k + 300k cho đơn 500k -> Bị chặn QTN-03")
    void testCompleteOrder_TotalPaymentMismatch_Excessive_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("500000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Arrays.asList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(new BigDecimal("300000.00"))
                                .build(),
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                                .amount(new BigDecimal("300000.00"))
                                .isConfirmed(true)
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.PAYMENT_TOTAL_MISMATCH, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-06: Khách lẻ thanh toán có nợ (customer == null) -> Bị chặn QTN-13")
    void testCompleteOrder_DebtWithoutCustomer_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("300000.00");
        Order order = createMockCreatingOrder(finalAmount, null); // Khách lẻ

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Arrays.asList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(new BigDecimal("100000.00"))
                                .build(),
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.DEBT)
                                .amount(new BigDecimal("200000.00"))
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.CUSTOMER_REQUIRED_FOR_DEBT, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-07: Khách nợ vượt hạn mức tín dụng cho phép -> Bị chặn QTN-13")
    void testCompleteOrder_CreditLimitExceeded_ThrowsException() {
        // Arrange
        vipCustomer.setCurrentDebt(new BigDecimal("1900000.00")); // Hạn mức 2tr, đã nợ 1.9tr
        BigDecimal finalAmount = new BigDecimal("300000.00");
        Order order = createMockCreatingOrder(finalAmount, vipCustomer);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNullForUpdate("cust-vip-01", "household-01"))
                .thenReturn(Optional.of(vipCustomer));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Collections.singletonList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.DEBT)
                                .amount(new BigDecimal("300000.00")) // 1.9tr + 300k = 2.2tr > 2tr
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.CREDIT_LIMIT_EXCEEDED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-08: Tiền mặt khách đưa nhỏ hơn số tiền thanh toán (amountGiven < amount) -> Bị chặn")
    void testCompleteOrder_CashGivenLessThanAmount_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("100000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Collections.singletonList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(new BigDecimal("100000.00"))
                                .amountGiven(new BigDecimal("80000.00")) // Đưa thiếu
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.CASH_GIVEN_LESS_THAN_AMOUNT, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-09: Trùng lặp hình thức thanh toán trong đơn -> Bị chặn")
    void testCompleteOrder_DuplicatePaymentMethod_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("200000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Arrays.asList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(new BigDecimal("100000.00"))
                                .build(),
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(new BigDecimal("100000.00"))
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.DUPLICATE_PAYMENT_METHOD, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-10: Hình thức thanh toán không hợp lệ -> Bị chặn")
    void testCompleteOrder_InvalidPaymentMethod_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("100000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Collections.singletonList(
                        OrderPaymentRequest.builder()
                                .paymentMethod("CRYPTO_PAYMENT")
                                .amount(new BigDecimal("100000.00"))
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.INVALID_PAYMENT_METHOD, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-11: Danh sách payments rỗng -> Bị chặn")
    void testCompleteOrder_EmptyPaymentsList_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("100000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Collections.emptyList())
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.PAYMENTS_EMPTY, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-12: Dòng thanh toán có amount <= 0 -> Bị chặn")
    void testCompleteOrder_ZeroOrNegativeAmount_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("100000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Collections.singletonList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(BigDecimal.ZERO)
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.PAYMENT_AMOUNT_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-13: Xác nhận chuyển khoản ngân hàng NCL-03-CN-012 thành công")
    void testConfirmBankTransfer_Success() {
        // Arrange
        Order order = createMockCreatingOrder(new BigDecimal("250000.00"), null);
        OrderPayment payment = OrderPayment.builder()
                .id("pay-transfer-01")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("250000.00"))
                .isConfirmed(false)
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));
        when(orderPaymentRepository.findByIdAndOrderIdAndHouseholdId("pay-transfer-01", "order-101", "household-01"))
                .thenReturn(Optional.of(payment));
        when(orderPaymentRepository.save(any(OrderPayment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ConfirmBankTransferRequest request = ConfirmBankTransferRequest.builder()
                .transactionCode("VCB.999888")
                .notes("Đã đối soát tin nhắn SMS")
                .build();

        // Act
        OrderPaymentResponse response = orderPaymentService.confirmBankTransfer("thungan01", "order-101", "pay-transfer-01", request);

        // Assert
        assertNotNull(response);
        assertTrue(response.getIsConfirmed());
        assertEquals("VCB.999888", response.getTransactionCode());
        assertEquals("user-02", response.getConfirmedByUserId());
        assertNotNull(response.getConfirmedAt());

        verify(orderPaymentRepository).save(payment);
    }

    @Test
    @DisplayName("TC-14: Xác nhận chuyển khoản cho dòng tiền mặt -> Bị chặn NOT_BANK_TRANSFER_PAYMENT")
    void testConfirmBankTransfer_NotBankTransfer_ThrowsException() {
        // Arrange
        Order order = createMockCreatingOrder(new BigDecimal("100000.00"), null);
        OrderPayment payment = OrderPayment.builder()
                .id("pay-cash-01")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.CASH)
                .amount(new BigDecimal("100000.00"))
                .isConfirmed(true)
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));
        when(orderPaymentRepository.findByIdAndOrderIdAndHouseholdId("pay-cash-01", "order-101", "household-01"))
                .thenReturn(Optional.of(payment));

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderPaymentService.confirmBankTransfer("thungan01", "order-101", "pay-cash-01", null));
        assertEquals(ErrorCode.NOT_BANK_TRANSFER_PAYMENT, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-17: Tương thích ngược (Legacy request không truyền payments) -> Tự động tạo 1 OrderPayment")
    void testCompleteOrder_LegacySingleCash_Success() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("100000.00");
        Order order = createMockCreatingOrder(finalAmount, null);
        order.setPaymentMethod("CASH");

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("120000.00"))
                .build(); // Không truyền payments

        // Act
        OrderResponse response = orderService.completeOrder("thungan01", "order-101", request);

        // Assert
        assertNotNull(response);
        assertEquals("COMPLETED", response.getStatus());
        assertEquals("CASH", response.getPaymentMethod());
        assertEquals(new BigDecimal("20000.00"), response.getChangeAmount());

        verify(orderPaymentRepository).saveAll(anyList());
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("TC-18: P1-02 Chặn bypass xác nhận chuyển khoản: Client gửi isConfirmed=true nhưng DB chưa có bản ghi xác thực")
    void testCompleteOrder_BypassBankTransferConfirmation_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("350000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));
        // DB trả về Optional.empty (chưa hề gọi endpoint confirm-bank-transfer)
        when(orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod("order-101", "household-01", PaymentMethodConstant.BANK_TRANSFER))
                .thenReturn(Optional.empty());

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Arrays.asList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(new BigDecimal("100000.00"))
                                .build(),
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                                .amount(new BigDecimal("250000.00"))
                                .transactionCode("FAKE_VCB_123")
                                .isConfirmed(true) // Giả mạo xác nhận từ client
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.BANK_TRANSFER_NOT_CONFIRMED, ex.getErrorCode(),
                "Hệ thống phải chặn đứng việc bypass xác nhận chuyển khoản từ client payload");
    }

    @Test
    @DisplayName("TC-19: P1-02 Chặn hoàn tất đơn khi chuyển khoản trong DB có isConfirmed = false")
    void testCompleteOrder_BankTransferInDbNotConfirmed_ThrowsException() {
        // Arrange
        BigDecimal finalAmount = new BigDecimal("350000.00");
        Order order = createMockCreatingOrder(finalAmount, null);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-101", "household-01")).thenReturn(Optional.of(order));

        OrderPayment unconfirmedPayment = OrderPayment.builder()
                .id("pay-unconfirmed")
                .order(order)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("250000.00"))
                .isConfirmed(false)
                .build();
        when(orderPaymentRepository.findFirstByOrderIdAndHouseholdIdAndPaymentMethod("order-101", "household-01", PaymentMethodConstant.BANK_TRANSFER))
                .thenReturn(Optional.of(unconfirmedPayment));

        CompleteOrderRequest request = CompleteOrderRequest.builder()
                .payments(Arrays.asList(
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.CASH)
                                .amount(new BigDecimal("100000.00"))
                                .build(),
                        OrderPaymentRequest.builder()
                                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                                .amount(new BigDecimal("250000.00"))
                                .transactionCode("VCB.999")
                                .isConfirmed(true)
                                .build()
                ))
                .build();

        // Act & Assert
        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("thungan01", "order-101", request));
        assertEquals(ErrorCode.BANK_TRANSFER_NOT_CONFIRMED, ex.getErrorCode());
    }
}
