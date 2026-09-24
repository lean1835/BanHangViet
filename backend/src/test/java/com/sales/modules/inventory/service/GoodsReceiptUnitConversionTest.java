package com.sales.modules.inventory.service;
import com.sales.modules.auth.entity.BusinessHousehold;
import com.sales.modules.auth.entity.User;
import com.sales.modules.auth.repository.UserRepository;
import com.sales.modules.inventory.entity.GoodsReceipt;
import com.sales.modules.inventory.entity.GoodsReceiptDetail;
import com.sales.modules.inventory.repository.GoodsReceiptDetailRepository;
import com.sales.modules.inventory.repository.GoodsReceiptRepository;
import com.sales.modules.product.entity.Product;
import com.sales.modules.product.entity.ProductUnitConversion;
import com.sales.modules.product.repository.ProductRepository;
import com.sales.modules.product.repository.ProductUnitConversionRepository;
import com.sales.modules.supplier.repository.SupplierRepository;
import com.sales.modules.supplier.repository.SupplierReturnItemRepository;
import com.sales.modules.supplier.repository.SupplierReturnRepository;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.modules.inventory.dto.request.CreateGoodsReceiptDetailRequest;
import com.sales.modules.inventory.dto.request.CreateGoodsReceiptRequest;
import com.sales.modules.inventory.dto.response.GoodsReceiptResponse;
import com.sales.modules.audit.service.impl.ActivityLogHelper;
import com.sales.modules.inventory.service.impl.GoodsReceiptServiceImpl;
import com.sales.modules.supplier.service.SupplierDebtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GoodsReceiptUnitConversionTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GoodsReceiptRepository goodsReceiptRepository;

    @Mock
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductUnitConversionRepository productUnitConversionRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private SupplierDebtService supplierDebtService;

    @Mock
    private SupplierReturnRepository supplierReturnRepository;

    @Mock
    private SupplierReturnItemRepository supplierReturnItemRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private GoodsReceiptServiceImpl goodsReceiptService;

    private User testUser;
    private BusinessHousehold testHousehold;
    private Product testProduct;
    private ProductUnitConversion testConversion;

    @BeforeEach
    void setUp() {
        testHousehold = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ Kinh Doanh Việt")
                .build();

        testUser = User.builder()
                .id("user-1")
                .username("owner")
                .household(testHousehold)
                .build();

        // Ban đầu: tồn kho = 0 lon, giá vốn = 0
        testProduct = Product.builder()
                .id("prod-1")
                .household(testHousehold)
                .name("Bia Hà Nội")
                .sku("BHN-001")
                .unit("Lon")
                .price(new BigDecimal("15000.00"))
                .costPrice(BigDecimal.ZERO)
                .stockQuantity(BigDecimal.ZERO)
                .build();

        // Đơn vị quy đổi: 1 Thùng = 24 Lon
        testConversion = ProductUnitConversion.builder()
                .id("conv-1")
                .product(testProduct)
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .price(new BigDecimal("280000.00"))
                .build();
    }

    @Test
    @DisplayName("TC-01: Nhập kho theo đơn vị quy đổi (1 Thùng = 24 Lon, giá 240,000 VND) -> Tồn kho cơ bản tăng 24 lon, giá vốn tính theo đơn vị cơ bản là 10,000 VND/lon (QTN-23)")
    void createGoodsReceipt_withUnitConversion_tc01_success() {
        // Request: Nhập 1 Thùng với đơn giá 240,000 VND
        CreateGoodsReceiptDetailRequest detailReq = CreateGoodsReceiptDetailRequest.builder()
                .productId("prod-1")
                .quantity(new BigDecimal("1"))
                .purchasePrice(new BigDecimal("240000.00"))
                .unitConversionId("conv-1")
                .build();

        CreateGoodsReceiptRequest request = CreateGoodsReceiptRequest.builder()
                .details(List.of(detailReq))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(anyList(), eq("hh-1")))
                .thenReturn(List.of(testProduct));
        when(productUnitConversionRepository.findAllById(any()))
                .thenReturn(List.of(testConversion));

        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(invocation -> {
            GoodsReceipt gr = invocation.getArgument(0);
            gr.setId("receipt-1");
            return gr;
        });

        GoodsReceiptResponse response = goodsReceiptService.createGoodsReceipt("owner", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("240000.00"), response.getTotalAmount());

        // Kiểm tra biến động tồn kho và giá vốn (TC-01):
        // Tồn kho cơ bản: 0 + 1 * 24 = 24 lon
        assertEquals(new BigDecimal("24"), testProduct.getStockQuantity());

        // Giá vốn bình quân (QTN-23): 240,000 / 24 = 10,000 VND / lon
        assertEquals(new BigDecimal("10000.00"), testProduct.getCostPrice());

        // Verify batch save details
        verify(goodsReceiptDetailRepository, times(1)).saveAll(argThat(details -> {
            List<GoodsReceiptDetail> list = (List<GoodsReceiptDetail>) details;
            assertEquals(1, list.size());
            GoodsReceiptDetail d = list.get(0);
            assertEquals("conv-1", d.getUnitConversionId());
            assertEquals("Thùng", d.getUnitName());
            assertEquals(new BigDecimal("24"), d.getConversionFactor());
            assertEquals(new BigDecimal("24"), d.getBaseQuantity());
            assertEquals(new BigDecimal("10000.00"), d.getBasePurchasePrice());
            return true;
        }));
    }

    @Test
    @DisplayName("TC-01 & QTN-23: Đang có tồn 10 lon giá vốn 8,000 VND. Nhập thêm 1 Thùng (24 lon) giá 240,000 VND -> Giá vốn bình quân = (80k + 240k) / 34 = 9,411.76 VND")
    void createGoodsReceipt_withUnitConversion_movingAverage_success() {
        testProduct.setStockQuantity(new BigDecimal("10.000"));
        testProduct.setCostPrice(new BigDecimal("8000.00"));

        CreateGoodsReceiptDetailRequest detailReq = CreateGoodsReceiptDetailRequest.builder()
                .productId("prod-1")
                .quantity(new BigDecimal("1"))
                .purchasePrice(new BigDecimal("240000.00"))
                .unitConversionId("conv-1")
                .build();

        CreateGoodsReceiptRequest request = CreateGoodsReceiptRequest.builder()
                .details(List.of(detailReq))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findAllByIdInAndHouseholdIdAndDeletedAtIsNull(anyList(), eq("hh-1")))
                .thenReturn(List.of(testProduct));
        when(productUnitConversionRepository.findAllById(any()))
                .thenReturn(List.of(testConversion));

        when(goodsReceiptRepository.save(any(GoodsReceipt.class))).thenAnswer(invocation -> {
            GoodsReceipt gr = invocation.getArgument(0);
            gr.setId("receipt-1");
            return gr;
        });

        GoodsReceiptResponse response = goodsReceiptService.createGoodsReceipt("owner", request);

        assertNotNull(response);
        // Tồn kho: 10 + 24 = 34
        assertEquals(new BigDecimal("34.000"), testProduct.getStockQuantity());

        // Giá vốn: (10 * 8000 + 240000) / 34 = 320000 / 34 = 9411.76
        assertEquals(new BigDecimal("9411.76"), testProduct.getCostPrice());
    }

    @Test
    @DisplayName("P2-02: getGoodsReceipts tính toán đúng returnStatus NOT_RETURNED, PARTIALLY_RETURNED, FULLY_RETURNED")
    void getGoodsReceipts_MapsReturnStatusCorrectly() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));

        GoodsReceipt gr1 = GoodsReceipt.builder()
                .id("gr-1")
                .receiptNumber("NK-001")
                .household(testHousehold)
                .createdByUser(testUser)
                .totalAmount(new BigDecimal("1000000.00"))
                .build();

        GoodsReceipt gr2 = GoodsReceipt.builder()
                .id("gr-2")
                .receiptNumber("NK-002")
                .household(testHousehold)
                .createdByUser(testUser)
                .totalAmount(new BigDecimal("2000000.00"))
                .build();

        GoodsReceipt gr3 = GoodsReceipt.builder()
                .id("gr-3")
                .receiptNumber("NK-003")
                .household(testHousehold)
                .createdByUser(testUser)
                .totalAmount(new BigDecimal("500000.00"))
                .build();

        org.springframework.data.domain.Page<GoodsReceipt> receiptPage =
                new org.springframework.data.domain.PageImpl<>(List.of(gr1, gr2, gr3));

        when(goodsReceiptRepository.findByHouseholdId(eq("hh-1"), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(receiptPage);

        // gr-1: chưa trả (0)
        // gr-2: trả một phần (500k)
        // gr-3: trả toàn bộ (500k)
        List<Object[]> returnTotals = List.of(
                new Object[]{"gr-2", new BigDecimal("500000.00")},
                new Object[]{"gr-3", new BigDecimal("500000.00")}
        );
        when(supplierReturnRepository.sumTotalReturnAmountByReceiptIds(eq(List.of("gr-1", "gr-2", "gr-3")), eq("hh-1")))
                .thenReturn(returnTotals);

        com.sales.common.dto.PageResponse<GoodsReceiptResponse> result =
                goodsReceiptService.getGoodsReceipts("owner", 0, 10);

        assertNotNull(result);
        assertEquals(3, result.getContent().size());

        GoodsReceiptResponse resp1 = result.getContent().get(0);
        assertEquals("NOT_RETURNED", resp1.getReturnStatus());
        assertEquals(BigDecimal.ZERO, resp1.getTotalReturnedAmount());

        GoodsReceiptResponse resp2 = result.getContent().get(1);
        assertEquals("PARTIALLY_RETURNED", resp2.getReturnStatus());
        assertEquals(new BigDecimal("500000.00"), resp2.getTotalReturnedAmount());

        GoodsReceiptResponse resp3 = result.getContent().get(2);
        assertEquals("FULLY_RETURNED", resp3.getReturnStatus());
        assertEquals(new BigDecimal("500000.00"), resp3.getTotalReturnedAmount());
    }
}
