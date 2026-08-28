import React from "react";
import { Calendar, Award } from "lucide-react";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import type { IPeakDayOfWeekSalesData } from "../types/ISalesAnalytics";
import { SALES_ANALYTICS_COPY } from "@/constants/salesAnalytics";

interface DayOfWeekDistributionProps {
  dayOfWeekStats: IPeakDayOfWeekSalesData[];
  busiestDayOfWeek?: number;
}

export const DayOfWeekDistribution: React.FC<DayOfWeekDistributionProps> = ({
  dayOfWeekStats,
  busiestDayOfWeek,
}) => {
  const maxRevenue = React.useMemo(() => {
    return Math.max(...dayOfWeekStats.map((d) => d.totalRevenue || 0), 1);
  }, [dayOfWeekStats]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-kv-blue-primary" />
          <h3 className="font-extrabold text-slate-800 text-sm">
            {SALES_ANALYTICS_COPY.PEAK_HOURS.DAY_OF_WEEK_CHART_TITLE}
          </h3>
        </div>
        <span className="text-[11px] font-bold text-slate-400">7 ngày trong tuần</span>
      </div>

      {/* 7 Days List / Bar */}
      <div className="flex flex-col gap-2.5 flex-1 justify-center">
        {dayOfWeekStats.map((day) => {
          const widthPercent = Math.max(
            Math.round(((day.totalRevenue || 0) / maxRevenue) * 100),
            day.orderCount > 0 ? 5 : 0
          );

          const isBusiest = day.dayOfWeek === busiestDayOfWeek && day.orderCount > 0;

          return (
            <div key={day.dayOfWeek} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className={isBusiest ? "text-amber-600 font-black" : "text-slate-700"}>
                    {day.dayName}
                  </span>
                  {isBusiest && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-black">
                      <Award className="w-3 h-3" />
                      Bán chạy nhất
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-[11px]">
                    {formatNumber(day.orderCount)} đơn ({day.revenuePercentage}%)
                  </span>
                  <span className="font-extrabold text-slate-800 text-right min-w-[80px]">
                    {formatCurrency(day.totalRevenue)}
                  </span>
                </div>
              </div>

              {/* Progress bar track */}
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  style={{ width: `${widthPercent}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    isBusiest
                      ? "bg-gradient-to-r from-amber-400 to-amber-600"
                      : day.orderCount > 0
                      ? "bg-gradient-to-r from-blue-400 to-kv-blue-primary"
                      : "bg-slate-200"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
