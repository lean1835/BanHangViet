package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.PointOfSaleRequest;
import com.sales.dto.response.PointOfSaleResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.PointOfSaleServiceImpl;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PointOfSaleServiceTest {

    @Mock
    private PointOfSaleRepository pointOfSaleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private PointOfSaleServiceImpl pointOfSaleService;

    private User ownerUser;
    private User staffUser;
    private User accountantUser;
    private BusinessHousehold household;
    private PointOfSale defaultPos;
    private PointOfSale branchPos;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ kinh doanh").build();
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();
        Role accountantRole = Role.builder().code("VT-03").name("Kế toán").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .taxCode("0123456789")
                .name("Tạp Hóa Bà Năm")
                .address("123 Lê Lợi, Phường Bến Nghé, Quận 1")
                .phoneNumber("0901234567")
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

        accountantUser = User.builder()
                .id("user-accountant")
                .username("accountant")
                .role(accountantRole)
                .household(household)
                .build();

        defaultPos = PointOfSale.builder()
                .id("pos-001")
                .household(household)
                .posCode("POS-01")
                .name("Quầy chính - Lê Lợi")
                .address("123 Lê Lợi, Quận 1")
                .phoneNumber("0901234567")
                .invoiceSymbol("C26TAA")
                .isDefault(true)
                .isActive(true)
                .build();

        branchPos = PointOfSale.builder()
                .id("pos-002")
                .household(household)
                .posCode("POS-02")
                .name("Chi nhánh 2 - Bến Nghé")
                .address("12 Đường Lê Lợi, Phường Bến Nghé")
                .phoneNumber("0909998888")
                .invoiceSymbol("C26TAB")
                .isDefault(false)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("Tạo điểm bán đầu tiên: Tự động gán làm điểm bán mặc định (is_default = true)")
    void createPointOfSale_FirstPOS_AutoDefault() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.existsByHouseholdIdAndNameIgnoreCaseAndDeletedAtIsNull(eq("house-001"), anyString()))
                .thenReturn(false);
        when(pointOfSaleRepository.countByHouseholdIdAndDeletedAtIsNull("house-001")).thenReturn(0L);
        when(pointOfSaleRepository.save(any(PointOfSale.class))).thenAnswer(invocation -> {
            PointOfSale p = invocation.getArgument(0);
            p.setId("pos-generated-id");
            return p;
        });

        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Quầy chính")
                .address("123 Lê Lợi, Quận 1")
                .phoneNumber("0901234567")
                .build();

        PointOfSaleResponse response = pointOfSaleService.createPointOfSale("owner", request);

        assertNotNull(response);
        assertEquals("Quầy chính", response.getName());
        assertTrue(response.getIsDefault());
        assertEquals("POS-01", response.getPosCode());
        verify(pointOfSaleRepository, times(1)).save(any(PointOfSale.class));
    }

    @Test
    @DisplayName("NCL-17-CN-001-TC-01: Chủ hộ khai báo điểm bán thứ hai thành công")
    void createPointOfSale_SecondPOS_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.existsByHouseholdIdAndNameIgnoreCaseAndDeletedAtIsNull(eq("house-001"), eq("Tạp hóa Bà Năm - CN2")))
                .thenReturn(false);
        when(pointOfSaleRepository.existsByHouseholdIdAndPosCodeIgnoreCaseAndDeletedAtIsNull(eq("house-001"), eq("POS-02")))
                .thenReturn(false);
        when(pointOfSaleRepository.existsByHouseholdIdAndInvoiceSymbolIgnoreCaseAndDeletedAtIsNull(eq("house-001"), eq("C26TAB")))
                .thenReturn(false);
        when(pointOfSaleRepository.countByHouseholdIdAndDeletedAtIsNull("house-001")).thenReturn(1L);
        when(pointOfSaleRepository.save(any(PointOfSale.class))).thenAnswer(invocation -> {
            PointOfSale p = invocation.getArgument(0);
            p.setId("pos-002");
            return p;
        });

        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .posCode("POS-02")
                .name("Tạp hóa Bà Năm - CN2")
                .address("Số 12 đường Lê Lợi, phường Bến Nghé")
                .phoneNumber("0909998888")
                .invoiceSymbol("C26TAB")
                .isDefault(false)
                .isActive(true)
                .build();

        PointOfSaleResponse response = pointOfSaleService.createPointOfSale("owner", request);

        assertNotNull(response);
        assertEquals("pos-002", response.getId());
        assertEquals("Tạp hóa Bà Năm - CN2", response.getName());
        assertEquals("POS-02", response.getPosCode());
        assertEquals("C26TAB", response.getInvoiceSymbol());
        assertFalse(response.getIsDefault());
        assertTrue(response.getIsActive());
    }

    @Test
    @DisplayName("NCL-17-CN-001-TC-02: Chặn tạo điểm bán khi ký hiệu hóa đơn riêng bị trùng")
    void createPointOfSale_DuplicateInvoiceSymbol_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.existsByHouseholdIdAndNameIgnoreCaseAndDeletedAtIsNull(eq("house-001"), anyString()))
                .thenReturn(false);
        when(pointOfSaleRepository.existsByHouseholdIdAndInvoiceSymbolIgnoreCaseAndDeletedAtIsNull(eq("house-001"), eq("C26TAA")))
                .thenReturn(true);

        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Điểm bán mới")
                .address("456 Nguyễn Huệ")
                .invoiceSymbol("C26TAA")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                pointOfSaleService.createPointOfSale("owner", request));

        assertEquals(ErrorCode.POS_INVOICE_SYMBOL_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chặn tạo điểm bán khi tên điểm bán bị trùng lặp trong hộ")
    void createPointOfSale_DuplicateName_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.existsByHouseholdIdAndNameIgnoreCaseAndDeletedAtIsNull(eq("house-001"), eq("Quầy chính - Lê Lợi")))
                .thenReturn(true);

        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Quầy chính - Lê Lợi")
                .address("123 Lê Lợi")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                pointOfSaleService.createPointOfSale("owner", request));

        assertEquals(ErrorCode.POS_NAME_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-17-CN-001-TC-03: Kế toán hoặc Nhân viên bán hàng không có quyền tạo điểm bán mới")
    void createPointOfSale_NonOwner_ThrowsForbidden() {
        when(userRepository.findByUsername("accountant")).thenReturn(Optional.of(accountantUser));

        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Điểm bán mới")
                .address("123 Lê Lợi")
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                pointOfSaleService.createPointOfSale("accountant", request));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    @DisplayName("Cập nhật thông tin điểm bán thành công")
    void updatePointOfSale_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(pointOfSaleRepository.existsByHouseholdIdAndNameIgnoreCaseAndIdNotAndDeletedAtIsNull(
                eq("house-001"), eq("Chi nhánh 2 - Mới"), eq("pos-002"))).thenReturn(false);
        when(pointOfSaleRepository.save(any(PointOfSale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Chi nhánh 2 - Mới")
                .address("999 Hai Bà Trưng")
                .phoneNumber("0912345678")
                .isActive(true)
                .build();

        PointOfSaleResponse response = pointOfSaleService.updatePointOfSale("owner", "pos-002", request);

        assertNotNull(response);
        assertEquals("Chi nhánh 2 - Mới", response.getName());
        assertEquals("999 Hai Bà Trưng", response.getAddress());
        assertEquals("0912345678", response.getPhoneNumber());
    }

    @Test
    @DisplayName("Chặn vô hiệu hóa điểm bán mặc định (không được deactivate)")
    void updatePointOfSale_DeactivateDefaultPOS_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-001", "house-001"))
                .thenReturn(Optional.of(defaultPos));

        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Quầy chính")
                .address("123 Lê Lợi")
                .isActive(false) // Cố tình tắt hoạt động
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                pointOfSaleService.updatePointOfSale("owner", "pos-001", request));

        assertEquals(ErrorCode.CANNOT_DEACTIVATE_DEFAULT_POS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Thiết lập điểm bán mặc định mới thành công: Reset điểm cũ")
    void setDefaultPointOfSale_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(pointOfSaleRepository.save(any(PointOfSale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PointOfSaleResponse response = pointOfSaleService.setDefaultPointOfSale("owner", "pos-002");

        assertNotNull(response);
        assertTrue(response.getIsDefault());
        verify(pointOfSaleRepository, times(1)).resetDefaultExcept("house-001", "pos-002");
    }

    @Test
    @DisplayName("Chặn thiết lập điểm bán đang ngưng hoạt động làm mặc định (CANNOT_SET_INACTIVE_POS_AS_DEFAULT)")
    void setDefaultPointOfSale_InactivePOS_ThrowsException() {
        PointOfSale inactivePos = PointOfSale.builder()
                .id("pos-003")
                .household(household)
                .posCode("POS-03")
                .name("Quầy ngưng hoạt động")
                .address("123 Test")
                .isDefault(false)
                .isActive(false)
                .build();

        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-003", "house-001"))
                .thenReturn(Optional.of(inactivePos));

        AppException ex = assertThrows(AppException.class, () ->
                pointOfSaleService.setDefaultPointOfSale("owner", "pos-003"));

        assertEquals(ErrorCode.CANNOT_SET_INACTIVE_POS_AS_DEFAULT, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chặn cập nhật điểm bán vừa đặt mặc định vừa ngưng hoạt động (CANNOT_SET_INACTIVE_POS_AS_DEFAULT)")
    void updatePointOfSale_SetInactivePOSAsDefault_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));

        PointOfSaleRequest request = PointOfSaleRequest.builder()
                .name("Quầy 2 Sửa")
                .address("123 Lê Lợi")
                .isDefault(true)
                .isActive(false)
                .build();

        AppException ex = assertThrows(AppException.class, () ->
                pointOfSaleService.updatePointOfSale("owner", "pos-002", request));

        assertEquals(ErrorCode.CANNOT_SET_INACTIVE_POS_AS_DEFAULT, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chặn xóa điểm bán mặc định (CANNOT_DELETE_DEFAULT_POS)")
    void deletePointOfSale_DefaultPOS_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-001", "house-001"))
                .thenReturn(Optional.of(defaultPos));

        AppException ex = assertThrows(AppException.class, () ->
                pointOfSaleService.deletePointOfSale("owner", "pos-001"));

        assertEquals(ErrorCode.CANNOT_DELETE_DEFAULT_POS, ex.getErrorCode());
    }

    @Test
    @DisplayName("Xóa điểm bán phụ thành công (Soft Delete)")
    void deletePointOfSale_Success() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-002", "house-001"))
                .thenReturn(Optional.of(branchPos));
        when(pointOfSaleRepository.save(any(PointOfSale.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertDoesNotThrow(() -> pointOfSaleService.deletePointOfSale("owner", "pos-002"));

        assertFalse(branchPos.getIsActive());
        assertNotNull(branchPos.getDeletedAt());
        verify(pointOfSaleRepository, times(1)).save(branchPos);
    }

    @Test
    @DisplayName("Lấy danh sách điểm bán đang hoạt động cho Nhân viên bán hàng (Dropdown)")
    void getActivePointsOfSale_Staff_Success() {
        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(staffUser));
        when(pointOfSaleRepository.findAllByHouseholdIdAndIsActiveTrueAndDeletedAtIsNull("house-001"))
                .thenReturn(List.of(defaultPos, branchPos));

        List<PointOfSaleResponse> list = pointOfSaleService.getActivePointsOfSale("staff");

        assertNotNull(list);
        assertEquals(2, list.size());
    }

    @Test
    @DisplayName("Lấy danh sách điểm bán có phân trang cho Kế toán")
    void getAllPointsOfSale_Accountant_Success() {
        when(userRepository.findByUsername("accountant")).thenReturn(Optional.of(accountantUser));
        Pageable pageable = PageRequest.of(0, 10);
        Page<PointOfSale> page = new PageImpl<>(List.of(defaultPos, branchPos), pageable, 2);

        when(pointOfSaleRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

        Page<PointOfSaleResponse> result = pointOfSaleService.getAllPointsOfSale("accountant", "Lê Lợi", true, pageable);

        assertNotNull(result);
        assertEquals(2, result.getTotalElements());
    }
}
