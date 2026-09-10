package com.sales.repository;

import com.sales.constant.PaymentMethodConstant;
import com.sales.constant.ShiftStatus;
import com.sales.entity.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Transactional
public class OrderCollectedAmountIntegrationTest {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderPaymentRepository orderPaymentRepository;

    @Autowired
    private ShiftRepository shiftRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BusinessHouseholdRepository businessHouseholdRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private CustomerDebtRepository customerDebtRepository;

    @Autowired
    private RoleRepository roleRepository;

    private BusinessHousehold household;
    private User cashier;
    private Shift shift;

    @BeforeEach
    void setUp() {
        Role cashierRole = roleRepository.findByCode("VT-02")
                .orElseGet(() -> roleRepository.save(Role.builder().code("VT-02").name("Nhân viên bán hàng").build()));

        household = businessHouseholdRepository.save(BusinessHousehold.builder()
                .name("Integration Test Household")
                .taxCode("8888888888")
                .phoneNumber("0888888888")
                .address("Test Addr")
                .build());

        cashier = userRepository.save(User.builder()
                .username("test_cashier_collected")
                .passwordHash("hashed")
                .fullName("Test Cashier")
                .role(cashierRole)
                .household(household)
                .build());

        shift = shiftRepository.save(Shift.builder()
                .household(household)
                .user(cashier)
                .openingCash(new BigDecimal("1000000.00"))
                .openedAt(LocalDateTime.now().minusHours(2))
                .status(ShiftStatus.OPEN)
                .build());
    }

    @Autowired
    private com.sales.service.interfaces.ShiftService shiftService;

    @Test
    @DisplayName("NCL-03-CN-011 & P1-01: Phân định đúng Doanh thu thực thu và Tiền mặt vào két ca")
    void sumCollectedAmountByShiftId_includesBankTransferInCombinedOrder() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Đơn 1: Thuần tiền mặt CASH 500.000đ
        Order cashOrder = orderRepository.save(Order.builder()
                .household(household)
                .createdByUser(cashier)
                .shift(shift)
                .orderNumber("ORD-001")
                .totalAmount(new BigDecimal("500000.00"))
                .finalAmount(new BigDecimal("500000.00"))
                .paymentMethod(PaymentMethodConstant.CASH)
                .status("COMPLETED")
                .createdAt(now.minusMinutes(50))
                .build());

        // 2. Đơn 2: Thuần chuyển khoản BANK_TRANSFER 1.000.000đ
        Order transferOrder = orderRepository.save(Order.builder()
                .household(household)
                .createdByUser(cashier)
                .shift(shift)
                .orderNumber("ORD-002")
                .totalAmount(new BigDecimal("1000000.00"))
                .finalAmount(new BigDecimal("1000000.00"))
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .status("COMPLETED")
                .createdAt(now.minusMinutes(40))
                .build());

        // 3. Đơn 3: Đơn kết hợp COMBINED tổng 1.000.000đ (300.000 CASH + 700.000 BANK_TRANSFER)
        Order combinedOrder = orderRepository.save(Order.builder()
                .household(household)
                .createdByUser(cashier)
                .shift(shift)
                .orderNumber("ORD-003")
                .totalAmount(new BigDecimal("1000000.00"))
                .finalAmount(new BigDecimal("1000000.00"))
                .paymentMethod(PaymentMethodConstant.COMBINED)
                .status("COMPLETED")
                .createdAt(now.minusMinutes(30))
                .build());

        orderPaymentRepository.save(OrderPayment.builder()
                .order(combinedOrder)
                .household(household)
                .paymentMethod(PaymentMethodConstant.CASH)
                .amount(new BigDecimal("300000.00"))
                .amountGiven(new BigDecimal("300000.00"))
                .changeAmount(BigDecimal.ZERO)
                .isConfirmed(true)
                .build());

