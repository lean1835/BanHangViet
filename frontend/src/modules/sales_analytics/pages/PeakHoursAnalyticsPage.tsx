import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Lock,
  BarChart2,
} from "lucide-react";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useGetPeakHoursAndDaysAnalysisQuery } from "../services/salesAnalyticsApi";
import { PeakHoursHeatmap } from "../components/PeakHoursHeatmap";
import { HourlyDistributionBar } from "../components/HourlyDistributionBar";
import { DayOfWeekDistribution } from "../components/DayOfWeekDistribution";
import { PeakInsightsCard } from "../components/PeakInsightsCard";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { getWeekDateRange } from "@/utils/dateFormatter";
import { SALES_ANALYTICS_COPY } from "@/constants/salesAnalytics";
import { useOnOrderCompleted } from "@/utils/orderEvents";
import { useOptionalReportFilter } from "@/modules/report/context/ReportFilterContext";

export const PeakHoursAnalyticsPage: React.FC = () => {
  const { currentRole } = useDashboardDemo();
  // Role check: Only Owner (VT-01) and Accountant (VT-03) allowed; Employee (VT-02) blocked (NCL-18-CN-001-TC-03)
  const isAllowed =
    currentRole === USER_ROLES.OWNER || currentRole === USER_ROLES.ACCOUNTANT;

  // Lấy bộ lọc từ thanh bên trái (ReportSidebar / ReportFilterContext), fallback an toàn nếu test độc lập
  const reportFilterCtx = useOptionalReportFilter();
  const currentWeek = useMemo(() => getWeekDateRange(), []);
  const [localFromDate] = useState<string>(currentWeek.fromDate);
  const [localToDate] = useState<string>(currentWeek.toDate);
  const [localPosId] = useState<string>("");

  const fromDate = reportFilterCtx ? reportFilterCtx.peakHoursFilter.fromDate : localFromDate;
  const toDate = reportFilterCtx ? reportFilterCtx.peakHoursFilter.toDate : localToDate;
  const posId = reportFilterCtx ? reportFilterCtx.peakHoursFilter.posId : localPosId;

  const { data: peakData, isLoading, refetch } = useGetPeakHoursAndDaysAnalysisQuery(
    {
      fromDate,
      toDate,
      posId: posId || undefined,
    },
    {
      skip: !isAllowed,
      refetchOnFocus: true, // Tự động làm mới khi quay lại tab trình duyệt
      refetchOnReconnect: true, // Tự động làm mới khi có mạng trở lại
    }
  );

  // Tự động làm mới tức thì (0ms) khi có bất kỳ đơn hàng nào bán thành công (cùng tab hoặc khác tab)
  useOnOrderCompleted(refetch);

  // Permission Denied View for Employee (NCL-18-CN-001-TC-03)
  if (!isAllowed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm w-full animate-auth-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3.5">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-base sm:text-lg font-black text-slate-800 mb-1.5">
          {SALES_ANALYTICS_COPY.PEAK_HOURS.PERMISSION_DENIED_TITLE}
        </h2>
        <p className="text-xs font-semibold text-slate-500 max-w-md leading-relaxed">
          {SALES_ANALYTICS_COPY.PEAK_HOURS.PERMISSION_DENIED_DESC}
        </p>
      </div>
    );
  }

  const filterInfo = peakData?.filterInfo;
  const hourlyStats = peakData?.hourlyStats || [];
  const dayOfWeekStats = peakData?.dayOfWeekStats || [];
  const heatmap = peakData?.heatmap || [];
  const insights = peakData?.insights || {
    peakHour: 0,
    peakHourLabel: "00:00 - 01:00",
    peakHourRevenue: 0,
    peakHourOrderCount: 0,
    lowestHour: 0,
    lowestHourLabel: "00:00 - 01:00",
    lowestHourRevenue: 0,
    lowestHourOrderCount: 0,
    busiestDayOfWeek: 1,
    busiestDayName: "Thứ Hai",
    busiestDayRevenue: 0,
    busiestDayOrderCount: 0,
    quietestDayOfWeek: 1,
    quietestDayName: "Thứ Hai",
    quietestDayRevenue: 0,
    quietestDayOrderCount: 0,
    topPeakSlots: [],
    recommendations: [],
  };

  const totalOrders = filterInfo?.totalOrders || 0;
  const totalRevenue = filterInfo?.totalRevenue || 0;
  const averageOrderValue = filterInfo?.averageOrderValue || 0;

  const hasData = totalOrders > 0;

  return (
    <div className="flex flex-col gap-6 w-full animate-auth-fade-in">
      {/* Page Title */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {SALES_ANALYTICS_COPY.PEAK_HOURS.TITLE}
        </h1>
        <p className="text-xs text-slate-500 max-w-2xl">
          {SALES_ANALYTICS_COPY.PEAK_HOURS.SUBTITLE}
        </p>
      </div>


      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide block">
              {SALES_ANALYTICS_COPY.PEAK_HOURS.KPI.TOTAL_ORDERS}
            </span>
            <span className="text-lg font-black text-slate-800">
              {formatNumber(totalOrders)} đơn
            </span>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide block">
              {SALES_ANALYTICS_COPY.PEAK_HOURS.KPI.TOTAL_REVENUE}
            </span>
            <span className="text-lg font-black text-emerald-700">
              {formatCurrency(totalRevenue)}
            </span>
          </div>
        </div>

        {/* Card 3: Average Order Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide block">
              {SALES_ANALYTICS_COPY.PEAK_HOURS.KPI.AVERAGE_ORDER_VALUE}
            </span>
            <span className="text-lg font-black text-slate-800">
              {formatCurrency(averageOrderValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[350px] bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-10 h-10 border-4 border-kv-blue-primary border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs font-bold text-slate-500">
            Đang tổng hợp dữ liệu giờ cao điểm và xây dựng biểu đồ nhiệt...
          </span>
        </div>
      ) : !hasData ? (
        /* Empty / Insufficient Data State (NCL-18-CN-001-TC-02) */
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <BarChart2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">
            {SALES_ANALYTICS_COPY.PEAK_HOURS.EMPTY_STATE_TITLE}
          </h3>
          <p className="text-xs font-semibold text-slate-500 max-w-md leading-relaxed">
            {SALES_ANALYTICS_COPY.PEAK_HOURS.EMPTY_STATE_DESC}
          </p>
        </div>
      ) : (
        /* Success State with Full Charts (NCL-18-CN-001-TC-01) */
        <div className="flex flex-col gap-6">
          {/* Heatmap Matrix */}
          <PeakHoursHeatmap heatmap={heatmap} maxRevenue={totalRevenue} />

          {/* 2 Column Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HourlyDistributionBar
              hourlyStats={hourlyStats}
              peakHour={insights.peakHour}
              lowestHour={insights.lowestHour}
            />
            <DayOfWeekDistribution
              dayOfWeekStats={dayOfWeekStats}
              busiestDayOfWeek={insights.busiestDayOfWeek}
            />
          </div>

          {/* Insights & Recommendations */}
          <PeakInsightsCard insights={insights} totalOrders={totalOrders} />
        </div>
      )}
    </div>
  );
};

export default PeakHoursAnalyticsPage;
