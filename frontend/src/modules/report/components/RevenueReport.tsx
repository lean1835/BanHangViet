import React, { useMemo, useState } from "react";
import {
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Award,
  BarChart2,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  useGetDailyRevenueQuery,
  useGetTopSellingProductsQuery,
} from "../services/reportApi";
import { useReportFilter } from "../context/ReportFilterContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import { useOnOrderCompleted } from "@/utils/orderEvents";

export const RevenueReport: React.FC = () => {
  const { revenueFilter } = useReportFilter();
  const { fromDate, toDate } = revenueFilter;

  const [topSellingPage, setTopSellingPage] = useState<number>(0);
  const topSellingPageSize = 8;

  const {
    data: dailyRes,
    isLoading: isDailyLoading,
    isFetching: isDailyFetching,
    refetch: refetchDaily,
  } = useGetDailyRevenueQuery(
    { fromDate, toDate },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  const {
    data: topSellingRes,
    isLoading: isTopSellingLoading,
    isFetching: isTopSellingFetching,
    refetch: refetchTopSelling,
  } = useGetTopSellingProductsQuery(
    { fromDate, toDate, limit: 50 },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
    }
  );

  // Tự động làm mới khi có đơn hàng hoàn thành
  useOnOrderCompleted(() => {
    void refetchDaily();
    void refetchTopSelling();
  });

  const rawDailyList = dailyRes?.result;
  const dailyList = useMemo(() => {
    if (!rawDailyList) return [];
    return [...rawDailyList].sort((a, b) => (a.salesDate || "").localeCompare(b.salesDate || ""));
  }, [rawDailyList]);
  const rawTopSellingList = topSellingRes?.result;
  const topSellingList = useMemo(() => rawTopSellingList || [], [rawTopSellingList]);

  const totalTopSellingPages = Math.ceil(topSellingList.length / topSellingPageSize) || 1;
  const paginatedTopSellingList = useMemo(() => {
    const start = topSellingPage * topSellingPageSize;
    return topSellingList.slice(start, start + topSellingPageSize);
  }, [topSellingList, topSellingPage, topSellingPageSize]);

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
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const isFetching = isDailyFetching || isTopSellingFetching;
  const isLoading = isDailyLoading || isTopSellingLoading;

  return (
    <div className="flex flex-col gap-6 w-full animate-auth-fade-in">
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
        <div className="xl:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Mặt Hàng Bán Chạy</span>
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {topSellingList.length} mặt hàng
            </span>
          </div>

          {isTopSellingLoading || isTopSellingFetching ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-xs font-semibold gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kv-blue-primary"></div>
              <span>Đang tải danh sách bán chạy...</span>
            </div>
          ) : topSellingList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 text-xs font-semibold">
              <Package className="w-10 h-10 text-slate-300 mb-2" />
              <span>Không có sản phẩm bán chạy trong thời gian này.</span>
            </div>
          ) : (
            <div className="flex flex-col flex-1 justify-between">
              <div className="overflow-x-auto">
                <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                      <th className="p-3 w-10 text-center">STT</th>
                      <th className="p-3">Sản phẩm</th>
                      <th className="p-3 text-right">Đã bán</th>
                      <th className="p-3 text-right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
                    {paginatedTopSellingList.map((product, idx) => {
                      const overallIdx = topSellingPage * topSellingPageSize + idx;
                      return (
                        <tr key={product.productId || idx} className="hover:bg-slate-50/50 group transition-all">
                          <td className="p-3 text-center">
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-black inline-flex items-center justify-center ${
                                overallIdx === 0
                                  ? "bg-amber-100 text-amber-700 border border-amber-300"
                                  : overallIdx === 1
                                  ? "bg-slate-200 text-slate-700"
                                  : overallIdx === 2
                                  ? "bg-amber-50 text-amber-600"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {overallIdx + 1}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-slate-800 block truncate max-w-[140px]" title={product.productName}>
                              {product.productName}
                            </span>
                            {product.sku && (
                              <span className="text-[10px] text-slate-400 font-mono font-normal block">
                                {product.sku}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right font-black text-kv-blue-primary">
                            {product.quantitySold} {product.unit || ""}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-800">
                            {formatCurrency(product.revenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <TablePaginationFooter
                currentPage={topSellingPage}
                pageSize={topSellingPageSize}
                totalElements={topSellingList.length}
                totalPages={totalTopSellingPages}
                onPageChange={setTopSellingPage}
                recordUnit="mặt hàng"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
