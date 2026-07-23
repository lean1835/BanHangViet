package com.viet.sales.service;

import com.viet.sales.constant.BackupType;
import com.viet.sales.entity.BusinessHousehold;
import com.viet.sales.entity.Product;
import com.viet.sales.entity.Role;
import com.viet.sales.entity.User;
import com.viet.sales.exception.AppException;
import com.viet.sales.exception.ErrorCode;
import com.viet.sales.repository.EInvoiceRepository;
import com.viet.sales.repository.ProductRepository;
import com.viet.sales.repository.UserRepository;
import com.viet.sales.service.classes.BackupServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BackupServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @InjectMocks
    private BackupServiceImpl backupService;

    private User ownerUser;
    private User staffUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        Role ownerRole = Role.builder().code("VT-01").name("Chủ hộ").build();
        Role staffRole = Role.builder().code("VT-02").name("Nhân viên bán hàng").build();

        household = BusinessHousehold.builder()
                .id("house-001")
                .taxCode("0123456789")
                .name("Hộ Kinh Doanh Mẫu")
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
    }

    @Test
    @DisplayName("NCL-09-CN-006-TC-03: Nhân viên bán hàng cố truy cập API sao lưu -> Bị chặn với FORBIDDEN (403)")
    void exportBackupData_StaffRole_ThrowsForbidden() {
        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(staffUser));

        AppException exception = assertThrows(AppException.class, () ->
                backupService.exportBackupData("staff", BackupType.PRODUCTS, LocalDate.now(), LocalDate.now())
        );

        assertEquals(ErrorCode.FORBIDDEN, exception.getErrorCode());
        assertEquals(HttpStatus.FORBIDDEN, exception.getErrorCode().getStatusCode());
    }

    @Test
    @DisplayName("NCL-09-CN-006-TC-02: Không có dữ liệu trong khoảng thời gian chọn -> Ném NO_DATA_TO_EXPORT (400)")
    void exportBackupData_NoData_ThrowsException() {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));
        when(productRepository.findAll(any(Specification.class))).thenReturn(Collections.emptyList());

        AppException exception = assertThrows(AppException.class, () ->
                backupService.exportBackupData("owner", BackupType.PRODUCTS, LocalDate.now(), LocalDate.now())
        );

        assertEquals(ErrorCode.NO_DATA_TO_EXPORT, exception.getErrorCode());
    }

    @Test
    @DisplayName("NCL-09-CN-006-TC-01: Chủ hộ chọn xuất sản phẩm -> Tạo tệp `.xlsx` sao lưu thành công")
    void exportBackupData_Products_Success() throws Exception {
        when(userRepository.findByUsername("owner")).thenReturn(Optional.of(ownerUser));

        Product p1 = Product.builder()
                .id("p-001")
                .sku("SP001")
                .name("Cà phê Muối")
                .unit("Ly")
                .price(new BigDecimal("35000"))
                .stockQuantity(new BigDecimal("50"))
                .status("ACTIVE")
                .build();

        when(productRepository.findAll(any(Specification.class))).thenReturn(List.of(p1));

        ResponseEntity<Resource> response = backupService.exportBackupData("owner", BackupType.PRODUCTS, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31));

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getHeaders().get(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION).get(0).contains("backup_products_20260101_20260131.xlsx"));
    }
}
