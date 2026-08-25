package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.InitPosInventoryRequest;
import com.sales.dto.request.PosInventoryItemRequest;
import com.sales.dto.request.UpdatePosInventoryRequest;
import com.sales.dto.response.PosInventoryResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.PosInventoryRepository;
import com.sales.repository.ProductRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.PosInventoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PosInventoryServiceTest {

    @Mock
    private PosInventoryRepository posInventoryRepository;

    @Mock
    private PointOfSaleRepository pointOfSaleRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PosInventoryServiceImpl posInventoryService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;
    private PointOfSale branchPos;
    private Product product1;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build();
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .taxCode("0123456789")
                .name("Tạp Hóa Bà Năm")
                .build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("chuho")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();

        staffUser = User.builder()
                .id("user-staff")
                .username("bannam01")
                .role(staffRole)
                .household(household)
                .isActive(true)
                .build();

        branchPos = PointOfSale.builder()
                .id("pos-002")
                .household(household)
                .posCode("POS-02")
                .name("Điểm bán Chi nhánh 2")
                .isActive(true)
                .build();

        TaxRate taxRate = TaxRate.builder().id("tax-1").ratePercentage(BigDecimal.valueOf(1.0)).build();

        product1 = Product.builder()
                .id("prod-001")
                .household(household)
                .sku("8934567890123")
                .name("Nước ngọt Coca-Cola 320ml")
                .unit("Lon")
                .price(BigDecimal.valueOf(10000))
                .stockQuantity(BigDecimal.valueOf(150))
                .taxRate(taxRate)
                .status("ACTIVE")
                .build();
    }

    @Test
    @DisplayName("Khởi tạo tồn kho cho điểm bán thành công")
    void testInitOrUpdatePosInventories_Success() {
        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(productRepository.findAllById(List.of("prod-001")))
                .thenReturn(List.of(product1));
        when(posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(eq("house-001"), eq("pos-002"), any()))
                .thenReturn(List.of());
        when(posInventoryRepository.saveAll(anyIterable())).thenAnswer(invocation -> invocation.getArgument(0));

        InitPosInventoryRequest request = InitPosInventoryRequest.builder()
                .items(List.of(
                        PosInventoryItemRequest.builder()
                                .productId("prod-001")
                                .stockQuantity(BigDecimal.valueOf(12))
                                .minStockQuantity(BigDecimal.valueOf(5))
                                .build()
                ))
                .build();

        List<PosInventoryResponse> responses = posInventoryService.initOrUpdatePosInventories("chuho", "pos-002", request);

        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("prod-001", responses.get(0).getProductId());
        assertEquals(BigDecimal.valueOf(12), responses.get(0).getStockQuantity());
        assertEquals(BigDecimal.valueOf(5), responses.get(0).getMinStockQuantity());

        verify(posInventoryRepository).saveAll(anyIterable());
    }

    @Test
    @DisplayName("Cập nhật tồn kho sản phẩm tại điểm bán thành công")
    void testUpdatePosInventory_Success() {
        PosInventory existing = PosInventory.builder()
                .id("pos-inv-1")
                .household(household)
                .pointOfSale(branchPos)
                .product(product1)
                .stockQuantity(BigDecimal.valueOf(12))
                .minStockQuantity(BigDecimal.valueOf(5))
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(productRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("prod-001", "house-001"))
                .thenReturn(Optional.of(product1));
        when(posInventoryRepository.findByPointOfSaleIdAndProductId("pos-002", "prod-001"))
                .thenReturn(Optional.of(existing));
        when(posInventoryRepository.save(any(PosInventory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdatePosInventoryRequest request = UpdatePosInventoryRequest.builder()
                .stockQuantity(BigDecimal.valueOf(20))
                .minStockQuantity(BigDecimal.valueOf(8))
                .build();

        PosInventoryResponse response = posInventoryService.updatePosInventory("chuho", "pos-002", "prod-001", request);

        assertNotNull(response);
        assertEquals(BigDecimal.valueOf(20), response.getStockQuantity());
        assertEquals(BigDecimal.valueOf(8), response.getMinStockQuantity());
    }

    @Test
    @DisplayName("Trừ tồn kho điểm bán thành công")
    void testCheckAndDeductPosStock_Success() {
        PosInventory existing = PosInventory.builder()
                .id("pos-inv-1")
                .household(household)
                .pointOfSale(branchPos)
                .product(product1)
                .stockQuantity(BigDecimal.valueOf(12))
                .minStockQuantity(BigDecimal.valueOf(5))
                .build();

        when(posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(eq("house-001"), eq("pos-002"), any()))
                .thenReturn(List.of(existing));
        when(posInventoryRepository.saveAll(anyIterable())).thenAnswer(invocation -> invocation.getArgument(0));

        posInventoryService.checkAndDeductPosStock("house-001", "pos-002", "prod-001", BigDecimal.valueOf(3));

        assertEquals(BigDecimal.valueOf(9), existing.getStockQuantity());
        verify(posInventoryRepository).saveAll(anyIterable());
    }

    @Test
    @DisplayName("Trừ tồn kho thất bại khi sản phẩm chưa được khai báo tại điểm bán")
    void testCheckAndDeductPosStock_NotInitialized() {
        when(posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(eq("house-001"), eq("pos-002"), any()))
                .thenReturn(List.of());

        AppException ex = assertThrows(AppException.class, () ->
                posInventoryService.checkAndDeductPosStock("house-001", "pos-002", "prod-001", BigDecimal.valueOf(3)));

        assertEquals(ErrorCode.POS_PRODUCT_NOT_INITIALIZED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Lấy danh sách cảnh báo tồn kho sắp hết tại điểm bán")
    void testGetLowStockWarningsByPos_Success() {
        PosInventory lowStockInv = PosInventory.builder()
                .id("pos-inv-1")
                .household(household)
                .pointOfSale(branchPos)
                .product(product1)
                .stockQuantity(BigDecimal.valueOf(2))
                .minStockQuantity(BigDecimal.valueOf(5))
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(posInventoryRepository.findLowStockInventoriesByPos("house-001", "pos-002"))
                .thenReturn(List.of(lowStockInv));

        List<PosInventoryResponse> list = posInventoryService.getLowStockWarningsByPos("chuho", "pos-002");

        assertNotNull(list);
        assertEquals(1, list.size());
        assertTrue(list.get(0).getIsLowStock());
    }
}
