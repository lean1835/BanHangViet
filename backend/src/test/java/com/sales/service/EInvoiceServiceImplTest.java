package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.UpdateInvoiceRequest;
import com.sales.dto.response.CustomerTaxLookupResponse;
import com.sales.dto.response.InvoiceResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Customer;
import com.sales.entity.EInvoice;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.CustomerRepository;
import com.sales.repository.EInvoiceItemRepository;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.InvoiceDeliveryLogRepository;
import com.sales.repository.InvoiceStatusLogRepository;
import com.sales.repository.InvoiceTemplateRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.ProductRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.EInvoiceServiceImpl;
import com.sales.service.interfaces.EmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EInvoiceServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private EInvoiceItemRepository eInvoiceItemRepository;

    @Mock
    private InvoiceStatusLogRepository invoiceStatusLogRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private InvoiceTemplateRepository invoiceTemplateRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InvoiceDeliveryLogRepository invoiceDeliveryLogRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private TransactionTemplate transactionTemplate;

    @InjectMocks
    private EInvoiceServiceImpl eInvoiceService;

    private User currentUser;
    private BusinessHousehold household;
    private EInvoice draftInvoice;
    private EInvoice issuedInvoice;

    @BeforeEach
    void setUp() {
        Role role = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        household = BusinessHousehold.builder()
                .id("hh-100")
                .taxCode("0109998887")
                .name("Hộ kinh doanh Test")
                .address("123 Phố Huế, Hà Nội")
                .phoneNumber("0988888888")
                .build();

        currentUser = User.builder()
                .id("user-1")
                .username("seller1")
                .fullName("Nguyễn Văn Bán")
                .role(role)
                .household(household)
                .build();

        draftInvoice = EInvoice.builder()
                .id("inv-draft-1")
                .household(household)
                .createdByUser(currentUser)
                .invoiceNumber("HD00001")
                .status("DRAFT")
                .totalAmountBeforeTax(BigDecimal.valueOf(100000))
                .finalAmount(BigDecimal.valueOf(100000))
                .lookupCode("LOOKUP001")
                .items(new ArrayList<>())
                .build();

        issuedInvoice = EInvoice.builder()
                .id("inv-issued-1")
                .household(household)
                .createdByUser(currentUser)
                .invoiceNumber("HD00002")
                .status("ISSUED")
                .taxAuthorityCode("CQT-123456")
                .totalAmountBeforeTax(BigDecimal.valueOf(200000))
                .finalAmount(BigDecimal.valueOf(200000))
                .lookupCode("LOOKUP002")
                .items(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("NCL-04-CN-006-TC-01: Luồng thành công - Nhập thông tin người mua có MST hợp lệ 10 chữ số")
    void testUpdateInvoice_Success_CorporateBuyer_10Digits() {
        // Arrange
        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(currentUser));
        when(eInvoiceRepository.findById("inv-draft-1")).thenReturn(Optional.of(draftInvoice));
        when(customerRepository.findByHouseholdIdAndTaxCodeAndDeletedAtIsNull("hh-100", "0101234567"))
                .thenReturn(Optional.empty());
        when(eInvoiceRepository.save(any(EInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .buyerName("Công ty TNHH Giải pháp Công nghệ")
                .buyerTaxCode("0101234567")
                .buyerAddress("456 Nguyễn Trãi, Thanh Xuân, Hà Nội")
                .buyerEmail("contact@techsol.vn")
                .buyerPhone("02439998888")
                .build();

        // Act
        InvoiceResponse response = eInvoiceService.updateInvoice("seller1", "inv-draft-1", request);

        // Assert
        assertNotNull(response);
        assertEquals("0101234567", response.getBuyerTaxCode());
        assertEquals("Công ty TNHH Giải pháp Công nghệ", response.getBuyerName());
        assertEquals("456 Nguyễn Trãi, Thanh Xuân, Hà Nội", response.getBuyerAddress());
        assertEquals("contact@techsol.vn", response.getBuyerEmail());

        // Verify Customer profile was created/saved
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    @DisplayName("NCL-04-CN-006-TC-01: Luồng thành công - Nhập thông tin người mua có MST hợp lệ 13 chữ số")
    void testUpdateInvoice_Success_CorporateBuyer_13Digits() {
        // Arrange
        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(currentUser));
        when(eInvoiceRepository.findById("inv-draft-1")).thenReturn(Optional.of(draftInvoice));
        when(customerRepository.findByHouseholdIdAndTaxCodeAndDeletedAtIsNull("hh-100", "0101234567-001"))
                .thenReturn(Optional.empty());
        when(eInvoiceRepository.save(any(EInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .buyerName("Chi nhánh Công ty ABC")
                .buyerTaxCode("0101234567-001")
                .buyerAddress("789 Cầu Giấy, Hà Nội")
                .build();

        // Act
        InvoiceResponse response = eInvoiceService.updateInvoice("seller1", "inv-draft-1", request);

        // Assert
        assertNotNull(response);
        assertEquals("0101234567-001", response.getBuyerTaxCode());
        assertEquals("Chi nhánh Công ty ABC", response.getBuyerName());
        verify(customerRepository, times(1)).save(any(Customer.class));
    }

    @Test
    @DisplayName("NCL-04-CN-006-TC-02: Dữ liệu không hợp lệ - Thất bại khi MST sai số lượng chữ số")
    void testUpdateInvoice_InvalidTaxCode_ThrowsException() {
        // Arrange
        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(currentUser));
        when(eInvoiceRepository.findById("inv-draft-1")).thenReturn(Optional.of(draftInvoice));

        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .buyerName("Công ty Sai MST")
                .buyerTaxCode("12345") // Chỉ có 5 chữ số
                .build();

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () ->
                eInvoiceService.updateInvoice("seller1", "inv-draft-1", request));

        assertEquals(ErrorCode.INVALID_TAX_CODE, exception.getErrorCode());
        verify(eInvoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("NCL-04-CN-006-TC-03: Sai trạng thái - Chặn sửa trực tiếp thông tin người mua khi hóa đơn đã ISSUED")
    void testUpdateInvoice_IssuedStatus_ThrowsException() {
        // Arrange
        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(currentUser));
        when(eInvoiceRepository.findById("inv-issued-1")).thenReturn(Optional.of(issuedInvoice));

        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .buyerName("Công ty Muốn Sửa Dữ Liệu")
                .buyerTaxCode("0101234567")
                .build();

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () ->
                eInvoiceService.updateInvoice("seller1", "inv-issued-1", request));

        assertEquals(ErrorCode.INVOICE_NOT_EDITABLE, exception.getErrorCode());
        verify(eInvoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("NCL-04-CN-006: Auto-fill từ hồ sơ khách hàng sẵn có khi nhập MST")
    void testUpdateInvoice_AutoFillFromExistingCustomer() {
        // Arrange
        Customer existingCust = Customer.builder()
                .id("cust-1")
                .household(household)
                .taxCode("0101234567")
                .name("Công ty Đã Có Trong DB")
                .address("100 Hoàng Quốc Việt")
                .email("info@daco.vn")
                .phoneNumber("0912345678")
                .build();

        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(currentUser));
        when(eInvoiceRepository.findById("inv-draft-1")).thenReturn(Optional.of(draftInvoice));
        when(customerRepository.findByHouseholdIdAndTaxCodeAndDeletedAtIsNull("hh-100", "0101234567"))
                .thenReturn(Optional.of(existingCust));
        when(eInvoiceRepository.save(any(EInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Request chỉ gửi MST, tên và địa chỉ để trống
        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .buyerTaxCode("0101234567")
                .build();

        // Act
        InvoiceResponse response = eInvoiceService.updateInvoice("seller1", "inv-draft-1", request);

        // Assert
        assertNotNull(response);
        assertEquals("0101234567", response.getBuyerTaxCode());
        assertEquals("Công ty Đã Có Trong DB", response.getBuyerName());
        assertEquals("100 Hoàng Quốc Việt", response.getBuyerAddress());
        assertEquals("info@daco.vn", response.getBuyerEmail());
        assertEquals("0912345678", response.getBuyerPhone());
    }

    @Test
    @DisplayName("NCL-04-CN-006: Mặc định tên người mua là Khách lẻ khi không nhập MST và tên")
    void testUpdateInvoice_DefaultRetailCustomer() {
        // Arrange
        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(currentUser));
        when(eInvoiceRepository.findById("inv-draft-1")).thenReturn(Optional.of(draftInvoice));
        when(eInvoiceRepository.save(any(EInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateInvoiceRequest request = UpdateInvoiceRequest.builder()
                .buyerTaxCode("")
                .buyerName("")
                .build();

        // Act
        InvoiceResponse response = eInvoiceService.updateInvoice("seller1", "inv-draft-1", request);

        // Assert
        assertNotNull(response);
        assertEquals("Khách lẻ", response.getBuyerName());
        assertNull(response.getBuyerTaxCode());
    }

    @Test
    @DisplayName("NCL-04-CN-006: Tra cứu thông tin người mua thành công theo MST")
    void testLookupBuyerInfoByTaxCode_Success() {
        // Arrange
        Customer existingCust = Customer.builder()
                .id("cust-1")
                .household(household)
                .taxCode("0101234567")
                .name("Công ty Tra Cứu")
                .address("200 Trần Duy Hưng")
                .email("contact@tracuu.vn")
                .phoneNumber("0977665544")
                .build();

        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(currentUser));
        when(customerRepository.findByHouseholdIdAndTaxCodeAndDeletedAtIsNull("hh-100", "0101234567"))
                .thenReturn(Optional.of(existingCust));

        // Act
        CustomerTaxLookupResponse lookup = eInvoiceService.lookupBuyerInfoByTaxCode("seller1", "0101234567");

        // Assert
        assertNotNull(lookup);
        assertEquals("0101234567", lookup.getBuyerTaxCode());
        assertEquals("Công ty Tra Cứu", lookup.getBuyerName());
        assertEquals("200 Trần Duy Hưng", lookup.getBuyerAddress());
        assertEquals("contact@tracuu.vn", lookup.getBuyerEmail());
        assertEquals("0977665544", lookup.getBuyerPhone());
    }

    @Test
    @DisplayName("NCL-02-CN-007: Xuất hóa đơn từ đơn hàng có đơn vị quy đổi (Thùng) -> Hóa đơn mang đúng tên đơn vị quy đổi và giá bán")
    void testCreateInvoiceFromOrder_WithUnitConversion() {
        household.setRevenueThresholdEnabled(true);
        com.sales.entity.Order order = com.sales.entity.Order.builder()
                .id("ord-conv-1")
                .household(household)
                .createdByUser(currentUser)
                .status("COMPLETED")
                .paymentStatus("PAID")
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("280000.00"))
                .items(new ArrayList<>())
                .build();

        com.sales.entity.OrderItem item = com.sales.entity.OrderItem.builder()
                .id("item-1")
                .order(order)
                .productName("Bia Heineken")
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .baseQuantity(new BigDecimal("24"))
                .quantity(new BigDecimal("1"))
                .unitPrice(new BigDecimal("280000.00"))
                .discountAmount(BigDecimal.ZERO)
                .taxRatePercentage(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .build();
        order.getItems().add(item);

        when(userRepository.findByUsername("seller1")).thenReturn(Optional.of(currentUser));
        when(orderRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("ord-conv-1", "hh-100"))
                .thenReturn(Optional.of(order));
        when(eInvoiceRepository.findByOrderIdAndDeletedAtIsNull("ord-conv-1"))
                .thenReturn(Optional.empty());
        when(invoiceTemplateRepository.findByHouseholdId("hh-100"))
                .thenReturn(Optional.empty());
        when(invoiceTemplateRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(eInvoiceRepository.save(any(EInvoice.class))).thenAnswer(inv -> {
            EInvoice invObj = inv.getArgument(0);
            invObj.setId("inv-100");
            return invObj;
        });

        InvoiceResponse response = eInvoiceService.createInvoiceDraft("seller1", "ord-conv-1");

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        assertEquals("Thùng", response.getItems().get(0).getUnit());
        assertEquals(new BigDecimal("280000.00"), response.getItems().get(0).getUnitPrice());
        assertEquals(new BigDecimal("1"), response.getItems().get(0).getQuantity());
    }
}

