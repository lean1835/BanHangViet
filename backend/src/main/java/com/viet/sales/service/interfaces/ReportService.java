package com.viet.sales.service.interfaces;

import com.viet.sales.dto.response.*;
import java.time.LocalDate;
import java.util.List;

public interface ReportService {
    List<DailyRevenueProjection> getDailyRevenue(String currentUsername, LocalDate fromDate, LocalDate toDate);
    
    List<ProductRevenueProjection> getProductRevenue(String currentUsername, LocalDate fromDate, LocalDate toDate);

    List<ProductRevenueProjection> getProductRevenue(String currentUsername, LocalDate fromDate, LocalDate toDate, Integer limit);
    
    ReconciliationResponse getReconciliation(String currentUsername, LocalDate date);
    
    void lockReconciliation(String currentUsername, LocalDate date, String notes);
    
    DashboardOverviewResponse getDashboardOverview(String currentUsername, LocalDate fromDate, LocalDate toDate);
    
    CompareRevenueResponse compareRevenue(String currentUsername, LocalDate period1Start, LocalDate period1End, LocalDate period2Start, LocalDate period2End);
    
    PageResponse<ActivityLogResponse> getActivityLogs(String currentUsername, String targetUsername, LocalDate fromDate, LocalDate toDate, int page, int size);
}
