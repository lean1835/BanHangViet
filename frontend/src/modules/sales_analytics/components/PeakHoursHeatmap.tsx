import React, { useState } from "react";
import { Flame, Clock, Calendar, TrendingUp, ShoppingBag, DollarSign } from "lucide-react";
import { formatCurrency, formatNumber, formatCompactCurrency } from "@/utils/formatCurrency";
import type { ISalesHeatmapCell } from "../types/ISalesAnalytics";
import { SALES_ANALYTICS_COPY } from "@/constants/salesAnalytics";

export type HeatmapMetric = "ORDERS" | "REVENUE";

interface PeakHoursHeatmapProps {
  heatmap: ISalesHeatmapCell[];
  maxRevenue?: number;
  initialMetric?: HeatmapMetric;
}

const DAYS_OF_WEEK = [
  { index: 1, name: "Thứ 2", fullName: "Thứ Hai" },
  { index: 2, name: "Thứ 3", fullName: "Thứ Ba" },
  { index: 3, name: "Thứ 4", fullName: "Thứ Tư" },
  { index: 4, name: "Thứ 5", fullName: "Thứ Năm" },
  { index: 5, name: "Thứ 6", fullName: "Thứ Sáu" },
  { index: 6, name: "Thứ 7", fullName: "Thứ Bảy" },
  { index: 7, name: "Chủ Nhật", fullName: "Chủ Nhật" },
];

const getHeatmapColorClass = (intensity: number, hasValue: boolean): string => {
  if (!hasValue || intensity <= 0) {
    return "bg-slate-50 border-slate-200/50 text-slate-400 hover:border-slate-300";
  }
  if (intensity < 0.2) {
    return "bg-sky-100/80 border-sky-200 text-sky-800 hover:bg-sky-200 hover:border-sky-300";
  }
  if (intensity < 0.45) {
    return "bg-sky-300 border-sky-400 text-sky-950 hover:bg-sky-400";
  }
  if (intensity < 0.75) {
    return "bg-blue-500 border-blue-600 text-white font-bold hover:bg-blue-600";
  }
  return "bg-indigo-700 border-indigo-800 text-white font-black hover:bg-indigo-800 ring-1 ring-amber-400 shadow-sm";
};

