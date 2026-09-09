package com.sales.service;

import com.sales.dto.response.InvoiceRepresentationResponse;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.EInvoice;
import com.sales.entity.EInvoiceItem;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.EInvoiceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EInvoiceRepresentationAndExportTest {

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EInvoiceServiceImpl eInvoiceService;

    private User storeOwner;
    private BusinessHousehold household;
    private EInvoice issuedInvoice;
    private EInvoice canceledInvoice;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-1")
                .name("Hộ Kinh Doanh Bà Năm")
                .taxCode("8123456789")
                .address("12 Lê Lợi, P. Bến Nghé, Q1")
                .phoneNumber("0908888888")
                .build();

        Role roleOwner = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();

        storeOwner = User.builder()
                .id("user-owner")
                .username("chuho01")
                .fullName("Bà Năm")
                .household(household)
                .role(roleOwner)
                .build();

        issuedInvoice = EInvoice.builder()
                .id("inv-issued")
                .household(household)
                .invoiceNumber("00000123")
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .title("HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                .buyerName("Nguyễn Văn A")
                .buyerTaxCode("0101234567")
                .buyerAddress("Số 1 Lý Tự Trọng")
                .totalAmountBeforeTax(new BigDecimal("100000"))
                .taxAmount(new BigDecimal("10000"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("110000"))
                .status("ISSUED")
                .taxAuthorityCode("CQT-123456789")
                .lookupCode("LOOKUP123")
                .createdByUser(storeOwner)
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>(List.of(
                        EInvoiceItem.builder()
                                .id("item-1")
                                .productName("Gạo Nàng Hương 5kg")
                                .unit("Túi")
                                .quantity(new BigDecimal("2.000"))
                                .unitPrice(new BigDecimal("50000"))
                                .subtotal(new BigDecimal("100000"))
                                .build()
                )))
                .build();

        canceledInvoice = EInvoice.builder()
                .id("inv-canceled")
                .household(household)
                .invoiceNumber("00000124")
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .title("HÓA ĐƠN GIÁ TRỊ GIA TĂNG")
                .buyerName("Nguyễn Văn B")
                .totalAmountBeforeTax(new BigDecimal("50000"))
                .taxAmount(new BigDecimal("5000"))
                .discountAmount(BigDecimal.ZERO)
                .finalAmount(new BigDecimal("55000"))
                .status("CANCELED")
                .lookupCode("LOOKUP124")
                .createdByUser(storeOwner)
                .createdAt(LocalDateTime.now())
                .items(new ArrayList<>())
                .build();
    }

    @Test
    @DisplayName("NCL-05-CN-006-TC-01: Xuất danh sách hóa đơn tra cứu ra tệp Excel thành công với dòng tổng cộng")
    void testExportInvoicesToExcel_Success() {
        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(storeOwner));
        when(eInvoiceRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(issuedInvoice, canceledInvoice));

        byte[] excelBytes = eInvoiceService.exportInvoicesToExcel("chuho01", "ALL", null, null, null, "127.0.0.1", "JUnit");

        assertNotNull(excelBytes);
        assertTrue(excelBytes.length > 0);
    }

    @Test
    @DisplayName("NCL-05-CN-006-TC-02: Bộ lọc không có dữ liệu -> Báo lỗi NO_DATA_TO_EXPORT và không tạo tệp")
    void testExportInvoicesToExcel_NoData_ThrowsException() {
        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(storeOwner));
        when(eInvoiceRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(Collections.emptyList());

        AppException ex = assertThrows(AppException.class, () ->
                eInvoiceService.exportInvoicesToExcel("chuho01", "ALL", null, null, null, "127.0.0.1", "JUnit"));

        assertEquals(ErrorCode.NO_DATA_TO_EXPORT, ex.getErrorCode());
    }

    @Test
    @DisplayName("NCL-05-CN-007-TC-01: Xem bản thể hiện hóa đơn đã cấp mã hợp lệ")
    void testGetInvoiceRepresentation_Issued() {
        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(storeOwner));
        when(eInvoiceRepository.findById("inv-issued")).thenReturn(Optional.of(issuedInvoice));

        InvoiceRepresentationResponse response = eInvoiceService.getInvoiceRepresentation("chuho01", "inv-issued");

        assertNotNull(response);
        assertEquals("00000123", response.getInvoiceNumber());
        assertEquals("1C26TAA", response.getInvoiceSymbol());
        assertNull(response.getWatermarkText());
        assertFalse(response.isDraft());
        assertFalse(response.isCanceled());
        assertNotNull(response.getHtmlRepresentation());
        assertTrue(response.getHtmlRepresentation().contains("CQT-123456789"));
    }

    @Test
    @DisplayName("NCL-05-CN-007-TC-02: Xem bản thể hiện hóa đơn bị hủy có dấu Watermark HÓA ĐƠN ĐÃ HỦY")
    void testGetInvoiceRepresentation_Canceled() {
        when(userRepository.findByUsername("chuho01")).thenReturn(Optional.of(storeOwner));
        when(eInvoiceRepository.findById("inv-canceled")).thenReturn(Optional.of(canceledInvoice));

        InvoiceRepresentationResponse response = eInvoiceService.getInvoiceRepresentation("chuho01", "inv-canceled");

        assertNotNull(response);
        assertEquals("HÓA ĐƠN ĐÃ HỦY", response.getWatermarkText());
        assertTrue(response.isCanceled());
        assertTrue(response.getHtmlRepresentation().contains("HÓA ĐƠN ĐÃ HỦY"));
    }
}
