package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.ShiftStatus;
import com.sales.dto.request.CancelOrderRequest;
import com.sales.dto.response.CanceledOrderStatisticsResponse;
import com.sales.dto.response.OrderCancelReasonDto;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CancelOrderServiceTest {

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
    private OrderPaymentRepository orderPaymentRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private User ownerUser;
    private User cashierUser;
    private BusinessHousehold household;
    private Shift activeShift;
    private Shift closedShift;
    private PointOfSale pos1;
    private PointOfSale pos2;
    private Order creatingOrder;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();
        Role cashierRole = Role.builder().code("VT-02").name("Thu ngân").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .name("Tạp Hóa Việt")
                .build();

        pos1 = PointOfSale.builder().id("pos-001").name("Quầy 1").build();
        pos2 = PointOfSale.builder().id("pos-002").name("Quầy 2").build();

        ownerUser = User.builder()
                .id("user-owner-001")
                .username("chuho")
                .fullName("Nguyễn Chủ Hộ")
                .role(ownerRole)
                .household(household)
                .build();

        cashierUser = User.builder()
                .id("user-cashier-001")
                .username("thungan01")
                .fullName("Trần Thu Ngân")
                .role(cashierRole)
                .household(household)
                .pointOfSale(pos1)
                .build();

        activeShift = Shift.builder()
                .id("shift-001")
                .status(ShiftStatus.OPEN)
                .user(cashierUser)
                .openedAt(LocalDateTime.now().minusHours(2))
                .build();

        closedShift = Shift.builder()
                .id("shift-closed")
                .status(ShiftStatus.CLOSED)
                .user(cashierUser)
                .openedAt(LocalDateTime.now().minusDays(1))
                .build();

        creatingOrder = Order.builder()
                .id("order-001")
                .orderNumber("ORD-20260908-0001")
                .household(household)
                .shift(activeShift)
                .pointOfSale(pos1)
                .createdByUser(cashierUser)
                .status("CREATING")
                .paymentMethod("CASH")
                .paymentStatus("PENDING")
                .totalAmount(new BigDecimal("150000.00"))
                .finalAmount(new BigDecimal("150000.00"))
                .items(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("TC-01: Hủy đơn hàng CREATING thành công với lý do Khách đổi ý (Pass AC-01 & QTN-09)")
    void cancelOrder_Success_CreatingStatus_WithReason() {
        // Given
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "house-001"))
                .thenReturn(Optional.of(creatingOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .cancelReasonNote(null)
                .build();

        // When
        OrderResponse response = orderService.cancelOrder("thungan01", "order-001", request);

        // Then
        assertNotNull(response);
        assertEquals("CANCELED", response.getStatus());
        assertEquals("CUSTOMER_CHANGED_MIND", response.getCancelReason());
        assertEquals("Khách đổi ý", response.getCancelReasonDescription());
        assertNull(response.getCancelReasonNote());
        assertEquals("user-cashier-001", response.getCanceledByUserId());
        assertEquals("Trần Thu Ngân", response.getCanceledByFullName());
        assertNotNull(response.getCanceledAt());

        // Kiểm chứng tính trung lập tồn kho: Không gọi trừ kho hay hoàn kho
        verify(posInventoryService, never()).batchDeductPosStock(any(), any(), any());
        verify(productRepository, never()).deductStock(any(), any(), any());

        // Kiểm chứng ghi nhận nhật ký kiểm toán QTN-09
        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(cashierUser), eq("CANCEL_ORDER"), eq("orders"), eq("order-001"),
                any(), any(), any(), any());
    }

    @Test
    @DisplayName("TC-02: Hủy đơn hàng thành công khi chọn lý do OTHER và có nhập ghi chú chi tiết")
    void cancelOrder_Success_WhenReasonIsOther_WithDetailedNote() {
        // Given
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "house-001"))
                .thenReturn(Optional.of(creatingOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.OTHER)
                .cancelReasonNote("Khách không đủ tiền mặt và app ngân hàng bảo trì")
                .build();

        // When
        OrderResponse response = orderService.cancelOrder("chuho", "order-001", request);

        // Then
        assertNotNull(response);
        assertEquals("CANCELED", response.getStatus());
        assertEquals("OTHER", response.getCancelReason());
        assertEquals("Lý do khác", response.getCancelReasonDescription());
        assertEquals("Khách không đủ tiền mặt và app ngân hàng bảo trì", response.getCancelReasonNote());
        assertEquals("Nguyễn Chủ Hộ", response.getCanceledByFullName());
    }

    @Test
    @DisplayName("TC-03: Chặn hủy đơn hàng khi không chọn lý do (Throw ORDER_CANCEL_REASON_REQUIRED - 3111)")
    void cancelOrder_ThrowsException_WhenReasonIsNull() {
        // Given
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "house-001"))
                .thenReturn(Optional.of(creatingOrder));

        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(null)
                .build();

        // When & Then
        AppException exception = assertThrows(AppException.class, () ->
                orderService.cancelOrder("thungan01", "order-001", request));

        assertEquals(ErrorCode.ORDER_CANCEL_REASON_REQUIRED, exception.getErrorCode());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-04: Chặn hủy khi chọn OTHER nhưng để trống ghi chú (Throw ORDER_CANCEL_NOTE_REQUIRED - 3112)")
    void cancelOrder_ThrowsException_WhenReasonIsOther_AndNoteIsBlank() {
        // Given
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "house-001"))
                .thenReturn(Optional.of(creatingOrder));

        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.OTHER)
                .cancelReasonNote("   ")
                .build();

        // When & Then
        AppException exception = assertThrows(AppException.class, () ->
                orderService.cancelOrder("thungan01", "order-001", request));

        assertEquals(ErrorCode.ORDER_CANCEL_NOTE_REQUIRED, exception.getErrorCode());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-05: Chặn hủy đơn đã thanh toán COMPLETED (Throw ORDER_ALREADY_COMPLETED_CANNOT_CANCEL - 3110)")
    void cancelOrder_ThrowsException_WhenOrderAlreadyCompleted() {
        // Given
        creatingOrder.setStatus("COMPLETED");
        creatingOrder.setPaymentStatus("PAID");

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "house-001"))
                .thenReturn(Optional.of(creatingOrder));

        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .build();

        // When & Then
        AppException exception = assertThrows(AppException.class, () ->
                orderService.cancelOrder("thungan01", "order-001", request));

        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CANCEL, exception.getErrorCode());
        assertTrue(exception.getMessage().contains("Hủy hóa đơn"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-06: Chặn hủy đơn đã bị hủy CANCELED trước đó (Throw ORDER_ALREADY_CANCELED - 3113)")
    void cancelOrder_ThrowsException_WhenOrderAlreadyCanceled() {
        // Given
        creatingOrder.setStatus("CANCELED");

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "house-001"))
                .thenReturn(Optional.of(creatingOrder));

        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.STAFF_INPUT_ERROR)
                .build();

        // When & Then
        AppException exception = assertThrows(AppException.class, () ->
                orderService.cancelOrder("thungan01", "order-001", request));

        assertEquals(ErrorCode.ORDER_ALREADY_CANCELED, exception.getErrorCode());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-07: Chặn khi không tìm thấy đơn hàng (Throw ORDER_NOT_FOUND)")
    void cancelOrder_ThrowsException_WhenOrderNotFound() {
        // Given
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("invalid-id", "house-001"))
                .thenReturn(Optional.empty());

        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.OUT_OF_STOCK)
                .build();

        // When & Then
        AppException exception = assertThrows(AppException.class, () ->
                orderService.cancelOrder("thungan01", "invalid-id", request));

        assertEquals(ErrorCode.ORDER_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    @DisplayName("TC-08: Chặn khi thu ngân khác điểm bán cố tình thao tác (Throw POS_EMPLOYEE_ACCESS_DENIED)")
    void cancelOrder_ThrowsException_WhenSalespersonBelongsToAnotherPos() {
        // Given
        creatingOrder.setPointOfSale(pos2); // Đơn của Quầy 2, nhưng cashierUser trực Quầy 1

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "house-001"))
                .thenReturn(Optional.of(creatingOrder));

        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .build();

        // When & Then
        AppException exception = assertThrows(AppException.class, () ->
                orderService.cancelOrder("thungan01", "order-001", request));

        assertEquals(ErrorCode.POS_EMPLOYEE_ACCESS_DENIED, exception.getErrorCode());
    }

    @Test
    @DisplayName("TC-09: Chặn khi ca làm việc liên kết đã đóng (Throw SHIFT_ALREADY_CLOSED)")
    void cancelOrder_ThrowsException_WhenShiftIsClosed() {
        // Given
        creatingOrder.setShift(closedShift);

        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "house-001"))
                .thenReturn(Optional.of(creatingOrder));

        CancelOrderRequest request = CancelOrderRequest.builder()
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .build();

        // When & Then
        AppException exception = assertThrows(AppException.class, () ->
                orderService.cancelOrder("thungan01", "order-001", request));

        assertEquals(ErrorCode.SHIFT_ALREADY_CLOSED, exception.getErrorCode());
    }

    @Test
    @DisplayName("TC-10: Lấy danh mục lý do hủy đơn chuẩn hóa trả về 4 lý do")
    void getCancelReasons_ReturnsStandardReasons() {
        List<OrderCancelReasonDto> reasons = orderService.getCancelReasons();

        assertNotNull(reasons);
        assertEquals(4, reasons.size());

        assertTrue(reasons.stream().anyMatch(r -> "CUSTOMER_CHANGED_MIND".equals(r.getCode()) && "Khách đổi ý".equals(r.getDescription()) && !r.isRequiresNote()));
        assertTrue(reasons.stream().anyMatch(r -> "OUT_OF_STOCK".equals(r.getCode()) && "Hết hàng".equals(r.getDescription()) && !r.isRequiresNote()));
        assertTrue(reasons.stream().anyMatch(r -> "STAFF_INPUT_ERROR".equals(r.getCode()) && "Nhân viên nhập nhầm".equals(r.getDescription()) && !r.isRequiresNote()));
        assertTrue(reasons.stream().anyMatch(r -> "OTHER".equals(r.getCode()) && "Lý do khác".equals(r.getDescription()) && r.isRequiresNote()));
    }

    @Test
    @DisplayName("TC-11: Thống kê số đơn hủy và lý do theo ca và theo nhân viên (Pass AC-04)")
    void getCanceledOrderStatistics_ReturnsAggregatedData() {
        // Given
        Order canceledOrder1 = Order.builder()
                .id("order-c1")
                .orderNumber("ORD-001")
                .status("CANCELED")
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .canceledByUser(cashierUser)
                .canceledAt(LocalDateTime.now().minusMinutes(30))
                .totalAmount(new BigDecimal("100000.00"))
                .build();

        Order canceledOrder2 = Order.builder()
                .id("order-c2")
                .orderNumber("ORD-002")
                .status("CANCELED")
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .canceledByUser(cashierUser)
                .canceledAt(LocalDateTime.now().minusMinutes(20))
                .totalAmount(new BigDecimal("200000.00"))
                .build();

        Order canceledOrder3 = Order.builder()
                .id("order-c3")
                .orderNumber("ORD-003")
                .status("CANCELED")
                .cancelReason(OrderCancelReason.OTHER)
                .cancelReasonNote("Khách đổi ý sang thanh toán online")
                .canceledByUser(ownerUser)
                .canceledAt(LocalDateTime.now().minusMinutes(10))
                .totalAmount(new BigDecimal("300000.00"))
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(shiftRepository.findByIdAndHouseholdId("shift-001", "house-001")).thenReturn(Optional.of(activeShift));
        when(orderRepository.findCanceledOrders(eq("house-001"), eq("shift-001"), isNull(), any(), any()))
                .thenReturn(List.of(canceledOrder1, canceledOrder2, canceledOrder3));

        // When
        CanceledOrderStatisticsResponse response = orderService.getCanceledOrderStatistics(
                "chuho", "shift-001", LocalDateTime.now().minusHours(5), LocalDateTime.now());

        // Then
        assertNotNull(response);
        assertEquals(3, response.getTotalCanceledOrders());
        assertEquals(new BigDecimal("600000.00"), response.getTotalCanceledAmount());
        assertEquals("shift-001", response.getShiftId());

        // Kiểm tra phân loại theo lý do
        assertNotNull(response.getByReason());
        assertTrue(response.getByReason().stream()
                .anyMatch(r -> "CUSTOMER_CHANGED_MIND".equals(r.getReasonCode()) && r.getCount() == 2));
        assertTrue(response.getByReason().stream()
                .anyMatch(r -> "OTHER".equals(r.getReasonCode()) && r.getCount() == 1));

        // Kiểm tra phân loại theo nhân viên
        assertNotNull(response.getByEmployee());
        assertEquals(2, response.getByEmployee().size());
        assertTrue(response.getByEmployee().stream()
                .anyMatch(e -> "user-cashier-001".equals(e.getEmployeeId()) && e.getCount() == 2));
        assertTrue(response.getByEmployee().stream()
                .anyMatch(e -> "user-owner-001".equals(e.getEmployeeId()) && e.getCount() == 1));

        // Kiểm tra danh sách đơn gần nhất
        assertEquals(3, response.getRecentCanceledOrders().size());
    }

    @Test
    @DisplayName("TC-12: Thu ngân VT-02 xem thống kê đơn hủy bị giới hạn chỉ xem đơn của chính mình (QTN-10)")
    void getCanceledOrderStatistics_Salesperson_FiltersOwnOrdersOnly() {
        // Given
        Order myCanceledOrder = Order.builder()
                .id("order-c1")
                .orderNumber("ORD-001")
                .status("CANCELED")
                .cancelReason(OrderCancelReason.CUSTOMER_CHANGED_MIND)
                .canceledByUser(cashierUser)
                .canceledAt(LocalDateTime.now().minusMinutes(15))
                .totalAmount(new BigDecimal("150000.00"))
                .build();

        when(userRepository.findByUsername("thungan")).thenReturn(Optional.of(cashierUser));
        when(orderRepository.findCanceledOrders(eq("house-001"), isNull(), eq("user-cashier-001"), any(), any()))
                .thenReturn(List.of(myCanceledOrder));

        // When
        CanceledOrderStatisticsResponse response = orderService.getCanceledOrderStatistics(
                "thungan", null, null, null);

        // Then
        assertNotNull(response);
        assertEquals(1, response.getTotalCanceledOrders());
        assertEquals(new BigDecimal("150000.00"), response.getTotalCanceledAmount());
        assertEquals(1, response.getByEmployee().size());
        assertEquals("user-cashier-001", response.getByEmployee().get(0).getEmployeeId());
        verify(orderRepository).findCanceledOrders(eq("house-001"), isNull(), eq("user-cashier-001"), any(), any());
    }

    @Test
    @DisplayName("TC-13: Truyền shiftId chuỗi rỗng được chuẩn hóa sang null (tránh Silent Failure)")
    void getCanceledOrderStatistics_EmptyShiftId_SanitizedToNull() {
        // Given
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(orderRepository.findCanceledOrders(eq("house-001"), isNull(), isNull(), any(), any()))
                .thenReturn(Collections.emptyList());

        // When
        CanceledOrderStatisticsResponse response = orderService.getCanceledOrderStatistics(
                "chuho", "   ", null, null);

        // Then
        assertNotNull(response);
        assertNull(response.getShiftId());
        verify(orderRepository).findCanceledOrders(eq("house-001"), isNull(), isNull(), any(), any());
        verify(shiftRepository, never()).findByIdAndHouseholdId(any(), any());
    }
}
