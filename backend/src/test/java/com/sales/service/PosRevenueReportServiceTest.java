package com.sales.service;

import com.sales.dto.response.*;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.Role;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.EInvoiceRepository;
import com.sales.repository.OrderRepository;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.ReportServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PosRevenueReportServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private EInvoiceRepository eInvoiceRepository;

    @Mock
    private PointOfSaleRepository pointOfSaleRepository;

    @InjectMocks
    private ReportServiceImpl reportService;

    private User ownerUser;
    private BusinessHousehold household;
    private PointOfSale pos1;
    private PointOfSale pos2;

    @BeforeEach
    void setUp() {
        household = BusinessHousehold.builder()
                .id("household-1")
                .name("Hộ Kinh Doanh Test")
                .taxCode("0123456789")
                .build();

        Role roleOwner = Role.builder().id(1).code("VT-01").name("Chủ hộ").build();

        ownerUser = User.builder()
                .id("user-owner-1")
                .username("owner_test")
                .household(household)
                .role(roleOwner)
                .build();

        pos1 = PointOfSale.builder()
                .id("pos-1")
                .household(household)
                .posCode("POS-001")
                .name("Quầy chính")
                .address("123 Đường A")
                .isDefault(true)
                .isActive(true)
                .build();

        pos2 = PointOfSale.builder()
                .id("pos-2")
                .household(household)
                .posCode("POS-002")
                .name("Chi nhánh 2")
                .address("456 Đường B")
                .isDefault(false)
                .isActive(true)
                .build();
    }

    @Test
    @DisplayName("TC-01: Lấy báo cáo doanh thu nhiều điểm bán thành công và tính đúng tỷ trọng %")
    void testGetPosRevenueReport_Success_MultiplePos() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findAllByHouseholdIdAndDeletedAtIsNull("household-1"))
                .thenReturn(List.of(pos1, pos2));

        PosRevenueProjection proj1 = mock(PosRevenueProjection.class);
        when(proj1.getPosId()).thenReturn("pos-1");
        when(proj1.getOrderCount()).thenReturn(10L);
        when(proj1.getGrossSales()).thenReturn(new BigDecimal("5300000.00"));
        when(proj1.getTotalDiscount()).thenReturn(new BigDecimal("300000.00"));
        when(proj1.getNetRevenue()).thenReturn(new BigDecimal("5000000.00"));
        when(proj1.getCashRevenue()).thenReturn(new BigDecimal("3000000.00"));
        when(proj1.getBankRevenue()).thenReturn(new BigDecimal("1500000.00"));
        when(proj1.getDebtRevenue()).thenReturn(new BigDecimal("500000.00"));

        PosRevenueProjection proj2 = mock(PosRevenueProjection.class);
        when(proj2.getPosId()).thenReturn("pos-2");
        when(proj2.getOrderCount()).thenReturn(5L);
        when(proj2.getGrossSales()).thenReturn(new BigDecimal("2700000.00"));
        when(proj2.getTotalDiscount()).thenReturn(new BigDecimal("200000.00"));
        when(proj2.getNetRevenue()).thenReturn(new BigDecimal("2500000.00"));
        when(proj2.getCashRevenue()).thenReturn(new BigDecimal("1500000.00"));
        when(proj2.getBankRevenue()).thenReturn(new BigDecimal("500000.00"));
        when(proj2.getDebtRevenue()).thenReturn(new BigDecimal("500000.00"));

        when(orderRepository.getPosRevenueSummary(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), isNull()))
                .thenReturn(List.of(proj1, proj2));

        PosInvoiceCountProjection inv1 = mock(PosInvoiceCountProjection.class);
        when(inv1.getPosId()).thenReturn("pos-1");
        when(inv1.getInvoiceCount()).thenReturn(8L);

        PosInvoiceCountProjection inv2 = mock(PosInvoiceCountProjection.class);
        when(inv2.getPosId()).thenReturn("pos-2");
        when(inv2.getInvoiceCount()).thenReturn(3L);

        when(eInvoiceRepository.getPosInvoiceCounts(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), isNull()))
                .thenReturn(List.of(inv1, inv2));

        PosDailyRevenueProjection daily1 = mock(PosDailyRevenueProjection.class);
        when(daily1.getSalesDate()).thenReturn(Date.valueOf("2026-09-15"));
        when(daily1.getPosId()).thenReturn("pos-1");
        when(daily1.getPosName()).thenReturn("Quầy chính");
        when(daily1.getOrderCount()).thenReturn(6L);
        when(daily1.getNetRevenue()).thenReturn(new BigDecimal("3450000.00"));

        when(orderRepository.getPosDailyRevenue(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), isNull()))
                .thenReturn(List.of(daily1));

        LocalDate fromDate = LocalDate.of(2026, 9, 1);
        LocalDate toDate = LocalDate.of(2026, 9, 30);

        PosRevenueReportResponse response = reportService.getPosRevenueReport("owner_test", fromDate, toDate, null);

        assertNotNull(response);
        assertEquals(fromDate, response.getFromDate());
        assertEquals(toDate, response.getToDate());

        // Kiểm tra tổng toàn hộ
        PosHouseholdTotalResponse total = response.getHouseholdSummary();
        assertNotNull(total);
        assertEquals(2, total.getTotalPosCount());
        assertEquals(2, total.getActivePosCount());
        assertEquals(15L, total.getTotalOrders());
        assertEquals(11L, total.getTotalInvoices());
        assertEquals(new BigDecimal("8000000.00"), total.getTotalGrossSales());
        assertEquals(new BigDecimal("500000.00"), total.getTotalDiscount());
        assertEquals(new BigDecimal("7500000.00"), total.getTotalNetRevenue());
        assertEquals(new BigDecimal("4500000.00"), total.getTotalCashRevenue());
        assertEquals(new BigDecimal("2000000.00"), total.getTotalBankRevenue());
        assertEquals(new BigDecimal("1000000.00"), total.getTotalDebtRevenue());

        // Kiểm tra từng điểm bán
        List<PosRevenueSummaryResponse> summaries = response.getPosSummaries();
        assertEquals(2, summaries.size());

        PosRevenueSummaryResponse sum1 = summaries.stream().filter(s -> s.getPosId().equals("pos-1")).findFirst().orElseThrow();
        assertEquals("POS-001", sum1.getPosCode());
        assertEquals(10L, sum1.getOrderCount());
        assertEquals(8L, sum1.getInvoiceCount());
        assertEquals(new BigDecimal("5000000.00"), sum1.getNetRevenue());
        // 5,000,000 / 7,500,000 * 100 = 66.67%
        assertEquals(new BigDecimal("66.67"), sum1.getRevenuePercentage());

        PosRevenueSummaryResponse sum2 = summaries.stream().filter(s -> s.getPosId().equals("pos-2")).findFirst().orElseThrow();
        assertEquals("POS-002", sum2.getPosCode());
        assertEquals(5L, sum2.getOrderCount());
        assertEquals(3L, sum2.getInvoiceCount());
        assertEquals(new BigDecimal("2500000.00"), sum2.getNetRevenue());
        // 2,500,000 / 7,500,000 * 100 = 33.33%
        assertEquals(new BigDecimal("33.33"), sum2.getRevenuePercentage());

        // Kiểm tra daily breakdown
        assertEquals(1, response.getDailyBreakdown().size());
        assertEquals(LocalDate.of(2026, 9, 15), response.getDailyBreakdown().get(0).getSalesDate());
        assertEquals(new BigDecimal("3450000.00"), response.getDailyBreakdown().get(0).getNetRevenue());
    }

    @Test
    @DisplayName("TC-02: Điểm bán chưa phát sinh đơn hàng vẫn xuất hiện trong báo cáo với doanh thu = 0 (Zero-Filling)")
    void testGetPosRevenueReport_EmptyPos_ZeroFilling() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findAllByHouseholdIdAndDeletedAtIsNull("household-1"))
                .thenReturn(List.of(pos1, pos2));

        // Chỉ có pos-1 có đơn, pos-2 hoàn toàn không có đơn
        PosRevenueProjection proj1 = mock(PosRevenueProjection.class);
        when(proj1.getPosId()).thenReturn("pos-1");
        when(proj1.getOrderCount()).thenReturn(5L);
        when(proj1.getGrossSales()).thenReturn(new BigDecimal("3000000.00"));
        when(proj1.getTotalDiscount()).thenReturn(BigDecimal.ZERO);
        when(proj1.getNetRevenue()).thenReturn(new BigDecimal("3000000.00"));
        when(proj1.getCashRevenue()).thenReturn(new BigDecimal("3000000.00"));
        when(proj1.getBankRevenue()).thenReturn(BigDecimal.ZERO);
        when(proj1.getDebtRevenue()).thenReturn(BigDecimal.ZERO);

        when(orderRepository.getPosRevenueSummary(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), isNull()))
                .thenReturn(List.of(proj1));
        when(eInvoiceRepository.getPosInvoiceCounts(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), isNull()))
                .thenReturn(List.of());
        when(orderRepository.getPosDailyRevenue(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), isNull()))
                .thenReturn(List.of());

        LocalDate fromDate = LocalDate.of(2026, 7, 1);
        LocalDate toDate = LocalDate.of(2026, 7, 31);

        PosRevenueReportResponse response = reportService.getPosRevenueReport("owner_test", fromDate, toDate, null);

        assertNotNull(response);
        assertEquals(2, response.getPosSummaries().size());

        // Điểm 2 không có đơn nhưng vẫn hiển thị với số 0
        PosRevenueSummaryResponse sum2 = response.getPosSummaries().stream().filter(s -> s.getPosId().equals("pos-2")).findFirst().orElseThrow();
        assertEquals(0L, sum2.getOrderCount());
        assertEquals(0L, sum2.getInvoiceCount());
        assertEquals(BigDecimal.ZERO, sum2.getNetRevenue());
        assertEquals(new BigDecimal("0.00"), sum2.getRevenuePercentage());
    }

    @Test
    @DisplayName("TC-04: Lọc theo một điểm bán cụ thể thành công")
    void testGetPosRevenueReport_FilterBySpecificPosId() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-1", "household-1"))
                .thenReturn(Optional.of(pos1));

        PosRevenueProjection proj1 = mock(PosRevenueProjection.class);
        when(proj1.getPosId()).thenReturn("pos-1");
        when(proj1.getOrderCount()).thenReturn(3L);
        when(proj1.getGrossSales()).thenReturn(new BigDecimal("1000000.00"));
        when(proj1.getTotalDiscount()).thenReturn(BigDecimal.ZERO);
        when(proj1.getNetRevenue()).thenReturn(new BigDecimal("1000000.00"));
        when(proj1.getCashRevenue()).thenReturn(new BigDecimal("1000000.00"));
        when(proj1.getBankRevenue()).thenReturn(BigDecimal.ZERO);
        when(proj1.getDebtRevenue()).thenReturn(BigDecimal.ZERO);

        when(orderRepository.getPosRevenueSummary(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), eq("pos-1")))
                .thenReturn(List.of(proj1));
        when(eInvoiceRepository.getPosInvoiceCounts(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), eq("pos-1")))
                .thenReturn(List.of());
        when(orderRepository.getPosDailyRevenue(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), eq("pos-1")))
                .thenReturn(List.of());

        PosRevenueReportResponse response = reportService.getPosRevenueReport("owner_test", null, null, "pos-1");

        assertNotNull(response);
        assertEquals(1, response.getPosSummaries().size());
        assertEquals("pos-1", response.getPosSummaries().get(0).getPosId());
        assertEquals(new BigDecimal("100.00"), response.getPosSummaries().get(0).getRevenuePercentage());
    }

    @Test
    @DisplayName("TC-05: Ném ngoại lệ khi khoảng thời gian không hợp lệ (fromDate > toDate)")
    void testGetPosRevenueReport_InvalidDateRange_ThrowsException() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));

        LocalDate fromDate = LocalDate.of(2026, 9, 30);
        LocalDate toDate = LocalDate.of(2026, 9, 1);

        AppException exception = assertThrows(AppException.class, () ->
                reportService.getPosRevenueReport("owner_test", fromDate, toDate, null)
        );

        assertEquals(ErrorCode.INVALID_INPUT, exception.getErrorCode());
    }

    @Test
    @DisplayName("Lọc theo posId không tồn tại ném ngoại lệ POS_NOT_FOUND")
    void testGetPosRevenueReport_PosNotFound_ThrowsException() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(ownerUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-nonexistent", "household-1"))
                .thenReturn(Optional.empty());

        AppException exception = assertThrows(AppException.class, () ->
                reportService.getPosRevenueReport("owner_test", null, null, "pos-nonexistent")
        );

        assertEquals(ErrorCode.POS_NOT_FOUND, exception.getErrorCode());
    }
}
