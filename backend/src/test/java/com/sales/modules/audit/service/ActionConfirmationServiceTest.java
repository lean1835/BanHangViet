package com.sales.modules.audit.service;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.invoice.entity.EInvoice;
import com.sales.modules.order.entity.DiningTable;
import com.sales.modules.order.entity.Order;
import com.sales.modules.order.entity.OrderItem;
import com.sales.common.constant.ActionSeverity;
import com.sales.common.constant.ActionType;
import com.sales.modules.audit.dto.response.ActionConsequenceResponse;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.invoice.repository.EInvoiceRepository;
import com.sales.modules.order.repository.OrderRepository;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.audit.service.impl.ActionConfirmationServiceImpl;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActionConfirmationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EInvoiceRepository invoiceRepository;

    @InjectMocks
    private ActionConfirmationServiceImpl actionConfirmationService;

    private User sampleUser;
    private BusinessHousehold sampleHousehold;
    private Order sampleOrder;
    private EInvoice sampleInvoice;

    @BeforeEach
    void setUp() {
        sampleHousehold = BusinessHousehold.builder()
                .id("household-001")
                .name("Hộ Kinh Doanh Mẫu")
                .build();

        sampleUser = User.builder()
                .id("user-001")
                .username("thungan01")
                .role(Role.builder().id(1).code("VT-01").name("Chủ hộ kinh doanh").build())
                .household(sampleHousehold)
                .isActive(true)
                .build();

        DiningTable table = DiningTable.builder()
                .id("table-001")
                .name("Bàn số 3")
                .build();

        List<OrderItem> items = new ArrayList<>();
        items.add(OrderItem.builder().id("item-1").build());
        items.add(OrderItem.builder().id("item-2").build());

        sampleOrder = Order.builder()
                .id("order-001")
                .orderNumber("HD20260916-0001")
                .household(sampleHousehold)
                .status("CREATING")
                .diningTable(table)
                .finalAmount(new BigDecimal("150000.00"))
                .items(items)
                .build();

        sampleInvoice = EInvoice.builder()
                .id("invoice-001")
                .invoiceNumber("00000088")
                .invoiceSymbol("1C26TAA")
                .household(sampleHousehold)
                .status("TAX_CODE_GRANTED")
                .finalAmount(new BigDecimal("500000.00"))
                .build();
    }

    @Test
    @DisplayName("TC-01: Phân tích hậu quả hủy đơn hàng (Order) thành công")
    void testAnalyzeCancelOrder_Success() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001")).thenReturn(Optional.of(sampleOrder));

        ActionConsequenceResponse response = actionConfirmationService.getActionConsequences(
                "thungan01", ActionType.CANCEL_ORDER, "order-001");

        assertNotNull(response);
        assertEquals(ActionType.CANCEL_ORDER, response.getActionType());
        assertEquals("HD20260916-0001", response.getTargetCode());
        assertEquals(ActionSeverity.DANGER, response.getSeverity());
        assertTrue(response.getIsIrreversible());
        assertNotNull(response.getConsequences());
        assertTrue(response.getConsequences().stream().anyMatch(c -> c.contains("Bàn số 3")));
        assertTrue(response.getConsequences().stream().anyMatch(c -> c.contains("150,000 đ")));
        assertTrue(response.getConsequences().stream().anyMatch(c -> c.contains("KHÔNG THỂ HOÀN TÁC")));
    }

    @Test
    @DisplayName("TC-02: Phân tích hậu quả hủy hóa đơn điện tử đã cấp mã thuế (TAX_CODE_GRANTED)")
    void testAnalyzeCancelInvoice_TaxCodeGranted() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(sampleUser));
        when(invoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("invoice-001", "household-001")).thenReturn(Optional.of(sampleInvoice));

        ActionConsequenceResponse response = actionConfirmationService.getActionConsequences(
                "thungan01", ActionType.CANCEL_INVOICE, "invoice-001");

        assertNotNull(response);
        assertEquals(ActionType.CANCEL_INVOICE, response.getActionType());
        assertEquals("00000088", response.getTargetCode());
        assertEquals(ActionSeverity.DANGER, response.getSeverity());
        assertTrue(response.getIsIrreversible());
        assertTrue(response.getConsequences().stream().anyMatch(c -> c.contains("CƠ QUAN THUẾ CẤP MÃ")));
        assertTrue(response.getConsequences().stream().anyMatch(c -> c.contains("Nghị định 123/2020/NĐ-CP")));
        assertTrue(response.getConsequences().stream().anyMatch(c -> c.contains("KHÔNG THỂ ĐẢO NGƯỢC")));
    }

    @Test
    @DisplayName("TC-03: Chặn phân tích hậu quả khi đơn hàng thuộc Hộ kinh doanh khác (Multi-tenancy)")
    void testAnalyzeCancelOrder_DifferentHousehold() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                actionConfirmationService.getActionConsequences("thungan01", ActionType.CANCEL_ORDER, "order-001"));
        assertEquals(ErrorCode.TARGET_OBJECT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-04: Đối tượng targetId không tồn tại ném TARGET_OBJECT_NOT_FOUND")
    void testAnalyzeCancelOrder_NotFound() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("non-existent", "household-001")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                actionConfirmationService.getActionConsequences("thungan01", ActionType.CANCEL_ORDER, "non-existent"));
        assertEquals(ErrorCode.TARGET_OBJECT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-05: Loại hành động không hỗ trợ ném UNSUPPORTED_ACTION_TYPE")
    void testUnsupportedActionType() {
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(sampleUser));

        AppException ex = assertThrows(AppException.class, () ->
                actionConfirmationService.getActionConsequences("thungan01", ActionType.VOID_PAYMENT, "target-01"));
        assertEquals(ErrorCode.UNSUPPORTED_ACTION_TYPE, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-06: Thu ngân (VT-02) không có quyền hủy hóa đơn điện tử ném FORBIDDEN (RBAC)")
    void testAnalyzeCancelInvoice_SalespersonForbidden() {
        sampleUser.setRole(Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build());
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(sampleUser));

        AppException ex = assertThrows(AppException.class, () ->
                actionConfirmationService.getActionConsequences("thungan01", ActionType.CANCEL_INVOICE, "invoice-001"));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-07: Đơn hàng đã hủy ném ORDER_ALREADY_CANCELED")
    void testAnalyzeCancelOrder_AlreadyCanceled() {
        sampleOrder.setStatus("CANCELED");
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001")).thenReturn(Optional.of(sampleOrder));

        AppException ex = assertThrows(AppException.class, () ->
                actionConfirmationService.getActionConsequences("thungan01", ActionType.CANCEL_ORDER, "order-001"));
        assertEquals(ErrorCode.ORDER_ALREADY_CANCELED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-08: Đơn hàng đã hoàn thành ném ORDER_ALREADY_COMPLETED_CANNOT_CANCEL")
    void testAnalyzeCancelOrder_AlreadyCompleted() {
        sampleOrder.setStatus("COMPLETED");
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(sampleUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("order-001", "household-001")).thenReturn(Optional.of(sampleOrder));

        AppException ex = assertThrows(AppException.class, () ->
                actionConfirmationService.getActionConsequences("thungan01", ActionType.CANCEL_ORDER, "order-001"));
        assertEquals(ErrorCode.ORDER_ALREADY_COMPLETED_CANNOT_CANCEL, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-09: Hóa đơn điện tử đã hủy ném INVOICE_CANNOT_BE_CANCELED")
    void testAnalyzeCancelInvoice_AlreadyCanceled() {
        sampleInvoice.setStatus("CANCELED");
        when(userRepository.findByUsername("thungan01")).thenReturn(Optional.of(sampleUser));
        when(invoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("invoice-001", "household-001")).thenReturn(Optional.of(sampleInvoice));

        AppException ex = assertThrows(AppException.class, () ->
                actionConfirmationService.getActionConsequences("thungan01", ActionType.CANCEL_INVOICE, "invoice-001"));
        assertEquals(ErrorCode.INVOICE_CANNOT_BE_CANCELED, ex.getErrorCode());
    }
}
