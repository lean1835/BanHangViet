package com.sales.service.interfaces;

import com.sales.dto.response.PeakHoursAndDaysResponse;

import java.time.LocalDate;

public interface SalesAnalyticsService {
    PeakHoursAndDaysResponse getPeakHoursAndDaysAnalysis(String currentUsername, LocalDate fromDate, LocalDate toDate, String posId);
}