export const PeakHoursHeatmap: React.FC<PeakHoursHeatmapProps> = ({
  heatmap,
  initialMetric = "ORDERS",
}) => {
  const [metric, setMetric] = useState<HeatmapMetric>(initialMetric);
  const [hoveredCell, setHoveredCell] = useState<ISalesHeatmapCell | null>(null);

  // Calculate max order count and max revenue dynamically from the dataset
  const { maxOrders, maxRevenue } = React.useMemo(() => {
    let maxO = 0;
    let maxR = 0;
    for (const cell of heatmap) {
      if ((cell.orderCount || 0) > maxO) maxO = cell.orderCount;
      if ((cell.totalRevenue || 0) > maxR) maxR = cell.totalRevenue;
    }
    return {
      maxOrders: Math.max(maxO, 1),
      maxRevenue: Math.max(maxR, 1),
    };
  }, [heatmap]);

  // Map heatmap data for O(1) cell lookup: `${dayOfWeek}_${hourOfDay}`
  const cellMap = React.useMemo(() => {
    const map = new Map<string, ISalesHeatmapCell>();
    for (const cell of heatmap) {
      map.set(`${cell.dayOfWeek}_${cell.hourOfDay}`, cell);
    }
    return map;
  }, [heatmap]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm">
              {SALES_ANALYTICS_COPY.PEAK_HOURS.HEATMAP_TITLE}
            </h3>
            <p className="text-[11px] text-slate-400 font-normal">
              {metric === "ORDERS"
                ? "Màu sắc càng đậm thể hiện lượng đơn hàng phát sinh càng cao trong khung giờ"
                : "Màu sắc càng đậm thể hiện doanh thu đạt đỉnh càng cao trong khung giờ"}
            </p>
          </div>
        </div>

        {/* Right side: Metric toggle & Legend */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          {/* Segmented Metric Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
            <button
              type="button"
              onClick={() => setMetric("ORDERS")}
              className={`flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-md transition-all cursor-pointer ${
                metric === "ORDERS"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Số lượng đơn</span>
            </button>
            <button
              type="button"
              onClick={() => setMetric("REVENUE")}
              className={`flex items-center gap-1.5 px-2.5 py-1 font-bold rounded-md transition-all cursor-pointer ${
                metric === "REVENUE"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Doanh thu</span>
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 shrink-0">
            <span>{metric === "ORDERS" ? "0 đơn" : "0 đ"}</span>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200 inline-block" />
              <span className="w-3.5 h-3.5 rounded bg-sky-100 border border-sky-200 inline-block" />
              <span className="w-3.5 h-3.5 rounded bg-sky-300 border border-sky-400 inline-block" />
              <span className="w-3.5 h-3.5 rounded bg-blue-500 border border-blue-600 inline-block" />
              <span className="w-3.5 h-3.5 rounded bg-indigo-700 border border-indigo-800 inline-block ring-1 ring-amber-400" />
            </div>
            <span className="text-indigo-700 font-black">
              {metric === "ORDERS"
                ? `Đỉnh (${formatNumber(maxOrders)} đơn)`
                : `Đỉnh (${formatCompactCurrency(maxRevenue)})`}
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid Wrapper */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[760px] flex flex-col gap-1.5 select-none">
          {/* Header Row: Hours 00 to 23 */}
          <div className="flex items-center gap-1 pl-20">
            {Array.from({ length: 24 }).map((_, hour) => (
              <div
                key={hour}
                className="flex-1 text-center font-mono font-bold text-[10px] text-slate-400"
              >
                {hour < 10 ? `0${hour}` : hour}h
              </div>
            ))}
          </div>

          {/* Days Rows (7 Days) */}
          {DAYS_OF_WEEK.map((day) => (
            <div key={day.index} className="flex items-center gap-1">
              {/* Day Label */}
              <div className="w-20 shrink-0 text-xs font-bold text-slate-700 truncate pr-2 text-right">
                {day.name}
              </div>

              {/* 24 Hour Cells */}
              <div className="flex-1 flex items-center gap-1">
                {Array.from({ length: 24 }).map((_, hour) => {
                  const cell = cellMap.get(`${day.index}_${hour}`) || {
                    dayOfWeek: day.index,
                    dayName: day.fullName,
                    hourOfDay: hour,
                    hourLabel: `${hour < 10 ? "0" + hour : hour}:00 - ${(hour + 1) % 24 < 10 ? "0" + (hour + 1) % 24 : (hour + 1) % 24}:00`,
                    orderCount: 0,
                    totalRevenue: 0,
                    intensity: 0,
                  };

                  const cellIntensity =
                    metric === "ORDERS"
                      ? (cell.orderCount || 0) / maxOrders
                      : (cell.totalRevenue || 0) / maxRevenue;

                  const hasValue =
                    metric === "ORDERS"
                      ? (cell.orderCount || 0) > 0
                      : (cell.totalRevenue || 0) > 0;

                  const colorClass = getHeatmapColorClass(
                    cellIntensity,
                    hasValue
                  );

                  const isPeakCell = cellIntensity >= 0.85 && hasValue;

                  return (
                    <div
                      key={hour}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                      className={`flex-1 h-8 rounded-md border text-[9px] flex items-center justify-center cursor-pointer transition-all duration-150 relative group ${colorClass}`}
                    >
                      {metric === "ORDERS" ? (
                        cell.orderCount > 0 ? (
                          <span className="font-semibold">{cell.orderCount}</span>
                        ) : (
                          <span className="opacity-0 group-hover:opacity-40">-</span>
                        )
                      ) : cell.totalRevenue > 0 ? (
                        <span className="font-semibold text-[8px] leading-tight text-center px-0.5 truncate max-w-full">
                          {formatCompactCurrency(cell.totalRevenue)}
                        </span>
                      ) : (
                        <span className="opacity-0 group-hover:opacity-40">-</span>
                      )}

                      {/* Top Peak Badge Indicator */}
                      {isPeakCell && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white shadow-xs" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hovered Cell Detail Info Bar */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs min-h-[36px]">
        {hoveredCell ? (
          <div className="flex items-center gap-4 flex-wrap text-slate-700 animate-auth-fade-in">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Calendar className="w-3.5 h-3.5 text-kv-blue-primary" />
              <span>{hoveredCell.dayName}</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-700">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{hoveredCell.hourLabel}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Số đơn:</span>
              <span className="font-extrabold text-blue-700">
                {formatNumber(hoveredCell.orderCount)} đơn
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Doanh thu:</span>
              <span className="font-black text-emerald-700">
                {formatCurrency(hoveredCell.totalRevenue)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Mức độ tập trung:</span>
              <span className="font-bold text-indigo-700">
                {Math.round(
                  (metric === "ORDERS"
                    ? (hoveredCell.orderCount || 0) / maxOrders
                    : (hoveredCell.totalRevenue || 0) / maxRevenue) * 100
                )}%
              </span>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px] italic flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            Rê chuột vào từng ô trên biểu đồ để xem chi tiết số đơn và doanh thu của từng khung giờ.
          </span>
        )}
      </div>
    </div>
  );
};

export default PeakHoursHeatmap;
