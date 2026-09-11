package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CompleteOrderRequest;
import com.sales.dto.request.CreateOrderItemRequest;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.PromotionItemResultResponse;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderUnitConversionTest {

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
    private OrderPaymentRepository orderPaymentRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User currentUser;
    private BusinessHousehold household;
    private Shift activeShift;
    private Product product;
    private ProductUnitConversion conversion;
    private Order order;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ Kinh Doanh Việt")
                .build();

        currentUser = User.builder()
                .id("u-1")
                .username("cashier")
                .role(Role.builder().code("VT-02").build())
                .household(household)
                .build();

        activeShift = Shift.builder()
                .id("shift-1")
                .user(currentUser)
                .status(ShiftStatus.OPEN)
                .build();

        product = Product.builder()
                .id("prod-1")
                .household(household)
                .name("Bia Hà Nội")
                .unit("Lon")
                .price(new BigDecimal("12000.00"))
                .costPrice(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("30.000"))
                .taxRate(TaxRate.builder().ratePercentage(BigDecimal.ZERO).build())
                .build();

        conversion = ProductUnitConversion.builder()
                .id("conv-1")
                .product(product)
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .price(new BigDecimal("280000.00"))
                .build();

        order = Order.builder()
                .id("ord-1")
                .orderNumber("OD-001")
                .household(household)
                .createdByUser(currentUser)
                .shift(activeShift)
                .status("CREATING")
                .paymentMethod("CASH")
                .paymentStatus("PENDING")
                .totalAmount(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("TC-02: Bán theo đơn vị quy đổi (1 Thùng = 24 lon) -> Lưu baseQuantity = 24, tính đơn giá theo quy đổi")
    void addOrderItem_withConversion_tc02_success() {
        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-1")
                .quantity(new BigDecimal("1"))
                .unitConversionId("conv-1")
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(product));
        when(productUnitConversionRepository.findByIdAndProductId("conv-1", "prod-1"))
                .thenReturn(Optional.of(conversion));
        when(promotionService.calculateItemPromotion(any(User.class), any(Product.class), any(), any(), any()))
                .thenReturn(PromotionItemResultResponse.builder()
                        .discountAmount(BigDecimal.ZERO)
                        .build());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.addOrderItem("cashier", "ord-1", req);

        assertNotNull(res);
        assertEquals(1, res.getItems().size());
        assertEquals("Thùng", res.getItems().get(0).getUnitName());
        assertEquals(new BigDecimal("1"), res.getItems().get(0).getQuantity());
        assertEquals(new BigDecimal("24"), res.getItems().get(0).getBaseQuantity());
        assertEquals(new BigDecimal("280000.00"), res.getItems().get(0).getUnitPrice());
    }

    @Test
    @DisplayName("TC-02: Bán theo đơn vị quy đổi (1 Thùng = 24 lon) khi tồn kho chỉ còn 20 lon -> Cảnh báo tồn kho QTN-08 theo đơn vị cơ bản")
    void addOrderItem_withConversion_lowStockWarning_evaluatedInBaseUnit() {
        // Tồn kho chỉ còn 20 lon
        product.setStockQuantity(new BigDecimal("20.000"));

        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-1")
                .quantity(new BigDecimal("1")) // 1 Thùng = 24 lon > 20 lon
                .unitConversionId("conv-1")
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(product));
        when(productUnitConversionRepository.findByIdAndProductId("conv-1", "prod-1"))
                .thenReturn(Optional.of(conversion));
        when(promotionService.calculateItemPromotion(any(User.class), any(Product.class), any(), any(), any()))
                .thenReturn(PromotionItemResultResponse.builder()
                        .discountAmount(BigDecimal.ZERO)
                        .build());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.addOrderItem("cashier", "ord-1", req);

        assertNotNull(res);
        assertFalse(res.getWarningMessages().isEmpty());
        assertTrue(res.getWarningMessages().get(0).contains("vượt quá số lượng tồn kho khả dụng"));
        assertTrue(res.getWarningMessages().get(0).contains("Yêu cầu: 24"));
    }

    @Test
    @DisplayName("TC-02: Hoàn tất đơn hàng bán 1 Thùng (24 lon) và 3 lon lẻ -> Trừ tổng cộng 27 lon khỏi kho theo đơn vị cơ bản")
    void completeOrder_withConversionAndBaseUnit_deductsStockAccuratelyInBaseUnit() {
        // Thêm 1 dòng bán 1 Thùng (baseQuantity = 24)
        OrderItem itemCarton = OrderItem.builder()
                .id("item-carton")
                .order(order)
                .product(product)
                .productName("Bia Hà Nội")
                .quantity(new BigDecimal("1"))
                .baseQuantity(new BigDecimal("24"))
                .unitPrice(new BigDecimal("280000.00"))
                .subtotal(new BigDecimal("280000.00"))
                .build();

        // Thêm 1 dòng bán 3 Lon lẻ (baseQuantity = 3)
        OrderItem itemCan = OrderItem.builder()
                .id("item-can")
                .order(order)
                .product(product)
                .productName("Bia Hà Nội")
                .quantity(new BigDecimal("3"))
                .baseQuantity(new BigDecimal("3"))
                .unitPrice(new BigDecimal("12000.00"))
                .subtotal(new BigDecimal("36000.00"))
                .build();

        order.getItems().addAll(List.of(itemCarton, itemCan));
        order.setTotalAmount(new BigDecimal("316000.00"));
        order.setFinalAmount(new BigDecimal("316000.00"));

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        CompleteOrderRequest completeReq = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("320000.00"))
                .build();

        OrderResponse res = orderService.completeOrder("cashier", "ord-1", completeReq);

        assertNotNull(res);
        assertEquals("COMPLETED", res.getStatus());

        // Kiểm tra tồn kho bị trừ chính xác là 24 + 3 = 27 lon
        verify(productRepository, times(1)).deductStock(eq("prod-1"), eq("hh-1"), eq(new BigDecimal("27")));
    }
}
