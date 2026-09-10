package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.RoundingRule;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CalculateWeightRequest;
import com.sales.dto.request.CompleteOrderRequest;
import com.sales.dto.request.CreateOrderItemRequest;
import com.sales.dto.response.CalculateWeightResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
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
class WeightBasedSellingServiceTest {

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
    private Product weightProduct;
    private Product standardProduct;
    private Order order;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ Kinh Doanh Thực Phẩm Tươi")
                .roundingRule("ROUND_TO_1000")
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

        weightProduct = Product.builder()
                .id("prod-weight-1")
                .household(household)
                .name("Thịt Heo Ba Chỉ")
                .unit("Kg")
                .price(new BigDecimal("150000.00"))
                .costPrice(new BigDecimal("120000.00"))
                .stockQuantity(new BigDecimal("10.000"))
                .isSoldByWeight(true)
                .decimalPlaces(3)
                .minWeightStep(new BigDecimal("0.001"))
                .taxRate(TaxRate.builder().ratePercentage(BigDecimal.ZERO).build())
                .build();

        standardProduct = Product.builder()
                .id("prod-std-1")
                .household(household)
                .name("Nước Ngọt Coca Cola")
                .unit("Lon")
                .price(new BigDecimal("10000.00"))
                .costPrice(new BigDecimal("8000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .isSoldByWeight(false)
                .decimalPlaces(0)
                .minWeightStep(BigDecimal.ONE)
                .taxRate(TaxRate.builder().ratePercentage(BigDecimal.ZERO).build())
                .build();

        order = Order.builder()
                .id("ord-1")
                .orderNumber("OD-W-001")
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
    @DisplayName("TC-01: Bán hàng theo cân với số lượng thập phân (0.355 kg) thành công")
    void addOrderItem_weightProduct_decimalQuantity_tc01_success() {
        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-weight-1")
                .quantity(new BigDecimal("0.355"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-weight-1", "hh-1"))
                .thenReturn(Optional.of(weightProduct));
        when(promotionService.calculateItemPromotion(any(User.class), any(Product.class), any(), any(), any()))
                .thenReturn(PromotionItemResultResponse.builder()
                        .discountAmount(BigDecimal.ZERO)
                        .build());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.addOrderItem("cashier", "ord-1", req);

        assertNotNull(res);
        assertEquals(1, res.getItems().size());
        assertEquals(new BigDecimal("0.355"), res.getItems().get(0).getQuantity());
        // 0.355 * 150000 = 53250 -> ROUND_TO_1000 = 53000
        assertEquals(new BigDecimal("53000.00"), res.getItems().get(0).getSubtotal());
        assertEquals(new BigDecimal("-250.00"), res.getItems().get(0).getRoundingDifference());
        assertTrue(res.getItems().get(0).getIsSoldByWeight());
        assertEquals(3, res.getItems().get(0).getDecimalPlaces());
    }

    @Test
    @DisplayName("TC-01: Trừ tồn kho số lượng thập phân chính xác khi hoàn tất đơn hàng")
    void completeOrder_weightProduct_deductDecimalStock_tc01_success() {
        OrderItem item = OrderItem.builder()
                .id("item-1")
                .order(order)
                .product(weightProduct)
                .productName(weightProduct.getName())
                .quantity(new BigDecimal("0.355"))
                .baseQuantity(new BigDecimal("0.355"))
                .unitPrice(weightProduct.getPrice())
                .discountAmount(BigDecimal.ZERO)
                .subtotal(new BigDecimal("53250.00"))
                .build();
        order.getItems().add(item);
        order.setTotalAmount(new BigDecimal("53250.00"));
        order.setFinalAmount(new BigDecimal("53250.00"));

        CompleteOrderRequest req = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("60000.00"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.completeOrder("cashier", "ord-1", req);

        assertNotNull(res);
        assertEquals("COMPLETED", res.getStatus());
        verify(productRepository).deductStock(eq("prod-weight-1"), eq("hh-1"), eq(new BigDecimal("0.355")));
        // 10.000 - 0.355 = 9.645
        assertEquals(new BigDecimal("9.645"), weightProduct.getStockQuantity());
    }

    @Test
    @DisplayName("TC-02: Chặn khi số lượng bán nhỏ hơn minWeightStep (nhập 0.0005 < 0.001)")
    void addOrderItem_weightProduct_belowMinWeightStep_throwsWeightStepInvalid() {
        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-weight-1")
                .quantity(new BigDecimal("0.0005"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-weight-1", "hh-1"))
                .thenReturn(Optional.of(weightProduct));

        AppException ex = assertThrows(AppException.class, () ->
                orderService.addOrderItem("cashier", "ord-1", req));
        assertEquals(ErrorCode.WEIGHT_STEP_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-02: Chặn khi số lượng bán vượt quá decimalPlaces cấu hình (cấu hình 2 chữ số lẻ nhưng nhập 0.125)")
    void addOrderItem_weightProduct_exceedDecimalPlaces_throwsDecimalPlacesExceeded() {
        weightProduct.setDecimalPlaces(2);
        weightProduct.setMinWeightStep(new BigDecimal("0.01"));

        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-weight-1")
                .quantity(new BigDecimal("0.125"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-weight-1", "hh-1"))
                .thenReturn(Optional.of(weightProduct));

        AppException ex = assertThrows(AppException.class, () ->
                orderService.addOrderItem("cashier", "ord-1", req));
        assertEquals(ErrorCode.DECIMAL_PLACES_EXCEEDED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-02: Chặn khi số lượng không phải bội số của minWeightStep (bước 0.05 nhưng nhập 0.12)")
    void addOrderItem_weightProduct_invalidMultipleOfStep_throwsWeightStepInvalid() {
        weightProduct.setMinWeightStep(new BigDecimal("0.05"));
        weightProduct.setDecimalPlaces(2);

        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-weight-1")
                .quantity(new BigDecimal("0.12"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-weight-1", "hh-1"))
                .thenReturn(Optional.of(weightProduct));

        AppException ex = assertThrows(AppException.class, () ->
                orderService.addOrderItem("cashier", "ord-1", req));
        assertEquals(ErrorCode.WEIGHT_STEP_INVALID, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-02: Chặn khi sản phẩm không bán theo cân nhưng nhập số lượng thập phân (1.5 lon)")
    void addOrderItem_nonWeightProduct_decimalQuantity_throwsNonWeightProductDecimalNotAllowed() {
        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-std-1")
                .quantity(new BigDecimal("1.5"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-std-1", "hh-1"))
                .thenReturn(Optional.of(standardProduct));

        AppException ex = assertThrows(AppException.class, () ->
                orderService.addOrderItem("cashier", "ord-1", req));
        assertEquals(ErrorCode.NON_WEIGHT_PRODUCT_DECIMAL_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-02: Chặn khi mặt hàng không bán theo cân nhưng nhập buyAmount để mua theo số tiền")
    void addOrderItem_nonWeightProduct_withBuyAmount_throwsNonWeightProductDecimalNotAllowed() {
        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-std-1")
                .buyAmount(new BigDecimal("20000"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-std-1", "hh-1"))
                .thenReturn(Optional.of(standardProduct));

        AppException ex = assertThrows(AppException.class, () ->
                orderService.addOrderItem("cashier", "ord-1", req));
        assertEquals(ErrorCode.NON_WEIGHT_PRODUCT_DECIMAL_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-03: Bán theo số tiền mua (50,000 VND) -> tự quy đổi khối lượng và tính lệch làm tròn")
    void addOrderItem_buyAmount_tc03_success() {
        // Giá: 150,000 VND/kg, minWeightStep: 0.001, decimalPlaces: 3, rule: ROUND_TO_1000
        // 50,000 / 150,000 = 0.33333333 -> steps = 333 -> quantity = 0.333 kg
        // exactSubtotal = 0.333 * 150000 = 49950.00
        // roundedSubtotal = ROUND_TO_1000(49950.00) = 50000.00
        // roundingDifference = 50000 - 49950 = +50.00
        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-weight-1")
                .buyAmount(new BigDecimal("50000"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-weight-1", "hh-1"))
                .thenReturn(Optional.of(weightProduct));
        when(promotionService.calculateItemPromotion(any(User.class), any(Product.class), any(), any(), any()))
                .thenReturn(PromotionItemResultResponse.builder()
                        .discountAmount(BigDecimal.ZERO)
                        .build());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.addOrderItem("cashier", "ord-1", req);

        assertNotNull(res);
        assertEquals(1, res.getItems().size());
        assertEquals(new BigDecimal("0.333"), res.getItems().get(0).getQuantity());
        assertEquals(new BigDecimal("50000.00"), res.getItems().get(0).getSubtotal());
        assertEquals(new BigDecimal("50.00"), res.getItems().get(0).getRoundingDifference());
    }

    @Test
    @DisplayName("TC-03: Chặn khi số tiền mua quá nhỏ dẫn tới khối lượng quy đổi = 0")
    void addOrderItem_buyAmount_tooSmall_throwsBuyAmountTooSmall() {
        weightProduct.setMinWeightStep(new BigDecimal("0.1")); // Bước 100 gram = 15,000 VND
        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-weight-1")
                .buyAmount(new BigDecimal("500")) // 500 VND < bước tối thiểu
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-weight-1", "hh-1"))
                .thenReturn(Optional.of(weightProduct));

        AppException ex = assertThrows(AppException.class, () ->
                orderService.addOrderItem("cashier", "ord-1", req));
        assertEquals(ErrorCode.BUY_AMOUNT_TOO_SMALL, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-03: Preview tính trọng lượng trước từ số tiền (calculateWeight API)")
    void calculateWeight_preview_tc03_success() {
        CalculateWeightRequest req = CalculateWeightRequest.builder()
                .productId("prod-weight-1")
                .buyAmount(new BigDecimal("50000"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-weight-1", "hh-1"))
                .thenReturn(Optional.of(weightProduct));

        CalculateWeightResponse res = orderService.calculateWeight("cashier", req);

        assertNotNull(res);
        assertEquals("prod-weight-1", res.getProductId());
        assertEquals(new BigDecimal("0.333"), res.getCalculatedQuantity());
        assertEquals(new BigDecimal("49950.00"), res.getExactSubtotal());
        assertEquals(new BigDecimal("50000.00"), res.getRoundedSubtotal());
        assertEquals(new BigDecimal("50.00"), res.getRoundingDifference());
    }

    @Test
    @DisplayName("TC-03: Chặn preview tính trọng lượng cho sản phẩm không bán theo cân")
    void calculateWeight_nonWeightProduct_throwsError() {
        CalculateWeightRequest req = CalculateWeightRequest.builder()
                .productId("prod-std-1")
                .buyAmount(new BigDecimal("50000"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-std-1", "hh-1"))
                .thenReturn(Optional.of(standardProduct));

        AppException ex = assertThrows(AppException.class, () ->
                orderService.calculateWeight("cashier", req));
        assertEquals(ErrorCode.NON_WEIGHT_PRODUCT_DECIMAL_NOT_ALLOWED, ex.getErrorCode());
    }

    @Test
    @DisplayName("QTN-07: Chặn hoàn tất đơn hàng khi tổng tiền đơn hàng lệch với tổng thành tiền các dòng hàng")
    void completeOrder_integrityQTN07_totalMismatch_throwsOrderTotalMismatch() {
        OrderItem item = OrderItem.builder()
                .id("item-1")
                .order(order)
                .product(weightProduct)
                .quantity(new BigDecimal("0.355"))
                .subtotal(new BigDecimal("53000.00"))
                .build();
        order.getItems().add(item);
        // Cố tình tạo lệch: totalAmount = 50000 != 53000
        order.setTotalAmount(new BigDecimal("50000.00"));
        order.setFinalAmount(new BigDecimal("50000.00"));

        CompleteOrderRequest req = CompleteOrderRequest.builder()
                .amountGiven(new BigDecimal("50000.00"))
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));

        AppException ex = assertThrows(AppException.class, () ->
                orderService.completeOrder("cashier", "ord-1", req));
        assertEquals(ErrorCode.ORDER_TOTAL_MISMATCH, ex.getErrorCode());
    }

    @Test
    @DisplayName("QTN-08: Cảnh báo khi số lượng hàng cân vượt tồn kho nhưng không chặn tạo đơn")
    void addOrderItem_stockWarningQTN08_whenStockExceeded() {
        // Tồn kho chỉ còn 0.200 kg
        weightProduct.setStockQuantity(new BigDecimal("0.200"));

        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-weight-1")
                .quantity(new BigDecimal("0.500")) // 0.500 kg > 0.200 kg
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-weight-1", "hh-1"))
                .thenReturn(Optional.of(weightProduct));
        when(promotionService.calculateItemPromotion(any(User.class), any(Product.class), any(), any(), any()))
                .thenReturn(PromotionItemResultResponse.builder()
                        .discountAmount(BigDecimal.ZERO)
                        .build());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.addOrderItem("cashier", "ord-1", req);

        assertNotNull(res);
        assertFalse(res.getWarningMessages().isEmpty());
        assertTrue(res.getWarningMessages().get(0).contains("tồn kho khả dụng"));
    }

    @Test
    @DisplayName("F-05: Bán hàng theo cân kết hợp đơn vị quy đổi (0.5 Yến = 5 kg >= minWeightStep 1 kg) không bị chặn oan")
    void addOrderItem_weightProductWithUnitConversion_validBaseQuantity_success() {
        weightProduct.setMinWeightStep(BigDecimal.ONE); // 1.000 kg
        weightProduct.setDecimalPlaces(3);

        ProductUnitConversion yenConversion = ProductUnitConversion.builder()
                .id("conv-yen")
                .product(weightProduct)
                .unitName("Yến")
                .conversionFactor(new BigDecimal("10.000")) // 1 Yến = 10 kg
                .price(new BigDecimal("150000.00"))
                .build();

        CreateOrderItemRequest req = CreateOrderItemRequest.builder()
                .productId("prod-weight-1")
                .unitConversionId("conv-yen")
                .quantity(new BigDecimal("0.500")) // 0.500 Yến (= 5.000 kg >= 1.000 kg min step)
                .build();

        when(userRepository.findByUsername("cashier")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-1", "hh-1"))
                .thenReturn(Optional.of(order));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-weight-1", "hh-1"))
                .thenReturn(Optional.of(weightProduct));
        when(productUnitConversionRepository.findByIdAndProductId("conv-yen", "prod-weight-1"))
                .thenReturn(Optional.of(yenConversion));
        when(promotionService.calculateItemPromotion(any(User.class), any(Product.class), any(), any(), any()))
                .thenReturn(PromotionItemResultResponse.builder()
                        .discountAmount(BigDecimal.ZERO)
                        .build());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse res = orderService.addOrderItem("cashier", "ord-1", req);

        assertNotNull(res);
        assertEquals(1, res.getItems().size());
        assertEquals(new BigDecimal("0.500"), res.getItems().get(0).getQuantity());
        assertEquals(0, new BigDecimal("5.000").compareTo(res.getItems().get(0).getBaseQuantity()));
    }
}
