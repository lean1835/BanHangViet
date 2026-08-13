package com.sales.service;

import com.sales.dto.request.GenerateTaxRegisterRequest;
import com.sales.dto.response.TaxPeriodResponse;
import com.sales.entity.*;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.TaxDeclarationPeriodRepository;
import com.sales.repository.TaxSalesRegisterRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ActivityLogHelper;
import com.sales.service.classes.TaxPeriodServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaxPeriodServiceImplTest {

    @Mock
    private TaxDeclarationPeriodRepository taxPeriodRepository;

    @Mock
    private TaxSalesRegisterRepository salesRegisterRepository;

    @Mock
    private EInvoiceRepository invoiceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogHelper activityLogHelper;

    @InjectMocks
    private TaxPeriodServiceImpl taxPeriodService;

    private User accountantUser;
    private User salesStaffUser;
    private BusinessHousehold household;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("hh-001")
                .name("Hộ kinh doanh Tạp Hóa Việt")
                .build();

        Role accountantRole = Role.builder().id(3).code("VT-03").name("Kế toán").build();
        accountantUser = User.builder()
                .id("user-acc")
                .username("ketoan01")
                .fullName("Nguyễn Văn Kế Toán")
                .household(household)
                .role(accountantRole)
                .build();

        Role salesRole = Role.builder().id(2).code("VT-02").name("Nhân viên bán hàng").build();
        salesStaffUser = User.builder()
                .id("user-sales")
                .username("banhang01")
                .fullName("Lê Văn Bán Hàng")
                .household(household)
                .role(salesRole)
                .build();
    }

    @Test
    @DisplayName("Lập bảng kê thành công - Quý 3/2026 có 2 hóa đơn hợp lệ (TC-01)")
    void generateSalesRegister_success_quarterly() {
        GenerateTaxRegisterRequest request = GenerateTaxRegisterRequest.builder()
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(3)
                .build();

        EInvoice inv1 = EInvoice.builder()
                .id("inv-001")
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .invoiceNumber("00000001")
                .status("TAX_CODE_GRANTED")
                .totalAmountBeforeTax(new BigDecimal("1000000.00"))
                .taxAmount(new BigDecimal("100000.00"))
                .finalAmount(new BigDecimal("1100000.00"))
                .taxResponseAt(LocalDateTime.of(2026, 8, 15, 10, 0))
                .household(household)
                .build();

        EInvoice inv2 = EInvoice.builder()
                .id("inv-002")
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .invoiceNumber("00000002")
                .status("ISSUED")
                .taxAuthorityCode("TC-12345")
                .totalAmountBeforeTax(new BigDecimal("2000000.00"))
                .taxAmount(new BigDecimal("200000.00"))
                .finalAmount(new BigDecimal("2200000.00"))
                .createdAt(LocalDateTime.of(2026, 9, 1, 14, 0))
                .household(household)
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(accountantUser));
        when(invoiceRepository.findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc("hh-001"))
                .thenReturn(List.of(inv1, inv2));
        when(taxPeriodRepository.findByHouseholdIdAndPeriodTypeAndYearAndPeriodNumber("hh-001", "QUARTERLY", 2026, 3))
                .thenReturn(Optional.empty());

        when(taxPeriodRepository.save(any(TaxDeclarationPeriod.class))).thenAnswer(invocation -> {
            TaxDeclarationPeriod p = invocation.getArgument(0);
            p.setId("period-q3-2026");
            return p;
        });

        TaxPeriodResponse response = taxPeriodService.generateSalesRegister("ketoan01", request);

        assertNotNull(response);
        assertEquals("QUARTERLY", response.getPeriodType());
        assertEquals(2026, response.getYear());
        assertEquals(3, response.getPeriodNumber());
        assertEquals(2, response.getTotalValidInvoices());
        assertEquals(new BigDecimal("3000000.00"), response.getTotalRevenue());
        assertEquals(new BigDecimal("300000.00"), response.getTotalTaxAmount());

        verify(salesRegisterRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("Loại bỏ hóa đơn bị HỦY và trừ bớt hóa đơn ĐIỀU CHỈNH GIẢM (TC-02 & QTN-22)")
    void generateSalesRegister_withCanceledAndAdjustedInvoices() {
        GenerateTaxRegisterRequest request = GenerateTaxRegisterRequest.builder()
                .periodType("MONTHLY")
                .year(2026)
                .periodNumber(9)
                .build();

        EInvoice validOriginal = EInvoice.builder()
                .id("inv-orig")
                .status("TAX_CODE_GRANTED")
                .totalAmountBeforeTax(new BigDecimal("5000000.00"))
                .taxAmount(new BigDecimal("500000.00"))
                .taxResponseAt(LocalDateTime.of(2026, 9, 10, 10, 0))
                .household(household)
                .build();

        EInvoice canceledInvoice = EInvoice.builder()
                .id("inv-canceled")
                .status("CANCELED")
                .totalAmountBeforeTax(new BigDecimal("3000000.00"))
                .taxAmount(new BigDecimal("300000.00"))
                .taxResponseAt(LocalDateTime.of(2026, 9, 12, 11, 0))
                .household(household)
                .build();

        EInvoice decreaseAdjust = EInvoice.builder()
                .id("inv-decrease")
                .status("TAX_CODE_GRANTED")
                .title("HÓA ĐƠN ĐIỀU CHỈNH GIẢM GIÁ TRỊ GIA TĂNG")
                .returnTicket(new ReturnTicket())
                .totalAmountBeforeTax(new BigDecimal("1000000.00"))
                .taxAmount(new BigDecimal("100000.00"))
                .taxResponseAt(LocalDateTime.of(2026, 9, 15, 14, 0))
                .household(household)
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(accountantUser));
        when(invoiceRepository.findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc("hh-001"))
                .thenReturn(List.of(validOriginal, canceledInvoice, decreaseAdjust));
        when(taxPeriodRepository.save(any(TaxDeclarationPeriod.class))).thenAnswer(i -> {
            TaxDeclarationPeriod p = i.getArgument(0);
            p.setId("period-m9-2026");
            return p;
        });

        TaxPeriodResponse response = taxPeriodService.generateSalesRegister("ketoan01", request);

        assertNotNull(response);
        // Hóa đơn bị HỦY bị loại bỏ -> Còn 2 hóa đơn
        assertEquals(2, response.getTotalValidInvoices());
        // Doanh thu = 5,000,000 - 1,000,000 = 4,000,000
        assertEquals(new BigDecimal("4000000.00"), response.getTotalRevenue());
        // Thuế = 500,000 - 100,000 = 400,000
        assertEquals(new BigDecimal("400000.00"), response.getTotalTaxAmount());
    }

    @Test
    @DisplayName("Kỳ rỗng không có hóa đơn -> Ném lỗi NO_VALID_INVOICES_IN_PERIOD và không lưu kỳ rỗng (TC-03 & QTN-22)")
    void generateSalesRegister_emptyPeriod_throwsException() {
        GenerateTaxRegisterRequest request = GenerateTaxRegisterRequest.builder()
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(4)
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(accountantUser));
        when(invoiceRepository.findByHouseholdIdAndDeletedAtIsNullOrderByCreatedAtDesc("hh-001"))
                .thenReturn(Collections.emptyList());

        AppException ex = assertThrows(AppException.class, () ->
                taxPeriodService.generateSalesRegister("ketoan01", request));

        assertEquals(ErrorCode.NO_VALID_INVOICES_IN_PERIOD, ex.getErrorCode());
        verify(taxPeriodRepository, never()).save(any());
        verify(salesRegisterRepository, never()).saveAll(any());
    }

    @Test
    @DisplayName("Nhân viên bán hàng truy cập -> Ném lỗi FORBIDDEN (TC-04)")
    void generateSalesRegister_salesStaffRole_throwsForbidden() {
        GenerateTaxRegisterRequest request = GenerateTaxRegisterRequest.builder()
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(3)
                .build();

        when(userRepository.findByUsername("banhang01")).thenReturn(Optional.of(salesStaffUser));

        AppException ex = assertThrows(AppException.class, () ->
                taxPeriodService.generateSalesRegister("banhang01", request));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        verify(taxPeriodRepository, never()).save(any());
    }
}
