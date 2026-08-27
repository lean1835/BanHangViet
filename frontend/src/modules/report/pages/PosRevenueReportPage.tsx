import React, { useState, useMemo } from "react";
import {
  Calendar,
  Filter,
  ShieldAlert,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useGetPosRevenueReportQuery } from "../services/posRevenueReportApi";
import { useGetPointsOfSaleQuery } from "@/modules/point_of_sale/services/pointOfSaleApi";
import type { IPosRevenueSummary } from "../types/IPosRevenue";
import { PosRevenueKpis } from "../components/PosRevenueKpis";
import { PosRevenueChart } from "../components/PosRevenueChart";
import { PosRevenueTable } from "../components/PosRevenueTable";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";

type TPeriodOption = "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "CUSTOM";

const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const PosRevenueReportPage: React.FC = () => {
  const { currentRole } = useDashboardDemo();

  const [period, setPeriod] = useState<TPeriodOption>("THIS_MONTH");
  const [selectedPosId, setSelectedPosId] = useState<string>("");

  // Calculate default dates based on period
  const [fromDate, setFromDate] = useState(() => {
    const now = new Date();
    return formatDateToISO(new Date(now.getFullYear(), now.getMonth(), 1));
  });

  const [toDate, setToDate] = useState(() => {
    return formatDateToISO(new Date());
  });

  const handlePeriodChange = (newPeriod: TPeriodOption) => {
    setPeriod(newPeriod);
    const now = new Date();

    if (newPeriod === "TODAY") {
      const todayStr = formatDateToISO(now);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (newPeriod === "THIS_WEEK") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      setFromDate(formatDateToISO(monday));
      setToDate(formatDateToISO(new Date()));
    } else if (newPeriod === "THIS_MONTH") {
      setFromDate(formatDateToISO(new Date(now.getFullYear(), now.getMonth(), 1)));
      setToDate(formatDateToISO(new Date()));
    } else if (newPeriod === "THIS_QUARTER") {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      setFromDate(formatDateToISO(new Date(now.getFullYear(), quarterMonth, 1)));
      setToDate(formatDateToISO(new Date()));
    }
  };

  // Query BE endpoint: GET /api/v1/points-of-sale/reports/revenue
  const {
    data: apiReportData,
    isLoading: isLoadingApi,
    isFetching,
    error: apiError,
  } = useGetPosRevenueReportQuery({
    fromDate,
    toDate,
    posId: selectedPosId || undefined,
  });

  // Query POS list for filter dropdown
  const { data: posData } = useGetPointsOfSaleQuery({
    size: 50,
  });

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
    <div className="space-y-5 animate-fade-in">
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

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* POS Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-xs text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPosId}
              onChange={(e) => setSelectedPosId(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="">Tất cả điểm bán ({posData?.totalElements || 0})</option>
              {posData?.content?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.posCode})
                </option>
              ))}
            </select>
          </div>

          {/* Period Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => handlePeriodChange("TODAY")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                period === "TODAY"
                  ? "bg-white text-kv-blue-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange("THIS_WEEK")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                period === "THIS_WEEK"
                  ? "bg-white text-kv-blue-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tuần này
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange("THIS_MONTH")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                period === "THIS_MONTH"
                  ? "bg-white text-kv-blue-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange("THIS_QUARTER")}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                period === "THIS_QUARTER"
                  ? "bg-white text-kv-blue-primary shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Quý này
            </button>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white shadow-xs text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPeriod("CUSTOM");
              }}
              className="bg-transparent font-medium text-slate-700 outline-none text-xs"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPeriod("CUSTOM");
              }}
              className="bg-transparent font-medium text-slate-700 outline-none text-xs"
            />
          </div>
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
