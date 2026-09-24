package com.sales.modules.report.service;
import com.sales.common.dto.PageResponse;
import com.sales.modules.audit.dto.response.ActivityLogResponse;
import com.sales.modules.customer.dto.response.ReconciliationResponse;
import com.sales.modules.pos.dto.response.EmployeeShiftReportResponse;
import com.sales.modules.pos.dto.response.PosRevenueReportResponse;
import com.sales.modules.product.dto.response.ProductGroupRevenueDetailResponse;
import com.sales.modules.product.dto.response.ProductRevenueProjection;
import com.sales.modules.report.dto.response.CompareRevenueResponse;
import com.sales.modules.report.dto.response.DailyRevenueProjection;
import com.sales.modules.report.dto.response.DashboardOverviewResponse;
import com.sales.modules.report.dto.response.GrossProfitReportResponse;
import com.sales.modules.report.dto.response.PaymentMethodReportResponse;
import com.sales.modules.report.dto.response.ProductGroupReportResponse;
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

    PosRevenueReportResponse getPosRevenueReport(String currentUsername, LocalDate fromDate, LocalDate toDate, String posId);

    EmployeeShiftReportResponse getEmployeeShiftReport(String currentUsername, LocalDate fromDate, LocalDate toDate, String userId, java.math.BigDecimal customThreshold);

    GrossProfitReportResponse getGrossProfitReport(String currentUsername, LocalDate fromDate, LocalDate toDate, String productId);

    GrossProfitReportResponse getGrossProfitReport(String currentUsername, LocalDate fromDate, LocalDate toDate, String productId, String posId);

    PaymentMethodReportResponse getPaymentMethodReport(String currentUsername, LocalDate fromDate, LocalDate toDate, String userId, String shiftId);

    ProductGroupReportResponse getProductGroupReport(String currentUsername, LocalDate fromDate, LocalDate toDate);

    ProductGroupRevenueDetailResponse getProductGroupDetail(String currentUsername, String groupId, LocalDate fromDate, LocalDate toDate);
}
