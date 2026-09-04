import React, { useState, useMemo } from "react";
import {
  ShieldAlert,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useGetPosRevenueReportQuery } from "../services/posRevenueReportApi";
import type { IPosRevenueSummary } from "../types/IPosRevenue";
import { PosRevenueKpis } from "../components/PosRevenueKpis";
import { PosRevenueChart } from "../components/PosRevenueChart";
import { PosRevenueTable } from "../components/PosRevenueTable";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";

import { useOptionalReportFilter } from "../context/ReportFilterContext";
import { useOnOrderCompleted } from "@/utils/orderEvents";

const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const PosRevenueReportPage: React.FC = () => {
  const { currentRole } = useDashboardDemo();

  // Đọc bộ lọc từ thanh bên trái (ReportSidebar / ReportFilterContext), fallback nếu test độc lập
  const reportFilterCtx = useOptionalReportFilter();

  const [localFromDate] = useState(() => {
    const now = new Date();
    return formatDateToISO(new Date(now.getFullYear(), now.getMonth(), 1));
  });
  const [localToDate] = useState(() => {
    return formatDateToISO(new Date());
  });
  const [localPosId] = useState<string>("");

  const fromDate = reportFilterCtx ? reportFilterCtx.posRevenueFilter.fromDate : localFromDate;
  const toDate = reportFilterCtx ? reportFilterCtx.posRevenueFilter.toDate : localToDate;
  const selectedPosId = reportFilterCtx ? reportFilterCtx.posRevenueFilter.posId : localPosId;

  // Query BE endpoint: GET /api/v1/points-of-sale/reports/revenue
  const {
    data: apiReportData,
    isLoading: isLoadingApi,
    isFetching,
    error: apiError,
    refetch,
  } = useGetPosRevenueReportQuery(
    {
      fromDate,
      toDate,
      posId: selectedPosId || undefined,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Tự động làm mới tức thì (0ms) khi có bất kỳ đơn hàng nào bán thành công
  useOnOrderCompleted(refetch);

  const reportSummary: IPosRevenueSummary = useMemo(() => {
    if (apiReportData) {
      return apiReportData;
    }

    // Default empty summary when loading or no data
    return {
      fromDate,
      toDate,
      totalRevenue: 0,
      totalOrders: 0,
      totalInvoices: 0,
      items: [],
    };
  }, [apiReportData, fromDate, toDate]);

  // Role Guard: NCL-17-CN-004-TC-03 requires blocking salesperson VT-02
  const isSalesperson = currentRole === USER_ROLES.CASHIER;

  if (isSalesperson) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 animate-fade-in my-12 bg-white rounded-2xl border border-rose-200 shadow-xs">
        <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">
          Không có quyền truy cập báo cáo
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tài khoản của bạn với vai trò <strong>Thu ngân (VT-02)</strong> không có quyền xem báo cáo tổng hợp doanh thu giữa các điểm bán. Vui lòng liên hệ Chủ hộ (VT-01) hoặc Kế toán (VT-03) để được cấp quyền.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 w-full animate-auth-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Báo cáo Doanh thu theo Điểm bán
            </h1>
            {isFetching && (
              <Loader2 className="w-4 h-4 text-kv-blue-primary animate-spin" />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp và so sánh doanh thu thuần, tỷ trọng đóng góp giữa các chi nhánh trong cùng hộ
          </p>
        </div>
      </div>

      {apiError && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>
            Đang tải dữ liệu từ máy chủ. Nếu chưa có đơn hàng nào trong khoảng thời gian này, các điểm bán sẽ hiển thị với doanh thu 0đ.
          </span>
        </div>
      )}

      {/* KPIs Cards */}
      <PosRevenueKpis summary={reportSummary} isLoading={isLoadingApi} />

      {/* Visual Charts */}
      <PosRevenueChart
        items={reportSummary.items}
        totalRevenue={reportSummary.totalRevenue}
        isLoading={isLoadingApi}
      />

      {/* Comparison Data Table */}
      <PosRevenueTable
        items={reportSummary.items}
        totalRevenue={reportSummary.totalRevenue}
        totalOrders={reportSummary.totalOrders}
        isLoading={isLoadingApi}
      />
    </div>
  );
};

export default PosRevenueReportPage;
