import React, { useState } from "react";
import { CalendarRange, Layers, BarChart3, Table as TableIcon } from "lucide-react";
import type { IMonthlyRevenueBreakdown } from "../types/IAnnualRevenueTracking";

interface MonthlyRevenueBreakdownTableProps {
  breakdown?: IMonthlyRevenueBreakdown[];
  year: number;
  warningThresholdPercentage?: number;
}

const formatCurrency = (val?: number): string => {
  if (val === undefined || val === null) return "0 đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(val);
};

const formatCompact = (val: number): string => {
  if (val >= 1_000_000_000) {
    return `${(val / 1_000_000_000).toFixed(1)} tỷ`;
  }
  if (val >= 1_000_000) {
    return `${(val / 1_000_000).toFixed(0)} tr`;
  }
  return new Intl.NumberFormat("vi-VN").format(val);
};

export const MonthlyRevenueBreakdownTable: React.FC<
  MonthlyRevenueBreakdownTableProps
> = ({ breakdown = [], year, warningThresholdPercentage = 80 }) => {
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");

  if (!breakdown || breakdown.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center text-slate-500 shadow-2xs">
        <CalendarRange className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs">Chưa có dữ liệu phân rã doanh thu theo tháng cho năm {year}.</p>
      </div>
    );
  }

  // Tổng cộng toàn bộ
  const totalRevenue = breakdown.reduce((acc, item) => acc + (item.revenue || 0), 0);
  const totalTax = breakdown.reduce((acc, item) => acc + (item.taxAmount || 0), 0);
  const totalInvoices = breakdown.reduce(
    (acc, item) => acc + (item.validInvoiceCount || 0),
    0
  );

  const maxMonthRevenue = Math.max(
    ...breakdown.map((b) => b.revenue || 0),
    1
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col gap-4">
      {/* Header & Bộ chuyển đổi góc nhìn */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Layers className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              Doanh thu theo tháng (Năm {year})
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút Toggle giữa Bảng và Biểu đồ */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Xem danh sách bảng dữ liệu kế toán chi tiết"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Bảng số liệu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === "chart"
                  ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Xem biểu đồ cột trực quan theo tháng"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Biểu đồ trực quan</span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl hidden sm:inline-block">
            {breakdown.length} tháng ghi nhận
          </span>
        </div>
      </div>

      {/* 1. CHẾ ĐỘ BIỂU ĐỒ TRỰC QUAN (VISUAL BAR CHART) */}
      {viewMode === "chart" ? (
        <div className="p-4 bg-slate-50/60 rounded-xl border border-slate-200/70 flex flex-col gap-4">
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Biểu đồ doanh thu hàng tháng so với đỉnh cao nhất ({formatCompact(maxMonthRevenue)})</span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded bg-blue-500" />
              <span>Doanh thu tháng</span>
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-6 pb-2 items-end h-48 border-b border-slate-200">
            {breakdown.map((row) => {
              const heightPct = Math.max(
                Math.round(((row.revenue || 0) / maxMonthRevenue) * 100),
                6
              );
              const isWarning = (row.percentageOfThreshold || 0) >= warningThresholdPercentage;
              const isExceeded = (row.percentageOfThreshold || 0) >= 100;

              let barBg = "bg-blue-500 hover:bg-blue-600";
              if (isExceeded) barBg = "bg-rose-500 hover:bg-rose-600";
              else if (isWarning) barBg = "bg-amber-500 hover:bg-amber-600";

              return (
                <div
                  key={row.month}
                  className="group relative flex flex-col items-center h-full justify-end"
                >
                  {/* Tooltip hover */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none whitespace-nowrap">
                    <div className="bg-slate-900 text-white text-[10px] rounded-lg py-1.5 px-2.5 shadow-lg flex flex-col gap-0.5">
                      <span className="font-bold text-slate-300">Tháng {row.month}/{year}</span>
                      <span className="font-black text-white">{formatCurrency(row.revenue)}</span>
                      <span className="text-slate-300">Lũy kế: {formatCurrency(row.cumulativeRevenue)}</span>
                      <span className="text-slate-300">HĐ: {row.validInvoiceCount} | Thuế: {formatCompact(row.taxAmount || 0)}</span>
                    </div>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
                  </div>

                  {/* Giá trị compact trên cột */}
                  <span className="text-[9px] font-bold text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatCompact(row.revenue)}
                  </span>

                  {/* Cột Bar */}
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[28px] rounded-t-lg transition-all duration-300 ${barBg} shadow-2xs`}
                  />

                  {/* Nhãn tháng */}
                  <span className="text-[11px] font-bold text-slate-700 mt-2">
                    T{row.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1 font-medium">
            <span>Tổng số: <strong className="text-slate-900 font-extrabold">{totalInvoices}</strong> hóa đơn</span>
            <span>Tổng phát sinh: <strong className="text-blue-900 font-black">{formatCurrency(totalRevenue)}</strong></span>
          </div>
        </div>
      ) : (
        /* 2. CHẾ ĐỘ BẢNG KẾ TOÁN CHI TIẾT */
        <div className="overflow-x-auto border border-slate-200/90 rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50/90 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="p-3 text-center w-14">Tháng</th>
                <th className="p-3 text-center">Số HĐ hợp lệ</th>
                <th className="p-3 text-right">Doanh thu tháng</th>
                <th className="p-3 text-right">Thuế phát sinh</th>
                <th className="p-3 text-right">Doanh thu lũy kế</th>
                <th className="p-3 text-right w-48">% so với ngưỡng 1 tỷ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {breakdown.map((row) => {
                const pct = row.percentageOfThreshold || 0;
                const isWarningCrossed = pct >= warningThresholdPercentage && pct < 100;
                const isExceeded = pct >= 100;

                let barColor = "bg-emerald-500";
                let badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200/60";
                if (isExceeded) {
                  barColor = "bg-rose-500";
                  badgeColor = "text-rose-700 bg-rose-50 border-rose-200/60 font-black";
                } else if (isWarningCrossed) {
                  barColor = "bg-amber-500";
                  badgeColor = "text-amber-800 bg-amber-50 border-amber-200/60 font-black";
                }

                return (
                  <tr
                    key={row.month}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="p-3 text-center font-black text-slate-800 bg-slate-50/30">
                      T{row.month}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600">
                      {row.validInvoiceCount}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="p-3 text-right font-semibold text-rose-600">
                      {formatCurrency(row.taxAmount)}
                    </td>
                    <td className="p-3 text-right font-black text-blue-900">
                      {formatCurrency(row.cumulativeRevenue)}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shrink-0">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}
                        >
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50/90 font-extrabold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td className="p-3 text-center uppercase tracking-wider">Tổng</td>
                <td className="p-3 text-center">{totalInvoices}</td>
                <td className="p-3 text-right text-blue-900 font-black">
                  {formatCurrency(totalRevenue)}
                </td>
                <td className="p-3 text-right text-rose-700">
                  {formatCurrency(totalTax)}
                </td>
                <td className="p-3 text-right font-black text-blue-950">
                  {formatCurrency(
                    breakdown[breakdown.length - 1]?.cumulativeRevenue || totalRevenue
                  )}
                </td>
                <td className="p-3 text-right">
                  <span className="text-xs font-black text-blue-800">
                    {breakdown[breakdown.length - 1]?.percentageOfThreshold?.toFixed(2) || 0}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
