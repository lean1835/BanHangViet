package com.sales.modules.order.repository;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.BusinessHouseholdRepository;
import com.sales.modules.auth.repository.RoleRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.customer.entity.Customer;
import com.sales.modules.customer.entity.CustomerDebt;
import com.sales.modules.customer.repository.CustomerDebtRepository;
import com.sales.modules.customer.repository.CustomerRepository;
import com.sales.modules.order.entity.Order;
import com.sales.modules.order.entity.OrderPayment;
import com.sales.modules.pos.entity.Shift;
import com.sales.modules.pos.repository.ShiftRepository;
import com.sales.common.constant.PaymentMethodConstant;
import com.sales.common.constant.ShiftStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import com.sales.modules.order.entity.OrderCancelReason;
import com.sales.modules.pos.dto.request.CloseShiftRequest;
import com.sales.modules.pos.dto.response.PosRevenueProjection;
import com.sales.modules.pos.dto.response.ShiftResponse;
import com.sales.modules.pos.service.ShiftService;
import com.sales.modules.report.dto.response.DailyRevenueProjection;
import java.util.List;

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
    private ShiftService shiftService;

    @Test
    @DisplayName("NCL-03-CN-011 & P1-01: Phân định đúng Doanh thu thực thu và Tiền mặt vào két ca")
    void sumCollectedAmountByShiftId_includesBankTransferInCombinedOrder() {
        LocalDateTime now = LocalDate.now().atTime(12, 0);
        shift.setOpenedAt(now.minusHours(2));
        shift = shiftRepository.save(shift);

        orderRepository.save(Order.builder()
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

        orderRepository.save(Order.builder()
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

        BigDecimal totalCollected = orderRepository.sumCollectedAmountByShiftId(shift.getId());
        assertEquals(0, new BigDecimal("2700000.00").compareTo(totalCollected),
                "Doanh thu thực thu ca phải gom đủ cả CASH và BANK_TRANSFER của đơn kết hợp COMBINED");

        BigDecimal rangeCollected = orderRepository.sumCollectedAmountByShiftIdAndTimeRange(
                shift.getId(), now.minusHours(1), now);
        assertEquals(0, new BigDecimal("2700000.00").compareTo(rangeCollected),
                "Doanh thu theo khoảng thời gian phải bằng tổng doanh thu thực thu");

        BigDecimal cashSales = orderRepository.sumCashSalesAmountByShiftId(shift.getId());
        assertEquals(0, new BigDecimal("1000000.00").compareTo(cashSales),
                "Tiền mặt vào két ca chỉ được tính tiền mặt giấy (1.000.000đ), không tính tiền chuyển khoản vào tài khoản ngân hàng");

        BigDecimal rangeCashSales = orderRepository.sumCashSalesAmountByShiftIdAndTimeRange(
                shift.getId(), now.minusHours(1), now);
        assertEquals(0, new BigDecimal("1000000.00").compareTo(rangeCashSales),
                "Tiền mặt bán hàng theo khoảng thời gian phải bằng 1.000.000đ");

        List<DailyRevenueProjection> dailyRevenues = orderRepository.getDailyRevenue(
                household.getId(), now.minusDays(1), now.plusDays(1));
        assertEquals(1, dailyRevenues.size());
        DailyRevenueProjection daily = dailyRevenues.get(0);
        assertEquals(0, new BigDecimal("3100000.00").compareTo(daily.getNetRevenue()), "Doanh thu thuần phải là 3.100.000đ");
        assertEquals(0, new BigDecimal("1000000.00").compareTo(daily.getCashRevenue()), "Doanh thu tiền mặt (bao gồm cả phần COMBINED) phải là 1.000.000đ");
        assertEquals(0, new BigDecimal("1700000.00").compareTo(daily.getBankRevenue()), "Doanh thu chuyển khoản (bao gồm cả phần COMBINED) phải là 1.700.000đ");
        assertEquals(0, new BigDecimal("400000.00").compareTo(daily.getDebtRevenue()), "Doanh thu ghi nợ phải là 400.000đ");
        assertEquals(0, daily.getNetRevenue().compareTo(daily.getCashRevenue().add(daily.getBankRevenue()).add(daily.getDebtRevenue())),
                "Tổng tiền theo các hình thức phải bằng đúng doanh thu thuần netRevenue");

        List<PosRevenueProjection> posSummaries = orderRepository.getPosRevenueSummary(
                household.getId(), now.minusDays(1), now.plusDays(1), null);
        assertEquals(1, posSummaries.size());
        PosRevenueProjection posSummary = posSummaries.get(0);
        assertEquals(0, new BigDecimal("3100000.00").compareTo(posSummary.getNetRevenue()));
        assertEquals(0, new BigDecimal("1000000.00").compareTo(posSummary.getCashRevenue()));
        assertEquals(0, new BigDecimal("1700000.00").compareTo(posSummary.getBankRevenue()));
        assertEquals(0, new BigDecimal("400000.00").compareTo(posSummary.getDebtRevenue()));
        assertEquals(0, posSummary.getNetRevenue().compareTo(posSummary.getCashRevenue().add(posSummary.getBankRevenue()).add(posSummary.getDebtRevenue())));

        creatingOrder.setStatus("CANCELED");
        creatingOrder.setCancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND);
        orderRepository.save(creatingOrder);

        CloseShiftRequest closeRequest = CloseShiftRequest.builder()
                .closingCashActual(new BigDecimal("3700000.00"))
                .differenceReason(null)
                .build();

        ShiftResponse closeResponse = shiftService.closeShift(cashier.getUsername(), shift.getId(), closeRequest);
        assertEquals("CLOSED", closeResponse.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(closeResponse.getDifferenceAmount()),
                "Chênh lệch tiền mặt đóng ca phải bằng 0 khi đếm đủ tiền giấy trong két");
    }

    @Test
    @DisplayName("P2-04: Đối soát chuyển khoản ngân hàng phải loại trừ các đơn hàng đã bị hủy (status = CANCELED)")
    void findBankTransfersByShiftIdAndHouseholdId_excludesCanceledOrders() {
        LocalDateTime now = LocalDateTime.now();

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

        List<OrderPayment> transfers = orderPaymentRepository.findBankTransfersByShiftIdAndHouseholdId(shift.getId(), household.getId());

        assertEquals(1, transfers.size(), "Danh sách đối soát chuyển khoản chỉ chứa đơn chưa bị hủy");
        assertEquals("ORD-TRANS-01", transfers.get(0).getOrder().getOrderNumber());
    }
}
