package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateProductUnitConversionRequest;
import com.sales.dto.request.UpdateProductUnitConversionRequest;
import com.sales.dto.response.ProductUnitConversionResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.ProductUnitConversionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductUnitConversionServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductUnitConversionRepository productUnitConversionRepository;

    @Mock
    private ProductPriceTierRepository productPriceTierRepository;

    @Mock
    private GoodsReceiptDetailRepository goodsReceiptDetailRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private ReturnTicketItemRepository returnTicketItemRepository;

    @Mock
    private InventoryAuditDetailRepository inventoryAuditDetailRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ProductUnitConversionServiceImpl conversionService;

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
                .id("user-1")
                .username("owner")
                .household(testHousehold)
                .build();

        testProduct = Product.builder()
                .id("prod-1")
                .household(testHousehold)
                .name("Bia Hà Nội")
                .sku("BHN-001")
                .unit("Lon")
                .price(new BigDecimal("12000.00"))
                .costPrice(new BigDecimal("10000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .build();
    }

    @Test
    @DisplayName("Tạo đơn vị quy đổi thành công")
    void createUnitConversion_success() {
        CreateProductUnitConversionRequest request = CreateProductUnitConversionRequest.builder()
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .price(new BigDecimal("270000.00"))
                .barcode("8934567890123")
                .isDefaultImport(true)
                .isDefaultSale(true)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));
        when(productUnitConversionRepository.existsByProductIdAndUnitNameIgnoreCase("prod-1", "Thùng"))
                .thenReturn(false);
        when(productRepository.existsByHouseholdIdAndBarcodeAndDeletedAtIsNull("hh-1", "8934567890123"))
                .thenReturn(false);
        when(productUnitConversionRepository.existsByHouseholdIdAndBarcodeAndIdNot("hh-1", "8934567890123", null))
                .thenReturn(false);

        when(productUnitConversionRepository.save(any(ProductUnitConversion.class)))
                .thenAnswer(invocation -> {
                    ProductUnitConversion c = invocation.getArgument(0);
                    c.setId("conv-1");
                    return c;
                });

        ProductUnitConversionResponse response = conversionService.createUnitConversion("owner", "prod-1", request);

        assertNotNull(response);
        assertEquals("Thùng", response.getUnitName());
        assertEquals(new BigDecimal("24"), response.getConversionFactor());
        assertEquals(new BigDecimal("270000.00"), response.getPrice());
        assertEquals("Lon", response.getBaseUnit());
    }

    @Test
    @DisplayName("Tạo đơn vị quy đổi trùng tên đơn vị cơ bản ném lỗi DUPLICATE_UNIT_CONVERSION_NAME")
    void createUnitConversion_duplicateBaseUnit_throwsException() {
        CreateProductUnitConversionRequest request = CreateProductUnitConversionRequest.builder()
                .unitName("Lon") // Trùng đơn vị gốc
                .conversionFactor(new BigDecimal("12"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));

        AppException ex = assertThrows(AppException.class, () ->
                conversionService.createUnitConversion("owner", "prod-1", request));
        assertEquals(ErrorCode.DUPLICATE_UNIT_CONVERSION_NAME, ex.getErrorCode());
    }

    @Test
    @DisplayName("Tạo đơn vị quy đổi với tỷ lệ <= 0 hoặc = 1 ném lỗi INVALID_CONVERSION_FACTOR")
    void createUnitConversion_invalidFactor_throwsException() {
        CreateProductUnitConversionRequest req1 = CreateProductUnitConversionRequest.builder()
                .unitName("Lốc")
                .conversionFactor(BigDecimal.ZERO)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));

        AppException ex1 = assertThrows(AppException.class, () ->
                conversionService.createUnitConversion("owner", "prod-1", req1));
        assertEquals(ErrorCode.INVALID_CONVERSION_FACTOR, ex1.getErrorCode());

        CreateProductUnitConversionRequest req2 = CreateProductUnitConversionRequest.builder()
                .unitName("Lốc")
                .conversionFactor(BigDecimal.ONE)
                .build();

        AppException ex2 = assertThrows(AppException.class, () ->
                conversionService.createUnitConversion("owner", "prod-1", req2));
        assertEquals(ErrorCode.INVALID_CONVERSION_FACTOR, ex2.getErrorCode());
    }

    @Test
    @DisplayName("TC-03: Sửa tỷ lệ quy đổi khi đã có biến động tồn kho bị chặn và ném CANNOT_MODIFY_CONVERSION_WITH_STOCK_MOVEMENT")
    void updateUnitConversion_tc03_stockMovementExists_changingFactor_throwsException() {
        ProductUnitConversion existing = ProductUnitConversion.builder()
                .id("conv-1")
                .product(testProduct)
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .price(new BigDecimal("270000.00"))
                .build();

        UpdateProductUnitConversionRequest request = UpdateProductUnitConversionRequest.builder()
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("30")) // Cố tình đổi từ 24 sang 30
                .price(new BigDecimal("300000.00"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));
        when(productUnitConversionRepository.findByIdAndProductId("conv-1", "prod-1"))
                .thenReturn(Optional.of(existing));

        // Giả lập sản phẩm đã có phiếu nhập kho phát sinh biến động tồn
        when(goodsReceiptDetailRepository.hasStockMovementByProduct("prod-1", "hh-1"))
                .thenReturn(true);

        AppException ex = assertThrows(AppException.class, () ->
                conversionService.updateUnitConversion("owner", "prod-1", "conv-1", request));

        assertEquals(ErrorCode.CANNOT_MODIFY_CONVERSION_WITH_STOCK_MOVEMENT, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-03: Sửa giá bán hoặc tên khi đã có biến động tồn kho nhưng KHÔNG đổi tỷ lệ quy đổi thì được phép thành công")
    void updateUnitConversion_tc03_stockMovementExists_notChangingFactor_success() {
        ProductUnitConversion existing = ProductUnitConversion.builder()
                .id("conv-1")
                .product(testProduct)
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .price(new BigDecimal("270000.00"))
                .build();

        UpdateProductUnitConversionRequest request = UpdateProductUnitConversionRequest.builder()
                .unitName("Thùng 24 lon")
                .conversionFactor(new BigDecimal("24")) // Giữ nguyên tỷ lệ 24
                .price(new BigDecimal("280000.00"))    // Đổi giá bán
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));
        when(productUnitConversionRepository.findByIdAndProductId("conv-1", "prod-1"))
                .thenReturn(Optional.of(existing));
        when(productUnitConversionRepository.existsByProductIdAndUnitNameIgnoreCaseAndIdNot("prod-1", "Thùng 24 lon", "conv-1"))
                .thenReturn(false);
        when(productUnitConversionRepository.save(any(ProductUnitConversion.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ProductUnitConversionResponse response = conversionService.updateUnitConversion("owner", "prod-1", "conv-1", request);

        assertNotNull(response);
        assertEquals("Thùng 24 lon", response.getUnitName());
        assertEquals(new BigDecimal("280000.00"), response.getPrice());
        assertEquals(new BigDecimal("24"), response.getConversionFactor());
    }

    @Test
    @DisplayName("TC-03: Sửa tỷ lệ quy đổi khi CHƯA có biến động tồn kho thì được phép thành công")
    void updateUnitConversion_tc03_noStockMovement_changingFactor_success() {
        ProductUnitConversion existing = ProductUnitConversion.builder()
                .id("conv-1")
                .product(testProduct)
                .unitName("Lốc")
                .conversionFactor(new BigDecimal("6"))
                .price(new BigDecimal("70000.00"))
                .build();

        UpdateProductUnitConversionRequest request = UpdateProductUnitConversionRequest.builder()
                .unitName("Lốc")
                .conversionFactor(new BigDecimal("12")) // Đổi từ 6 sang 12
                .price(new BigDecimal("140000.00"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));
        when(productUnitConversionRepository.findByIdAndProductId("conv-1", "prod-1"))
                .thenReturn(Optional.of(existing));

        // Giả lập hoàn toàn chưa có biến động tồn kho nào
        when(goodsReceiptDetailRepository.hasStockMovementByProduct("prod-1", "hh-1")).thenReturn(false);
        when(orderItemRepository.hasStockMovementByProduct("prod-1", "hh-1")).thenReturn(false);
        when(returnTicketItemRepository.hasStockMovementByProduct("prod-1", "hh-1")).thenReturn(false);
        when(inventoryAuditDetailRepository.hasStockMovementByProduct("prod-1", "hh-1")).thenReturn(false);

        when(productUnitConversionRepository.existsByProductIdAndUnitNameIgnoreCaseAndIdNot("prod-1", "Lốc", "conv-1"))
                .thenReturn(false);
        when(productUnitConversionRepository.save(any(ProductUnitConversion.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ProductUnitConversionResponse response = conversionService.updateUnitConversion("owner", "prod-1", "conv-1", request);

        assertNotNull(response);
        assertEquals(new BigDecimal("12"), response.getConversionFactor());
        assertEquals(new BigDecimal("140000.00"), response.getPrice());
    }

    @Test
    @DisplayName("Xóa đơn vị quy đổi đã phát sinh giao dịch nhập kho ném CANNOT_DELETE_CONVERSION_IN_USE")
    void deleteUnitConversion_inUseInReceipt_throwsException() {
        ProductUnitConversion existing = ProductUnitConversion.builder()
                .id("conv-1")
                .product(testProduct)
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));
        when(productUnitConversionRepository.findByIdAndProductId("conv-1", "prod-1"))
                .thenReturn(Optional.of(existing));
        when(goodsReceiptDetailRepository.existsByUnitConversionId("conv-1")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () ->
                conversionService.deleteUnitConversion("owner", "prod-1", "conv-1"));

        assertEquals(ErrorCode.CANNOT_DELETE_CONVERSION_IN_USE, ex.getErrorCode());
        verify(productUnitConversionRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Xóa đơn vị quy đổi đang được sử dụng trong bậc giá ném CANNOT_DELETE_CONVERSION_IN_USE")
    void deleteUnitConversion_inUseInPriceTier_throwsException() {
        ProductUnitConversion existing = ProductUnitConversion.builder()
                .id("conv-tier-1")
                .product(testProduct)
                .unitName("Thùng")
                .conversionFactor(new BigDecimal("24"))
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(testUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(testProduct));
        when(productUnitConversionRepository.findByIdAndProductId("conv-tier-1", "prod-1"))
                .thenReturn(Optional.of(existing));
        when(goodsReceiptDetailRepository.existsByUnitConversionId("conv-tier-1")).thenReturn(false);
        when(orderItemRepository.existsByUnitConversionId("conv-tier-1")).thenReturn(false);
        when(productPriceTierRepository.existsByUnitConversionId("conv-tier-1")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () ->
                conversionService.deleteUnitConversion("owner", "prod-1", "conv-tier-1"));

        assertEquals(ErrorCode.CANNOT_DELETE_CONVERSION_IN_USE, ex.getErrorCode());
        verify(productUnitConversionRepository, never()).delete(any());
    }
}
