package com.sales.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sales.dto.request.CreateSupplierRequest;
import com.sales.dto.request.UpdateSupplierRequest;
import com.sales.dto.response.SupplierResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.Role;
import com.sales.entity.Supplier;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.GoodsReceiptRepository;
import com.sales.repository.SupplierRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.SupplierServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SupplierServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private SupplierRepository supplierRepository;

    @Mock
    private GoodsReceiptRepository goodsReceiptRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private SupplierServiceImpl supplierService;

    private User currentUser;
    private BusinessHousehold household;
    private Supplier sampleSupplier;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();

        household = BusinessHousehold.builder()
                .id("household-101")
                .name("Hộ kinh doanh Test")
                .taxCode("0123456789")
                .build();

        currentUser = User.builder()
                .id("user-101")
                .username("chuho_test")
                .household(household)
                .role(ownerRole)
                .build();

        sampleSupplier = Supplier.builder()
                .id("supplier-1")
                .household(household)
                .name("Nhà Cung Cấp Nước Giải Khát")
                .phoneNumber("0912345678")
                .email("supplier@test.com")
                .address("123 Lê Lợi")
                .taxCode("0312345678")
                .note("Cung cấp đồ uống")
                .build();
    }

    @Test
    @DisplayName("Tạo nhà cung cấp mới thành công")
    void createSupplier_success() {
        CreateSupplierRequest request = CreateSupplierRequest.builder()
                .name("Nhà Cung Cấp Nước Giải Khát")
                .phoneNumber("0912345678")
                .email("supplier@test.com")
                .address("123 Lê Lợi")
                .taxCode("0312345678")
                .note("Cung cấp đồ uống")
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.existsByHouseholdIdAndPhoneNumberAndDeletedAtIsNull("household-101", "0912345678")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenReturn(sampleSupplier);

        SupplierResponse response = supplierService.createSupplier("chuho_test", request);

        assertNotNull(response);
        assertEquals("supplier-1", response.getId());
        assertEquals("Nhà Cung Cấp Nước Giải Khát", response.getName());
        assertEquals("0912345678", response.getPhoneNumber());

        verify(supplierRepository, times(1)).save(any(Supplier.class));
    }

    @Test
    @DisplayName("Tạo nhà cung cấp thất bại do trùng số điện thoại")
    void createSupplier_phoneExists() {
        CreateSupplierRequest request = CreateSupplierRequest.builder()
                .name("Nhà Cung Cấp Mới")
                .phoneNumber("0912345678")
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.existsByHouseholdIdAndPhoneNumberAndDeletedAtIsNull("household-101", "0912345678")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () ->
                supplierService.createSupplier("chuho_test", request));

        assertEquals(ErrorCode.SUPPLIER_PHONE_EXISTS, exception.getErrorCode());
        verify(supplierRepository, never()).save(any(Supplier.class));
    }

    @Test
    @DisplayName("Cập nhật nhà cung cấp thành công")
    void updateSupplier_success() {
        UpdateSupplierRequest request = UpdateSupplierRequest.builder()
                .name("Nhà Cung Cấp Đã Cập Nhật")
                .phoneNumber("0987654321")
                .email("updated@test.com")
                .address("456 Nguyễn Huệ")
                .taxCode("0387654321")
                .note("Ghi chú mới")
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("supplier-1", "household-101")).thenReturn(Optional.of(sampleSupplier));
        when(supplierRepository.existsByHouseholdIdAndPhoneNumberAndIdNotAndDeletedAtIsNull("household-101", "0987654321", "supplier-1")).thenReturn(false);
        when(supplierRepository.save(any(Supplier.class))).thenReturn(sampleSupplier);

        SupplierResponse response = supplierService.updateSupplier("chuho_test", "supplier-1", request);

        assertNotNull(response);
        verify(supplierRepository, times(1)).save(sampleSupplier);
    }

    @Test
    @DisplayName("Cập nhật nhà cung cấp thất bại do không tìm thấy")
    void updateSupplier_notFound() {
        UpdateSupplierRequest request = UpdateSupplierRequest.builder()
                .name("Nhà Cung Cấp Test")
                .phoneNumber("0987654321")
                .build();

        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("invalid-id", "household-101")).thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () ->
                supplierService.updateSupplier("chuho_test", "invalid-id", request));

        assertEquals(ErrorCode.SUPPLIER_NOT_FOUND, exception.getErrorCode());
    }

    @Test
    @DisplayName("Lấy chi tiết nhà cung cấp thành công")
    void getSupplier_success() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("supplier-1", "household-101")).thenReturn(Optional.of(sampleSupplier));

        SupplierResponse response = supplierService.getSupplier("chuho_test", "supplier-1");

        assertNotNull(response);
        assertEquals("supplier-1", response.getId());
        assertEquals("0912345678", response.getPhoneNumber());
    }

    @Test
    @DisplayName("Lấy danh sách nhà cung cấp thành công")
    void getSuppliers_success() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findAllByHouseholdIdAndDeletedAtIsNull("household-101")).thenReturn(List.of(sampleSupplier));

        List<SupplierResponse> responses = supplierService.getSuppliers("chuho_test");

        assertEquals(1, responses.size());
        assertEquals("supplier-1", responses.get(0).getId());
    }

    @Test
    @DisplayName("Tìm kiếm nhà cung cấp thành công")
    void searchSuppliers_success() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.searchSuppliers("household-101", "Giải Khát")).thenReturn(List.of(sampleSupplier));

        List<SupplierResponse> responses = supplierService.searchSuppliers("chuho_test", "Giải Khát");

        assertEquals(1, responses.size());
        assertEquals("Nhà Cung Cấp Nước Giải Khát", responses.get(0).getName());
    }

    @Test
    @DisplayName("Xóa nhà cung cấp thành công")
    void deleteSupplier_success() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("supplier-1", "household-101")).thenReturn(Optional.of(sampleSupplier));
        when(goodsReceiptRepository.existsBySupplierId("supplier-1")).thenReturn(false);

        supplierService.deleteSupplier("chuho_test", "supplier-1");

        verify(supplierRepository, times(1)).save(sampleSupplier);
        assertNotNull(sampleSupplier.getDeletedAt());
    }

    @Test
    @DisplayName("Xóa nhà cung cấp thất bại do đã phát sinh phiếu nhập kho")
    void deleteSupplier_hasDependencies() {
        when(userRepository.findByUsername("chuho_test")).thenReturn(Optional.of(currentUser));
        when(supplierRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("supplier-1", "household-101")).thenReturn(Optional.of(sampleSupplier));
        when(goodsReceiptRepository.existsBySupplierId("supplier-1")).thenReturn(true);

        AppException exception = assertThrows(AppException.class, () ->
                supplierService.deleteSupplier("chuho_test", "supplier-1"));

        assertEquals(ErrorCode.SUPPLIER_HAS_DEPENDENCIES, exception.getErrorCode());
        assertNull(sampleSupplier.getDeletedAt());
    }
}
