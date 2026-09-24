import React, { useState } from "react";
import { Tooltip } from "antd";
import { Calendar, CircleDollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import type { IDailyGrossProfit } from "../types/IReport";

interface GrossProfitDailyChartProps {
  dailyReports: IDailyGrossProfit[];
  isLoading?: boolean;
}

export const GrossProfitDailyChart: React.FC<GrossProfitDailyChartProps> = ({
  dailyReports,
  isLoading = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="h-4 bg-slate-100 rounded w-1/4 animate-pulse" />
        <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!dailyReports || dailyReports.length === 0) {
    return null;
  }

  // Sắp xếp ngày tăng dần
  const sortedReports = [...dailyReports].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  const maxVal = Math.max(
    ...sortedReports.map((d) => Math.max(d.netRevenue, d.grossProfit, 0)),
    1000000
  );

  const chartHeight = 160;

  const formatDateLabel = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const renderTooltipContent = (item: IDailyGrossProfit) => {
    const parts = (item.date || "").split("-");
    const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : item.date;

    return (
      <div className="p-0.5 space-y-2.5 min-w-[220px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <Calendar className="w-3.5 h-3.5 text-kv-blue-primary shrink-0" />
            <span>Ngày {displayDate}</span>
          </div>
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm ${
              item.grossProfit >= 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-rose-50 text-rose-700"
            }`}
          >
            Biên độ: {item.grossProfitMarginPercentage.toFixed(1)}%
          </span>
        </div>

        <div className="space-y-2 text-slate-700">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-600">
              <CircleDollarSign className="w-3.5 h-3.5 text-kv-blue-primary shrink-0" />
              <span>Doanh thu thuần:</span>
            </span>
            <span className="font-bold text-slate-900">
              {formatCurrency(item.netRevenue)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-600">
              <TrendingUp
                className={`w-3.5 h-3.5 shrink-0 ${
                  item.grossProfit >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
              />
              <span>Lợi nhuận gộp:</span>
            </span>
            <span
              className={`font-bold ${
                item.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatCurrency(item.grossProfit)}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-slate-400 text-[11px] font-medium">Tỷ suất lãi gộp:</span>
          <span
            className={`font-black text-sm ${
              item.grossProfit >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {item.grossProfitMarginPercentage.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-kv-blue-primary shrink-0" />
            <h3 className="text-sm font-bold text-slate-900">
              Xu hướng Doanh thu & Tiền lời theo ngày
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            So sánh giữa doanh số bán ra và lợi nhuận gộp thực tế
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-slate-600">
            <CircleDollarSign className="w-3.5 h-3.5 text-kv-blue-primary shrink-0" />
            <span>Doanh thu thuần</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Tiền lời gộp</span>
          </div>
        </div>
      </div>

      {/* Interactive Bar Chart Area */}
      <div className="relative pt-6 pb-2">
        <div className="flex items-end gap-2 sm:gap-3 justify-between overflow-x-auto pb-2 min-h-[190px]">
          {sortedReports.map((item, index) => {
            const revenueHeight = Math.max((item.netRevenue / maxVal) * chartHeight, 4);
            const profitHeight = Math.max(
              (Math.max(item.grossProfit, 0) / maxVal) * chartHeight,
              item.grossProfit > 0 ? 4 : 0
            );
            const isHovered = hoveredIndex === index;

            return (
              <Tooltip
                key={item.date || index}
                title={renderTooltipContent(item)}
                placement="top"
                color="#ffffff"
                arrow={{ pointAtCenter: true }}
                styles={{
                  body: {
                    backgroundColor: "#ffffff",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 10px 25px -5px rgba(0, 104, 255, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
                    color: "#1A1A2E",
                  },
                }}
                mouseEnterDelay={0.05}
              >
                <div
                  className={`flex flex-col items-center flex-1 min-w-[36px] px-1 py-1.5 rounded-xl transition-all duration-200 cursor-pointer group ${
                    isHovered ? "bg-slate-100/90 shadow-2xs" : "hover:bg-slate-50"
                  }`}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Bars Pair */}
                  <div className="flex items-end gap-1 w-full justify-center h-[160px]">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revenueHeight}px` }}
                      className={`w-2.5 sm:w-3.5 rounded-t-sm bg-kv-blue-primary transition-all duration-300 ${
                        isHovered ? "brightness-110 ring-2 ring-kv-blue-light" : "opacity-90"
                      }`}
                    />
                    {/* Gross Profit Bar */}
                    <div
                      style={{ height: `${profitHeight}px` }}
                      className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                        item.grossProfit < 0
                          ? "bg-rose-500"
                          : "bg-emerald-500"
                      } ${isHovered ? "brightness-110 ring-2 ring-emerald-100" : "opacity-90"}`}
                    />
                  </div>

                  {/* Date Label */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium mt-2 truncate max-w-full transition-colors ${
                      isHovered ? "text-kv-blue-primary font-bold" : "text-slate-400"
                    }`}
                  >
                    {formatDateLabel(item.date)}
                  </span>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};
