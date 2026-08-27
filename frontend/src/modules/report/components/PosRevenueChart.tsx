import React from "react";
import { BarChart3, PieChart } from "lucide-react";
import type { IPosRevenueItem } from "../types/IPosRevenue";
import { formatCurrency } from "@/utils/formatCurrency";

interface PosRevenueChartProps {
  items: IPosRevenueItem[];
  totalRevenue: number;
  isLoading?: boolean;
}

const BAR_COLORS = [
  "bg-kv-blue-primary",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-sky-500",
];

export const PosRevenueChart: React.FC<PosRevenueChartProps> = ({
  items,
  totalRevenue,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-64 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-2">
          <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
          <div className="w-32 h-4 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...items.map((i) => i.netRevenue), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Chart 1: So sánh doanh thu cột ngang */}
      <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <BarChart3 className="w-4 h-4 text-kv-blue-primary" />
            <span>So sánh doanh thu thuần giữa các điểm bán</span>
          </div>
          <span className="text-xs text-slate-400">Đơn vị: VNĐ</span>
        </div>

        <div className="space-y-3.5 pt-1">
          {items.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">Chưa có dữ liệu điểm bán</p>
          ) : (
            items.map((item, idx) => {
              const widthPct = Math.max((item.netRevenue / maxRevenue) * 100, 2);
              const colorClass = BAR_COLORS[idx % BAR_COLORS.length];

              return (
                <div key={item.posId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      {item.posName}{" "}
                      <span className="text-[11px] font-normal text-slate-400">({item.posCode})</span>
                    </span>
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(item.netRevenue)}
                    </span>
                  </div>
                  <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colorClass} rounded-full transition-all duration-500`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chart 2: Tỷ trọng đóng góp % */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm pb-3 border-b border-slate-100">
            <PieChart className="w-4 h-4 text-purple-600" />
            <span>Tỷ trọng đóng góp doanh thu</span>
          </div>

          {/* Proportion Segmented Bar */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex mt-4">
            {items.map((item, idx) => {
              const pct = totalRevenue > 0 ? (item.netRevenue / totalRevenue) * 100 : 0;
              if (pct <= 0) return null;
              return (
                <div
                  key={item.posId}
                  className={`h-full ${BAR_COLORS[idx % BAR_COLORS.length]}`}
                  style={{ width: `${pct}%` }}
                  title={`${item.posName}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2 mt-4">
            {items.map((item, idx) => {
              const pct = totalRevenue > 0 ? ((item.netRevenue / totalRevenue) * 100).toFixed(1) : "0.0";
              const colorClass = BAR_COLORS[idx % BAR_COLORS.length];

              return (
                <div key={item.posId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-3 h-3 rounded-full shrink-0 ${colorClass}`} />
                    <span className="text-slate-700 truncate font-semibold">{item.posName}</span>
                  </div>
                  <span className="font-extrabold text-slate-900 shrink-0">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
          * Điểm bán không phát sinh đơn hiển thị 0% theo quy chuẩn kiểm toán.
        </div>
      </div>
    </div>
  );
};
