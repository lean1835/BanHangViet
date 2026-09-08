package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateGoodsReceiptDetailRequest;
import com.sales.dto.request.CreateGoodsReceiptRequest;
import com.sales.dto.response.GoodsReceiptResponse;
import com.sales.entity.*;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.GoodsReceiptServiceImpl;
import com.sales.service.interfaces.SupplierDebtService;
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
}
