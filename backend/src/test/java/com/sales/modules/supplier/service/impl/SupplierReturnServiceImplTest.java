package com.sales.modules.supplier.service.impl;
import com.sales.common.dto.PageResponse;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.Role;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.inventory.entity.GoodsReceipt;
import com.sales.modules.inventory.entity.GoodsReceiptDetail;
import com.sales.modules.inventory.repository.GoodsReceiptDetailRepository;
import com.sales.modules.inventory.repository.GoodsReceiptRepository;
import com.sales.modules.order.dto.response.ReceiptReturnableCheckResponse;
import com.sales.modules.order.dto.response.ReceiptReturnableItemResponse;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.supplier.dto.response.SupplierReturnDetailResponse;
import com.sales.modules.supplier.dto.response.SupplierReturnResponse;
import com.sales.modules.supplier.entity.Supplier;
import com.sales.modules.supplier.entity.SupplierReturn;
import com.sales.modules.supplier.entity.SupplierReturnItem;
import com.sales.modules.supplier.repository.SupplierReturnItemRepository;
import com.sales.modules.supplier.repository.SupplierReturnRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.supplier.dto.request.CreateSupplierReturnItemRequest;
import com.sales.modules.supplier.dto.request.CreateSupplierReturnRequest;
import com.sales.common.exception.AppException;
import com.sales.common.exception.ErrorCode;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import com.sales.modules.supplier.service.SupplierDebtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class SupplierReturnServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GoodsReceiptRepository goodsReceiptRepository;

    @Mock
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private SupplierReturnRepository supplierReturnRepository;

    @Mock
    private SupplierReturnItemRepository supplierReturnItemRepository;

    @Mock
    private SupplierDebtService supplierDebtService;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private SupplierReturnServiceImpl supplierReturnService;

    private User ownerUser;
    private User cashierUser;
    private BusinessHousehold household;
    private Supplier supplier;
    private Product product;
    private GoodsReceipt goodsReceipt;
    private GoodsReceiptDetail goodsReceiptDetail;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-001")
                .name("Tạp Hóa Việt")
                .build();

        Role ownerRole = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();
        Role cashierRole = Role.builder().id(2).code("VT-02").name("Thu ngân").build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("owner_test")
                .fullName("Chủ Hộ")
                .household(household)
                .role(ownerRole)
                .build();

        cashierUser = User.builder()
                .id("user-cashier")
                .username("cashier_test")
                .fullName("Thu Ngân")
                .household(household)
                .role(cashierRole)
                .build();

        supplier = Supplier.builder()
                .id("supp-001")
                .household(household)
                .name("Công ty Nước Giải Khát ABC")
                .phoneNumber("0901234567")
                .currentDebt(new BigDecimal("240000.00"))
                .build();

        product = Product.builder()
                .id("prod-001")
                .household(household)
                .sku("SP001")
                .name("Nước ngọt Coca 330ml")
                .unit("Chai")
                .stockQuantity(new BigDecimal("24.000"))
                .costPrice(new BigDecimal("10000.00"))
                .build();

        goodsReceipt = GoodsReceipt.builder()
                .id("gr-001")
                .household(household)
                .supplier(supplier)
                .receiptNumber("NK-001")
                .totalAmount(new BigDecimal("240000.00"))
                .receivedAt(LocalDateTime.now().minusDays(2))
                .createdByUser(ownerUser)
                .build();

        goodsReceiptDetail = GoodsReceiptDetail.builder()
                .id("grd-001")
                .receipt(goodsReceipt)
                .product(product)
                .quantity(new BigDecimal("24.000"))
                .purchasePrice(new BigDecimal("10000.00"))
                .conversionFactor(BigDecimal.ONE)
                .baseQuantity(new BigDecimal("24.000"))
                .basePurchasePrice(new BigDecimal("10000.00"))
                .unitName("Chai")
                .build();
    }

    @Test
    @DisplayName("TC-01: Lập phiếu trả hàng NCC thành công - Tồn giảm, nợ NCC giảm, tính lại giá vốn QTN-23")
    void createSupplierReturn_success_tc01() {
        // Arrange
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(goodsReceiptRepository.findByIdAndHouseholdId("gr-001", "hh-001")).thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptDetailRepository.findByReceiptId("gr-001")).thenReturn(List.of(goodsReceiptDetail));
        when(supplierReturnItemRepository.sumQuantityReturnedByDetailIds(anyList())).thenReturn(Collections.emptyList());
        when(supplierReturnRepository.save(any(SupplierReturn.class))).thenAnswer(inv -> {
            SupplierReturn sr = inv.getArgument(0);
            if (sr.getId() == null) sr.setId("sr-001");
            return sr;
        });

        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Hàng hỏng")
                .notes("Trả 2 chai vỡ nắp")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("2.000"))
                                .itemReason("Vỡ nắp do vận chuyển")
                                .build()
                ))
                .build();

        // Act
        SupplierReturnResponse response = supplierReturnService.createSupplierReturn("owner_test", request);

        // Assert
        assertNotNull(response);
        assertEquals("gr-001", response.getReceiptId());
        assertEquals("NK-001", response.getReceiptNumber());
        assertEquals("Hàng hỏng", response.getReason());
        assertEquals(new BigDecimal("20000.00"), response.getTotalReturnAmount());

        // Kiểm tra tồn kho giảm 2 chai: 24 - 2 = 22
        assertEquals(new BigDecimal("22.000"), product.getStockQuantity());
        // Kiểm tra giá vốn: cũ 10k, trả 2 chai 10k -> giá vốn mới vẫn là 10k (240k - 20k) / 22 = 220k / 22 = 10,000
        assertEquals(new BigDecimal("10000.00"), product.getCostPrice());

        // Kiểm tra gọi khấu trừ công nợ NCC
        verify(supplierDebtService, times(1)).recordSupplierReturnDebtReduction(
                eq(household), eq(supplier), eq(goodsReceipt), eq(new BigDecimal("20000.00")), anyString(), eq(ownerUser)
        );

        verify(supplierReturnItemRepository, times(1)).saveAll(anyList());
        verify(productRepository, times(1)).saveAll(anyCollection());
    }

    @Test
    @DisplayName("TC-02: Chặn trả hàng khi số lượng trả vượt quá số lượng đã nhập (AC-02)")
    void createSupplierReturn_exceededImportedQuantity_throwsException() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(goodsReceiptRepository.findByIdAndHouseholdId("gr-001", "hh-001")).thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptDetailRepository.findByReceiptId("gr-001")).thenReturn(List.of(goodsReceiptDetail));
        when(supplierReturnItemRepository.sumQuantityReturnedByDetailIds(anyList())).thenReturn(Collections.emptyList());

        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Hàng hỏng")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("25.000")) // Nhập 24 nhưng đòi trả 25
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                supplierReturnService.createSupplierReturn("owner_test", request));

        assertEquals(ErrorCode.EXCEEDED_SUPPLIER_RETURNABLE_QUANTITY, ex.getErrorCode());
        verify(supplierReturnRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-03: Chặn trả hàng khi số lượng trả vượt quá số lượng còn lại sau các lần trả trước (AC-02)")
    void createSupplierReturn_exceededRemainingAfterPreviousReturns_throwsException() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(goodsReceiptRepository.findByIdAndHouseholdId("gr-001", "hh-001")).thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptDetailRepository.findByReceiptId("gr-001")).thenReturn(List.of(goodsReceiptDetail));
        // Đã trả 20 chai ở các phiếu trước
        SupplierReturnItemRepository.ReceiptDetailReturnedProjection prevReturnProj = mock(SupplierReturnItemRepository.ReceiptDetailReturnedProjection.class);
        when(prevReturnProj.getDetailId()).thenReturn("grd-001");
        when(prevReturnProj.getTotalReturned()).thenReturn(new BigDecimal("20.000"));
        when(supplierReturnItemRepository.sumQuantityReturnedByDetailIds(anyList())).thenReturn(List.of(prevReturnProj));

        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Cận hạn")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("5.000")) // Còn 4 chai nhưng đòi trả 5
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                supplierReturnService.createSupplierReturn("owner_test", request));

        assertEquals(ErrorCode.EXCEEDED_SUPPLIER_RETURNABLE_QUANTITY, ex.getErrorCode());
        verify(supplierReturnRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-04: Chặn trả hàng khi số lượng trả vượt quá tồn kho thực tế hiện có (QTN-24)")
    void createSupplierReturn_exceededCurrentStock_throwsException() {
        // Tồn kho thực tế chỉ còn 1 chai do đã bán bớt
        product.setStockQuantity(new BigDecimal("1.000"));

        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(goodsReceiptRepository.findByIdAndHouseholdId("gr-001", "hh-001")).thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptDetailRepository.findByReceiptId("gr-001")).thenReturn(List.of(goodsReceiptDetail));
        when(supplierReturnItemRepository.sumQuantityReturnedByDetailIds(anyList())).thenReturn(Collections.emptyList());

        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Hàng hỏng")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("2.000")) // Còn 1 chai nhưng đòi trả 2
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                supplierReturnService.createSupplierReturn("owner_test", request));

        assertEquals(ErrorCode.INSUFFICIENT_STOCK_FOR_RETURN, ex.getErrorCode());
        verify(supplierReturnRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-05: Tính lại giá vốn bình quân di động chính xác theo QTN-23")
    void createSupplierReturn_recalculateWeightedAverageCost_QTN23() {
        // Giả sử tồn kho là 10 chai, giá vốn hiện tại là 10,000đ (tổng giá trị kho = 100,000đ)
        // Phiếu nhập này nhập giá 12,000đ/chai. Trả lại 2 chai của phiếu nhập này (giá trị trả = 24,000đ)
        // Sau trả: Tồn kho còn 8 chai. Giá trị kho = 100k - 24k = 76,000đ
        // Giá vốn bình quân mới = 76,000 / 8 = 9,500.00đ
        product.setStockQuantity(new BigDecimal("10.000"));
        product.setCostPrice(new BigDecimal("10000.00"));
        goodsReceiptDetail.setPurchasePrice(new BigDecimal("12000.00"));
        goodsReceiptDetail.setBasePurchasePrice(new BigDecimal("12000.00"));

        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(goodsReceiptRepository.findByIdAndHouseholdId("gr-001", "hh-001")).thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptDetailRepository.findByReceiptId("gr-001")).thenReturn(List.of(goodsReceiptDetail));
        when(supplierReturnItemRepository.sumQuantityReturnedByDetailIds(anyList())).thenReturn(Collections.emptyList());
        when(supplierReturnRepository.save(any(SupplierReturn.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Sai quy cách")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("2.000"))
                                .build()
                ))
                .build();

        supplierReturnService.createSupplierReturn("owner_test", request);

        // Tồn kho mới = 8
        assertEquals(new BigDecimal("8.000"), product.getStockQuantity());
        // Giá vốn mới = 9,500.00đ
        assertEquals(new BigDecimal("9500.00"), product.getCostPrice());
    }

    @Test
    @DisplayName("TC-06: Kiểm tra thông tin khả năng trả hàng của phiếu nhập (checkReceiptReturnable)")
    void checkReceiptReturnable_success() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(goodsReceiptRepository.findByIdAndHouseholdId("gr-001", "hh-001")).thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptDetailRepository.findByReceiptId("gr-001")).thenReturn(List.of(goodsReceiptDetail));

        SupplierReturnItemRepository.ReceiptDetailReturnedProjection proj = mock(SupplierReturnItemRepository.ReceiptDetailReturnedProjection.class);
        when(proj.getDetailId()).thenReturn("grd-001");
        when(proj.getTotalReturned()).thenReturn(new BigDecimal("4.000"));
        when(supplierReturnItemRepository.sumQuantityReturnedByDetailIds(List.of("grd-001"))).thenReturn(List.of(proj));

        ReceiptReturnableCheckResponse response = supplierReturnService.checkReceiptReturnable("owner_test", "gr-001");

        assertNotNull(response);
        assertEquals("gr-001", response.getReceiptId());
        assertEquals("NK-001", response.getReceiptNumber());
        assertEquals("Công ty Nước Giải Khát ABC", response.getSupplierName());
        assertEquals(1, response.getItems().size());

        ReceiptReturnableItemResponse item = response.getItems().get(0);
        assertEquals(new BigDecimal("24.000"), item.getImportedQuantity());
        assertEquals(new BigDecimal("4.000"), item.getPreviouslyReturnedQuantity());
        assertEquals(new BigDecimal("20.000"), item.getRemainingReturnableQuantity());
        assertEquals(new BigDecimal("24.000"), item.getCurrentStockQuantity());
        // maxAllowed = min(20, 24) = 20
        assertEquals(new BigDecimal("20.000"), item.getMaxAllowedReturnQuantity());
    }

    @Test
    @DisplayName("TC-07: Phiếu nhập không có nhà cung cấp (mua lẻ chợ) -> Trả hàng không sinh lỗi cấn trừ nợ")
    void createSupplierReturn_withoutSupplier_success() {
        goodsReceipt.setSupplier(null);

        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(goodsReceiptRepository.findByIdAndHouseholdId("gr-001", "hh-001")).thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptDetailRepository.findByReceiptId("gr-001")).thenReturn(List.of(goodsReceiptDetail));
        when(supplierReturnItemRepository.sumQuantityReturnedByDetailIds(anyList())).thenReturn(Collections.emptyList());
        when(supplierReturnRepository.save(any(SupplierReturn.class))).thenAnswer(inv -> inv.getArgument(0));

        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Hàng hỏng")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("2.000"))
                                .build()
                ))
                .build();

        SupplierReturnResponse response = supplierReturnService.createSupplierReturn("owner_test", request);

        assertNotNull(response);
        assertNull(response.getSupplierId());
        // Không gọi giảm nợ NCC vì không có supplier
        verify(supplierDebtService, never()).recordSupplierReturnDebtReduction(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("TC-08: Nhân viên bán hàng (VT-02) không có quyền tạo phiếu trả hàng NCC (QTN-10)")
    void createSupplierReturn_cashierRole_throwsForbidden() {
        when(userRepository.findByUsername("cashier_test")).thenReturn(Optional.of(cashierUser));

        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Hàng hỏng")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("2.000"))
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                supplierReturnService.createSupplierReturn("cashier_test", request));

        assertEquals(ErrorCode.ONLY_STORE_OWNER_CAN_RETURN_SUPPLIER, ex.getErrorCode());
        verify(supplierReturnRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-09: Lấy chi tiết phiếu trả hàng NCC theo ID thành công")
    void getSupplierReturnById_success() {
        SupplierReturn sr = SupplierReturn.builder()
                .id("sr-001")
                .returnNumber("TH-NCC-20260914-001")
                .household(household)
                .receipt(goodsReceipt)
                .supplier(supplier)
                .createdByUser(ownerUser)
                .totalReturnAmount(new BigDecimal("20000.00"))
                .reason("Hàng hỏng")
                .returnDate(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        SupplierReturnItem sri = SupplierReturnItem.builder()
                .id("sri-001")
                .supplierReturn(sr)
                .receiptDetail(goodsReceiptDetail)
                .product(product)
                .quantity(new BigDecimal("2.000"))
                .purchasePrice(new BigDecimal("10000.00"))
                .baseQuantity(new BigDecimal("2.000"))
                .basePurchasePrice(new BigDecimal("10000.00"))
                .subtotal(new BigDecimal("20000.00"))
                .unitName("Chai")
                .build();
        sr.getItems().add(sri);

        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(supplierReturnRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("sr-001", "hh-001")).thenReturn(Optional.of(sr));

        SupplierReturnDetailResponse response = supplierReturnService.getSupplierReturnById("owner_test", "sr-001");

        assertNotNull(response);
        assertEquals("sr-001", response.getId());
        assertEquals("TH-NCC-20260914-001", response.getReturnNumber());
        assertEquals("Hàng hỏng", response.getReason());
        assertEquals(1, response.getItems().size());
        assertEquals(new BigDecimal("20000.00"), response.getTotalReturnAmount());
    }

    @Test
    @DisplayName("TC-10: Tra cứu danh sách phiếu trả hàng NCC phân trang (getSupplierReturns)")
    void getSupplierReturns_paged_success() {
        SupplierReturn sr = SupplierReturn.builder()
                .id("sr-001")
                .returnNumber("TH-NCC-20260914-001")
                .household(household)
                .receipt(goodsReceipt)
                .supplier(supplier)
                .createdByUser(ownerUser)
                .totalReturnAmount(new BigDecimal("20000.00"))
                .reason("Hàng hỏng")
                .returnDate(LocalDateTime.now())
                .items(Collections.emptyList())
                .build();

        Page<SupplierReturn> page = new PageImpl<>(List.of(sr));
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(supplierReturnRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        PageResponse<SupplierReturnResponse> response = supplierReturnService.getSupplierReturns(
                "owner_test", null, null, null, null, 0, 10
        );

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("sr-001", response.getContent().get(0).getId());
    }

    @Test
    @DisplayName("TC-11: Phiếu nhập đã trả toàn bộ hàng -> createSupplierReturn ném RECEIPT_ALREADY_FULLY_RETURNED")
    void createSupplierReturn_alreadyFullyReturned_throwsException() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(goodsReceiptRepository.findByIdAndHouseholdId("gr-001", "hh-001")).thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptDetailRepository.findByReceiptId("gr-001")).thenReturn(List.of(goodsReceiptDetail));

        SupplierReturnItemRepository.ReceiptDetailReturnedProjection proj = mock(SupplierReturnItemRepository.ReceiptDetailReturnedProjection.class);
        when(proj.getDetailId()).thenReturn("grd-001");
        // Detail has 24, previous returned = 24 -> fully returned
        when(proj.getTotalReturned()).thenReturn(new BigDecimal("24.000"));
        when(supplierReturnItemRepository.sumQuantityReturnedByDetailIds(List.of("grd-001"))).thenReturn(List.of(proj));

        CreateSupplierReturnRequest request = CreateSupplierReturnRequest.builder()
                .receiptId("gr-001")
                .reason("Hàng hỏng")
                .items(List.of(
                        CreateSupplierReturnItemRequest.builder()
                                .receiptDetailId("grd-001")
                                .quantity(new BigDecimal("1.000"))
                                .build()
                ))
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                supplierReturnService.createSupplierReturn("owner_test", request)
        );

        assertEquals(ErrorCode.RECEIPT_ALREADY_FULLY_RETURNED, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-12: checkReceiptReturnable với phiếu nhập đã trả toàn bộ -> returnStatus = FULLY_RETURNED và isFullyReturned = true")
    void checkReceiptReturnable_fullyReturned_statusCorrect() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(goodsReceiptRepository.findByIdAndHouseholdId("gr-001", "hh-001")).thenReturn(Optional.of(goodsReceipt));
        when(goodsReceiptDetailRepository.findByReceiptId("gr-001")).thenReturn(List.of(goodsReceiptDetail));

        SupplierReturnItemRepository.ReceiptDetailReturnedProjection proj = mock(SupplierReturnItemRepository.ReceiptDetailReturnedProjection.class);
        when(proj.getDetailId()).thenReturn("grd-001");
        when(proj.getTotalReturned()).thenReturn(new BigDecimal("24.000"));
        when(supplierReturnItemRepository.sumQuantityReturnedByDetailIds(List.of("grd-001"))).thenReturn(List.of(proj));

        ReceiptReturnableCheckResponse response = supplierReturnService.checkReceiptReturnable("owner_test", "gr-001");

        assertNotNull(response);
        assertEquals("FULLY_RETURNED", response.getReturnStatus());
        assertTrue(response.getIsFullyReturned());
        assertFalse(response.getIsReturnable());
    }
}
