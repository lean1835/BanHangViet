package com.sales.service;

import com.sales.dto.request.BarcodeScanRequest;
import com.sales.dto.request.CreateOrderItemRequest;
import com.sales.dto.response.BarcodeScanResponse;
import com.sales.dto.response.OrderResponse;
import com.sales.dto.response.PromotionItemResultResponse;
import com.sales.entity.*;
import com.sales.repository.ProductRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.BarcodeServiceImpl;
import com.sales.service.interfaces.OrderService;
import com.sales.service.interfaces.PromotionService;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BarcodeServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private PromotionService promotionService;

    @Mock
    private OrderService orderService;

    @InjectMocks
    private BarcodeServiceImpl barcodeService;

    private User mockUser;
    private BusinessHousehold mockHousehold;
    private Product mockProduct;

    @BeforeEach
    void setUp() {
        mockHousehold = BusinessHousehold.builder()
                .id("household-123")
                .name("Hộ Kinh Doanh Test")
                .build();

        mockUser = User.builder()
                .id("user-1")
                .username("seller")
                .fullName("Nhân viên bán hàng")
                .household(mockHousehold)
                .build();

        mockProduct = Product.builder()
                .id("prod-88")
                .sku("8934567890123")
                .barcode("8934567890123")
                .name("Nước mắm Nam Ngư 500ml")
                .unit("Chai")
                .price(new BigDecimal("35000.00"))
                .stockQuantity(new BigDecimal("100.000"))
                .household(mockHousehold)
                .build();
    }

    @Test
    @DisplayName("NCL-16-CN-001-TC-01: Quét mã vạch thành công - Trả về thông tin sản phẩm và khuyến mại")
    void scanBarcode_Success_ReturnsProductAndPromotion() {
        BarcodeScanRequest request = BarcodeScanRequest.builder()
                .barcode("8934567890123")
                .build();

        PromotionItemResultResponse promoResult = PromotionItemResultResponse.builder()
                .originalSubtotal(new BigDecimal("35000.00"))
                .discountAmount(new BigDecimal("3500.00"))
                .finalSubtotal(new BigDecimal("31500.00"))
                .promotionId("promo-1")
                .promotionName("Giảm 10% nước mắm")
                .build();

        when(userRepository.findByUsername("seller")).thenReturn(Optional.of(mockUser));
        when(productRepository.findByHouseholdIdAndBarcodeOrSku("household-123", "8934567890123"))
                .thenReturn(List.of(mockProduct));
        when(promotionService.calculateItemPromotion(eq(mockUser), eq(mockProduct), eq(BigDecimal.ONE), eq(new BigDecimal("35000.00")), eq(false)))
                .thenReturn(promoResult);

        BarcodeScanResponse response = barcodeService.scanBarcode("seller", request);

        assertNotNull(response);
        assertTrue(response.getFound());
        assertEquals("prod-88", response.getProductId());
        assertEquals("Nước mắm Nam Ngư 500ml", response.getProductName());
        assertEquals(new BigDecimal("35000.00"), response.getUnitPrice());
        assertEquals(new BigDecimal("3500.00"), response.getDiscountAmount());
        assertEquals(new BigDecimal("31500.00"), response.getSubtotal());
        assertEquals("promo-1", response.getPromotionId());
    }

    @Test
    @DisplayName("NCL-16-CN-001-TC-02: Quét mã vạch không tồn tại trong hệ thống - Trả về found = false")
    void scanBarcode_NotFound_ReturnsFoundFalse() {
        BarcodeScanRequest request = BarcodeScanRequest.builder()
                .barcode("9999999999999")
                .build();

        when(userRepository.findByUsername("seller")).thenReturn(Optional.of(mockUser));
        when(productRepository.findByHouseholdIdAndBarcodeOrSku("household-123", "9999999999999"))
                .thenReturn(Collections.emptyList());

        BarcodeScanResponse response = barcodeService.scanBarcode("seller", request);

        assertNotNull(response);
        assertFalse(response.getFound());
        assertEquals("9999999999999", response.getSuggestedBarcode());
        assertTrue(response.getMessage().contains("chưa được gán cho mặt hàng nào"));
        assertNull(response.getProductId());
    }

    @Test
    @DisplayName("NCL-16-CN-001-TC-03: Quét mã vạch có orderId - Ủy quyền OrderService thực hiện thêm sản phẩm")
    void scanBarcode_WithOrderId_DelegatesToOrderService() {
        BarcodeScanRequest request = BarcodeScanRequest.builder()
                .barcode("8934567890123")
                .orderId("order-100")
                .quantity(BigDecimal.ONE)
                .build();

        PromotionItemResultResponse promoResult1 = PromotionItemResultResponse.builder()
                .originalSubtotal(new BigDecimal("35000.00"))
                .discountAmount(new BigDecimal("3500.00"))
                .finalSubtotal(new BigDecimal("31500.00"))
                .build();

        OrderResponse mockOrderResponse = OrderResponse.builder()
                .id("order-100")
                .totalAmount(new BigDecimal("94500.00"))
                .finalAmount(new BigDecimal("94500.00"))
                .build();

        when(userRepository.findByUsername("seller")).thenReturn(Optional.of(mockUser));
        when(productRepository.findByHouseholdIdAndBarcodeOrSku("household-123", "8934567890123"))
                .thenReturn(List.of(mockProduct));
        when(promotionService.calculateItemPromotion(eq(mockUser), eq(mockProduct), eq(BigDecimal.ONE), eq(new BigDecimal("35000.00")), eq(false)))
                .thenReturn(promoResult1);
        when(orderService.addOrderItem(eq("seller"), eq("order-100"), any(CreateOrderItemRequest.class)))
                .thenReturn(mockOrderResponse);

        BarcodeScanResponse response = barcodeService.scanBarcode("seller", request);

        assertNotNull(response);
        assertTrue(response.getFound());
        assertNotNull(response.getOrder());
        assertEquals("order-100", response.getOrder().getId());
        verify(orderService).addOrderItem(eq("seller"), eq("order-100"), any(CreateOrderItemRequest.class));
    }
}
