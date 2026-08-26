package com.sales.service.interfaces;

import com.sales.dto.response.PageResponse;
import com.sales.dto.response.PeakHoursAndDaysResponse;
import com.sales.dto.response.PurchaseSuggestionResponse;

import java.time.LocalDate;

public interface SalesAnalyticsService {
    PeakHoursAndDaysResponse getPeakHoursAndDaysAnalysis(String currentUsername, LocalDate fromDate, LocalDate toDate, String posId);

    PageResponse<PurchaseSuggestionResponse> getPurchaseForecast(
            String currentUsername, Integer periodDays, String groupId, int page, int size);
}

