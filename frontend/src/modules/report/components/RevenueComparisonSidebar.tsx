import React from "react";
import { SlidersHorizontal, RefreshCw } from "lucide-react";
import { useReportFilter } from "../context/ReportFilterContext";

interface RevenueComparisonSidebarProps {
  onRefresh?: () => void;
  isFetching?: boolean;
}

export const RevenueComparisonSidebar: React.FC<RevenueComparisonSidebarProps> = ({
  onRefresh,
  isFetching,
}) => {
  const { comparisonFilter, setComparisonFilter, setComparisonPreset } = useReportFilter();

  return (
    <div className="flex flex-col gap-3.5 text-xs animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-800">
          <SlidersHorizontal className="w-3.5 h-3.5 text-kv-blue-primary" />
          <span>BỘ LỌC SO SÁNH</span>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            title="Làm mới số liệu so sánh"
            className="flex items-center gap-1 text-[10px] font-bold text-kv-blue-primary hover:text-kv-blue-dark transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        )}
      </div>

      {/* Presets */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Mẫu so sánh định sẵn
        </label>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setComparisonPreset("monthVsMonth")}
            className={`py-1.5 px-2 rounded-md border text-center transition-all cursor-pointer shadow-2xs ${
              comparisonFilter.activePreset === "monthVsMonth"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary font-black"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Tháng này vs Trước
          </button>
          <button
            type="button"
            onClick={() => setComparisonPreset("weekVsWeek")}
            className={`py-1.5 px-2 rounded-md border text-center transition-all cursor-pointer shadow-2xs ${
              comparisonFilter.activePreset === "weekVsWeek"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary font-black"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            7 ngày vs Trước
          </button>
        </div>
      </div>

      {/* Period 1 (Kỳ gốc) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-700 text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
            <span>Kỳ 1 (Kỳ gốc)</span>
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Từ ngày:</span>
            <input
              type="date"
              value={comparisonFilter.period1Start}
              onChange={(e) =>
                setComparisonFilter((prev) => ({
                  ...prev,
                  period1Start: e.target.value,
                  activePreset: "custom",
                }))
              }
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Đến ngày:</span>
            <input
              type="date"
              value={comparisonFilter.period1End}
              onChange={(e) =>
                setComparisonFilter((prev) => ({
                  ...prev,
                  period1End: e.target.value,
                  activePreset: "custom",
                }))
              }
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Period 2 (Kỳ so sánh) */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <label className="font-bold text-kv-blue-primary text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-kv-blue-primary inline-block" />
            <span>Kỳ 2 (Kỳ so sánh)</span>
          </label>
        </div>
        <div className="flex flex-col gap-1.5">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Từ ngày:</span>
            <input
              type="date"
              value={comparisonFilter.period2Start}
              onChange={(e) =>
                setComparisonFilter((prev) => ({
                  ...prev,
                  period2Start: e.target.value,
                  activePreset: "custom",
                }))
              }
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Đến ngày:</span>
            <input
              type="date"
              value={comparisonFilter.period2End}
              onChange={(e) =>
                setComparisonFilter((prev) => ({
                  ...prev,
                  period2End: e.target.value,
                  activePreset: "custom",
                }))
              }
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
