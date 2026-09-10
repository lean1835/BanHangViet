package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.HoldOrderRequest;
import com.sales.dto.request.SwitchDiningTableRequest;
import com.sales.dto.request.UpdateOrderLabelRequest;
import com.sales.dto.response.HeldOrderSummaryResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.OrderServiceImpl;
import com.sales.service.interfaces.PosInventoryService;
import com.sales.service.interfaces.ProductPriceTierService;
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
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderHoldingServiceTest {

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

    private BusinessHousehold household;
    private User cashierUser;
    private Shift activeShift;
    private DiningTable table1;
    private DiningTable table2;
    private Order order;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("household-001")
                .name("Quán Phở Thìn")
                .build();

        cashierUser = User.builder()
                .id("user-002")
                .username("thungan01")
                .role(Role.builder().code("VT-02").build())
                .household(household)
                .build();

        activeShift = Shift.builder()
                .id("shift-001")
                .user(cashierUser)
                .status(ShiftStatus.OPEN)
                .build();

        table1 = DiningTable.builder()
                .id("table-001")
                .household(household)
                .name("Bàn 1")
                .area("Tầng 1")
                .isActive(true)
                .build();

        table2 = DiningTable.builder()
                .id("table-002")
                .household(household)
                .name("Bàn 2")
                .area("Tầng 1")
                .isActive(true)
                .build();

        order = Order.builder()
                .id("order-001")
                .household(household)
                .shift(activeShift)
                .createdByUser(cashierUser)
                .orderNumber("OD-1001")
                .totalAmount(BigDecimal.valueOf(150000))
                .finalAmount(BigDecimal.valueOf(150000))
                .status("CREATING")
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("TC-01: Treo đơn thành công kèm tên nhận diện (không chọn bàn)")
    void holdOrder_success_with_label_only() {
        HoldOrderRequest request = HoldOrderRequest.builder()
                .orderLabel("Bác Nam áo xanh")
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001"))
                .thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = orderService.holdOrder("thungan01", "order-001", request);

        assertNotNull(res);
        assertEquals("Bác Nam áo xanh", res.getOrderLabel());
        assertNull(res.getDiningTableId());
        assertEquals("CREATING", res.getStatus());
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    @DisplayName("TC-02: Treo đơn thành công kèm bàn ăn và tên nhận diện")
    void holdOrder_success_with_table() {
        HoldOrderRequest request = HoldOrderRequest.builder()
                .orderLabel("Bàn 1 ngoài hiên")
                .diningTableId("table-001")
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001"))
                .thenReturn(Optional.of(order));
        when(diningTableRepository.findByIdAndHouseholdIdForUpdate("table-001", "household-001"))
                .thenReturn(Optional.of(table1));
        when(orderRepository.existsByDiningTableIdAndStatusAndIdNotAndDeletedAtIsNull("table-001", "CREATING", "order-001"))
                .thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = orderService.holdOrder("thungan01", "order-001", request);

        assertNotNull(res);
        assertEquals("Bàn 1 ngoài hiên", res.getOrderLabel());
        assertEquals("table-001", res.getDiningTableId());
        assertEquals("Bàn 1", res.getDiningTableName());
    }

    @Test
    @DisplayName("TC-07: Treo đơn thất bại khi bàn ăn đã có đơn khác đang phục vụ")
    void holdOrder_failed_table_occupied() {
        HoldOrderRequest request = HoldOrderRequest.builder()
                .diningTableId("table-001")
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001"))
                .thenReturn(Optional.of(order));
        when(diningTableRepository.findByIdAndHouseholdIdForUpdate("table-001", "household-001"))
                .thenReturn(Optional.of(table1));
        when(orderRepository.existsByDiningTableIdAndStatusAndIdNotAndDeletedAtIsNull("table-001", "CREATING", "order-001"))
                .thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> orderService.holdOrder("thungan01", "order-001", request));
        assertEquals(ErrorCode.DINING_TABLE_OCCUPIED, ex.getErrorCode());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Treo đơn thất bại khi không nhập tên nhận diện lẫn không chọn bàn ăn")
    void holdOrder_failed_missing_label_and_table() {
        HoldOrderRequest request = HoldOrderRequest.builder()
                .orderLabel("   ")
                .diningTableId(null)
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001"))
                .thenReturn(Optional.of(order));

        AppException ex = assertThrows(AppException.class, () -> orderService.holdOrder("thungan01", "order-001", request));
        assertEquals(ErrorCode.ORDER_LABEL_OR_TABLE_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Treo đơn thất bại khi đơn hàng không ở trạng thái CREATING")
    void holdOrder_failed_order_not_creating() {
        order.setStatus("COMPLETED");
        HoldOrderRequest request = HoldOrderRequest.builder().orderLabel("Khách cũ").build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001"))
                .thenReturn(Optional.of(order));

        AppException ex = assertThrows(AppException.class, () -> orderService.holdOrder("thungan01", "order-001", request));
        assertEquals(ErrorCode.ORDER_CANNOT_BE_HELD, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật tên nhận diện đơn hàng thành công")
    void updateOrderLabel_success() {
        UpdateOrderLabelRequest request = UpdateOrderLabelRequest.builder()
                .orderLabel("Bác Nam đổi qua bàn tròn")
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001"))
                .thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = orderService.updateOrderLabel("thungan01", "order-001", request);

        assertNotNull(res);
        assertEquals("Bác Nam đổi qua bàn tròn", res.getOrderLabel());
    }

    @Test
    @DisplayName("TC-08: Chuyển bàn ăn thành công sang bàn mới còn trống")
    void switchDiningTable_success() {
        order.setDiningTable(table1);

        SwitchDiningTableRequest request = SwitchDiningTableRequest.builder()
                .newDiningTableId("table-002")
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001"))
                .thenReturn(Optional.of(order));
        when(diningTableRepository.findByIdAndHouseholdIdForUpdate("table-002", "household-001"))
                .thenReturn(Optional.of(table2));
        when(orderRepository.existsByDiningTableIdAndStatusAndIdNotAndDeletedAtIsNull("table-002", "CREATING", "order-001"))
                .thenReturn(false);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse res = orderService.switchDiningTable("thungan01", "order-001", request);

        assertNotNull(res);
        assertEquals("table-002", res.getDiningTableId());
        assertEquals("Bàn 2", res.getDiningTableName());
    }

    @Test
    @DisplayName("TC-10: Chuyển bàn thất bại khi chọn trùng bàn hiện tại")
    void switchDiningTable_failed_same_table() {
        order.setDiningTable(table1);

        SwitchDiningTableRequest request = SwitchDiningTableRequest.builder()
                .newDiningTableId("table-001")
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001"))
                .thenReturn(Optional.of(order));

        AppException ex = assertThrows(AppException.class, () -> orderService.switchDiningTable("thungan01", "order-001", request));
        assertEquals(ErrorCode.CANNOT_SWITCH_TO_SAME_TABLE, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-09: Chuyển bàn thất bại khi bàn đích đang phục vụ đơn khác")
    void switchDiningTable_failed_target_occupied() {
        order.setDiningTable(table1);

        SwitchDiningTableRequest request = SwitchDiningTableRequest.builder()
                .newDiningTableId("table-002")
                .build();

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001"))
                .thenReturn(Optional.of(order));
        when(diningTableRepository.findByIdAndHouseholdIdForUpdate("table-002", "household-001"))
                .thenReturn(Optional.of(table2));
        when(orderRepository.existsByDiningTableIdAndStatusAndIdNotAndDeletedAtIsNull("table-002", "CREATING", "order-001"))
                .thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> orderService.switchDiningTable("thungan01", "order-001", request));
        assertEquals(ErrorCode.DINING_TABLE_OCCUPIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-05: Lấy danh sách đơn treo hiển thị cờ cảnh báo quá hạn khi vượt quá số giờ cấu hình")
    void getHeldOrders_overdue_flag_true() {
        // Đơn tạo 5 tiếng trước (cấu hình 4 tiếng)
        order.setCreatedAt(LocalDateTime.now().minusHours(5));
        order.setOrderLabel("Khách lâu không thanh toán");
        order.setDiningTable(table1);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(shiftRepository.findByUserIdAndStatus("user-002", ShiftStatus.OPEN))
                .thenReturn(Optional.of(activeShift));
        when(orderRepository.findByHouseholdIdAndShiftIdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                "household-001", "shift-001", "CREATING"))
                .thenReturn(List.of(order));
        when(settingsRepository.findByHouseholdId("household-001"))
                .thenReturn(Optional.of(BusinessHouseholdSettings.builder().maxOrderHoldingHours(4).build()));

        List<HeldOrderSummaryResponse> list = orderService.getHeldOrders("thungan01");

        assertNotNull(list);
        assertEquals(1, list.size());
        HeldOrderSummaryResponse summary = list.get(0);
        assertEquals("order-001", summary.getId());
        assertEquals("Khách lâu không thanh toán", summary.getOrderLabel());
        assertEquals("Bàn 1", summary.getDiningTableName());
        assertTrue(summary.getIsOverdue(), "Đơn phải được đánh dấu quá hạn isOverdue = true");
        assertTrue(summary.getHoldingDurationMinutes() >= 300);
    }

    @Test
    @DisplayName("TC-06: Lấy danh sách đơn treo trong hạn trả về isOverdue = false")
    void getHeldOrders_within_limit_not_overdue() {
        order.setCreatedAt(LocalDateTime.now().minusMinutes(45));
        order.setOrderLabel("Khách mới vào 45 phút");

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(shiftRepository.findByUserIdAndStatus("user-002", ShiftStatus.OPEN))
                .thenReturn(Optional.of(activeShift));
        when(orderRepository.findByHouseholdIdAndShiftIdAndStatusAndDeletedAtIsNullOrderByCreatedAtDesc(
                "household-001", "shift-001", "CREATING"))
                .thenReturn(List.of(order));
        when(settingsRepository.findByHouseholdId("household-001"))
                .thenReturn(Optional.of(BusinessHouseholdSettings.builder().maxOrderHoldingHours(4).build()));

        List<HeldOrderSummaryResponse> list = orderService.getHeldOrders("thungan01");

        assertNotNull(list);
        assertEquals(1, list.size());
        assertFalse(list.get(0).getIsOverdue(), "Đơn trong hạn phải có isOverdue = false");
    }
}
