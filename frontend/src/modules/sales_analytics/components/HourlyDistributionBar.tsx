import React from "react";
import { Clock, TrendingUp } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import type { IPeakHourlySalesData } from "../types/ISalesAnalytics";
import { SALES_ANALYTICS_COPY } from "@/constants/salesAnalytics";

interface HourlyDistributionBarProps {
  hourlyStats: IPeakHourlySalesData[];
  peakHour?: number;
  lowestHour?: number;
}

export const HourlyDistributionBar: React.FC<HourlyDistributionBarProps> = ({
  hourlyStats,
  peakHour,
  lowestHour,
}) => {
  const maxRevenue = React.useMemo(() => {
    return Math.max(...hourlyStats.map((h) => h.totalRevenue || 0), 1);
  }, [hourlyStats]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-kv-blue-primary" />
          <h3 className="font-extrabold text-slate-800 text-sm">
            {SALES_ANALYTICS_COPY.PEAK_HOURS.HOURLY_CHART_TITLE}
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400">24 khung giờ</span>
      </div>

      {/* 24 Bars Container */}
      <div className="h-[200px] flex items-end gap-1.5 pt-4 pb-2 border-b border-slate-100 overflow-x-auto">
        {hourlyStats.map((stat) => {
          const heightPercent = Math.max(
            Math.round(((stat.totalRevenue || 0) / maxRevenue) * 100),
            stat.orderCount > 0 ? 8 : 2
          );

          const isPeak = stat.hour === peakHour && stat.orderCount > 0;
          const isLowest = stat.hour === lowestHour && stat.orderCount === 0;

          let barColor = "bg-slate-200 group-hover:bg-slate-300";
          if (isPeak) {
            barColor = "bg-gradient-to-t from-indigo-700 to-amber-500 ring-2 ring-amber-400";
          } else if (isLowest) {
            barColor = "bg-slate-100 border-dashed border border-slate-300";
          } else if (stat.orderCount > 0) {
            barColor = "bg-gradient-to-t from-kv-blue-primary to-sky-400 group-hover:brightness-110";
          }

          return (
            <div
              key={stat.hour}
              className="flex-1 min-w-[20px] h-full flex flex-col justify-end items-center gap-1.5 group relative select-none"
            >
              {/* Hover Tooltip */}
              <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-20 flex flex-col items-center">
                <span className="font-mono font-extrabold">{stat.label}</span>
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(stat.totalRevenue)} ({stat.revenuePercentage}%)
                </span>
                <span className="text-slate-300 text-[9px]">
                  {formatNumber(stat.orderCount)} đơn
                </span>
              </div>

              {/* Bar Fill Track */}
              <div className="w-full flex-1 flex items-end justify-center rounded-t overflow-hidden">
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t transition-all duration-300 ${barColor}`}
                />
              </div>

              {/* X Axis Label */}
              <span
                className={`font-mono text-[9px] truncate w-full text-center ${
                  isPeak ? "font-black text-amber-600" : "text-slate-500 font-medium"
                }`}
              >
                {stat.hour}h
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-3 text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-kv-blue-primary inline-block" />
          <span>Doanh thu theo giờ</span>
        </span>
        <span className="flex items-center gap-1 text-slate-600 font-bold">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          <span>Tỷ lệ phân bố (%)</span>
        </span>
      </div>
    </div>
  );
};
