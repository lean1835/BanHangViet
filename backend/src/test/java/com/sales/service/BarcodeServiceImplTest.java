package com.sales.service;

import com.sales.dto.request.AssignBarcodeRequest;
import com.sales.dto.response.BarcodeResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Product;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.ProductRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.BarcodeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
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

    @InjectMocks
    private BarcodeServiceImpl barcodeService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;
    private Product product;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();
        Role staffRole = Role.builder().code("VT-02").name("Bán hàng").build();

        household = BusinessHousehold.builder()
                .id("house-100")
                .name("Cửa Hàng Thực Phẩm Viet")
                .taxCode("0123456789")
                .build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("owner")
                .role(ownerRole)
                .household(household)
                .build();

        staffUser = User.builder()
                .id("user-staff")
                .username("staff")
                .role(staffRole)
                .household(household)
                .build();

        product = Product.builder()
                .id("prod-001")
                .sku("SP001")
                .name("Nước mắm Nam Ngư chai 500ml")
                .unit("Chai")
                .price(new BigDecimal("45000.00"))
                .stockQuantity(new BigDecimal("50.000"))
                .household(household)
                .barcode(null)
                .build();
    }

    @Test
    @DisplayName("NCL-16-CN-002-TC-01: Sinh mã vạch nội bộ thành công cho sản phẩm chưa có mã")
    void testGenerateInternalBarcode_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-001", "house-100"))
                .thenReturn(Optional.of(product));
        when(productRepository.existsByHouseholdIdAndBarcodeAndDeletedAtIsNull(eq("house-100"), any()))
                .thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BarcodeResponse response = barcodeService.generateInternalBarcode("owner", "prod-001");

        assertNotNull(response);
        assertEquals("prod-001", response.getProductId());
        assertEquals("SP001", response.getSku());
        assertNotNull(response.getBarcode());
        assertTrue(response.getBarcode().startsWith("200"));
        assertNotNull(response.getBarcodeBase64Image());
        assertTrue(response.getBarcodeBase64Image().startsWith("data:image/png;base64,"));
        assertEquals("Cửa Hàng Thực Phẩm Viet", response.getHouseholdName());
    }

    @Test
    @DisplayName("NCL-16-CN-002-TC-02: Xử lý va chạm trùng mã nội bộ và thử lại cho đến khi duy nhất")
    void testGenerateInternalBarcode_HandlesCollision() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-001", "house-100"))
                .thenReturn(Optional.of(product));
        // Lần đầu bị trùng (true), lần thứ hai thành công (false)
        when(productRepository.existsByHouseholdIdAndBarcodeAndDeletedAtIsNull(eq("house-100"), any()))
                .thenReturn(true)
                .thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        BarcodeResponse response = barcodeService.generateInternalBarcode("owner", "prod-001");

        assertNotNull(response);
        assertNotNull(response.getBarcode());
        verify(productRepository, times(2)).existsByHouseholdIdAndBarcodeAndDeletedAtIsNull(eq("house-100"), any());
    }

    @Test
    @DisplayName("NCL-16-CN-002-TC-03: Nhân viên bán hàng bấm sinh mã bị ném lỗi cấm quyền")
    void testGenerateInternalBarcode_SalesStaffRole_ThrowsForbidden() {
        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(staffUser));

        AppException exception = assertThrows(AppException.class, () ->
                barcodeService.generateInternalBarcode("staff", "prod-001")
        );

        assertEquals(ErrorCode.FORBIDDEN_BARCODE_MANAGEMENT, exception.getErrorCode());
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("QTN-27: Gán mã vạch thủ công thành công khi không bị trùng")
    void testAssignBarcode_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-001", "house-100"))
                .thenReturn(Optional.of(product));
        when(productRepository.existsByHouseholdIdAndBarcodeAndIdNotAndDeletedAtIsNull("house-100", "8934567890123", "prod-001"))
                .thenReturn(false);
        when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AssignBarcodeRequest request = AssignBarcodeRequest.builder()
                .barcode("8934567890123")
                .build();

        BarcodeResponse response = barcodeService.assignBarcode("owner", "prod-001", request);

        assertNotNull(response);
        assertEquals("8934567890123", response.getBarcode());
        assertNotNull(response.getBarcodeBase64Image());
    }

    @Test
    @DisplayName("QTN-27: Gán mã vạch trùng lặp với sản phẩm khác trong hộ ném lỗi BARCODE_ALREADY_EXISTS")
    void testAssignBarcode_Duplicate_ThrowsAppException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-001", "house-100"))
                .thenReturn(Optional.of(product));
        when(productRepository.existsByHouseholdIdAndBarcodeAndIdNotAndDeletedAtIsNull("house-100", "8934567890123", "prod-001"))
                .thenReturn(true);

        AssignBarcodeRequest request = AssignBarcodeRequest.builder()
                .barcode("8934567890123")
                .build();

        AppException exception = assertThrows(AppException.class, () ->
                barcodeService.assignBarcode("owner", "prod-001", request)
        );

        assertEquals(ErrorCode.BARCODE_ALREADY_EXISTS, exception.getErrorCode());
        verify(productRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lấy dữ liệu tem in mã vạch thành công với khổ giấy 58mm")
    void testGetBarcodePrintData_Success() {
        product.setBarcode("200123456789");
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-001", "house-100"))
                .thenReturn(Optional.of(product));

        BarcodeResponse response = barcodeService.getBarcodePrintData("owner", "prod-001", "58mm", 2);

        assertNotNull(response);
        assertEquals("200123456789", response.getBarcode());
        assertEquals("58mm", response.getPaperSize());
        assertEquals(2, response.getQuantity());
        assertNotNull(response.getBarcodeBase64Image());
    }
}
