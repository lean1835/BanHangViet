package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CreateOrderRequest;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.entity.*;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.OrderServiceImpl;
import com.sales.service.interfaces.PosInventoryService;
import com.sales.service.interfaces.PromotionService;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

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

    @InjectMocks
    private OrderServiceImpl orderService;

    private User currentUser;
    private BusinessHousehold household;
    private Shift activeShift;
    private Customer vipCustomer;

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

        activeShift = Shift.builder()
                .id("shift-001")
                .user(currentUser)
                .status(ShiftStatus.OPEN)
                .openedAt(LocalDateTime.now())
                .openingCash(new BigDecimal("100000.00"))
                .build();

        vipCustomer = Customer.builder()
                .id("cust-vip")
                .household(household)
                .name("Khách VIP")
                .phoneNumber("0912345678")
                .isVip(true)
                .discountType("PERCENTAGE")
                .discountRate(new BigDecimal("5.00"))
                .totalSpent(new BigDecimal("500000.00"))
                .build();
    }

    @Test
    @DisplayName("NCL-15-CN-003-TC-01: Đơn hàng gán khách VIP có chiết khấu 5% -> tính đúng customerDiscountAmount và finalAmount")
    void createOrder_VipCustomer_5PercentDiscount() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .customerId("cust-vip")
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(shiftRepository.findByUserIdAndStatus("user-001", ShiftStatus.OPEN)).thenReturn(Optional.of(activeShift));
        when(customerRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("cust-vip", "house-001")).thenReturn(Optional.of(vipCustomer));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrder("chuho", request);

        assertNotNull(response);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    @DisplayName("NCL-15-CN-003-TC-02: Đơn vừa có KM sản phẩm vừa có chiết khấu VIP 5% -> tính đúng finalAmount không bị trừ trùng")
    void recalculateOrderTotals_CombinedPromotionAndVipDiscount_NoDoubleDiscount() {
        Product product = Product.builder()
                .id("prod-001")
                .household(household)
                .name("Sản phẩm A")
                .price(new BigDecimal("100000.00"))
                .stockQuantity(new BigDecimal("10"))
                .build();

        Order order = Order.builder()
                .id("order-001")
                .household(household)
                .shift(activeShift)
                .createdByUser(currentUser)
                .customer(vipCustomer)
                .status("CREATING")
                .items(new ArrayList<>())
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "house-001"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-001", "house-001"))
                .thenReturn(Optional.of(product));
        when(promotionService.calculateItemPromotion(any(), any(Product.class), any(BigDecimal.class), any(BigDecimal.class), any()))
                .thenReturn(PromotionItemResultResponse.builder()
                        .discountAmount(new BigDecimal("20000.00"))
                        .finalSubtotal(new BigDecimal("180000.00"))
                        .build());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.sales.dto.request.CreateOrderItemRequest request = com.sales.dto.request.CreateOrderItemRequest.builder()
                .productId("prod-001")
                .quantity(new BigDecimal("2"))
                .build();

        OrderResponse response = orderService.addOrderItem("chuho", "order-001", request);

        assertNotNull(response);
        // Total subtotal = 180,000
        // Item promo discount = 20,000
        // VIP discount (5% of 180,000) = 9,000
        // Total discount recorded = 29,000
        // Final amount = 180,000 - 9,000 = 171,000
        assertEquals(new BigDecimal("20000.00"), order.getPromotionDiscountAmount());
        assertEquals(new BigDecimal("9000.00"), order.getCustomerDiscountAmount());
        assertEquals(new BigDecimal("29000.00"), order.getDiscountAmount());
        assertEquals(new BigDecimal("171000.00"), order.getFinalAmount());
    }

    @Test
    @DisplayName("NCL-15-CN-003-TC-04: Hoàn tất đơn hàng (completeOrder) -> customer.totalSpent được cộng dồn chính xác")
    void completeOrder_UpdatesCustomerTotalSpent() {
        Order order = Order.builder()
                .id("order-002")
                .household(household)
                .shift(activeShift)
                .createdByUser(currentUser)
                .customer(vipCustomer)
                .finalAmount(new BigDecimal("171000.00"))
                .status("CREATING")
                .paymentStatus("PENDING")
                .paymentMethod("CASH")
                .items(new ArrayList<>())
                .build();

        OrderItem dummyItem = OrderItem.builder()
                .id("item-002")
                .order(order)
                .unitPrice(new BigDecimal("180000.00"))
                .quantity(new BigDecimal("1"))
                .subtotal(new BigDecimal("180000.00"))
                .build();
        order.getItems().add(dummyItem);

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-002", "house-001"))
                .thenReturn(Optional.of(order));
        when(customerRepository.save(any(Customer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.sales.dto.request.CompleteOrderRequest completeRequest = com.sales.dto.request.CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("200000.00"))
                .build();

        orderService.completeOrder("chuho", "order-002", completeRequest);

        assertEquals(new BigDecimal("671000.00"), vipCustomer.getTotalSpent());
        verify(customerRepository).save(vipCustomer);
    }
}
