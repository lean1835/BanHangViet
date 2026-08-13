package com.sales.service;

import com.sales.dto.request.CreateInventoryAuditDetailRequest;
import com.sales.dto.request.CreateInventoryAuditRequest;
import com.sales.dto.response.InventoryAuditDetailInfoResponse;
import com.sales.dto.response.InventoryAuditResponse;
import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PendingOrderCheckResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.InventoryAuditServiceImpl;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryAuditServiceImplTest {

    @Mock
    private InventoryAuditRepository inventoryAuditRepository;

    @Mock
    private InventoryAuditDetailRepository inventoryAuditDetailRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @InjectMocks
    private InventoryAuditServiceImpl inventoryAuditService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;
    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên").build();

        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ Tạp Hóa Việt")
                .taxCode("0123456789")
                .build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("chuho_test")
                .fullName("Nguyễn Văn Owner")
                .role(ownerRole)
                .household(household)
                .build();

        staffUser = User.builder()
                .id("user-staff")
                .username("nhanvien_test")
                .fullName("Trần Văn Staff")
                .role(staffRole)
                .household(household)
                .build();

        sampleProduct = Product.builder()
                .id("prod-1")
                .household(household)
                .sku("SP001")
                .name("Nước ngọt Coca-Cola 320ml")
                .unit("Lon")
                .stockQuantity(new BigDecimal("12.000"))
                .price(new BigDecimal("10000.00"))
                .costPrice(new BigDecimal("8000.00"))
                .build();
    }

    @Test
    @DisplayName("NCL-13-CN-004-TC-01: Lập phiếu kiểm kê thành công và điều chỉnh tồn kho")
    void testCreateInventoryAudit_Success() {
        // Arrange: Tồn kho hệ thống = 12, thực tế đếm = 10, chênh lệch = -2, có lý do
        CreateInventoryAuditDetailRequest detailReq = CreateInventoryAuditDetailRequest.builder()
                .productId("prod-1")
                .actualQuantity(new BigDecimal("10.000"))
                .reason("Hao hụt hỏng hóc trong quá trình vận chuyển")
                .build();

        CreateInventoryAuditRequest request = CreateInventoryAuditRequest.builder()
                .notes("Đợt kiểm kê định kỳ tháng 8")
                .details(List.of(detailReq))
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(sampleProduct));
        when(inventoryAuditRepository.countByHouseholdId("hh-1")).thenReturn(0L);
        when(inventoryAuditRepository.existsByAuditNumber(anyString())).thenReturn(false);

        InventoryAudit savedAudit = InventoryAudit.builder()
                .id("audit-1")
                .auditNumber("KK-20260812-0001")
                .household(household)
                .createdByUser(ownerUser)
                .auditDate(LocalDateTime.now())
                .status("COMPLETED")
                .totalItems(1)
                .totalDifferenceQty(new BigDecimal("-2.000"))
                .notes("Đợt kiểm kê định kỳ tháng 8")
                .build();

        when(inventoryAuditRepository.save(any(InventoryAudit.class))).thenReturn(savedAudit);

        // Act
        InventoryAuditResponse response = inventoryAuditService.createInventoryAudit("chuho_test", request);

        // Assert
        assertNotNull(response);
        assertEquals("audit-1", response.getId());
        assertEquals("KK-20260812-0001", response.getAuditNumber());
        assertEquals(1, response.getTotalItems());
        assertEquals(new BigDecimal("-2.000"), response.getTotalDifferenceQty());

        // Kiểm tra tồn kho của sản phẩm đã được cập nhật về 10.000
        assertEquals(new BigDecimal("10.000"), sampleProduct.getStockQuantity());
        verify(productRepository, times(1)).save(sampleProduct);
        verify(inventoryAuditRepository, times(1)).save(any(InventoryAudit.class));
        verify(inventoryAuditDetailRepository, times(1)).save(any(InventoryAuditDetail.class));
        verify(activityLogHelper, times(1)).logActivityInNewTransaction(
                eq(household), eq(ownerUser), eq("KIEM_KE_KHO"), eq("inventory_audits"),
                eq("audit-1"), any(), any(), any(), any()
        );
    }

    @Test
    @DisplayName("NCL-13-CN-004-TC-02: Lập phiếu kiểm kê thất bại do chênh lệch tồn nhưng để trống lý do")
    void testCreateInventoryAudit_DiscrepancyWithoutReason_ThrowsException() {
        // Arrange: Tồn hệ thống = 12, thực đếm = 10, chênh lệch = -2, để trống lý do
        CreateInventoryAuditDetailRequest detailReq = CreateInventoryAuditDetailRequest.builder()
                .productId("prod-1")
                .actualQuantity(new BigDecimal("10.000"))
                .reason("   ") // Rỗng/Trống
                .build();

        CreateInventoryAuditRequest request = CreateInventoryAuditRequest.builder()
                .details(List.of(detailReq))
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-1", "hh-1"))
                .thenReturn(Optional.of(sampleProduct));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () ->
                inventoryAuditService.createInventoryAudit("chuho_test", request)
        );

        assertEquals(ErrorCode.DISCREPANCY_REASON_REQUIRED, exception.getErrorCode());
        verify(inventoryAuditRepository, never()).save(any());
    }

    @Test
    @DisplayName("NCL-13-CN-004-TC-04: Lập phiếu kiểm kê thất bại do vai trò nhân viên bán hàng (VT-02)")
    void testCreateInventoryAudit_NonOwnerRole_ThrowsException() {
        CreateInventoryAuditRequest request = CreateInventoryAuditRequest.builder()
                .details(Collections.emptyList())
                .build();

        when(userRepository.findByUsername("nhanvien_test")).thenReturn(Optional.of(staffUser));

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () ->
                inventoryAuditService.createInventoryAudit("nhanvien_test", request)
        );

        assertEquals(ErrorCode.ONLY_STORE_OWNER_CAN_AUDIT, exception.getErrorCode());
    }

    @Test
    @DisplayName("NCL-13-CN-004-TC-03: Kiểm tra đơn hàng đang tạo (CREATING)")
    void testCheckPendingOrders() {
        Order creatingOrder = Order.builder()
                .id("order-1")
                .orderNumber("HD-001")
                .status("CREATING")
                .household(household)
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(orderRepository.findByHouseholdIdAndStatusAndDeletedAtIsNull("hh-1", "CREATING"))
                .thenReturn(List.of(creatingOrder));

        PendingOrderCheckResponse response = inventoryAuditService.checkPendingOrders("chuho_test");

        assertTrue(response.isHasPendingOrders());
        assertEquals(1, response.getPendingOrderCount());
        assertTrue(response.getPendingOrderNumbers().contains("HD-001"));
        assertTrue(response.getWarningMessage().contains("HD-001"));
    }

    @Test
    @DisplayName("Lấy danh sách phiếu kiểm kê kho phân trang")
    void testGetInventoryAudits_Success() {
        InventoryAudit audit = InventoryAudit.builder()
                .id("audit-1")
                .auditNumber("KK-20260812-0001")
                .household(household)
                .createdByUser(ownerUser)
                .auditDate(LocalDateTime.now())
                .status("COMPLETED")
                .totalItems(1)
                .totalDifferenceQty(BigDecimal.ZERO)
                .build();

        Page<InventoryAudit> page = new PageImpl<>(List.of(audit));

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(inventoryAuditRepository.findByHouseholdIdOrderByCreatedAtDesc(eq("hh-1"), any(Pageable.class)))
                .thenReturn(page);

        PageResponse<InventoryAuditResponse> response = inventoryAuditService.getInventoryAudits("chuho_test", 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("KK-20260812-0001", response.getContent().get(0).getAuditNumber());
    }

    @Test
    @DisplayName("Xem chi tiết phiếu kiểm kê kho theo ID")
    void testGetInventoryAuditById_Success() {
        InventoryAudit audit = InventoryAudit.builder()
                .id("audit-1")
                .auditNumber("KK-20260812-0001")
                .household(household)
                .createdByUser(ownerUser)
                .auditDate(LocalDateTime.now())
                .status("COMPLETED")
                .totalItems(1)
                .totalDifferenceQty(new BigDecimal("-2.000"))
                .build();

        InventoryAuditDetail detail = InventoryAuditDetail.builder()
                .id("detail-1")
                .audit(audit)
                .product(sampleProduct)
                .systemQuantity(new BigDecimal("12.000"))
                .actualQuantity(new BigDecimal("10.000"))
                .differenceQuantity(new BigDecimal("-2.000"))
                .reason("Hao hụt")
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));
        when(inventoryAuditRepository.findByIdAndHouseholdId("audit-1", "hh-1"))
                .thenReturn(Optional.of(audit));
        when(inventoryAuditDetailRepository.findByAuditId("audit-1"))
                .thenReturn(List.of(detail));

        InventoryAuditDetailInfoResponse response = inventoryAuditService.getInventoryAuditById("chuho_test", "audit-1");

        assertNotNull(response);
        assertEquals("KK-20260812-0001", response.getAuditNumber());
        assertEquals(1, response.getDetails().size());
        assertEquals("SP001", response.getDetails().get(0).getProductSku());
    }

    @Test
    @DisplayName("Ném ngoại lệ khi có sản phẩm trùng lặp trong cùng một phiếu kiểm kê")
    void testCreateInventoryAudit_DuplicateProduct_ThrowsException() {
        CreateInventoryAuditDetailRequest detail1 = CreateInventoryAuditDetailRequest.builder()
                .productId("prod-1")
                .actualQuantity(new BigDecimal("10.000"))
                .reason("Hao hụt")
                .build();

        CreateInventoryAuditDetailRequest detail2 = CreateInventoryAuditDetailRequest.builder()
                .productId("prod-1")
                .actualQuantity(new BigDecimal("8.000"))
                .reason("Sai sót đếm lại")
                .build();

        CreateInventoryAuditRequest request = CreateInventoryAuditRequest.builder()
                .details(List.of(detail1, detail2))
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(ownerUser));

        AppException exception = assertThrows(AppException.class, () ->
                inventoryAuditService.createInventoryAudit("chuho_test", request)
        );

        assertEquals(ErrorCode.DUPLICATE_PRODUCT_IN_AUDIT, exception.getErrorCode());
    }
}
