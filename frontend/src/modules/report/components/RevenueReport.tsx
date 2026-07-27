import React, { useState, useMemo } from "react";
import {
  Calendar,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Award,
  BarChart2,
  Package,
} from "lucide-react";
import {
  useGetDailyRevenueQuery,
  useGetTopSellingProductsQuery,
} from "../services/reportApi";
import { formatCurrency } from "@/utils/formatCurrency";
import { getLocalDateString } from "@/utils/dateFormatter";

const getPresetDates = (preset: "today" | "last7days" | "thisMonth") => {
  const now = new Date();
  const todayStr = getLocalDateString(now);

  if (preset === "today") {
    return { fromDate: todayStr, toDate: todayStr };
  }

  if (preset === "last7days") {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { fromDate: getLocalDateString(d), toDate: todayStr };
  }

  // thisMonth
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    fromDate: getLocalDateString(firstDay),
    toDate: todayStr,
  };
};

export const RevenueReport: React.FC = () => {
  const defaultDates = useMemo(() => getPresetDates("thisMonth"), []);
  const [fromDate, setFromDate] = useState<string>(defaultDates.fromDate);
  const [toDate, setToDate] = useState<string>(defaultDates.toDate);
  const [activePreset, setActivePreset] = useState<"today" | "last7days" | "thisMonth" | "custom">("thisMonth");

  const {
    data: dailyRes,
    isLoading: isDailyLoading,
    isFetching: isDailyFetching,
    refetch: refetchDaily,
  } = useGetDailyRevenueQuery({ fromDate, toDate });

  const {
    data: topSellingRes,
    isLoading: isTopSellingLoading,
    isFetching: isTopSellingFetching,
    refetch: refetchTopSelling,
  } = useGetTopSellingProductsQuery({ fromDate, toDate, limit: 10 });

  const rawDailyList = dailyRes?.result;
  const dailyList = useMemo(() => {
    if (!rawDailyList) return [];
    return [...rawDailyList].sort((a, b) => (a.salesDate || "").localeCompare(b.salesDate || ""));
  }, [rawDailyList]);
  const topSellingList = topSellingRes?.result || [];

  const handlePresetClick = (preset: "today" | "last7days" | "thisMonth") => {
    const dates = getPresetDates(preset);
    setFromDate(dates.fromDate);
    setToDate(dates.toDate);
    setActivePreset(preset);
  };

  const handleRefetch = () => {
    void refetchDaily();
    void refetchTopSelling();
  };

  // Aggregated KPIs
  const totalNetRevenue = useMemo(
    () => dailyList.reduce((acc, curr) => acc + (curr.netRevenue || 0), 0),
    [dailyList]
  );

  const totalOrderCount = useMemo(
    () => dailyList.reduce((acc, curr) => acc + (curr.orderCount || 0), 0),
    [dailyList]
  );

  const avgOrderValue = totalOrderCount > 0 ? Math.round(totalNetRevenue / totalOrderCount) : 0;

  // Chart max calculation
  const maxNetRevenue = useMemo(() => {
    const max = Math.max(...dailyList.map((d) => d.netRevenue || 0), 0);
    return max > 0 ? max : 1000000;
  }, [dailyList]);

  // Format date helper for chart labels
  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  const isFetching = isDailyFetching || isTopSellingFetching;
  const isLoading = isDailyLoading || isTopSellingLoading;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Từ:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setActivePreset("custom");
              }}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20"
            />
            <span>Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setActivePreset("custom");
              }}
              className="border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20"
            />
          </div>

          <div className="flex items-center gap-1.5 border-l pl-3 border-slate-200">
            <button
              onClick={() => handlePresetClick("today")}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors ${
                activePreset === "today"
                  ? "bg-kv-blue-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => handlePresetClick("last7days")}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors ${
                activePreset === "last7days"
                  ? "bg-kv-blue-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              7 ngày qua
            </button>
            <button
              onClick={() => handlePresetClick("thisMonth")}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-colors ${
                activePreset === "thisMonth"
                  ? "bg-kv-blue-primary text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Tháng này
            </button>
          </div>
        </div>

        <button
          onClick={handleRefetch}
          disabled={isFetching}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-kv-blue-primary" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide block">
              Tổng doanh thu thuần
            </span>
            <span className="text-lg font-black text-slate-800">
              {formatCurrency(totalNetRevenue)}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide block">
              Tổng đơn hoàn thành
            </span>
            <span className="text-lg font-black text-slate-800">
              {totalOrderCount.toLocaleString("vi-VN")} đơn
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 sm:col-span-2 lg:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-extrabold uppercase tracking-wide block">
              Giá trị trung bình / đơn
            </span>
            <span className="text-lg font-black text-slate-800">
              {formatCurrency(avgOrderValue)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Revenue Chart & Top Selling Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Daily Revenue Chart */}
        <div className="xl:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-kv-blue-primary" />
              <span>Biểu Đồ Doanh Thu Theo Ngày</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">
              ({dailyList.length} ngày có phát sinh)
            </span>
          </div>

          {isLoading || isFetching ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-8 h-8 animate-spin text-kv-blue-primary mb-2" />
              <span>Đang tải dữ liệu biểu đồ...</span>
            </div>
          ) : dailyList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-xs font-semibold">
              <BarChart2 className="w-10 h-10 text-slate-300 mb-2" />
              <span>Không có dữ liệu doanh thu trong khoảng thời gian đã chọn.</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-end">
              {/* Bars Container */}
              <div className="h-[220px] flex items-end gap-3 sm:gap-5 px-3 pt-6 pb-2 border-b border-slate-200 overflow-x-auto">
                {dailyList.map((item) => {
                  const heightPercent = Math.max(
                    Math.round(((item.netRevenue || 0) / maxNetRevenue) * 100),
                    8
                  );
                  return (
                    <div
                      key={item.salesDate}
                      className="flex-1 min-w-[40px] max-w-[64px] h-full flex flex-col justify-end items-center gap-2 group relative"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20 flex flex-col items-center">
                        <span className="font-extrabold">{formatDateLabel(item.salesDate)}</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(item.netRevenue || 0)}</span>
                        <span className="text-slate-300 text-[9px]">{item.orderCount || 0} đơn hàng</span>
                      </div>

                      {/* Bar Track & Fill */}
                      <div className="w-full flex-1 bg-slate-100/80 rounded-t-lg flex items-end p-0.5 overflow-hidden border border-slate-200/60">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full bg-gradient-to-t from-kv-blue-primary via-blue-500 to-sky-400 rounded-t-md group-hover:brightness-110 transition-all duration-500 shadow-sm"
                        />
                      </div>

                      {/* Label X */}
                      <span className="text-[10px] font-extrabold text-slate-600 truncate w-full text-center shrink-0">
                        {formatDateLabel(item.salesDate)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Chart Footer Info */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold pt-3 px-1">
                <span>Trục Y: Doanh thu thuần (VNĐ)</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-kv-blue-primary inline-block" />
                  <span>Doanh thu thực tế từ đơn COMPLETED</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Top Selling Products */}
        <div className="xl:col-span-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[380px]">
          <div className="flex items-center justify-between border-b pb-3 mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Mặt Hàng Bán Chạy</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">Top 10</span>
          </div>

          {isTopSellingLoading || isTopSellingFetching ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-xs font-semibold">
              <RefreshCw className="w-8 h-8 animate-spin text-kv-blue-primary mb-2" />
              <span>Đang tải danh sách bán chạy...</span>
            </div>
          ) : topSellingList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-xs font-semibold">
              <Package className="w-10 h-10 text-slate-300 mb-2" />
              <span>Không có sản phẩm bán chạy trong thời gian này.</span>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs font-semibold text-slate-700">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-2 pl-1">#</th>
                    <th className="pb-2">Sản phẩm</th>
                    <th className="pb-2 text-right">Đã bán</th>
                    <th className="pb-2 text-right pr-1">Doanh thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topSellingList.map((product, idx) => (
                    <tr key={product.productId || idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 pl-1">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                            idx === 0
                              ? "bg-amber-100 text-amber-700 border border-amber-300"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-amber-50 text-amber-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-bold text-slate-800 block truncate max-w-[140px]" title={product.productName}>
                          {product.productName}
                        </span>
                        {product.sku && (
                          <span className="text-[10px] text-slate-400 font-mono font-normal block">
                            {product.sku}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-black text-kv-blue-primary">
                        {product.quantitySold} {product.unit || ""}
                      </td>
                      <td className="py-2.5 text-right pr-1 font-bold text-slate-800">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
