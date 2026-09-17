package com.sales.service;

import com.sales.dto.request.CheckExchangeEligibilityRequest;
import com.sales.dto.request.CreateProductExchangeRequest;
import com.sales.dto.request.ExchangeNewItemRequest;
import com.sales.dto.request.ExchangeReturnItemRequest;
import com.sales.dto.response.ExchangeEligibilityResponse;
import com.sales.dto.response.ProductExchangeResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.ProductExchangeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductExchangeServiceImplTest {

    @Mock
    private ProductExchangeTicketRepository productExchangeTicketRepository;

    @Mock
    private ProductExchangeItemRepository productExchangeItemRepository;

    @Mock
    private ReturnTicketItemRepository returnTicketItemRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InvoiceStatusLogRepository invoiceStatusLogRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private BusinessHouseholdSettingsRepository settingsRepository;

    @Mock
    private com.sales.service.interfaces.InvoiceNumberRangeService invoiceNumberRangeService;

    @InjectMocks
    private ProductExchangeServiceImpl productExchangeService;

    private BusinessHousehold household;
    private Role staffRole;
    private Role customerRole;
    private User staffUser;
    private EInvoice originalInvoice;
    private EInvoiceItem invoiceItem1;
    private Product product1; // original product: price 50,000
    private Product product2; // equal price product: price 50,000
    private Product productExpensive; // expensive product: price 70,000
    private Product productCheap; // cheaper product: price 30,000

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(productExchangeService, "maxReturnDays", 7);

        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Tạp Hóa Việt")
                .build();

        staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        customerRole = Role.builder().id(6).code("VT-06").name("Khách hàng").build();

        staffUser = User.builder()
                .id("u-1")
                .username("nhanvien1")
                .fullName("Nguyễn Văn Nhân Viên")
                .role(staffRole)
                .household(household)
                .build();

        product1 = Product.builder()
                .id("p-1")
                .name("Nước giặt OMO 2kg")
                .unit("Túi")
                .price(new BigDecimal("50000.00"))
                .stockQuantity(new BigDecimal("10.000"))
                .household(household)
                .build();

        product2 = Product.builder()
                .id("p-2")
                .name("Nước giặt Ariel 2kg")
                .unit("Túi")
                .price(new BigDecimal("50000.00"))
                .stockQuantity(new BigDecimal("15.000"))
                .household(household)
                .build();

        productExpensive = Product.builder()
                .id("p-3")
                .name("Nước giặt OMO Matic 3.5kg")
                .unit("Can")
                .price(new BigDecimal("70000.00"))
                .stockQuantity(new BigDecimal("8.000"))
                .household(household)
                .build();

        productCheap = Product.builder()
                .id("p-4")
                .name("Nước giặt Net 1.8kg")
                .unit("Túi")
                .price(new BigDecimal("30000.00"))
                .stockQuantity(new BigDecimal("20.000"))
                .household(household)
                .build();

        invoiceItem1 = EInvoiceItem.builder()
                .id("inv-item-1")
                .product(product1)
                .productName(product1.getName())
                .unit(product1.getUnit())
                .quantity(new BigDecimal("2.000"))
                .unitPrice(new BigDecimal("50000.00"))
                .taxRatePercentage(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .subtotal(new BigDecimal("100000.00"))
                .build();

        originalInvoice = EInvoice.builder()
                .id("inv-1")
                .household(household)
                .invoiceNumber("0000123")
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .status("ISSUED")
                .createdAt(LocalDateTime.now().minusDays(2))
                .buyerName("Khách lẻ")
                .items(new ArrayList<>(List.of(invoiceItem1)))
                .build();
    }

    // =========================================================================
    // TESTS FOR CHECK ELIGIBILITY
    // =========================================================================

    @Test
    @DisplayName("CheckEligibility - NCL-11-CN-005-TC-01: Ngang giá trả về isEligible = true, EQUAL_VALUE, diff = 0")
    void checkEligibility_EqualValue_ReturnsEligible() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-1", "p-1"))
                .thenReturn(BigDecimal.ZERO);
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-2", "hh-1"))
                .thenReturn(Optional.of(product2));

        CheckExchangeEligibilityRequest request = CheckExchangeEligibilityRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .invoiceItemId("inv-item-1")
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-2")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .build();

        ExchangeEligibilityResponse response = productExchangeService.checkEligibility(request, "nhanvien1");

        assertNotNull(response);
        assertTrue(response.isEligible());
        assertEquals("EQUAL_VALUE", response.getExchangeType());
        assertEquals(0, new BigDecimal("50000.00").compareTo(response.getTotalReturnAmount()));
        assertEquals(0, new BigDecimal("50000.00").compareTo(response.getTotalExchangeAmount()));
        assertEquals(0, BigDecimal.ZERO.compareTo(response.getDifferenceAmount()));
        assertFalse(response.isRequireNewInvoice());
        assertFalse(response.isRedirectToReturnFlow());
    }

    @Test
    @DisplayName("CheckEligibility - NCL-11-CN-005-TC-02: Đổi sang món giá cao hơn -> requireNewInvoice = true, diff > 0")
    void checkEligibility_HigherValue_ReturnsEligibleWithExtraPayment() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-1", "p-1"))
                .thenReturn(BigDecimal.ZERO);
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-3", "hh-1"))
                .thenReturn(Optional.of(productExpensive));

        CheckExchangeEligibilityRequest request = CheckExchangeEligibilityRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .invoiceItemId("inv-item-1")
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-3")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .build();

        ExchangeEligibilityResponse response = productExchangeService.checkEligibility(request, "nhanvien1");

        assertNotNull(response);
        assertTrue(response.isEligible());
        assertEquals("HIGHER_VALUE", response.getExchangeType());
        assertEquals(0, new BigDecimal("50000.00").compareTo(response.getTotalReturnAmount()));
        assertEquals(0, new BigDecimal("70000.00").compareTo(response.getTotalExchangeAmount()));
        assertEquals(0, new BigDecimal("20000.00").compareTo(response.getDifferenceAmount()));
        assertTrue(response.isRequireNewInvoice());
    }

    @Test
    @DisplayName("CheckEligibility - NCL-11-CN-005-TC-03: Đổi sang món giá thấp hơn -> redirectToReturnFlow = true")
    void checkEligibility_LowerValue_ReturnsRedirectToReturn() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-1", "p-1"))
                .thenReturn(BigDecimal.ZERO);
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-4", "hh-1"))
                .thenReturn(Optional.of(productCheap));

        CheckExchangeEligibilityRequest request = CheckExchangeEligibilityRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .invoiceItemId("inv-item-1")
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-4")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .build();

        ExchangeEligibilityResponse response = productExchangeService.checkEligibility(request, "nhanvien1");

        assertNotNull(response);
        assertFalse(response.isEligible());
        assertEquals("LOWER_VALUE", response.getExchangeType());
        assertTrue(response.isRedirectToReturnFlow());
        assertEquals(0, new BigDecimal("20000.00").compareTo(response.getSuggestedRefundAmount()));
    }

    // =========================================================================
    // TESTS FOR CREATE PRODUCT EXCHANGE
    // =========================================================================

    @Test
    @DisplayName("NCL-11-CN-005-TC-01: Đổi hàng ngang giá thành công, kho cập nhật 2 chiều, không sinh HĐ mới")
    void createProductExchange_EqualValue_Success() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-1", "p-1"))
                .thenReturn(BigDecimal.ZERO);
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-2", "hh-1"))
                .thenReturn(Optional.of(product2));
        when(productExchangeTicketRepository.findMaxTicketNumberByPrefix(eq("hh-1"), anyString()))
                .thenReturn(Optional.empty());

        when(productExchangeTicketRepository.save(any(ProductExchangeTicket.class)))
                .thenAnswer(invocation -> {
                    ProductExchangeTicket t = invocation.getArgument(0);
                    t.setId("dx-ticket-1");
                    return t;
                });

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .invoiceItemId("inv-item-1")
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-2")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .reason("Khách muốn đổi sang hương thơm Ariel")
                .build();

        BigDecimal oldStockP1 = product1.getStockQuantity();
        BigDecimal oldStockP2 = product2.getStockQuantity();

        ProductExchangeResponse response = productExchangeService.createProductExchange(request, "nhanvien1");

        assertNotNull(response);
        assertEquals("dx-ticket-1", response.getId());
        assertEquals("EQUAL_VALUE", response.getExchangeType());
        assertEquals(0, BigDecimal.ZERO.compareTo(response.getDifferenceAmount()));
        assertNull(response.getAdditionalInvoiceId()); // Không sinh hóa đơn mới

        // Kiểm tra tồn kho hai chiều: Món cũ tăng 1, món mới giảm 1
        assertEquals(oldStockP1.add(new BigDecimal("1.000")), product1.getStockQuantity());
        assertEquals(oldStockP2.subtract(new BigDecimal("1.000")), product2.getStockQuantity());
        verify(productRepository).saveAll(anyCollection());
    }

    @Test
    @DisplayName("NCL-11-CN-005-TC-02: Đổi sang món giá cao hơn thành công, lập hóa đơn bổ sung cho phần chênh")
    void createProductExchange_HigherValue_CreatesAdditionalInvoice() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-1", "p-1"))
                .thenReturn(BigDecimal.ZERO);
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-3", "hh-1"))
                .thenReturn(Optional.of(productExpensive));
        when(productExchangeTicketRepository.findMaxTicketNumberByPrefix(eq("hh-1"), anyString()))
                .thenReturn(Optional.empty());
        when(invoiceNumberRangeService.allocateNextInvoiceNumber(eq("hh-1"), anyString(), anyString()))
                .thenReturn("0000002");

        when(eInvoiceRepository.save(any(EInvoice.class))).thenAnswer(invocation -> {
            EInvoice inv = invocation.getArgument(0);
            inv.setId("inv-additional-1");
            return inv;
        });

        when(productExchangeTicketRepository.save(any(ProductExchangeTicket.class)))
                .thenAnswer(invocation -> {
                    ProductExchangeTicket t = invocation.getArgument(0);
                    t.setId("dx-ticket-2");
                    return t;
                });

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .invoiceItemId("inv-item-1")
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-3")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .extraPaymentMethod("CASH")
                .reason("Khách nâng cấp lên can 3.5kg")
                .build();

        ProductExchangeResponse response = productExchangeService.createProductExchange(request, "nhanvien1");

        assertNotNull(response);
        assertEquals("HIGHER_VALUE", response.getExchangeType());
        assertEquals(0, new BigDecimal("20000.00").compareTo(response.getDifferenceAmount()));
        assertEquals("inv-additional-1", response.getAdditionalInvoiceId());
        assertEquals("CASH", response.getExtraPaymentMethod());

        // Kiểm tra HĐ bổ sung được lưu với số tiền đúng bằng phần chênh lệch, số HĐ từ range service, và có items
        verify(invoiceNumberRangeService).allocateNextInvoiceNumber(eq("hh-1"), anyString(), anyString());
        verify(eInvoiceRepository).save(argThat(inv ->
                inv.getFinalAmount().compareTo(new BigDecimal("20000.00")) == 0 &&
                "CASH".equals(inv.getPaymentMethod()) &&
                "0000002".equals(inv.getInvoiceNumber()) &&
                inv.getItems() != null &&
                !inv.getItems().isEmpty() &&
                "Nước giặt OMO Matic 3.5kg".equals(inv.getItems().get(0).getProductName())
        ));
    }

    @Test
    @DisplayName("NCL-11-CN-005-TC-02 (Ngoại lệ): Đổi sang món giá cao hơn nhưng không chọn phương thức bù tiền -> Lỗi EXTRA_PAYMENT_REQUIRED")
    void createProductExchange_HigherValueWithoutPaymentMethod_ThrowsException() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-1", "p-1"))
                .thenReturn(BigDecimal.ZERO);
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-3", "hh-1"))
                .thenReturn(Optional.of(productExpensive));

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .invoiceItemId("inv-item-1")
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-3")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .extraPaymentMethod(null) // Thiếu phương thức thanh toán bù
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productExchangeService.createProductExchange(request, "nhanvien1"));
        assertEquals(ErrorCode.EXTRA_PAYMENT_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-11-CN-005-TC-03: Đổi sang món giá thấp hơn -> Chặn và ném EXCHANGE_LOWER_VALUE_REDIRECT")
    void createProductExchange_LowerValue_ThrowsRedirectException() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-1", "p-1"))
                .thenReturn(BigDecimal.ZERO);
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-4", "hh-1"))
                .thenReturn(Optional.of(productCheap));

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .invoiceItemId("inv-item-1")
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-4")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productExchangeService.createProductExchange(request, "nhanvien1"));
        assertEquals(ErrorCode.EXCHANGE_LOWER_VALUE_REDIRECT, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-11-CN-005-TC-04: Hóa đơn quá thời hạn đổi trả (QTN-18) -> Ném EXCHANGE_PERIOD_EXPIRED")
    void createProductExchange_ExpiredInvoice_ThrowsException() {
        originalInvoice.setCreatedAt(LocalDateTime.now().minusDays(10)); // 10 ngày trước, quá hạn 7 ngày

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-2")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productExchangeService.createProductExchange(request, "nhanvien1"));
        assertEquals(ErrorCode.EXCHANGE_PERIOD_EXPIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-11-CN-005-TC-05: Trả vượt số lượng còn lại có thể trả (QTN-19) -> Ném EXCEEDED_EXCHANGE_RETURNABLE_QUANTITY")
    void createProductExchange_ExceededQuantity_ThrowsException() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-1", "p-1"))
                .thenReturn(new BigDecimal("1.000")); // Đã trả/đổi 1 món, trong HĐ mua 2 món -> chỉ còn 1 món

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .invoiceItemId("inv-item-1")
                        .productId("p-1")
                        .quantity(new BigDecimal("2.000")) // Yêu cầu trả 2 món -> Vượt hạn mức 1
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-2")
                        .quantity(new BigDecimal("2.000"))
                        .build()))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productExchangeService.createProductExchange(request, "nhanvien1"));
        assertEquals(ErrorCode.EXCEEDED_EXCHANGE_RETURNABLE_QUANTITY, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-11-CN-005-TC-06: Sản phẩm đổi sang không đủ tồn kho -> Ném INSUFFICIENT_STOCK_FOR_EXCHANGE")
    void createProductExchange_InsufficientStock_ThrowsException() {
        product2.setStockQuantity(new BigDecimal("0.500")); // Tồn kho chỉ còn 0.5

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-2", "hh-1"))
                .thenReturn(Optional.of(product2));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-1", "p-1"))
                .thenReturn(BigDecimal.ZERO);

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder()
                        .invoiceItemId("inv-item-1")
                        .productId("p-1")
                        .quantity(new BigDecimal("1.000"))
                        .build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder()
                        .productId("p-2")
                        .quantity(new BigDecimal("1.000")) // Muốn đổi 1 nhưng tồn chỉ có 0.5
                        .build()))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productExchangeService.createProductExchange(request, "nhanvien1"));
        assertEquals(ErrorCode.INSUFFICIENT_STOCK_FOR_EXCHANGE, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-11-CN-005-TC-07: Người dùng không có quyền (VT-06) -> Ném UNAUTHORIZED_RETURN_ACTION")
    void createProductExchange_UnauthorizedRole_ThrowsException() {
        User customerUser = User.builder()
                .id("u-cust")
                .username("khachhang")
                .role(customerRole)
                .household(household)
                .build();

        when(userRepository.findByUsername("khachhang")).thenReturn(Optional.of(customerUser));

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(ExchangeReturnItemRequest.builder().productId("p-1").quantity(BigDecimal.ONE).build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder().productId("p-2").quantity(BigDecimal.ONE).build()))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productExchangeService.createProductExchange(request, "khachhang"));
        assertEquals(ErrorCode.UNAUTHORIZED_RETURN_ACTION, ex.getErrorCode());
    }

    @Test
    @DisplayName("P1-3 (QTN-19): Trùng lặp sản phẩm trong danh sách trả -> Ném DUPLICATE_EXCHANGE_ITEM")
    void createProductExchange_DuplicateReturnItem_ThrowsException() {
        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "hh-1"))
                .thenReturn(Optional.of(originalInvoice));

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-1")
                .returnItems(List.of(
                        ExchangeReturnItemRequest.builder().productId("p-1").quantity(BigDecimal.ONE).build(),
                        ExchangeReturnItemRequest.builder().productId("p-1").quantity(BigDecimal.ONE).build()
                ))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder().productId("p-2").quantity(BigDecimal.ONE).build()))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productExchangeService.createProductExchange(request, "nhanvien1"));
        assertEquals(ErrorCode.DUPLICATE_EXCHANGE_ITEM, ex.getErrorCode());
    }

    @Test
    @DisplayName("P2-2 (NCL-09-CN-008): Thời hạn đổi trả động từ BusinessHouseholdSettings (14 ngày thay vì 7 ngày)")
    void createProductExchange_DynamicReturnDaysLimit_AllowsExtendedPeriod() {
        // Hóa đơn tạo cách đây 10 ngày (vượt quá 7 ngày mặc định, nhưng nằm trong hạn 14 ngày)
        EInvoice oldInvoice = EInvoice.builder()
                .id("inv-old")
                .household(household)
                .invoiceNumber("0000100")
                .status("ISSUED")
                .createdAt(LocalDateTime.now().minusDays(10))
                .items(new ArrayList<>(List.of(invoiceItem1)))
                .build();

        BusinessHouseholdSettings settings = BusinessHouseholdSettings.builder()
                .household(household)
                .returnDaysLimit(14)
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(settings));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-old", "hh-1"))
                .thenReturn(Optional.of(oldInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-old"), anyList()))
                .thenReturn(Collections.emptyList());
        when(productExchangeItemRepository.sumReturnedQuantityByInvoiceAndProduct("inv-old", "p-1"))
                .thenReturn(BigDecimal.ZERO);
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-1", "hh-1"))
                .thenReturn(Optional.of(product1));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("p-2", "hh-1"))
                .thenReturn(Optional.of(product2));
        when(productExchangeTicketRepository.findMaxTicketNumberByPrefix(eq("hh-1"), anyString()))
                .thenReturn(Optional.empty());
        when(productExchangeTicketRepository.save(any(ProductExchangeTicket.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-old")
                .returnItems(List.of(ExchangeReturnItemRequest.builder().productId("p-1").quantity(BigDecimal.ONE).build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder().productId("p-2").quantity(BigDecimal.ONE).build()))
                .build();

        ProductExchangeResponse response = productExchangeService.createProductExchange(request, "nhanvien1");
        assertNotNull(response);
        assertEquals("EQUAL_VALUE", response.getExchangeType());
    }

    @Test
    @DisplayName("P2-2 (NCL-09-CN-008): Vượt quá thời hạn đổi trả động (15 ngày > 14 ngày) -> Ném EXCHANGE_PERIOD_EXPIRED")
    void createProductExchange_DynamicReturnDaysLimit_ExpiredThrowsException() {
        EInvoice expiredInvoice = EInvoice.builder()
                .id("inv-expired")
                .household(household)
                .invoiceNumber("0000099")
                .status("ISSUED")
                .createdAt(LocalDateTime.now().minusDays(15))
                .items(new ArrayList<>(List.of(invoiceItem1)))
                .build();

        BusinessHouseholdSettings settings = BusinessHouseholdSettings.builder()
                .household(household)
                .returnDaysLimit(14)
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffUser));
        when(settingsRepository.findByHouseholdId("hh-1")).thenReturn(Optional.of(settings));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-expired", "hh-1"))
                .thenReturn(Optional.of(expiredInvoice));

        CreateProductExchangeRequest request = CreateProductExchangeRequest.builder()
                .originalInvoiceId("inv-expired")
                .returnItems(List.of(ExchangeReturnItemRequest.builder().productId("p-1").quantity(BigDecimal.ONE).build()))
                .exchangeItems(List.of(ExchangeNewItemRequest.builder().productId("p-2").quantity(BigDecimal.ONE).build()))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                productExchangeService.createProductExchange(request, "nhanvien1"));
        assertEquals(ErrorCode.EXCHANGE_PERIOD_EXPIRED, ex.getErrorCode());
    }
}
