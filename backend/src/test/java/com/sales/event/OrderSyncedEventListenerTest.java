package com.sales.event;

import com.sales.entity.*;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceTemplateRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.EInvoiceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderSyncedEventListenerTest {

    @Mock
    private EInvoiceService eInvoiceService;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InvoiceTemplateRepository invoiceTemplateRepository;

    @InjectMocks
    private OrderSyncedEventListener eventListener;

    private BusinessHousehold household;
    private Customer corporateCustomer;
    private Order order;
    private User seller;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-100")
                .name("Hộ Kinh Doanh Bán Hàng Việt")
                .taxCode("0102030405")
                .address("123 Phố Huế, Hà Nội")
                .phoneNumber("02412345678")
                .build();

        corporateCustomer = Customer.builder()
                .id("cust-corp-1")
                .household(household)
                .name("Công ty TNHH Phần Mềm Á Châu")
                .taxCode("0109988776")
                .address("123 Lê Duẩn, Hoàn Kiếm, Hà Nội")
                .phoneNumber("02438889999")
                .email("contact@achau.vn")
                .build();

        seller = User.builder()
                .id("user-1")
                .username("seller1")
                .household(household)
                .build();

        order = Order.builder()
                .id("order-101")
                .orderNumber("ORD-101")
                .household(household)
                .customer(corporateCustomer)
                .createdByUser(seller)
                .totalAmount(new BigDecimal("1000000"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("1000000"))
                .build();
    }

    @Test
    @DisplayName("NCL-04-CN-006: Khắc phục lỗi bỏ sót buyerTaxCode khi fallback tạo hóa đơn SEND_ERROR từ sự kiện POS")
    void testHandleOrderSyncedEvent_FallbackPreservesBuyerTaxCode() {
        // Arrange
        OrderSyncedEvent event = new OrderSyncedEvent("seller1", "order-101", true);

        // Giả lập createInvoiceDraft ném lỗi (ví dụ lỗi mạng CQT)
        when(eInvoiceService.createInvoiceDraft("seller1", "order-101"))
                .thenThrow(new RuntimeException("Kết nối Cổng Tổng Cục Thuế thất bại"));

        when(eInvoiceRepository.findByOrderIdAndDeletedAtIsNull("order-101")).thenReturn(Optional.empty());
        when(orderRepository.findById("order-101")).thenReturn(Optional.of(order));
        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(seller));
        when(invoiceTemplateRepository.findByHouseholdId("hh-100")).thenReturn(Optional.empty());
        when(eInvoiceRepository.existsByLookupCodeAndDeletedAtIsNull(any())).thenReturn(false);

        // Act
        eventListener.handleOrderSyncedEvent(event);

        // Assert
        ArgumentCaptor<EInvoice> captor = ArgumentCaptor.forClass(EInvoice.class);
        verify(eInvoiceRepository, times(1)).save(captor.capture());

        EInvoice savedInvoice = captor.getValue();
        assertNotNull(savedInvoice);
        assertEquals("SEND_ERROR", savedInvoice.getStatus());
        assertEquals("0109988776", savedInvoice.getBuyerTaxCode(), "buyerTaxCode phải được bảo toàn từ khách hàng doanh nghiệp");
        assertEquals("Công ty TNHH Phần Mềm Á Châu", savedInvoice.getBuyerName());
        assertEquals("123 Lê Duẩn, Hoàn Kiếm, Hà Nội", savedInvoice.getBuyerAddress());
        assertEquals("02438889999", savedInvoice.getBuyerPhone());
        assertEquals("contact@achau.vn", savedInvoice.getBuyerEmail());
        assertTrue(savedInvoice.getTaxAuthorityResponse().contains("Kết nối Cổng Tổng Cục Thuế thất bại"));
    }
}
