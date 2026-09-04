package com.sales.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PosRevenueReportResponse {
    private LocalDate fromDate;
    private LocalDate toDate;
    private PosHouseholdTotalResponse householdSummary;
    private List<PosRevenueSummaryResponse> posSummaries;
    private List<PosDailyRevenueResponse> dailyBreakdown;
}
