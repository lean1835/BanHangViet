package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.constant.PosTransferStatus;
import com.sales.dto.request.CancelPosTransferRequest;
import com.sales.dto.request.CreatePosTransferRequest;
import com.sales.dto.request.PosTransferItemRequest;
import com.sales.dto.response.PosTransferResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.*;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.PosTransferServiceImpl;
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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PosTransferServiceImplTest {

    @Mock
    private PosTransferRepository posTransferRepository;

    @Mock
    private PosTransferItemRepository posTransferItemRepository;

    @Mock
    private PointOfSaleRepository pointOfSaleRepository;

    @Mock
    private PosInventoryRepository posInventoryRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PosTransferServiceImpl posTransferService;

    private User ownerUser;
    private User staffPos1User;
    private User staffPos2User;
    private BusinessHousehold household;
    private PointOfSale pos1;
    private PointOfSale pos2;
    private Product product1;
    private PosInventory inventoryPos1;
    private PosInventory inventoryPos2;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build();
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .taxCode("0123456789")
                .name("Tạp Hóa Việt")
                .build();

        pos1 = PointOfSale.builder()
                .id("pos-001")
                .household(household)
                .posCode("POS-01")
                .name("Điểm bán Quận 1")
                .isActive(true)
                .build();

        pos2 = PointOfSale.builder()
                .id("pos-002")
                .household(household)
                .posCode("POS-02")
                .name("Điểm bán Quận 2")
                .isActive(true)
                .build();

        ownerUser = User.builder()
                .id("user-owner")
                .username("chuho")
                .fullName("Nguyễn Văn A")
                .role(ownerRole)
                .household(household)
                .isActive(true)
                .build();

        staffPos1User = User.builder()
                .id("user-staff-1")
                .username("nhanvien1")
                .fullName("Trần Thị B")
                .role(staffRole)
                .household(household)
                .pointOfSale(pos1)
                .isActive(true)
                .build();

        staffPos2User = User.builder()
                .id("user-staff-2")
                .username("nhanvien2")
                .fullName("Lê Văn C")
                .role(staffRole)
                .household(household)
                .pointOfSale(pos2)
                .isActive(true)
                .build();

        product1 = Product.builder()
                .id("prod-001")
                .household(household)
                .sku("COCA-320")
                .name("Coca-Cola 320ml")
                .unit("Lon")
                .price(BigDecimal.valueOf(10000))
                .status("ACTIVE")
                .build();

        inventoryPos1 = PosInventory.builder()
                .id("inv-pos1-001")
                .household(household)
                .pointOfSale(pos1)
                .product(product1)
                .stockQuantity(BigDecimal.valueOf(12))
                .minStockQuantity(BigDecimal.valueOf(5))
                .build();

        inventoryPos2 = PosInventory.builder()
                .id("inv-pos2-001")
                .household(household)
                .pointOfSale(pos2)
                .product(product1)
                .stockQuantity(BigDecimal.ZERO)
                .minStockQuantity(BigDecimal.valueOf(5))
                .build();
    }

    @Test
    @DisplayName("TC-01 & TC-02: Lập phiếu chuyển hàng thành công -> Trừ tồn điểm gửi, trạng thái IN_TRANSIT")
    void createTransfer_success() {
        CreatePosTransferRequest request = CreatePosTransferRequest.builder()
                .fromPointOfSaleId("pos-001")
                .toPointOfSaleId("pos-002")
                .notes("Chuyển hàng sang điểm 2")
                .items(List.of(
                        PosTransferItemRequest.builder()
                                .productId("prod-001")
                                .quantity(BigDecimal.valueOf(12))
                                .build()
                ))
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-001", "house-001")).thenReturn(Optional.of(pos1));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001")).thenReturn(Optional.of(pos2));
        when(productRepository.findAllById(List.of("prod-001"))).thenReturn(List.of(product1));
        when(posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(
                eq("house-001"), eq("pos-001"), eq(List.of("prod-001")))).thenReturn(List.of(inventoryPos1));

        when(posTransferRepository.countByHouseholdIdAndTransferNumberStartingWith(any(), any())).thenReturn(0L);
        when(posTransferRepository.existsByTransferNumber(any())).thenReturn(false);

        when(posTransferRepository.save(any(PosTransfer.class))).thenAnswer(invocation -> {
            PosTransfer saved = invocation.getArgument(0);
            saved.setId("trans-001");
            return saved;
        });

        PosTransferResponse response = posTransferService.createTransfer("chuho", request);

        assertNotNull(response);
        assertEquals(PosTransferStatus.IN_TRANSIT, response.getStatus());
        assertEquals("pos-001", response.getFromPointOfSaleId());
        assertEquals("pos-002", response.getToPointOfSaleId());
        assertEquals(BigDecimal.valueOf(12), response.getTotalQuantity());

        // Kiểm tra tồn kho tại điểm gửi đã bị trừ 12
        assertEquals(0, inventoryPos1.getStockQuantity().compareTo(BigDecimal.ZERO));
        verify(posInventoryRepository).saveAll(any());
        verify(posTransferRepository).save(any(PosTransfer.class));
    }

    @Test
    @DisplayName("TC-04: Nhân viên bán hàng lập phiếu chuyển -> Bị chặn (FORBIDDEN)")
    void createTransfer_forbidden_whenNotOwner() {
        CreatePosTransferRequest request = CreatePosTransferRequest.builder()
                .fromPointOfSaleId("pos-001")
                .toPointOfSaleId("pos-002")
                .items(List.of(
                        PosTransferItemRequest.builder()
                                .productId("prod-001")
                                .quantity(BigDecimal.valueOf(5))
                                .build()
                ))
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffPos1User));

        AppException ex = assertThrows(AppException.class, () -> posTransferService.createTransfer("nhanvien1", request));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-05: Điểm gửi và điểm nhận trùng nhau -> Báo lỗi TRANSFER_SAME_POS")
    void createTransfer_samePos_throwsException() {
        CreatePosTransferRequest request = CreatePosTransferRequest.builder()
                .fromPointOfSaleId("pos-001")
                .toPointOfSaleId("pos-001")
                .items(List.of(
                        PosTransferItemRequest.builder()
                                .productId("prod-001")
                                .quantity(BigDecimal.valueOf(5))
                                .build()
                ))
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));

        AppException ex = assertThrows(AppException.class, () -> posTransferService.createTransfer("chuho", request));
        assertEquals(ErrorCode.TRANSFER_SAME_POS, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-03: Số lượng chuyển vượt quá tồn kho điểm gửi -> Báo lỗi TRANSFER_EXCEED_STOCK")
    void createTransfer_exceedStock_throwsException() {
        // Tồn kho điểm 1 có 12 chai, yêu cầu chuyển 15 chai
        CreatePosTransferRequest request = CreatePosTransferRequest.builder()
                .fromPointOfSaleId("pos-001")
                .toPointOfSaleId("pos-002")
                .items(List.of(
                        PosTransferItemRequest.builder()
                                .productId("prod-001")
                                .quantity(BigDecimal.valueOf(15))
                                .build()
                ))
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-001", "house-001")).thenReturn(Optional.of(pos1));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001")).thenReturn(Optional.of(pos2));
        when(productRepository.findAllById(List.of("prod-001"))).thenReturn(List.of(product1));
        when(posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(
                eq("house-001"), eq("pos-001"), eq(List.of("prod-001")))).thenReturn(List.of(inventoryPos1));

        AppException ex = assertThrows(AppException.class, () -> posTransferService.createTransfer("chuho", request));
        assertEquals(ErrorCode.TRANSFER_EXCEED_STOCK, ex.getErrorCode());
        // Đảm bảo tồn kho không bị trừ
        assertEquals(BigDecimal.valueOf(12), inventoryPos1.getStockQuantity());
    }

    @Test
    @DisplayName("TC-01: Bên nhận xác nhận đã nhận đủ -> Cộng tồn kho điểm nhận, status COMPLETED")
    void receiveTransfer_success() {
        PosTransfer transfer = PosTransfer.builder()
                .id("trans-001")
                .household(household)
                .transferNumber("CK-20260825-0001")
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(ownerUser)
                .status(PosTransferStatus.IN_TRANSIT)
                .totalItems(1)
                .totalQuantity(BigDecimal.valueOf(12))
                .transferredAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();

        PosTransferItem item = PosTransferItem.builder()
                .id("item-001")
                .transfer(transfer)
                .product(product1)
                .productSku(product1.getSku())
                .productName(product1.getName())
                .unit(product1.getUnit())
                .quantity(BigDecimal.valueOf(12))
                .build();
        transfer.getItems().add(item);

        when(userRepository.findByUsername("nhanvien2")).thenReturn(Optional.of(staffPos2User));
        when(posTransferRepository.findWithDetailsByIdAndHouseholdId("trans-001", "house-001")).thenReturn(Optional.of(transfer));
        when(posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(
                eq("house-001"), eq("pos-002"), eq(List.of("prod-001")))).thenReturn(List.of(inventoryPos2));
        when(posTransferRepository.save(any(PosTransfer.class))).thenReturn(transfer);

        PosTransferResponse response = posTransferService.receiveTransfer("nhanvien2", "trans-001");

        assertNotNull(response);
        assertEquals(PosTransferStatus.COMPLETED, transfer.getStatus());
        assertEquals("user-staff-2", transfer.getReceivedByUser().getId());
        assertNotNull(transfer.getReceivedAt());

        // Kiểm tra tồn kho điểm 2 được cộng 12 (0 + 12 = 12)
        assertEquals(0, inventoryPos2.getStockQuantity().compareTo(BigDecimal.valueOf(12)));
        verify(posInventoryRepository).saveAll(any());
    }

    @Test
    @DisplayName("TC-04: Nhân viên thuộc điểm 1 không được quyền nhận hàng cho điểm 2 -> Bị chặn")
    void receiveTransfer_byStaffAtWrongPos_throwsException() {
        PosTransfer transfer = PosTransfer.builder()
                .id("trans-001")
                .household(household)
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(ownerUser)
                .status(PosTransferStatus.IN_TRANSIT)
                .build();

        when(userRepository.findByUsername("nhanvien1")).thenReturn(Optional.of(staffPos1User));
        when(posTransferRepository.findWithDetailsByIdAndHouseholdId("trans-001", "house-001")).thenReturn(Optional.of(transfer));

        AppException ex = assertThrows(AppException.class, () -> posTransferService.receiveTransfer("nhanvien1", "trans-001"));
        assertEquals(ErrorCode.TRANSFER_RECEIVER_PERMISSION_DENIED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Xác nhận nhận hàng khi phiếu đã COMPLETED -> Báo lỗi TRANSFER_INVALID_STATUS")
    void receiveTransfer_alreadyCompleted_throwsException() {
        PosTransfer transfer = PosTransfer.builder()
                .id("trans-001")
                .household(household)
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(ownerUser)
                .status(PosTransferStatus.COMPLETED)
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(posTransferRepository.findWithDetailsByIdAndHouseholdId("trans-001", "house-001")).thenReturn(Optional.of(transfer));

        AppException ex = assertThrows(AppException.class, () -> posTransferService.receiveTransfer("chuho", "trans-001"));
        assertEquals(ErrorCode.TRANSFER_INVALID_STATUS, ex.getErrorCode());
    }

    @Test
    @DisplayName("TC-06: Chủ hộ hủy phiếu chuyển hàng -> Hoàn tồn kho về điểm gửi, status CANCELED")
    void cancelTransfer_success() {
        PosTransfer transfer = PosTransfer.builder()
                .id("trans-001")
                .household(household)
                .transferNumber("CK-20260825-0001")
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(ownerUser)
                .status(PosTransferStatus.IN_TRANSIT)
                .totalQuantity(BigDecimal.valueOf(12))
                .items(new ArrayList<>())
                .build();

        PosTransferItem item = PosTransferItem.builder()
                .id("item-001")
                .transfer(transfer)
                .product(product1)
                .productSku(product1.getSku())
                .productName(product1.getName())
                .unit(product1.getUnit())
                .quantity(BigDecimal.valueOf(12))
                .build();
        transfer.getItems().add(item);

        // Giả lập điểm 1 sau khi tạo phiếu còn 0 chai
        inventoryPos1.setStockQuantity(BigDecimal.ZERO);

        CancelPosTransferRequest request = CancelPosTransferRequest.builder()
                .cancelReason("Xe giao hàng gặp sự cố hỏng lốp")
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(posTransferRepository.findWithDetailsByIdAndHouseholdId("trans-001", "house-001")).thenReturn(Optional.of(transfer));
        when(posInventoryRepository.findByHouseholdIdAndPointOfSaleIdAndProductIdIn(
                eq("house-001"), eq("pos-001"), eq(List.of("prod-001")))).thenReturn(List.of(inventoryPos1));
        when(posTransferRepository.save(any(PosTransfer.class))).thenReturn(transfer);

        PosTransferResponse response = posTransferService.cancelTransfer("chuho", "trans-001", request);

        assertNotNull(response);
        assertEquals(PosTransferStatus.CANCELED, transfer.getStatus());
        assertEquals("Xe giao hàng gặp sự cố hỏng lốp", transfer.getCancelReason());
        assertNotNull(transfer.getCanceledAt());
        assertEquals("user-owner", transfer.getCanceledByUser().getId());

        // Kiểm tra tồn kho điểm 1 đã được hoàn lại 12 (0 + 12 = 12)
        assertEquals(0, inventoryPos1.getStockQuantity().compareTo(BigDecimal.valueOf(12)));
        verify(posInventoryRepository).saveAll(any());
    }

    @Test
    @DisplayName("Hủy phiếu chuyển hàng không có lý do -> Báo lỗi TRANSFER_CANCEL_REASON_REQUIRED")
    void cancelTransfer_blankReason_throwsException() {
        CancelPosTransferRequest request = CancelPosTransferRequest.builder()
                .cancelReason("   ")
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));

        AppException ex = assertThrows(AppException.class, () -> posTransferService.cancelTransfer("chuho", "trans-001", request));
        assertEquals(ErrorCode.TRANSFER_CANCEL_REASON_REQUIRED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Xem chi tiết phiếu chuyển hàng thành công")
    void getTransferById_success() {
        PosTransfer transfer = PosTransfer.builder()
                .id("trans-001")
                .household(household)
                .transferNumber("CK-20260825-0001")
                .fromPointOfSale(pos1)
                .toPointOfSale(pos2)
                .createdByUser(ownerUser)
                .status(PosTransferStatus.IN_TRANSIT)
                .items(Collections.emptyList())
                .build();

        when(userRepository.findByUsername("chuho")).thenReturn(Optional.of(ownerUser));
        when(posTransferRepository.findWithDetailsByIdAndHouseholdId("trans-001", "house-001")).thenReturn(Optional.of(transfer));

        PosTransferResponse response = posTransferService.getTransferById("chuho", "trans-001");

        assertNotNull(response);
        assertEquals("trans-001", response.getId());
        assertEquals("CK-20260825-0001", response.getTransferNumber());
    }
}
