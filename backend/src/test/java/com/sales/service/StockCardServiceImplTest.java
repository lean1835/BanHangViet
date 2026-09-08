package com.sales.service;

import com.sales.dto.response.StockCardResponse;
import com.sales.dto.response.StockMovementResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.StockCardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StockCardServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ReturnTicketItemRepository returnTicketItemRepository;

    @Mock
    private InventoryAuditDetailRepository inventoryAuditDetailRepository;

    @InjectMocks
    private StockCardServiceImpl stockCardService;

    private User testUser;
    private BusinessHousehold testHousehold;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        testHousehold = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ Kinh Doanh Việt")
                .build();

        testUser = User.builder()
                .id("u-1")
                .username("owner")
                .fullName("Nguyễn Văn Chủ")
                .household(testHousehold)
                .build();

        testProduct = Product.builder()
                .id("prod-1")
                .sku("SP001")
                .name("Sữa tươi Vinamilk")
                .unit("Hộp")
                .household(testHousehold)
                .stockQuantity(new BigDecimal("130.000"))
                .build();
    }

    @Test
    @DisplayName("TC-01: Xem thẻ kho thành công với chuỗi biến động và tồn sau mỗi biến động")
    void testTC01_Success_ChronologicalMovementsAndBalances() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));

        // 1. Goods receipt: +100 at 2026-09-02
        GoodsReceipt receipt = GoodsReceipt.builder()
                .id("gr-1")
                .receiptNumber("PN001")
                .receivedAt(LocalDateTime.of(2026, 9, 2, 8, 0))
                .createdByUser(testUser)
                .notes("Nhập hàng đợt 1")
                .build();
        GoodsReceiptDetail receiptDetail = GoodsReceiptDetail.builder()
                .id("grd-1")
                .receipt(receipt)
                .product(testProduct)
                .quantity(new BigDecimal("100.000"))
                .createdAt(LocalDateTime.of(2026, 9, 2, 8, 0))
                .build();
        when(goodsReceiptDetailRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(receiptDetail));

        // 2. Sale order: -20 at 2026-09-05
        Order order = Order.builder()
                .id("ord-1")
                .orderNumber("HD001")
                .createdAt(LocalDateTime.of(2026, 9, 5, 10, 30))
                .createdByUser(testUser)
                .status("COMPLETED")
                .build();
        OrderItem orderItem = OrderItem.builder()
                .id("oi-1")
                .order(order)
                .product(testProduct)
                .quantity(new BigDecimal("20.000"))
                .createdAt(LocalDateTime.of(2026, 9, 5, 10, 30))
                .build();
        when(orderItemRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(orderItem));

        // 3. Customer return: +5 at 2026-09-08
        ReturnTicket returnTicket = ReturnTicket.builder()
                .id("rt-1")
                .ticketNumber("PTH001")
                .approvedAt(LocalDateTime.of(2026, 9, 8, 14, 0))
                .approvedByUser(testUser)
                .reason("Khách trả hàng lỗi")
                .status("APPROVED")
                .build();
        ReturnTicketItem returnItem = ReturnTicketItem.builder()
                .id("rti-1")
                .returnTicket(returnTicket)
                .product(testProduct)
                .quantity(new BigDecimal("5.000"))
                .createdAt(LocalDateTime.of(2026, 9, 8, 14, 0))
                .build();
        when(returnTicketItemRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(returnItem));

        // 4. Inventory audit: diff +45 at 2026-09-15
        InventoryAudit audit = InventoryAudit.builder()
                .id("aud-1")
                .auditNumber("KK001")
                .auditDate(LocalDateTime.of(2026, 9, 15, 16, 0))
                .createdByUser(testUser)
                .status("COMPLETED")
                .build();
        InventoryAuditDetail auditDetail = InventoryAuditDetail.builder()
                .id("iad-1")
                .audit(audit)
                .product(testProduct)
                .systemQuantity(new BigDecimal("85.000"))
                .actualQuantity(new BigDecimal("130.000"))
                .differenceQuantity(new BigDecimal("45.000"))
                .reason("Kiểm kê định kỳ thừa hàng")
                .createdAt(LocalDateTime.of(2026, 9, 15, 16, 0))
                .build();
        when(inventoryAuditDetailRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(auditDetail));

        // Execute service call
        LocalDate fromDate = LocalDate.of(2026, 9, 1);
        LocalDate toDate = LocalDate.of(2026, 9, 30);
        StockCardResponse response = stockCardService.getStockCard("owner", "prod-1", fromDate, toDate, 0, 20);

        // Verify summary
        assertNotNull(response);
        assertEquals("prod-1", response.getProductId());
        assertEquals("SP001", response.getProductSku());
        assertEquals(0, new BigDecimal("0.000").compareTo(response.getOpeningStock()));
        assertEquals(0, new BigDecimal("150.000").compareTo(response.getTotalQuantityIn()));
        assertEquals(0, new BigDecimal("20.000").compareTo(response.getTotalQuantityOut()));
        assertEquals(0, new BigDecimal("130.000").compareTo(response.getClosingStock()));
        assertEquals(0, new BigDecimal("130.000").compareTo(response.getCurrentStock()));
        assertFalse(response.getIsDiscrepancy());
        assertNull(response.getWarning());

        // Verify movements
        List<StockMovementResponse> movements = response.getMovements().getContent();
        assertEquals(4, movements.size());

        // Movement 1: Goods Receipt
        assertEquals("GOODS_RECEIPT", movements.get(0).getDocumentType());
        assertEquals(0, new BigDecimal("100.000").compareTo(movements.get(0).getQuantityIn()));
        assertEquals(0, new BigDecimal("100.000").compareTo(movements.get(0).getBalanceAfter()));

        // Movement 2: Order
        assertEquals("SALE_ORDER", movements.get(1).getDocumentType());
        assertEquals(0, new BigDecimal("20.000").compareTo(movements.get(1).getQuantityOut()));
        assertEquals(0, new BigDecimal("80.000").compareTo(movements.get(1).getBalanceAfter()));

        // Movement 3: Return
        assertEquals("CUSTOMER_RETURN", movements.get(2).getDocumentType());
        assertEquals(0, new BigDecimal("5.000").compareTo(movements.get(2).getQuantityIn()));
        assertEquals(0, new BigDecimal("85.000").compareTo(movements.get(2).getBalanceAfter()));

        // Movement 4: Inventory Audit
        assertEquals("INVENTORY_AUDIT", movements.get(3).getDocumentType());
        assertEquals(0, new BigDecimal("45.000").compareTo(movements.get(3).getQuantityIn()));
        assertEquals(0, new BigDecimal("130.000").compareTo(movements.get(3).getBalanceAfter()));
    }

    @Test
    @DisplayName("TC-02: Kiểm tra liên kết chứng từ gốc và thông tin điều hướng")
    void testTC02_DocumentUrlAndOriginNavigation() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));

        GoodsReceipt receipt = GoodsReceipt.builder()
                .id("gr-99")
                .receiptNumber("PN099")
                .receivedAt(LocalDateTime.of(2026, 9, 2, 8, 0))
                .createdByUser(testUser)
                .build();
        GoodsReceiptDetail receiptDetail = GoodsReceiptDetail.builder()
                .id("grd-99")
                .receipt(receipt)
                .product(testProduct)
                .quantity(new BigDecimal("130.000"))
                .build();
        when(goodsReceiptDetailRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(receiptDetail));

        when(orderItemRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());
        when(returnTicketItemRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());
        when(inventoryAuditDetailRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());

        StockCardResponse response = stockCardService.getStockCard(
                "owner", "prod-1", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), 0, 10);

        List<StockMovementResponse> movements = response.getMovements().getContent();
        assertEquals(1, movements.size());
        StockMovementResponse item = movements.get(0);
        assertEquals("gr-99", item.getDocumentId());
        assertEquals("PN099", item.getDocumentNumber());
        assertEquals("/products/stock-entry?id=gr-99", item.getDocumentUrl());
        assertEquals("Phiếu nhập kho", item.getDocumentTypeName());
        assertEquals("Nguyễn Văn Chủ", item.getPerformedBy());
    }

    @Test
    @DisplayName("TC-03: Cảnh báo bất thường khi tồn cuối kỳ không khớp với tồn thực tế trong database")
    void testTC03_DiscrepancyDetected_TamperedStock() {
        // Database stock tampered to 999 while movement history totals 100
        testProduct.setStockQuantity(new BigDecimal("999.000"));

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));

        GoodsReceipt receipt = GoodsReceipt.builder()
                .id("gr-1")
                .receiptNumber("PN001")
                .receivedAt(LocalDateTime.of(2026, 9, 2, 8, 0))
                .createdByUser(testUser)
                .build();
        GoodsReceiptDetail receiptDetail = GoodsReceiptDetail.builder()
                .id("grd-1")
                .receipt(receipt)
                .product(testProduct)
                .quantity(new BigDecimal("100.000"))
                .build();
        when(goodsReceiptDetailRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(receiptDetail));
        when(orderItemRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());
        when(returnTicketItemRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());
        when(inventoryAuditDetailRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());

        StockCardResponse response = stockCardService.getStockCard(
                "owner", "prod-1", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), 0, 10);

        assertTrue(response.getIsDiscrepancy());
        assertNotNull(response.getWarning());
        assertTrue(response.getWarning().contains("Cảnh báo: Phát hiện sai lệch số liệu tồn kho!"));
        assertTrue(response.getWarning().contains("100"));
        assertTrue(response.getWarning().contains("999"));
    }

    @Test
    @DisplayName("Kiểm tra phân kỳ và tồn đầu kỳ khi có biến động trước kỳ")
    void testOpeningStock_WithPriorMovements() {
        testProduct.setStockQuantity(new BigDecimal("80.000"));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));

        // Prior movement before September 2026 (August 2026): +100
        GoodsReceipt receipt = GoodsReceipt.builder()
                .id("gr-old")
                .receiptNumber("PN-OLD")
                .receivedAt(LocalDateTime.of(2026, 8, 15, 10, 0))
                .createdByUser(testUser)
                .build();
        GoodsReceiptDetail receiptDetail = GoodsReceiptDetail.builder()
                .id("grd-old")
                .receipt(receipt)
                .product(testProduct)
                .quantity(new BigDecimal("100.000"))
                .build();
        when(goodsReceiptDetailRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(receiptDetail));

        // In-period movement (September 2026): -20
        Order order = Order.builder()
                .id("ord-1")
                .orderNumber("HD001")
                .createdAt(LocalDateTime.of(2026, 9, 10, 11, 0))
                .createdByUser(testUser)
                .status("COMPLETED")
                .build();
        OrderItem orderItem = OrderItem.builder()
                .id("oi-1")
                .order(order)
                .product(testProduct)
                .quantity(new BigDecimal("20.000"))
                .build();
        when(orderItemRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(orderItem));

        when(returnTicketItemRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());
        when(inventoryAuditDetailRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());

        StockCardResponse response = stockCardService.getStockCard(
                "owner", "prod-1", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), 0, 10);

        assertEquals(0, new BigDecimal("100.000").compareTo(response.getOpeningStock()));
        assertEquals(0, new BigDecimal("0.000").compareTo(response.getTotalQuantityIn()));
        assertEquals(0, new BigDecimal("20.000").compareTo(response.getTotalQuantityOut()));
        assertEquals(0, new BigDecimal("80.000").compareTo(response.getClosingStock()));
        assertEquals(1, response.getMovements().getContent().size());
        assertEquals("SALE_ORDER", response.getMovements().getContent().get(0).getDocumentType());
    }

    @Test
    @DisplayName("Ngoại lệ: Khoảng ngày không hợp lệ (fromDate > toDate)")
    void testInvalidDateRange_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));

        LocalDate fromDate = LocalDate.of(2026, 9, 30);
        LocalDate toDate = LocalDate.of(2026, 9, 1);

        AppException ex = assertThrows(AppException.class, () ->
                stockCardService.getStockCard("owner", "prod-1", fromDate, toDate, 0, 10));

        assertEquals(ErrorCode.INVALID_DATE_RANGE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Ngoại lệ: Không tìm thấy sản phẩm hoặc sản phẩm không thuộc hộ kinh doanh")
    void testProductNotFound_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("invalid-id", "hh-1"))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                stockCardService.getStockCard("owner", "invalid-id", null, null, 0, 10));

        assertEquals(ErrorCode.PRODUCT_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Kiểm kê điều chỉnh giảm (differenceQuantity < 0)")
    void testAuditNegativeDifference_HandledAsQuantityOut() {
        testProduct.setStockQuantity(new BigDecimal("70.000"));
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));

        GoodsReceipt receipt = GoodsReceipt.builder()
                .id("gr-1")
                .receiptNumber("PN001")
                .receivedAt(LocalDateTime.of(2026, 9, 1, 8, 0))
                .createdByUser(testUser)
                .build();
        GoodsReceiptDetail receiptDetail = GoodsReceiptDetail.builder()
                .id("grd-1")
                .receipt(receipt)
                .product(testProduct)
                .quantity(new BigDecimal("100.000"))
                .build();
        when(goodsReceiptDetailRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(receiptDetail));

        InventoryAudit audit = InventoryAudit.builder()
                .id("aud-1")
                .auditNumber("KK001")
                .auditDate(LocalDateTime.of(2026, 9, 15, 16, 0))
                .createdByUser(testUser)
                .status("COMPLETED")
                .build();
        InventoryAuditDetail auditDetail = InventoryAuditDetail.builder()
                .id("iad-1")
                .audit(audit)
                .product(testProduct)
                .systemQuantity(new BigDecimal("100.000"))
                .actualQuantity(new BigDecimal("70.000"))
                .differenceQuantity(new BigDecimal("-30.000"))
                .reason("Hàng hư hỏng vứt bỏ")
                .build();
        when(inventoryAuditDetailRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(auditDetail));

        when(orderItemRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());
        when(returnTicketItemRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());

        StockCardResponse response = stockCardService.getStockCard(
                "owner", "prod-1", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), 0, 10);

        assertEquals(0, new BigDecimal("30.000").compareTo(response.getTotalQuantityOut()));
        assertEquals(0, new BigDecimal("70.000").compareTo(response.getClosingStock()));

        StockMovementResponse auditMovement = response.getMovements().getContent().get(1);
        assertEquals("OUT", auditMovement.getChangeType());
        assertEquals(0, new BigDecimal("30.000").compareTo(auditMovement.getQuantityOut()));
        assertEquals(0, new BigDecimal("70.000").compareTo(auditMovement.getBalanceAfter()));
        assertEquals("Hàng hư hỏng vứt bỏ", auditMovement.getNotes());
    }

    @Test
    @DisplayName("TC-04: Khi giao dịch nhập và xuất trùng thời điểm, giao dịch nhập (IN) được ưu tiên xếp trước (OUT)")
    void testTC04_SameTimestamp_InPrioritizedOverOut() {
        LocalDateTime sameTimestamp = LocalDateTime.of(2026, 9, 10, 10, 0, 0);

        testProduct.setStockQuantity(new BigDecimal("80.000"));

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));

        // Goods receipt: +100 at sameTimestamp, but created with ID "z-id" (alphabetically after "a-id")
        GoodsReceipt receipt = GoodsReceipt.builder()
                .id("gr-1")
                .receiptNumber("PN001")
                .receivedAt(sameTimestamp)
                .createdByUser(testUser)
                .build();
        GoodsReceiptDetail receiptDetail = GoodsReceiptDetail.builder()
                .id("z-id")
                .receipt(receipt)
                .product(testProduct)
                .quantity(new BigDecimal("100.000"))
                .createdAt(sameTimestamp)
                .build();
        when(goodsReceiptDetailRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(receiptDetail));

        // Sale order: -20 at sameTimestamp, with ID "a-id" (alphabetically before "z-id")
        Order order = Order.builder()
                .id("ord-1")
                .orderNumber("HD001")
                .createdAt(sameTimestamp)
                .createdByUser(testUser)
                .status("COMPLETED")
                .build();
        OrderItem orderItem = OrderItem.builder()
                .id("a-id")
                .order(order)
                .product(testProduct)
                .quantity(new BigDecimal("20.000"))
                .createdAt(sameTimestamp)
                .build();
        when(orderItemRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(orderItem));

        when(returnTicketItemRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());
        when(inventoryAuditDetailRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());

        StockCardResponse response = stockCardService.getStockCard(
                "owner", "prod-1", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), 0, 10);

        List<StockMovementResponse> movements = response.getMovements().getContent();
        assertEquals(2, movements.size());

        // First item must be GOODS_RECEIPT (IN), even though its ID is "z-id"
        assertEquals("GOODS_RECEIPT", movements.get(0).getDocumentType());
        assertEquals("IN", movements.get(0).getChangeType());
        assertEquals(0, new BigDecimal("100.000").compareTo(movements.get(0).getBalanceAfter()));

        // Second item must be SALE_ORDER (OUT)
        assertEquals("SALE_ORDER", movements.get(1).getDocumentType());
        assertEquals("OUT", movements.get(1).getChangeType());
        assertEquals(0, new BigDecimal("80.000").compareTo(movements.get(1).getBalanceAfter()));
    }

    @Test
    @DisplayName("NCL-02-CN-007: Thẻ kho biến động chính xác theo đơn vị cơ sở khi giao dịch bằng đơn vị quy đổi (Nhập 1 Thùng = 24 lon, Bán 1 Thùng = 24 lon)")
    void testStockCard_withUnitConversion_usesBaseQuantity() {
        LocalDateTime t1 = LocalDateTime.of(2026, 9, 5, 10, 0);
        LocalDateTime t2 = LocalDateTime.of(2026, 9, 6, 15, 0);

        GoodsReceipt gr = GoodsReceipt.builder()
                .id("gr-1")
                .receiptNumber("NK-001")
                .receivedAt(t1)
                .createdByUser(testUser)
                .notes("Nhập lô bia")
                .build();
        GoodsReceiptDetail grd = GoodsReceiptDetail.builder()
                .id("grd-1")
                .receipt(gr)
                .product(testProduct)
                .quantity(new BigDecimal("1")) // 1 Thùng
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .baseQuantity(new BigDecimal("24")) // = 24 Lon
                .createdAt(t1)
                .build();

        Order order = Order.builder()
                .id("ord-1")
                .orderNumber("HD-001")
                .createdAt(t2)
                .createdByUser(testUser)
                .status("COMPLETED")
                .build();
        OrderItem oi = OrderItem.builder()
                .id("oi-1")
                .order(order)
                .product(testProduct)
                .quantity(new BigDecimal("1")) // Bán 1 Thùng
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .baseQuantity(new BigDecimal("24")) // = 24 Lon
                .createdAt(t2)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));
        when(goodsReceiptDetailRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(grd));
        when(orderItemRepository.findStockMovementsByProduct("prod-1", "hh-1"))
                .thenReturn(List.of(oi));
        when(returnTicketItemRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());
        when(inventoryAuditDetailRepository.findStockMovementsByProduct("prod-1", "hh-1")).thenReturn(Collections.emptyList());

        StockCardResponse response = stockCardService.getStockCard(
                "owner", "prod-1", LocalDate.of(2026, 9, 1), LocalDate.of(2026, 9, 30), 0, 10);

        List<StockMovementResponse> movements = response.getMovements().getContent();
        assertEquals(2, movements.size());

        // Nhập 1 thùng: quantityIn phải là 24 (lon), không phải 1
        assertEquals(new BigDecimal("24"), movements.get(0).getQuantityIn());
        assertEquals(new BigDecimal("24"), movements.get(0).getBalanceAfter());
        assertTrue(movements.get(0).getNotes().contains("[Quy đổi: 1 Thùng x 24]"));

        // Bán 1 thùng: quantityOut phải là 24 (lon), không phải 1
        assertEquals(new BigDecimal("24"), movements.get(1).getQuantityOut());
        assertEquals(new BigDecimal("0"), movements.get(1).getBalanceAfter());
        assertTrue(movements.get(1).getNotes().contains("[Quy đổi: 1 Thùng x 24]"));
    }
}

