import React from "react";
import { Calendar, SlidersHorizontal, RefreshCw } from "lucide-react";
import { useReportFilter } from "../context/ReportFilterContext";

interface RevenueReportSidebarProps {
  onRefresh?: () => void;
  isFetching?: boolean;
}

export const RevenueReportSidebar: React.FC<RevenueReportSidebarProps> = ({
  onRefresh,
  isFetching,
}) => {
  const { revenueFilter, setRevenueFilter, setRevenuePreset } = useReportFilter();

  return (
    <div className="flex flex-col gap-3.5 text-xs animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-800">
          <SlidersHorizontal className="w-3.5 h-3.5 text-kv-blue-primary" />
          <span>BỘ LỌC DOANH THU</span>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            title="Làm mới số liệu"
            className="flex items-center gap-1 text-[10px] font-bold text-kv-blue-primary hover:text-kv-blue-dark transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        )}
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Chọn nhanh khoảng thời gian
        </label>
        <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setRevenuePreset("today")}
            className={`py-1.5 px-1 rounded-md border text-center transition-all cursor-pointer shadow-2xs ${
              revenueFilter.activePreset === "today"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary font-black"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setRevenuePreset("last7days")}
            className={`py-1.5 px-1 rounded-md border text-center transition-all cursor-pointer shadow-2xs ${
              revenueFilter.activePreset === "last7days"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary font-black"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setRevenuePreset("thisMonth")}
            className={`py-1.5 px-1 rounded-md border text-center transition-all cursor-pointer shadow-2xs ${
              revenueFilter.activePreset === "thisMonth"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary font-black"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Tháng này
          </button>
        </div>
      </div>

      {/* Date Pickers */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Thời gian tùy chỉnh</span>
        </label>
        <div className="flex flex-col gap-1.5">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Từ ngày:</span>
            <input
              type="date"
              value={revenueFilter.fromDate}
              onChange={(e) =>
                setRevenueFilter((prev) => ({
                  ...prev,
                  fromDate: e.target.value,
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
              value={revenueFilter.toDate}
              onChange={(e) =>
                setRevenueFilter((prev) => ({
                  ...prev,
                  toDate: e.target.value,
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
