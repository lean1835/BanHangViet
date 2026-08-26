package com.sales.service;

import com.sales.dto.response.*;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.OrderRepository;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.classes.SalesAnalyticsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class SalesAnalyticsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PointOfSaleRepository pointOfSaleRepository;

    @InjectMocks
    private SalesAnalyticsServiceImpl salesAnalyticsService;

    private User testUser;
    private BusinessHousehold testHousehold;

    @BeforeEach
    public void setUp() {
        testHousehold = BusinessHousehold.builder()
                .id("household-1")
                .taxCode("0123456789")
                .name("Hộ kinh doanh Test Unit")
                .build();

        testUser = User.builder()
                .id("user-1")
                .username("owner_test")
                .household(testHousehold)
                .build();
    }

    @Test
    public void getPeakHoursAndDaysAnalysis_userNotFound_throwsException() {
        when(userRepository.findByUsername("unknown")).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                salesAnalyticsService.getPeakHoursAndDaysAnalysis("unknown", null, null, null));

        assertEquals(ErrorCode.USER_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    public void getPeakHoursAndDaysAnalysis_userWithoutHousehold_throwsForbidden() {
        User userNoHousehold = User.builder().username("no_household").household(null).build();
        when(userRepository.findByUsername("no_household")).thenReturn(Optional.of(userNoHousehold));

        AppException ex = assertThrows(AppException.class, () ->
                salesAnalyticsService.getPeakHoursAndDaysAnalysis("no_household", null, null, null));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    @Test
    public void getPeakHoursAndDaysAnalysis_invalidDateRange_throwsInvalidInput() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(testUser));

        LocalDate fromDate = LocalDate.of(2026, 8, 20);
        LocalDate toDate = LocalDate.of(2026, 8, 10);

        AppException ex = assertThrows(AppException.class, () ->
                salesAnalyticsService.getPeakHoursAndDaysAnalysis("owner_test", fromDate, toDate, null));

        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    public void getPeakHoursAndDaysAnalysis_invalidPosId_throwsInvalidInput() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(testUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("invalid-pos", "household-1"))
                .thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () ->
                salesAnalyticsService.getPeakHoursAndDaysAnalysis("owner_test", null, null, "invalid-pos"));

        assertEquals(ErrorCode.INVALID_INPUT, ex.getErrorCode());
    }

    @Test
    public void getPeakHoursAndDaysAnalysis_emptyOrders_successWithDefaults() {
        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(testUser));
        when(orderRepository.getPeakHourlyAnalysis(anyString(), any(LocalDateTime.class), any(LocalDateTime.class), isNull()))
                .thenReturn(Collections.emptyList());
        when(orderRepository.getPeakDayOfWeekAnalysis(anyString(), any(LocalDateTime.class), any(LocalDateTime.class), isNull()))
                .thenReturn(Collections.emptyList());
        when(orderRepository.getPeakHeatmapAnalysis(anyString(), any(LocalDateTime.class), any(LocalDateTime.class), isNull()))
                .thenReturn(Collections.emptyList());

        PeakHoursAndDaysResponse response = salesAnalyticsService.getPeakHoursAndDaysAnalysis("owner_test", null, null, null);

        assertNotNull(response);
        assertEquals(24, response.getHourlyStats().size());
        assertEquals(7, response.getDayOfWeekStats().size());
        assertEquals(168, response.getHeatmap().size());
        assertEquals(0L, response.getFilterInfo().getTotalOrders());
        assertEquals(BigDecimal.ZERO, response.getFilterInfo().getTotalRevenue());
        assertNotNull(response.getInsights());
    }

    @Test
    public void getPeakHoursAndDaysAnalysis_withPosId_success() {
        PointOfSale pos = PointOfSale.builder()
                .id("pos-1")
                .name("Chi nhánh 1")
                .household(testHousehold)
                .build();

        when(userRepository.findByUsername("owner_test")).thenReturn(Optional.of(testUser));
        when(pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull("pos-1", "household-1"))
                .thenReturn(Optional.of(pos));
        when(orderRepository.getPeakHourlyAnalysis(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), eq("pos-1")))
                .thenReturn(Collections.emptyList());
        when(orderRepository.getPeakDayOfWeekAnalysis(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), eq("pos-1")))
                .thenReturn(Collections.emptyList());
        when(orderRepository.getPeakHeatmapAnalysis(eq("household-1"), any(LocalDateTime.class), any(LocalDateTime.class), eq("pos-1")))
                .thenReturn(Collections.emptyList());

        PeakHoursAndDaysResponse response = salesAnalyticsService.getPeakHoursAndDaysAnalysis("owner_test", null, null, "pos-1");

        assertNotNull(response);
        assertEquals("pos-1", response.getFilterInfo().getPosId());
        assertEquals("Chi nhánh 1", response.getFilterInfo().getPosName());
    }
}