        orderPaymentRepository.save(OrderPayment.builder()
                .order(combinedOrder)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("700000.00"))
                .transactionCode("VCB123456")
                .isConfirmed(true)
                .build());

        // 4. Đơn 4: Đơn ghi nợ DEBT 600.000đ (khách trả trước 200.000đ, nợ 400.000đ)
        Customer customer = customerRepository.save(Customer.builder()
                .household(household)
                .name("Khách Nợ")
                .phoneNumber("0912345678")
                .creditLimit(new BigDecimal("10000000.00"))
                .currentDebt(new BigDecimal("400000.00"))
                .build());

        Order debtOrder = orderRepository.save(Order.builder()
                .household(household)
                .createdByUser(cashier)
                .customer(customer)
                .shift(shift)
                .orderNumber("ORD-004")
                .totalAmount(new BigDecimal("600000.00"))
                .finalAmount(new BigDecimal("600000.00"))
                .paymentMethod(PaymentMethodConstant.DEBT)
                .status("COMPLETED")
                .createdAt(now.minusMinutes(20))
                .build());

        customerDebtRepository.save(CustomerDebt.builder()
                .customer(customer)
                .household(household)
                .order(debtOrder)
                .type("DEBT_CREATED")
                .amount(new BigDecimal("400000.00"))
                .remainingAmount(new BigDecimal("400000.00"))
                .dueDate(now.plusDays(30))
                .createdByUser(cashier)
                .build());

        // 5. Đơn 5: Đơn chưa hoàn tất (CREATING) 800.000đ -> không được tính
        Order creatingOrder = orderRepository.save(Order.builder()
                .household(household)
                .createdByUser(cashier)
                .shift(shift)
                .orderNumber("ORD-005")
                .totalAmount(new BigDecimal("800000.00"))
                .finalAmount(new BigDecimal("800000.00"))
                .paymentMethod(PaymentMethodConstant.CASH)
                .status("CREATING")
                .createdAt(now.minusMinutes(10))
                .build());

        // KỲ VỌNG DOANH THU THỰC THU (Collected Revenue):
        // 500k (CASH) + 1000k (BANK) + 1000k (COMBINED) + 200k (DEBT down payment) = 2.700.000đ
        BigDecimal totalCollected = orderRepository.sumCollectedAmountByShiftId(shift.getId());
        assertEquals(0, new BigDecimal("2700000.00").compareTo(totalCollected),
                "Doanh thu thực thu ca phải gom đủ cả CASH và BANK_TRANSFER của đơn kết hợp COMBINED");

        BigDecimal rangeCollected = orderRepository.sumCollectedAmountByShiftIdAndTimeRange(
                shift.getId(), now.minusHours(1), now);
        assertEquals(0, new BigDecimal("2700000.00").compareTo(rangeCollected),
                "Doanh thu theo khoảng thời gian phải bằng tổng doanh thu thực thu");

        // KỲ VỌNG TIỀN MẶT BÁN HÀNG VÀO KÉT (Cash Sales):
        // 500k (CASH) + 0 (BANK) + 300k (COMBINED CASH part) + 200k (DEBT down payment) = 1.000.000đ
        BigDecimal cashSales = orderRepository.sumCashSalesAmountByShiftId(shift.getId());
        assertEquals(0, new BigDecimal("1000000.00").compareTo(cashSales),
                "Tiền mặt vào két ca chỉ được tính tiền mặt giấy (1.000.000đ), không tính tiền chuyển khoản vào tài khoản ngân hàng");

        BigDecimal rangeCashSales = orderRepository.sumCashSalesAmountByShiftIdAndTimeRange(
                shift.getId(), now.minusHours(1), now);
        assertEquals(0, new BigDecimal("1000000.00").compareTo(rangeCashSales),
                "Tiền mặt bán hàng theo khoảng thời gian phải bằng 1.000.000đ");

        // Trước khi đóng ca, hủy đơn CREATING để thỏa mãn điều kiện không còn đơn treo chưa xử lý
        creatingOrder.setStatus("CANCELED");
        creatingOrder.setCancelReason(com.sales.entity.OrderCancelReason.CUSTOMER_CHANGED_MIND);
        orderRepository.save(creatingOrder);

        // KỲ VỌNG ĐỐI SOÁT ĐÓNG CA (Close Shift):
        // Tiền đầu ca (1.000.000đ) + Tiền mặt bán hàng (1.000.000đ) = 2.000.000đ
        // Thu ngân đếm đúng 2.000.000đ tiền mặt trong két -> Chênh lệch = 0.00, không bị lệch âm 1.7tr tiền chuyển khoản!
        com.sales.dto.request.CloseShiftRequest closeRequest = com.sales.dto.request.CloseShiftRequest.builder()
                .closingCashActual(new BigDecimal("2000000.00"))
                .differenceReason(null)
                .build();

        com.sales.dto.response.ShiftResponse closeResponse = shiftService.closeShift(cashier.getUsername(), shift.getId(), closeRequest);
        assertEquals("CLOSED", closeResponse.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(closeResponse.getDifferenceAmount()),
                "Chênh lệch tiền mặt đóng ca phải bằng 0 khi đếm đủ tiền giấy trong két");
    }

    @Test
    @DisplayName("P2-04: Đối soát chuyển khoản ngân hàng phải loại trừ các đơn hàng đã bị hủy (status = CANCELED)")
    void findBankTransfersByShiftIdAndHouseholdId_excludesCanceledOrders() {
        LocalDateTime now = LocalDateTime.now();

        // 1. Đơn hoàn thành có chuyển khoản
        Order completedOrder = orderRepository.save(Order.builder()
                .household(household)
                .createdByUser(cashier)
                .shift(shift)
                .orderNumber("ORD-TRANS-01")
                .totalAmount(new BigDecimal("500000.00"))
                .finalAmount(new BigDecimal("500000.00"))
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .status("COMPLETED")
                .createdAt(now.minusMinutes(30))
                .build());

        orderPaymentRepository.save(OrderPayment.builder()
                .order(completedOrder)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("500000.00"))
                .transactionCode("VCB.OK")
                .isConfirmed(true)
                .build());

        // 2. Đơn CANCELED có chuyển khoản (khách hủy đơn)
        Order canceledOrder = orderRepository.save(Order.builder()
                .household(household)
                .createdByUser(cashier)
                .shift(shift)
                .orderNumber("ORD-TRANS-CANCEL")
                .totalAmount(new BigDecimal("300000.00"))
                .finalAmount(new BigDecimal("300000.00"))
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .status("CANCELED")
                .createdAt(now.minusMinutes(20))
                .build());

        orderPaymentRepository.save(OrderPayment.builder()
                .order(canceledOrder)
                .household(household)
                .paymentMethod(PaymentMethodConstant.BANK_TRANSFER)
                .amount(new BigDecimal("300000.00"))
                .isConfirmed(false)
                .build());

        // Truy vấn đối soát ca:
        java.util.List<OrderPayment> transfers = orderPaymentRepository.findBankTransfersByShiftIdAndHouseholdId(shift.getId(), household.getId());

        assertEquals(1, transfers.size(), "Danh sách đối soát chuyển khoản chỉ chứa đơn chưa bị hủy");
        assertEquals("ORD-TRANS-01", transfers.get(0).getOrder().getOrderNumber());
    }
}
