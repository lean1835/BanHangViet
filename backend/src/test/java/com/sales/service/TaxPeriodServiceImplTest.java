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

import com.sales.dto.response.TaxRevenueSummaryResponse;
import com.sales.repository.TaxRateRepository;

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
    private TaxRateRepository taxRateRepository;

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
        when(invoiceRepository.findValidInvoicesForTaxPeriod(eq("hh-001"), any(LocalDateTime.class), any(LocalDateTime.class)))
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
        when(invoiceRepository.findValidInvoicesForTaxPeriod(eq("hh-001"), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(validOriginal, decreaseAdjust));
        when(taxPeriodRepository.save(any(TaxDeclarationPeriod.class))).thenAnswer(i -> {
            TaxDeclarationPeriod p = i.getArgument(0);
            p.setId("period-m9-2026");
            return p;
        });

        TaxPeriodResponse response = taxPeriodService.generateSalesRegister("ketoan01", request);

        assertNotNull(response);
        // Hóa đơn bị HỦY bị loại bỏ từ query Database -> Còn 2 hóa đơn trong list trả về
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
        when(invoiceRepository.findValidInvoicesForTaxPeriod(eq("hh-001"), any(LocalDateTime.class), any(LocalDateTime.class)))
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

    @Test
    @DisplayName("Lấy chi tiết kỳ kê khai thuế thành công")
    void getTaxPeriodDetail_success() {
        TaxDeclarationPeriod period = TaxDeclarationPeriod.builder()
                .id("period-123")
                .household(household)
                .periodName("Tháng 09/2026")
                .periodType("MONTHLY")
                .year(2026)
                .periodNumber(9)
                .startDate(java.time.LocalDate.of(2026, 9, 1))
                .endDate(java.time.LocalDate.of(2026, 9, 30))
                .status("GENERATED")
                .createdByUser(accountantUser)
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(accountantUser));
        when(taxPeriodRepository.findByIdAndHouseholdId("period-123", "hh-001")).thenReturn(Optional.of(period));

        TaxPeriodResponse response = taxPeriodService.getTaxPeriodDetail("ketoan01", "period-123");

        assertNotNull(response);
        assertEquals("period-123", response.getId());
        assertEquals("Tháng 09/2026", response.getPeriodName());
    }

    @Test
    @DisplayName("Lấy danh sách các kỳ kê khai thuế thành công")
    void getAllTaxPeriods_success() {
        TaxDeclarationPeriod period = TaxDeclarationPeriod.builder()
                .id("period-123")
                .household(household)
                .periodName("Tháng 09/2026")
                .periodType("MONTHLY")
                .year(2026)
                .periodNumber(9)
                .status("GENERATED")
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(accountantUser));
        when(taxPeriodRepository.findByHouseholdIdOrderByYearDescPeriodNumberDesc("hh-001")).thenReturn(List.of(period));

        List<TaxPeriodResponse> response = taxPeriodService.getAllTaxPeriods("ketoan01");

        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("period-123", response.get(0).getId());
    }

    @Test
    @DisplayName("Lấy danh sách dòng bảng kê hóa đơn bán ra phân trang thành công")
    void getSalesRegisterItems_success() {
        TaxDeclarationPeriod period = TaxDeclarationPeriod.builder()
                .id("period-123")
                .household(household)
                .build();

        EInvoice inv = EInvoice.builder()
                .id("inv-001")
                .build();

        TaxSalesRegister registerItem = TaxSalesRegister.builder()
                .id("item-123")
                .period(period)
                .invoice(inv)
                .invoicePattern("1")
                .invoiceSymbol("1C26TAA")
                .invoiceNumber("00000001")
                .issueDate(LocalDateTime.now())
                .taxRatePercentage(new BigDecimal("10.00"))
                .revenueAmount(new BigDecimal("1000000.00"))
                .taxAmount(new BigDecimal("100000.00"))
                .invoiceType("ORIGINAL")
                .build();

        org.springframework.data.domain.Page<TaxSalesRegister> page = new org.springframework.data.domain.PageImpl<>(
                List.of(registerItem),
                org.springframework.data.domain.PageRequest.of(0, 10),
                1
        );

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(accountantUser));
        when(taxPeriodRepository.findByIdAndHouseholdId("period-123", "hh-001")).thenReturn(Optional.of(period));
        when(salesRegisterRepository.findByPeriodId(eq("period-123"), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        var response = taxPeriodService.getSalesRegisterItems("ketoan01", "period-123", 0, 10);

        assertNotNull(response);
        assertEquals(0, response.getPageNumber());
        assertEquals(10, response.getPageSize());
        assertEquals(1, response.getTotalElements());
        assertEquals(1, response.getContent().size());
        assertEquals("item-123", response.getContent().get(0).getId());
    }

    @Test
    @DisplayName("Tổng hợp doanh thu chịu thuế thành công - Phân tách nhiều mức thuế suất (TC-01)")
    void getTaxRevenueSummary_success_multiTaxRates() {
        TaxDeclarationPeriod period = TaxDeclarationPeriod.builder()
                .id("period-q3-2026")
                .household(household)
                .periodName("Bảng kê hóa đơn bán ra Quý 3 năm 2026")
                .periodType("QUARTERLY")
                .year(2026)
                .periodNumber(3)
                .build();

        EInvoice inv1 = EInvoice.builder().id("inv-01").build();
        EInvoice inv2 = EInvoice.builder().id("inv-02").build();

        TaxSalesRegister reg1 = TaxSalesRegister.builder()
                .id("reg-01")
                .period(period)
                .invoice(inv1)
                .taxRatePercentage(new BigDecimal("8.00"))
                .revenueAmount(new BigDecimal("100000000.00"))
                .taxAmount(new BigDecimal("8000000.00"))
                .build();

        TaxSalesRegister reg2 = TaxSalesRegister.builder()
                .id("reg-02")
                .period(period)
                .invoice(inv2)
                .taxRatePercentage(new BigDecimal("5.00"))
                .revenueAmount(new BigDecimal("84000000.00"))
                .taxAmount(new BigDecimal("4200000.00"))
                .build();

        TaxRate tr8 = TaxRate.builder().id("tr-8").household(household).name("Thuế VAT 8%").ratePercentage(new BigDecimal("8.00")).isActive(true).build();
        TaxRate tr5 = TaxRate.builder().id("tr-5").household(household).name("Thuế VAT 5%").ratePercentage(new BigDecimal("5.00")).isActive(true).build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(accountantUser));
        when(taxPeriodRepository.findByIdAndHouseholdId("period-q3-2026", "hh-001")).thenReturn(Optional.of(period));
        when(salesRegisterRepository.findByPeriodId("period-q3-2026")).thenReturn(List.of(reg1, reg2));
        when(taxRateRepository.findByHouseholdIdOrderByCreatedAtDesc("hh-001")).thenReturn(List.of(tr8, tr5));

        TaxRevenueSummaryResponse response = taxPeriodService.getTaxRevenueSummary("ketoan01", "period-q3-2026");

        assertNotNull(response);
        assertEquals("period-q3-2026", response.getPeriodId());
        assertEquals(new BigDecimal("184000000.00"), response.getTotalRevenue());
        assertEquals(new BigDecimal("12200000.00"), response.getTotalTaxAmount());
        assertEquals(2, response.getTaxRateSummaries().size());

        // Verified sorted by rate ascending: 5.00% first, 8.00% second
        assertEquals(new BigDecimal("5.00"), response.getTaxRateSummaries().get(0).getTaxRatePercentage());
        assertEquals(new BigDecimal("84000000.00"), response.getTaxRateSummaries().get(0).getRevenueAmount());

        assertEquals(new BigDecimal("8.00"), response.getTaxRateSummaries().get(1).getTaxRatePercentage());
        assertEquals(new BigDecimal("100000000.00"), response.getTaxRateSummaries().get(1).getRevenueAmount());
    }

    @Test
    @DisplayName("Ngoại lệ: Mặt hàng trong kỳ gán mức thuế đã ngừng hiệu lực -> Ném PRODUCT_TAX_RATE_INACTIVE (TC-02)")
    void getTaxRevenueSummary_inactiveTaxRate_throwsException() {
        TaxDeclarationPeriod period = TaxDeclarationPeriod.builder()
                .id("period-q3-2026")
                .household(household)
                .build();

        EInvoice inv1 = EInvoice.builder().id("inv-01").build();

        TaxSalesRegister reg1 = TaxSalesRegister.builder()
                .id("reg-01")
                .period(period)
                .invoice(inv1)
                .taxRatePercentage(new BigDecimal("10.00"))
                .revenueAmount(new BigDecimal("5000000.00"))
                .taxAmount(new BigDecimal("500000.00"))
                .build();

        TaxRate trInactive = TaxRate.builder()
                .id("tr-10")
                .household(household)
                .name("Thuế VAT 10% (Cũ)")
                .ratePercentage(new BigDecimal("10.00"))
                .isActive(false)
                .build();

        when(userRepository.findByUsername("ketoan01")).thenReturn(Optional.of(accountantUser));
        when(taxPeriodRepository.findByIdAndHouseholdId("period-q3-2026", "hh-001")).thenReturn(Optional.of(period));
        when(salesRegisterRepository.findByPeriodId("period-q3-2026")).thenReturn(List.of(reg1));
        when(taxRateRepository.findByHouseholdIdOrderByCreatedAtDesc("hh-001")).thenReturn(List.of(trInactive));

        AppException ex = assertThrows(AppException.class, () ->
                taxPeriodService.getTaxRevenueSummary("ketoan01", "period-q3-2026"));

        assertEquals(ErrorCode.PRODUCT_TAX_RATE_INACTIVE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Chặn truy cập: Nhân viên bán hàng (VT-02) không được phép xem tổng hợp doanh thu -> Ném FORBIDDEN (TC-03)")
    void getTaxRevenueSummary_salesStaffRole_throwsForbidden() {
        when(userRepository.findByUsername("banhang01")).thenReturn(Optional.of(salesStaffUser));

        AppException ex = assertThrows(AppException.class, () ->
                taxPeriodService.getTaxRevenueSummary("banhang01", "period-q3-2026"));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }
}
