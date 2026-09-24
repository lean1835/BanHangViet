package com.sales.modules.report.service;
import com.sales.common.dto.PageResponse;
import com.sales.modules.report.dto.response.PeakHoursAndDaysResponse;
import com.sales.modules.inventory.dto.response.PurchaseSuggestionResponse;
import com.sales.modules.product.dto.response.SlowMovingProductListResponse;

import java.time.LocalDate;

public interface SalesAnalyticsService {
    PeakHoursAndDaysResponse getPeakHoursAndDaysAnalysis(String currentUsername, LocalDate fromDate, LocalDate toDate, String posId);

    PageResponse<PurchaseSuggestionResponse> getPurchaseForecast(
            String currentUsername, Integer periodDays, String groupId, int page, int size);

    SlowMovingProductListResponse getSlowMovingProducts(
            String currentUsername, Integer thresholdDays, String groupId, String search, int page, int size);
}


