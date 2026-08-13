package com.sales.service;

import com.sales.dto.request.CreateReturnTicketItemRequest;
import com.sales.dto.request.CreateReturnTicketRequest;
import com.sales.dto.response.*;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.ReturnTicketServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReturnTicketServiceImplTest {

    @Mock
    private ReturnTicketRepository returnTicketRepository;

    @Mock
    private ReturnTicketItemRepository returnTicketItemRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private CustomerDebtRepository customerDebtRepository;

    @Mock
    private InvoiceStatusLogRepository invoiceStatusLogRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @InjectMocks
    private ReturnTicketServiceImpl returnTicketService;


    private User ownerUser;
    private User customerUser;
    private BusinessHousehold household;
    private EInvoice issuedInvoice;
    private Product product;
    private EInvoiceItem invoiceItem;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("house-1")
                .name("Hộ kinh doanh Tạp Hóa Việt")
                .taxCode("0123456789")
                .build();

        Role ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        Role customerRole = Role.builder().id(6).code("VT-06").name("Khách hàng").build();

        ownerUser = User.builder()
                .id("user-1")
                .username("chuho_viet")
                .fullName("Nguyễn Văn A")
                .role(ownerRole)
                .household(household)
                .build();

        customerUser = User.builder()
                .id("user-2")
                .username("khachhang")
                .fullName("Nguyễn Thị Lan")
                .role(customerRole)
                .household(household)
                .build();

        product = Product.builder()
                .id("prod-1")
                .name("Nước ngọt Coca-Cola 320ml")
                .unit("Lon")
                .price(new BigDecimal("10000.00"))
                .household(household)
                .build();

        invoiceItem = EInvoiceItem.builder()
                .id("item-1")
                .product(product)
                .productName(product.getName())
                .unit(product.getUnit())
                .quantity(new BigDecimal("5.000"))
                .unitPrice(product.getPrice())
                .taxRatePercentage(new BigDecimal("10.00"))
                .taxAmount(new BigDecimal("5000.00"))
                .subtotal(new BigDecimal("55000.00"))
                .build();

        List<EInvoiceItem> items = new ArrayList<>();
        items.add(invoiceItem);

        issuedInvoice = EInvoice.builder()
                .id("inv-1")
                .household(household)
                .invoiceNumber("00000123")
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .createdByUser(ownerUser)
                .status("ISSUED")
                .totalAmountBeforeTax(new BigDecimal("50000.00"))
                .taxAmount(new BigDecimal("5000.00"))
                .finalAmount(new BigDecimal("55000.00"))
                .lookupCode("LOOKUP123")
                .createdAt(LocalDateTime.now().minusDays(2))
                .items(items)
                .build();
    }

    @Test
    @DisplayName("Check Invoice Returnable - Thành công")
    void testCheckInvoiceReturnable_Success() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "house-1"))
                .thenReturn(Optional.of(issuedInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());

        InvoiceReturnableCheckResponse response = returnTicketService.checkInvoiceReturnable("inv-1", "chuho_viet");

        assertNotNull(response);
        assertTrue(response.isEligibleForReturn());
        assertFalse(response.isExpired());
        assertEquals("inv-1", response.getInvoiceId());
        assertEquals(1, response.getItems().size());
        assertEquals(new BigDecimal("5.000"), response.getItems().get(0).getReturnableQuantity());
    }

    @Test
    @DisplayName("Create Return Ticket - Thành công")
    void testCreateReturnTicket_Success() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "house-1"))
                .thenReturn(Optional.of(issuedInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());
        when(returnTicketRepository.findMaxTicketNumberByPrefix(eq("house-1"), anyString()))
                .thenReturn(Optional.empty());

        ReturnTicket savedTicket = ReturnTicket.builder()
                .id("ticket-1")
                .ticketNumber("PTH-20260811-0001")
                .household(household)
                .originalInvoice(issuedInvoice)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("22000.00"))
                .items(Collections.emptyList())
                .build();

        when(returnTicketRepository.save(any(ReturnTicket.class))).thenReturn(savedTicket);

        CreateReturnTicketRequest request = CreateReturnTicketRequest.builder()
                .originalInvoiceId("inv-1")
                .reason("Khách đổi trả 2 lon")
                .refundPaymentMethod("CASH")
                .items(List.of(
                        CreateReturnTicketItemRequest.builder()
                                .productId("prod-1")
                                .quantity(new BigDecimal("2.000"))
                                .build()
                ))
                .build();

        ReturnTicketResponse response = returnTicketService.createReturnTicket(request, "chuho_viet");

        assertNotNull(response);
        assertEquals("PTH-20260811-0001", response.getTicketNumber());
        assertEquals("PENDING", response.getStatus());
        verify(returnTicketRepository, times(1)).save(any(ReturnTicket.class));
    }

    @Test
    @DisplayName("Create Return Ticket - Thất bại khi số lượng trả vượt quá số lượng mua")
    void testCreateReturnTicket_ExceedQuantity_ThrowsException() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "house-1"))
                .thenReturn(Optional.of(issuedInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());

        CreateReturnTicketRequest request = CreateReturnTicketRequest.builder()
                .originalInvoiceId("inv-1")
                .reason("Trả 10 lon (chỉ mua 5)")
                .refundPaymentMethod("CASH")
                .items(List.of(
                        CreateReturnTicketItemRequest.builder()
                                .productId("prod-1")
                                .quantity(new BigDecimal("10.000"))
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.createReturnTicket(request, "chuho_viet")
        );

        assertEquals(ErrorCode.EXCEEDED_RETURNABLE_QUANTITY, ex.getErrorCode());
    }

    @Test
    @DisplayName("Create Return Ticket - Thất bại khi người dùng là Khách hàng (VT-06)")
    void testCreateReturnTicket_CustomerRole_ThrowsException() {
        when(userRepository.findByUsername("khachhang")).thenReturn(Optional.of(customerUser));

        CreateReturnTicketRequest request = CreateReturnTicketRequest.builder()
                .originalInvoiceId("inv-1")
                .items(List.of(
                        CreateReturnTicketItemRequest.builder()
                                .productId("prod-1")
                                .quantity(new BigDecimal("1.000"))
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.createReturnTicket(request, "khachhang")
        );

        assertEquals(ErrorCode.UNAUTHORIZED_RETURN_ACTION, ex.getErrorCode());
    }

    @Test
    @DisplayName("Create Return Ticket - Thành công cho sản phẩm tự nhập (product = null)")
    void testCreateReturnTicket_CustomProduct_Success() {
        EInvoiceItem customItem = EInvoiceItem.builder()
                .id("item-custom-1")
                .product(null)
                .productName("Sản phẩm tự nhập không có trong danh mục")
                .unit("Cái")
                .quantity(new BigDecimal("2.000"))
                .unitPrice(new BigDecimal("50000.00"))
                .taxRatePercentage(new BigDecimal("10.00"))
                .taxAmount(new BigDecimal("10000.00"))
                .subtotal(new BigDecimal("110000.00"))
                .build();

        EInvoice customInvoice = EInvoice.builder()
                .id("inv-custom")
                .household(household)
                .invoiceNumber("00000999")
                .createdByUser(ownerUser)
                .status("ISSUED")
                .createdAt(LocalDateTime.now().minusDays(1))
                .items(List.of(customItem))
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-custom", "house-1"))
                .thenReturn(Optional.of(customInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-custom"), anyList()))
                .thenReturn(Collections.emptyList());
        when(returnTicketRepository.findMaxTicketNumberByPrefix(eq("house-1"), anyString()))
                .thenReturn(Optional.empty());

        ReturnTicket savedTicket = ReturnTicket.builder()
                .id("ticket-custom")
                .ticketNumber("PTH-20260811-0002")
                .household(household)
                .originalInvoice(customInvoice)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("55000.00"))
                .items(Collections.emptyList())
                .build();

        when(returnTicketRepository.save(any(ReturnTicket.class))).thenReturn(savedTicket);

        CreateReturnTicketRequest request = CreateReturnTicketRequest.builder()
                .originalInvoiceId("inv-custom")
                .reason("Trả 1 cái sản phẩm tự nhập")
                .refundPaymentMethod("CASH")
                .items(List.of(
                        CreateReturnTicketItemRequest.builder()
                                .invoiceItemId("item-custom-1")
                                .productName("Sản phẩm tự nhập không có trong danh mục")
                                .quantity(new BigDecimal("1.000"))
                                .build()
                ))
                .build();

        ReturnTicketResponse response = returnTicketService.createReturnTicket(request, "chuho_viet");

        assertNotNull(response);
        assertEquals("PTH-20260811-0002", response.getTicketNumber());
        verify(returnTicketRepository, times(1)).save(any(ReturnTicket.class));
    }

    @Test
    @DisplayName("Create Return Ticket - Tính toán chính xác chiết khấu phân bổ")
    void testCreateReturnTicket_ProratedDiscount_Success() {
        // Mua 5 sản phẩm đơn giá 10.000, chiết khấu 5.000, thuế 10%
        EInvoiceItem discountedItem = EInvoiceItem.builder()
                .id("item-disc-1")
                .product(product)
                .productName(product.getName())
                .unit(product.getUnit())
                .quantity(new BigDecimal("5.000"))
                .unitPrice(new BigDecimal("10000.00"))
                .discountAmount(new BigDecimal("5000.00"))
                .taxRatePercentage(new BigDecimal("10.00"))
                .taxAmount(new BigDecimal("4500.00"))
                .subtotal(new BigDecimal("49500.00"))
                .build();

        EInvoice discInvoice = EInvoice.builder()
                .id("inv-disc")
                .household(household)
                .invoiceNumber("00000888")
                .createdByUser(ownerUser)
                .status("ISSUED")
                .createdAt(LocalDateTime.now().minusDays(1))
                .items(List.of(discountedItem))
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-disc", "house-1"))
                .thenReturn(Optional.of(discInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-disc"), anyList()))
                .thenReturn(Collections.emptyList());

        CreateReturnTicketRequest request = CreateReturnTicketRequest.builder()
                .originalInvoiceId("inv-disc")
                .reason("Trả 2 cái có chiết khấu")
                .items(List.of(
                        CreateReturnTicketItemRequest.builder()
                                .invoiceItemId("item-disc-1")
                                .productId("prod-1")
                                .quantity(new BigDecimal("2.000"))
                                .build()
                ))
                .build();

        ReturnTicket savedTicket = ReturnTicket.builder()
                .id("ticket-disc")
                .ticketNumber("PTH-20260811-0003")
                .household(household)
                .originalInvoice(discInvoice)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("19800.00"))
                .items(Collections.emptyList())
                .build();

        when(returnTicketRepository.save(argThat(t -> {
            // Kiểm tra tổng tiền trả lại phải được trừ chiết khấu: (20000 - 2000) * 1.10 = 19800.00
            return t.getTotalReturnAmount().compareTo(new BigDecimal("19800.00")) == 0;
        }))).thenReturn(savedTicket);

        ReturnTicketResponse response = returnTicketService.createReturnTicket(request, "chuho_viet");
        assertNotNull(response);
        verify(returnTicketRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Create Return Ticket - Hóa đơn có nhiều dòng trùng sản phẩm, tính theo invoiceItemId")
    void testCreateReturnTicket_MultipleLinesSameProduct_Success() {
        EInvoiceItem line1 = EInvoiceItem.builder()
                .id("item-line-1")
                .product(product)
                .productName(product.getName())
                .unit(product.getUnit())
                .quantity(new BigDecimal("5.000"))
                .unitPrice(new BigDecimal("10000.00"))
                .taxRatePercentage(BigDecimal.ZERO)
                .subtotal(new BigDecimal("50000.00"))
                .build();

        EInvoiceItem line2 = EInvoiceItem.builder()
                .id("item-line-2")
                .product(product)
                .productName(product.getName())
                .unit(product.getUnit())
                .quantity(new BigDecimal("3.000"))
                .unitPrice(new BigDecimal("8000.00"))
                .taxRatePercentage(BigDecimal.ZERO)
                .subtotal(new BigDecimal("24000.00"))
                .build();

        EInvoice multiLineInvoice = EInvoice.builder()
                .id("inv-multi")
                .household(household)
                .invoiceNumber("00000777")
                .createdByUser(ownerUser)
                .status("ISSUED")
                .createdAt(LocalDateTime.now().minusDays(1))
                .items(List.of(line1, line2))
                .build();

        // Giả lập đã có 1 phiếu trả cho line1 (trả 2 cái)
        ReturnTicketItem existingItem = ReturnTicketItem.builder()
                .id("ret-item-1")
                .invoiceItemId("item-line-1")
                .product(product)
                .quantity(new BigDecimal("2.000"))
                .build();

        ReturnedQuantityProjection existingProj = mock(ReturnedQuantityProjection.class);
        when(existingProj.getInvoiceItemId()).thenReturn("item-line-1");
        when(existingProj.getTotalReturned()).thenReturn(new BigDecimal("2.000"));

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-multi", "house-1"))
                .thenReturn(Optional.of(multiLineInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-multi"), anyList()))
                .thenReturn(List.of(existingProj));
        when(returnTicketRepository.findMaxTicketNumberByPrefix(eq("house-1"), anyString()))
                .thenReturn(Optional.empty());

        ReturnTicket savedTicket = ReturnTicket.builder()
                .id("ticket-multi")
                .ticketNumber("PTH-20260811-0004")
                .household(household)
                .originalInvoice(multiLineInvoice)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("24000.00"))
                .items(Collections.emptyList())
                .build();

        when(returnTicketRepository.save(any())).thenReturn(savedTicket);

        // Lập phiếu mới trả full 3 cái cho line2 (dòng 2 chưa trả cái nào)
        CreateReturnTicketRequest request = CreateReturnTicketRequest.builder()
                .originalInvoiceId("inv-multi")
                .reason("Trả hàng dòng 2 giá khuyến mãi")
                .items(List.of(
                        CreateReturnTicketItemRequest.builder()
                                .invoiceItemId("item-line-2")
                                .quantity(new BigDecimal("3.000"))
                                .build()
                ))
                .build();

        ReturnTicketResponse response = returnTicketService.createReturnTicket(request, "chuho_viet");
        assertNotNull(response);
        verify(returnTicketRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Create Return Ticket - QTN-18: Quá hạn 7 ngày, Chủ hộ tạo nhưng không bật allowOverdueOverride -> Thất bại")
    void testCreateReturnTicket_Overdue_WithoutOverride_ThrowsException() {
        EInvoice expiredInvoice = EInvoice.builder()
                .id("inv-expired")
                .household(household)
                .invoiceNumber("00000666")
                .createdByUser(ownerUser)
                .status("ISSUED")
                .createdAt(LocalDateTime.now().minusDays(10)) // Quá 7 ngày
                .items(List.of(invoiceItem))
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-expired", "house-1"))
                .thenReturn(Optional.of(expiredInvoice));

        CreateReturnTicketRequest request = CreateReturnTicketRequest.builder()
                .originalInvoiceId("inv-expired")
                .allowOverdueOverride(false)
                .items(List.of(
                        CreateReturnTicketItemRequest.builder()
                                .productId("prod-1")
                                .quantity(new BigDecimal("1.000"))
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.createReturnTicket(request, "chuho_viet")
        );

        assertEquals(ErrorCode.RETURN_PERIOD_EXPIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Create Return Ticket - QTN-18: Quá hạn 7 ngày, Chủ hộ tạo và bật allowOverdueOverride = true -> Thành công")
    void testCreateReturnTicket_Overdue_WithOwnerOverride_Success() {
        EInvoice expiredInvoice = EInvoice.builder()
                .id("inv-expired")
                .household(household)
                .invoiceNumber("00000666")
                .createdByUser(ownerUser)
                .status("ISSUED")
                .createdAt(LocalDateTime.now().minusDays(10)) // Quá 7 ngày
                .items(List.of(invoiceItem))
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-expired", "house-1"))
                .thenReturn(Optional.of(expiredInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-expired"), anyList()))
                .thenReturn(Collections.emptyList());
        when(returnTicketRepository.findMaxTicketNumberByPrefix(eq("house-1"), anyString()))
                .thenReturn(Optional.empty());

        ReturnTicket savedTicket = ReturnTicket.builder()
                .id("ticket-overdue")
                .ticketNumber("PTH-20260811-0005")
                .household(household)
                .originalInvoice(expiredInvoice)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("11000.00"))
                .items(Collections.emptyList())
                .build();

        when(returnTicketRepository.save(any())).thenReturn(savedTicket);

        CreateReturnTicketRequest request = CreateReturnTicketRequest.builder()
                .originalInvoiceId("inv-expired")
                .allowOverdueOverride(true)
                .items(List.of(
                        CreateReturnTicketItemRequest.builder()
                                .productId("prod-1")
                                .quantity(new BigDecimal("1.000"))
                                .build()
                ))
                .build();

        ReturnTicketResponse response = returnTicketService.createReturnTicket(request, "chuho_viet");
        assertNotNull(response);
        verify(returnTicketRepository, times(1)).save(any());
    }

    @Test
    @DisplayName("Get Return Tickets - Lấy danh sách phân trang thành công")
    void testGetReturnTickets_Success() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));

        ReturnTicket ticket1 = ReturnTicket.builder()
                .id("ticket-1")
                .ticketNumber("PTH-20260811-0001")
                .household(household)
                .originalInvoice(issuedInvoice)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("22000.00"))
                .items(Collections.emptyList())
                .createdAt(LocalDateTime.now())
                .build();

        org.springframework.data.domain.Page<ReturnTicket> page = new org.springframework.data.domain.PageImpl<>(
                List.of(ticket1),
                org.springframework.data.domain.PageRequest.of(0, 10),
                1
        );

        when(returnTicketRepository.findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        var response = returnTicketService.getReturnTickets(
                "chuho_viet", "PENDING", null, null, null, 0, 10
        );

        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getContent().size());
        assertEquals("PTH-20260811-0001", response.getContent().get(0).getTicketNumber());
    }

    @Test
    @DisplayName("Check Invoice Returnable - Tích lũy đúng khi có nhiều projection trùng sản phẩm (P1 Fix)")
    void testCheckInvoiceReturnable_AccumulatesMultipleProjections() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "house-1"))
                .thenReturn(Optional.of(issuedInvoice));

        ReturnedQuantityProjection proj1 = mock(ReturnedQuantityProjection.class);
        when(proj1.getInvoiceItemId()).thenReturn(null);
        when(proj1.getProductId()).thenReturn("prod-1");
        when(proj1.getTotalReturned()).thenReturn(new BigDecimal("2.000"));

        ReturnedQuantityProjection proj2 = mock(ReturnedQuantityProjection.class);
        when(proj2.getInvoiceItemId()).thenReturn(null);
        when(proj2.getProductId()).thenReturn("prod-1");
        when(proj2.getTotalReturned()).thenReturn(new BigDecimal("1.500"));

        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(List.of(proj1, proj2));

        InvoiceReturnableCheckResponse response = returnTicketService.checkInvoiceReturnable("inv-1", "chuho_viet");

        assertNotNull(response);
        assertEquals(1, response.getItems().size());
        // Invoice quantity = 5.000, already returned sum = 2.000 + 1.500 = 3.500 => returnable = 1.500
        assertEquals(new BigDecimal("1.500"), response.getItems().get(0).getReturnableQuantity());
    }

    @Test
    @DisplayName("Approve Return Ticket - Thành công cho Chủ hộ, hoàn tồn kho chính xác")
    void testApproveReturnTicket_Success() {
        product.setStockQuantity(new BigDecimal("10.000"));

        ReturnTicketItem ticketItem = ReturnTicketItem.builder()
                .id("t-item-1")
                .product(product)
                .productName(product.getName())
                .unit(product.getUnit())
                .quantity(new BigDecimal("2.000"))
                .unitPrice(product.getPrice())
                .subtotal(new BigDecimal("20000.00"))
                .build();

        ReturnTicket ticket = ReturnTicket.builder()
                .id("ticket-1")
                .ticketNumber("PTH-20260812-0001")
                .household(household)
                .originalInvoice(issuedInvoice)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("20000.00"))
                .refundPaymentMethod("CASH")
                .items(List.of(ticketItem))
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(returnTicketRepository.findByIdAndHouseholdId("ticket-1", "house-1")).thenReturn(Optional.of(ticket));
        when(returnTicketRepository.save(any(ReturnTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnTicketResponse response = returnTicketService.approveReturnTicket("ticket-1", "chuho_viet");

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        assertEquals("user-1", response.getApprovedByUserId());
        assertNotNull(response.getApprovedAt());
        verify(productRepository, times(1)).addStock(eq("prod-1"), eq("house-1"), eq(new BigDecimal("2.000")));
        verify(returnTicketRepository, times(1)).save(ticket);
    }

    @Test
    @DisplayName("Approve Return Ticket - Thất bại khi người thao tác là Nhân viên (VT-02)")
    void testApproveReturnTicket_StaffUser_ThrowsException() {
        Role staffRole = Role.builder().id(2).code("VT-02").name("Nhân viên").build();
        User staffUser = User.builder()
                .id("user-3")
                .username("nhanvien_viet")
                .role(staffRole)
                .household(household)
                .build();

        when(userRepository.findByUsername("nhanvien_viet")).thenReturn(Optional.of(staffUser));

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.approveReturnTicket("ticket-1", "nhanvien_viet")
        );

        assertEquals(ErrorCode.UNAUTHORIZED_RETURN_ACTION, ex.getErrorCode());
        verify(returnTicketRepository, never()).save(any());
    }

    @Test
    @DisplayName("Approve Return Ticket - Thất bại khi phiếu đã được duyệt trước đó")
    void testApproveReturnTicket_AlreadyProcessed_ThrowsException() {
        ReturnTicket ticket = ReturnTicket.builder()
                .id("ticket-1")
                .ticketNumber("PTH-20260812-0001")
                .household(household)
                .originalInvoice(issuedInvoice)
                .createdByUser(ownerUser)
                .status("APPROVED")
                .totalReturnAmount(new BigDecimal("20000.00"))
                .items(Collections.emptyList())
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(returnTicketRepository.findByIdAndHouseholdId("ticket-1", "house-1")).thenReturn(Optional.of(ticket));

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.approveReturnTicket("ticket-1", "chuho_viet")
        );

        assertEquals(ErrorCode.RETURN_TICKET_ALREADY_PROCESSED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Approve Return Ticket - Thành công giảm trừ công nợ khách hàng khi refundPaymentMethod = DEBT_REDUCTION")
    void testApproveReturnTicket_DebtReduction_Success() {
        Customer customer = Customer.builder()
                .id("cust-1")
                .household(household)
                .name("Nguyễn Thị Lan")
                .phoneNumber("0988888888")
                .currentDebt(new BigDecimal("100000.00"))
                .build();

        ReturnTicket ticket = ReturnTicket.builder()
                .id("ticket-debt")
                .ticketNumber("PTH-20260812-0002")
                .household(household)
                .originalInvoice(issuedInvoice)
                .customer(customer)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("30000.00"))
                .refundPaymentMethod("DEBT_REDUCTION")
                .items(Collections.emptyList())
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(returnTicketRepository.findByIdAndHouseholdId("ticket-debt", "house-1")).thenReturn(Optional.of(ticket));
        when(returnTicketRepository.save(any(ReturnTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnTicketResponse response = returnTicketService.approveReturnTicket("ticket-debt", "chuho_viet");

        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        verify(customerRepository, times(1)).save(argThat(c -> c.getCurrentDebt().compareTo(new BigDecimal("70000.00")) == 0));
        verify(customerDebtRepository, times(1)).save(any(CustomerDebt.class));
    }

    @Test
    @DisplayName("Reject Return Ticket - Thành công ghi lý do từ chối, giữ nguyên tồn kho")
    void testRejectReturnTicket_Success() {
        ReturnTicket ticket = ReturnTicket.builder()
                .id("ticket-1")
                .ticketNumber("PTH-20260812-0001")
                .household(household)
                .originalInvoice(issuedInvoice)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("20000.00"))
                .items(Collections.emptyList())
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(returnTicketRepository.findByIdAndHouseholdId("ticket-1", "house-1")).thenReturn(Optional.of(ticket));
        when(returnTicketRepository.save(any(ReturnTicket.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var rejectReq = com.sales.dto.request.RejectReturnTicketRequest.builder()
                .rejectReason("Hàng bị hư hỏng do lỗi người dùng")
                .build();

        ReturnTicketResponse response = returnTicketService.rejectReturnTicket("ticket-1", rejectReq, "chuho_viet");

        assertNotNull(response);
        assertEquals("REJECTED", response.getStatus());
        assertEquals("Hàng bị hư hỏng do lỗi người dùng", response.getRejectReason());
        assertNotNull(response.getRejectedAt());
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Reject Return Ticket - Thất bại khi lý do rỗng")
    void testRejectReturnTicket_EmptyReason_ThrowsException() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));

        var rejectReq = com.sales.dto.request.RejectReturnTicketRequest.builder()
                .rejectReason("   ")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.rejectReturnTicket("ticket-1", rejectReq, "chuho_viet")
        );

        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    @DisplayName("Create Decrease Adjustment Invoice (NCL-11-CN-003) - Thành công phát hành Hóa đơn điều chỉnh giảm")
    void testCreateDecreaseAdjustmentInvoice_Success() {
        ReturnTicketItem ticketItem = ReturnTicketItem.builder()
                .id("t-item-1")
                .product(product)
                .productName(product.getName())
                .unit(product.getUnit())
                .quantity(new BigDecimal("2.000"))
                .unitPrice(product.getPrice())
                .taxRatePercentage(new BigDecimal("8.00"))
                .taxAmount(new BigDecimal("1600.00"))
                .subtotal(new BigDecimal("21600.00"))
                .build();

        ReturnTicket ticket = ReturnTicket.builder()
                .id("ticket-1")
                .ticketNumber("PTH-20260812-0001")
                .household(household)
                .originalInvoice(issuedInvoice)
                .createdByUser(ownerUser)
                .status("APPROVED")
                .totalReturnAmount(new BigDecimal("21600.00"))
                .items(List.of(ticketItem))
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(returnTicketRepository.findByIdAndHouseholdId("ticket-1", "house-1")).thenReturn(Optional.of(ticket));
        when(eInvoiceRepository.existsByReturnTicketIdAndDeletedAtIsNull("ticket-1")).thenReturn(false);
        when(eInvoiceRepository.save(any(EInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnTicketResponse response = returnTicketService.createDecreaseAdjustmentInvoice("ticket-1", "chuho_viet");

        assertNotNull(response);
        verify(eInvoiceRepository, times(1)).save(argThat(inv ->
                "HÓA ĐƠN ĐIỀU CHỈNH GIẢM".equals(inv.getTitle()) &&
                "ISSUED".equals(inv.getStatus()) &&
                ticket.getId().equals(inv.getReturnTicket().getId())
        ));
        verify(eInvoiceRepository, times(1)).save(argThat(inv ->
                "ADJUSTED".equals(inv.getStatus()) && "inv-1".equals(inv.getId())
        ));
        verify(invoiceStatusLogRepository, times(2)).save(any(InvoiceStatusLog.class));
    }

    @Test
    @DisplayName("Create Decrease Adjustment Invoice (NCL-11-CN-003) - Thất bại khi phiếu trả hàng chưa được duyệt (status != APPROVED)")
    void testCreateDecreaseAdjustmentInvoice_TicketNotApproved_ThrowsException() {
        ReturnTicket ticket = ReturnTicket.builder()
                .id("ticket-1")
                .ticketNumber("PTH-20260812-0001")
                .household(household)
                .originalInvoice(issuedInvoice)
                .createdByUser(ownerUser)
                .status("PENDING")
                .totalReturnAmount(new BigDecimal("21600.00"))
                .items(Collections.emptyList())
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(returnTicketRepository.findByIdAndHouseholdId("ticket-1", "house-1")).thenReturn(Optional.of(ticket));

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.createDecreaseAdjustmentInvoice("ticket-1", "chuho_viet")
        );

        assertEquals(ErrorCode.RETURN_TICKET_NOT_APPROVED, ex.getErrorCode());
        verify(eInvoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create Decrease Adjustment Invoice (NCL-11-CN-003) - Thất bại khi đã tồn tại hóa đơn điều chỉnh giảm")
    void testCreateDecreaseAdjustmentInvoice_AlreadyExists_ThrowsException() {
        ReturnTicket ticket = ReturnTicket.builder()
                .id("ticket-1")
                .ticketNumber("PTH-20260812-0001")
                .household(household)
                .originalInvoice(issuedInvoice)
                .createdByUser(ownerUser)
                .status("APPROVED")
                .totalReturnAmount(new BigDecimal("21600.00"))
                .items(Collections.emptyList())
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(returnTicketRepository.findByIdAndHouseholdId("ticket-1", "house-1")).thenReturn(Optional.of(ticket));
        when(eInvoiceRepository.existsByReturnTicketIdAndDeletedAtIsNull("ticket-1")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.createDecreaseAdjustmentInvoice("ticket-1", "chuho_viet")
        );

        assertEquals(ErrorCode.ADJUSTMENT_INVOICE_ALREADY_EXISTS, ex.getErrorCode());
        verify(eInvoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create Decrease Adjustment Invoice (NCL-11-CN-003) - Thất bại khi hóa đơn gốc không ở trạng thái ISSUED")
    void testCreateDecreaseAdjustmentInvoice_OriginalInvoiceNotIssued_ThrowsException() {
        EInvoice canceledInvoice = EInvoice.builder()
                .id("inv-canceled")
                .household(household)
                .status("CANCELED")
                .build();

        ReturnTicket ticket = ReturnTicket.builder()
                .id("ticket-1")
                .ticketNumber("PTH-20260812-0001")
                .household(household)
                .originalInvoice(canceledInvoice)
                .createdByUser(ownerUser)
                .status("APPROVED")
                .totalReturnAmount(new BigDecimal("21600.00"))
                .items(Collections.emptyList())
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(returnTicketRepository.findByIdAndHouseholdId("ticket-1", "house-1")).thenReturn(Optional.of(ticket));
        when(eInvoiceRepository.existsByReturnTicketIdAndDeletedAtIsNull("ticket-1")).thenReturn(false);

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.createDecreaseAdjustmentInvoice("ticket-1", "chuho_viet")
        );

        assertEquals(ErrorCode.INVOICE_NOT_ISSUED, ex.getErrorCode());
        verify(eInvoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create Decrease Adjustment Invoice (NCL-11-CN-003) - Thất bại khi người thao tác là Nhân viên bán hàng (VT-02)")
    void testCreateDecreaseAdjustmentInvoice_SellerUser_ThrowsException() {
        Role sellerRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        User sellerUser = User.builder()
                .id("user-3")
                .username("nhanvien_banhang")
                .role(sellerRole)
                .household(household)
                .build();

        when(userRepository.findByUsername("nhanvien_banhang")).thenReturn(Optional.of(sellerUser));

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.createDecreaseAdjustmentInvoice("ticket-1", "nhanvien_banhang")
        );

        assertEquals(ErrorCode.UNAUTHORIZED_RETURN_ACTION, ex.getErrorCode());
        verify(returnTicketRepository, never()).save(any());
    }

    @Test
    @DisplayName("Approve Return Ticket - Thất bại khi người thao tác là Kế toán (VT-03)")
    void testApproveReturnTicket_AccountantUser_ThrowsException() {
        Role accountantRole = Role.builder().id(3).code("VT-03").name("Kế toán").build();
        User accountantUser = User.builder()
                .id("user-4")
                .username("ketoan_viet")
                .role(accountantRole)
                .household(household)
                .build();

        when(userRepository.findByUsername("ketoan_viet")).thenReturn(Optional.of(accountantUser));

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.approveReturnTicket("ticket-1", "ketoan_viet")
        );

        assertEquals(ErrorCode.UNAUTHORIZED_RETURN_ACTION, ex.getErrorCode());
        verify(returnTicketRepository, never()).save(any());
    }

    @Test
    @DisplayName("Reject Return Ticket - Thất bại khi người thao tác là Kế toán (VT-03)")
    void testRejectReturnTicket_AccountantUser_ThrowsException() {
        Role accountantRole = Role.builder().id(3).code("VT-03").name("Kế toán").build();
        User accountantUser = User.builder()
                .id("user-4")
                .username("ketoan_viet")
                .role(accountantRole)
                .household(household)
                .build();

        when(userRepository.findByUsername("ketoan_viet")).thenReturn(Optional.of(accountantUser));

        var rejectReq = com.sales.dto.request.RejectReturnTicketRequest.builder()
                .rejectReason("Từ chối bởi kế toán")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.rejectReturnTicket("ticket-1", rejectReq, "ketoan_viet")
        );

        assertEquals(ErrorCode.UNAUTHORIZED_RETURN_ACTION, ex.getErrorCode());
        verify(returnTicketRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create Return Ticket - Thất bại khi chọn DEBT_REDUCTION cho đơn khách lẻ (không có khách hàng)")
    void testCreateReturnTicket_DebtReduction_NoCustomer_ThrowsException() {
        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(eInvoiceRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("inv-1", "house-1"))
                .thenReturn(Optional.of(issuedInvoice));
        when(returnTicketItemRepository.findReturnedQuantitiesByInvoiceId(eq("inv-1"), anyList()))
                .thenReturn(Collections.emptyList());

        CreateReturnTicketRequest request = CreateReturnTicketRequest.builder()
                .originalInvoiceId("inv-1")
                .reason("Trả hàng giảm nợ nhưng đơn khách lẻ")
                .refundPaymentMethod("DEBT_REDUCTION")
                .items(List.of(
                        CreateReturnTicketItemRequest.builder()
                                .productId("prod-1")
                                .quantity(new BigDecimal("1.000"))
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.createReturnTicket(request, "chuho_viet")
        );

        assertEquals(ErrorCode.CUSTOMER_REQUIRED_FOR_DEBT, ex.getErrorCode());
    }

    @Test
    @DisplayName("Create Decrease Adjustment Invoice (NCL-11-CN-003) - Tính chính xác số tiền khi sản phẩm trả có chiết khấu dòng")
    void testCreateDecreaseAdjustmentInvoice_WithLineDiscount_CalculatesCorrectFinalAmount() {
        // Xi măng: 100.000đ/bao x 2 bao, chiết khấu 10.000đ/bao
        // Net before tax: 180.000đ, Tax (8%): 14.400đ -> Subtotal/TotalReturnAmount = 194.400đ
        ReturnTicketItem discountedItem = ReturnTicketItem.builder()
                .id("item-disc-1")
                .product(product)
                .productName(product.getName())
                .unit("Bao")
                .quantity(new BigDecimal("2.000"))
                .unitPrice(new BigDecimal("100000.00"))
                .taxRatePercentage(new BigDecimal("8.00"))
                .taxAmount(new BigDecimal("14400.00"))
                .subtotal(new BigDecimal("194400.00"))
                .build();

        ReturnTicket ticket = ReturnTicket.builder()
                .id("ticket-disc")
                .ticketNumber("PTH-20260812-0002")
                .household(household)
                .originalInvoice(issuedInvoice)
                .createdByUser(ownerUser)
                .status("APPROVED")
                .totalReturnAmount(new BigDecimal("194400.00"))
                .items(List.of(discountedItem))
                .build();

        when(userRepository.findByUsername("chuho_viet")).thenReturn(Optional.of(ownerUser));
        when(returnTicketRepository.findByIdAndHouseholdId("ticket-disc", "house-1")).thenReturn(Optional.of(ticket));
        when(eInvoiceRepository.existsByReturnTicketIdAndDeletedAtIsNull("ticket-disc")).thenReturn(false);
        when(eInvoiceRepository.save(any(EInvoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ReturnTicketResponse response = returnTicketService.createDecreaseAdjustmentInvoice("ticket-disc", "chuho_viet");

        assertNotNull(response);
        verify(eInvoiceRepository, times(1)).save(argThat(inv ->
                "HÓA ĐƠN ĐIỀU CHỈNH GIẢM".equals(inv.getTitle()) &&
                "ISSUED".equals(inv.getStatus()) &&
                new BigDecimal("180000.00").compareTo(inv.getTotalAmountBeforeTax()) == 0 &&
                new BigDecimal("14400.00").compareTo(inv.getTaxAmount()) == 0 &&
                new BigDecimal("194400.00").compareTo(inv.getFinalAmount()) == 0
        ));
    }

    @Test
    @DisplayName("Create Decrease Adjustment Invoice (NCL-11-CN-003) - Thất bại khi người thao tác là Nhân viên kho (VT-04, Whitelist check)")
    void testCreateDecreaseAdjustmentInvoice_WarehouseStaffUser_ThrowsException() {
        Role warehouseRole = Role.builder().id(4).code("VT-04").name("Nhân viên kho").build();
        User warehouseUser = User.builder()
                .id("user-5")
                .username("nhanvien_kho")
                .role(warehouseRole)
                .household(household)
                .build();

        when(userRepository.findByUsername("nhanvien_kho")).thenReturn(Optional.of(warehouseUser));

        AppException ex = assertThrows(AppException.class, () ->
                returnTicketService.createDecreaseAdjustmentInvoice("ticket-1", "nhanvien_kho")
        );

        assertEquals(ErrorCode.UNAUTHORIZED_RETURN_ACTION, ex.getErrorCode());
        verify(returnTicketRepository, never()).save(any());
    }
}


