package com.sales.service.classes;

import com.sales.dto.response.*;
import com.sales.entity.BusinessHousehold;
import com.sales.entity.PointOfSale;
import com.sales.entity.User;
import com.sales.exception.AppException;
import com.sales.exception.ErrorCode;
import com.sales.repository.OrderRepository;
import com.sales.repository.PointOfSaleRepository;
import com.sales.repository.UserRepository;
import com.sales.service.interfaces.InventoryWarningService;
import com.sales.service.interfaces.SalesAnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SalesAnalyticsServiceImpl implements SalesAnalyticsService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PointOfSaleRepository pointOfSaleRepository;
    private final InventoryWarningService inventoryWarningService;


    private static final String[] DAY_NAMES = {
            "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"
    };

    // MySQL DAYOFWEEK mapping: 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri, 7=Sat
    // Convert DAYOFWEEK (1..7) to standard Index (0..6 representing Mon..Sun)
    private int convertDayOfWeekToIndex(int mysqlDayOfWeek) {
        return mysqlDayOfWeek == 1 ? 6 : mysqlDayOfWeek - 2;
    }

    private int convertIndexToMysqlDayOfWeek(int index) {
        return index == 6 ? 1 : index + 2;
    }

    private String formatHourLabel(int hour) {
        return String.format("%02d:00 - %02d:00", hour, (hour + 1) % 24);
    }

    private BusinessHousehold getHouseholdAndValidate(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        BusinessHousehold household = user.getHousehold();
        if (household == null) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        return household;
    }

    @Override
    @Transactional(readOnly = true)
    public PeakHoursAndDaysResponse getPeakHoursAndDaysAnalysis(String currentUsername, LocalDate fromDate, LocalDate toDate, String posId) {
        BusinessHousehold household = getHouseholdAndValidate(currentUsername);

        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusDays(30);
        LocalDate end = toDate != null ? toDate : LocalDate.now();

        if (start.isAfter(end)) {
            throw new AppException(ErrorCode.INVALID_INPUT);
        }

        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);

        String posName = "Tất cả điểm bán";
        if (posId != null && !posId.trim().isEmpty()) {
            PointOfSale pos = pointOfSaleRepository.findByIdAndHouseholdIdAndDeletedAtIsNull(posId, household.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVALID_INPUT));
            posName = pos.getName();
        } else {
            posId = null;
        }

        // 1. Fetch DB raw projections
        List<PeakHourlyProjection> hourlyProjections = orderRepository.getPeakHourlyAnalysis(household.getId(), startDateTime, endDateTime, posId);
        List<PeakDayOfWeekProjection> dayOfWeekProjections = orderRepository.getPeakDayOfWeekAnalysis(household.getId(), startDateTime, endDateTime, posId);
        List<PeakHeatmapProjection> heatmapProjections = orderRepository.getPeakHeatmapAnalysis(household.getId(), startDateTime, endDateTime, posId);

        // 2. Map raw DB data to structures
        Map<Integer, PeakHourlyProjection> hourlyMap = hourlyProjections.stream()
                .filter(p -> p.getHourOfDay() != null)
                .collect(Collectors.toMap(PeakHourlyProjection::getHourOfDay, p -> p, (existing, replace) -> existing));

        Map<Integer, PeakDayOfWeekProjection> dayOfWeekMap = dayOfWeekProjections.stream()
                .filter(p -> p.getDayOfWeek() != null)
                .collect(Collectors.toMap(PeakDayOfWeekProjection::getDayOfWeek, p -> p, (existing, replace) -> existing));

        Map<String, PeakHeatmapProjection> heatmapMap = heatmapProjections.stream()
                .filter(p -> p.getDayOfWeek() != null && p.getHourOfDay() != null)
                .collect(Collectors.toMap(p -> p.getDayOfWeek() + "_" + p.getHourOfDay(), p -> p, (existing, replace) -> existing));

        // Calculate Totals
        long totalOrders = 0;
        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (PeakHourlyProjection p : hourlyProjections) {
            if (p.getOrderCount() != null) {
                totalOrders += p.getOrderCount();
            }
            if (p.getTotalRevenue() != null) {
                totalRevenue = totalRevenue.add(p.getTotalRevenue());
            }
        }

        BigDecimal averageOrderValue = totalOrders > 0
                ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // 3. Build Hourly Stats (All 24 hours)
        List<HourlySalesData> hourlyStats = new ArrayList<>(24);
        for (int hour = 0; hour < 24; hour++) {
            PeakHourlyProjection p = hourlyMap.get(hour);
            long orders = p != null && p.getOrderCount() != null ? p.getOrderCount() : 0L;
            BigDecimal rev = p != null && p.getTotalRevenue() != null ? p.getTotalRevenue() : BigDecimal.ZERO;

            BigDecimal aov = orders > 0
                    ? rev.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            BigDecimal pct = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? rev.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            hourlyStats.add(HourlySalesData.builder()
                    .hour(hour)
                    .label(formatHourLabel(hour))
                    .orderCount(orders)
                    .totalRevenue(rev)
                    .averageOrderValue(aov)
                    .revenuePercentage(pct)
                    .build());
        }

        // 4. Build Day of Week Stats (All 7 days: Monday to Sunday)
        List<DayOfWeekSalesData> dayOfWeekStats = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            int mysqlDay = convertIndexToMysqlDayOfWeek(i);
            PeakDayOfWeekProjection p = dayOfWeekMap.get(mysqlDay);
            long orders = p != null && p.getOrderCount() != null ? p.getOrderCount() : 0L;
            BigDecimal rev = p != null && p.getTotalRevenue() != null ? p.getTotalRevenue() : BigDecimal.ZERO;

            BigDecimal aov = orders > 0
                    ? rev.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            BigDecimal pct = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                    ? rev.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            dayOfWeekStats.add(DayOfWeekSalesData.builder()
                    .dayOfWeek(i + 1) // 1=Mon .. 7=Sun
                    .dayName(DAY_NAMES[i])
                    .orderCount(orders)
                    .totalRevenue(rev)
                    .averageOrderValue(aov)
                    .revenuePercentage(pct)
                    .build());
        }

        // 5. Build Heatmap Matrix (168 cells = 7 days x 24 hours)
        BigDecimal maxCellRevenue = BigDecimal.ZERO;
        long maxCellOrders = 0L;

        for (PeakHeatmapProjection p : heatmapProjections) {
            if (p.getTotalRevenue() != null && p.getTotalRevenue().compareTo(maxCellRevenue) > 0) {
                maxCellRevenue = p.getTotalRevenue();
            }
            if (p.getOrderCount() != null && p.getOrderCount() > maxCellOrders) {
                maxCellOrders = p.getOrderCount();
            }
        }

        List<SalesHeatmapCell> heatmap = new ArrayList<>(168);
        List<PeakSalesInsight.PeakTimeSlot> allSlots = new ArrayList<>(168);

        for (int dayIdx = 0; dayIdx < 7; dayIdx++) {
            int mysqlDay = convertIndexToMysqlDayOfWeek(dayIdx);
            String dayName = DAY_NAMES[dayIdx];

            for (int hour = 0; hour < 24; hour++) {
                String key = mysqlDay + "_" + hour;
                PeakHeatmapProjection p = heatmapMap.get(key);

                long cellOrders = p != null && p.getOrderCount() != null ? p.getOrderCount() : 0L;
                BigDecimal cellRev = p != null && p.getTotalRevenue() != null ? p.getTotalRevenue() : BigDecimal.ZERO;

                double intensity = 0.0;
                if (maxCellRevenue.compareTo(BigDecimal.ZERO) > 0) {
                    intensity = cellRev.divide(maxCellRevenue, 4, RoundingMode.HALF_UP).doubleValue();
                } else if (maxCellOrders > 0) {
                    intensity = (double) cellOrders / maxCellOrders;
                }
                // Cap intensity between 0.0 and 1.0
                intensity = Math.min(1.0, Math.max(0.0, intensity));

                String hourLabel = formatHourLabel(hour);

                heatmap.add(SalesHeatmapCell.builder()
                        .dayOfWeek(dayIdx + 1)
                        .dayName(dayName)
                        .hourOfDay(hour)
                        .hourLabel(hourLabel)
                        .orderCount(cellOrders)
                        .totalRevenue(cellRev)
                        .intensity(Math.round(intensity * 100.0) / 100.0)
                        .build());

                if (cellOrders > 0 || cellRev.compareTo(BigDecimal.ZERO) > 0) {
                    allSlots.add(PeakSalesInsight.PeakTimeSlot.builder()
                            .dayName(dayName)
                            .hourLabel(hourLabel)
                            .orderCount(cellOrders)
                            .totalRevenue(cellRev)
                            .build());
                }
            }
        }

        // Sort slots descending by total revenue, then order count
        allSlots.sort((a, b) -> {
            int cmp = b.getTotalRevenue().compareTo(a.getTotalRevenue());
            if (cmp != 0) return cmp;
            return b.getOrderCount().compareTo(a.getOrderCount());
        });

        List<PeakSalesInsight.PeakTimeSlot> topPeakSlots = allSlots.stream()
                .limit(3)
                .collect(Collectors.toList());

        // 6. Compute Extremes (Peak/Lowest Hour & Busiest/Quietest Day)
        HourlySalesData peakHourData = hourlyStats.stream()
                .max(Comparator.comparing(HourlySalesData::getTotalRevenue).thenComparing(HourlySalesData::getOrderCount))
                .orElse(null);

        HourlySalesData lowestHourData = hourlyStats.stream()
                .min(Comparator.comparing(HourlySalesData::getTotalRevenue).thenComparing(HourlySalesData::getOrderCount))
                .orElse(null);

        DayOfWeekSalesData busiestDayData = dayOfWeekStats.stream()
                .max(Comparator.comparing(DayOfWeekSalesData::getTotalRevenue).thenComparing(DayOfWeekSalesData::getOrderCount))
                .orElse(null);

        DayOfWeekSalesData quietestDayData = dayOfWeekStats.stream()
                .min(Comparator.comparing(DayOfWeekSalesData::getTotalRevenue).thenComparing(DayOfWeekSalesData::getOrderCount))
                .orElse(null);

        // 7. Generate Intelligent Recommendations
        List<String> recommendations = generateRecommendations(peakHourData, lowestHourData, busiestDayData, quietestDayData, topPeakSlots, totalOrders);

        PeakSalesInsight insights = PeakSalesInsight.builder()
                .peakHour(peakHourData != null ? peakHourData.getHour() : 0)
                .peakHourLabel(peakHourData != null ? peakHourData.getLabel() : "00:00 - 01:00")
                .peakHourRevenue(peakHourData != null ? peakHourData.getTotalRevenue() : BigDecimal.ZERO)
                .peakHourOrderCount(peakHourData != null ? peakHourData.getOrderCount() : 0L)
                .lowestHour(lowestHourData != null ? lowestHourData.getHour() : 0)
                .lowestHourLabel(lowestHourData != null ? lowestHourData.getLabel() : "00:00 - 01:00")
                .lowestHourRevenue(lowestHourData != null ? lowestHourData.getTotalRevenue() : BigDecimal.ZERO)
                .lowestHourOrderCount(lowestHourData != null ? lowestHourData.getOrderCount() : 0L)
                .busiestDayOfWeek(busiestDayData != null ? busiestDayData.getDayOfWeek() : 1)
                .busiestDayName(busiestDayData != null ? busiestDayData.getDayName() : "Thứ Hai")
                .busiestDayRevenue(busiestDayData != null ? busiestDayData.getTotalRevenue() : BigDecimal.ZERO)
                .busiestDayOrderCount(busiestDayData != null ? busiestDayData.getOrderCount() : 0L)
                .quietestDayOfWeek(quietestDayData != null ? quietestDayData.getDayOfWeek() : 1)
                .quietestDayName(quietestDayData != null ? quietestDayData.getDayName() : "Thứ Hai")
                .quietestDayRevenue(quietestDayData != null ? quietestDayData.getTotalRevenue() : BigDecimal.ZERO)
                .quietestDayOrderCount(quietestDayData != null ? quietestDayData.getOrderCount() : 0L)
                .topPeakSlots(topPeakSlots)
                .recommendations(recommendations)
                .build();

        PeakHoursAndDaysResponse.FilterInfo filterInfo = PeakHoursAndDaysResponse.FilterInfo.builder()
                .fromDate(start)
                .toDate(end)
                .posId(posId)
                .posName(posName)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .averageOrderValue(averageOrderValue)
                .build();

        return PeakHoursAndDaysResponse.builder()
                .filterInfo(filterInfo)
                .hourlyStats(hourlyStats)
                .dayOfWeekStats(dayOfWeekStats)
                .heatmap(heatmap)
                .insights(insights)
                .build();
    }

    private List<String> generateRecommendations(HourlySalesData peakHour,
                                                HourlySalesData lowestHour,
                                                DayOfWeekSalesData busiestDay,
                                                DayOfWeekSalesData quietestDay,
                                                List<PeakSalesInsight.PeakTimeSlot> topPeakSlots,
                                                long totalOrders) {
        List<String> recommendations = new ArrayList<>();

        if (totalOrders == 0) {
            recommendations.add("Chưa có đủ dữ liệu giao dịch trong khoảng thời gian này để đưa ra gợi ý tối ưu.");
            return recommendations;
        }

        if (peakHour != null && peakHour.getOrderCount() > 0) {
            recommendations.add(String.format("Khung giờ cao điểm nhất là %s với doanh thu đạt %s đ (%d đơn). Khuyến nghị chủ hộ bố trí tối đa nhân viên thu ngân và chuẩn bị sẵn tiền lẻ phục vụ thanh toán nhanh.",
                    peakHour.getLabel(), String.format("%,.0f", peakHour.getTotalRevenue()), peakHour.getOrderCount()));
        }

        if (busiestDay != null && busiestDay.getOrderCount() > 0) {
            recommendations.add(String.format("Ngày bán chạy nhất trong tuần là %s (chiếm %s%% tổng doanh thu kỳ). Khuyến nghị chủ động kiểm tra và nhập hàng bổ sung trước ngày này.",
                    busiestDay.getDayName(), busiestDay.getRevenuePercentage()));
        }

        if (!topPeakSlots.isEmpty()) {
            PeakSalesInsight.PeakTimeSlot topSlot = topPeakSlots.get(0);
            recommendations.add(String.format("Khung giờ vàng phát sinh doanh thu lớn nhất là %s lúc %s (%d đơn, %s đ). Nên kiểm kê quầy kệ và bổ sung hàng bán chạy trước mốc này.",
                    topSlot.getDayName(), topSlot.getHourLabel(), topSlot.getOrderCount(), String.format("%,.0f", topSlot.getTotalRevenue())));
        }

        if (lowestHour != null && lowestHour.getOrderCount() == 0) {
            recommendations.add(String.format("Khung giờ vắng khách nhất (%s) không phát sinh đơn hàng. Có thể xem xét điều chỉnh ca trực để tiết kiệm chi phí điện năng và nhân lực.",
                    lowestHour.getLabel()));
        }

        return recommendations;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<PurchaseSuggestionResponse> getPurchaseForecast(
            String currentUsername, Integer periodDays, String groupId, int page, int size) {
        return inventoryWarningService.getPurchaseSuggestions(currentUsername, periodDays, groupId, page, size);
    }
}

