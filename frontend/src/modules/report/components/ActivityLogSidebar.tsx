import React from "react";
import { Calendar, SlidersHorizontal, RotateCcw, RefreshCw } from "lucide-react";
import { useReportFilter } from "../context/ReportFilterContext";

interface ActivityLogSidebarProps {
  onRefresh?: () => void;
  isFetching?: boolean;
}

export const ActivityLogSidebar: React.FC<ActivityLogSidebarProps> = ({
  onRefresh,
  isFetching,
}) => {
  const {
    activityLogFilter,
    setActivityLogFilter,
    setActivityLogPreset,
    resetActivityLogFilter,
  } = useReportFilter();

  const hasFilter = Boolean(activityLogFilter.fromDate || activityLogFilter.toDate);

  return (
    <div className="flex flex-col gap-3.5 text-xs animate-in fade-in duration-200">
      {/* Title & Reset */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-800">
          <SlidersHorizontal className="w-3.5 h-3.5 text-kv-blue-primary" />
          <span>BỘ LỌC HOẠT ĐỘNG</span>
        </div>
        {hasFilter && (
          <button
            type="button"
            onClick={resetActivityLogFilter}
            title="Xóa bộ lọc ngày"
            className="flex items-center gap-1 text-[10px] font-bold text-kv-blue-primary hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Chọn nhanh khoảng ngày
        </label>
        <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setActivityLogPreset("today")}
            className="py-1 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-kv-blue-light hover:text-kv-blue-primary hover:border-kv-blue-primary transition-all text-slate-600 text-center cursor-pointer shadow-2xs"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setActivityLogPreset("7days")}
            className="py-1 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-kv-blue-light hover:text-kv-blue-primary hover:border-kv-blue-primary transition-all text-slate-600 text-center cursor-pointer shadow-2xs"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setActivityLogPreset("thisMonth")}
            className="py-1 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-kv-blue-light hover:text-kv-blue-primary hover:border-kv-blue-primary transition-all text-slate-600 text-center cursor-pointer shadow-2xs"
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => setActivityLogPreset("all")}
            className="py-1 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-kv-blue-light hover:text-kv-blue-primary hover:border-kv-blue-primary transition-all text-slate-600 text-center cursor-pointer shadow-2xs"
          >
            Toàn bộ
          </button>
        </div>
      </div>

      {/* Date Pickers */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Thời gian ghi nhận</span>
        </label>
        <div className="flex flex-col gap-1.5">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Từ ngày:</span>
            <input
              type="date"
              value={activityLogFilter.fromDate}
              onChange={(e) =>
                setActivityLogFilter((prev) => ({ ...prev, fromDate: e.target.value }))
              }
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Đến ngày:</span>
            <input
              type="date"
              value={activityLogFilter.toDate}
              onChange={(e) =>
                setActivityLogFilter((prev) => ({ ...prev, toDate: e.target.value }))
              }
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      {onRefresh && (
        <div className="pt-2 border-t border-slate-100 mt-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-kv-blue-primary" : ""}`} />
            <span>{isFetching ? "Đang tải dữ liệu..." : "Làm mới nhật ký"}</span>
          </button>
        </div>
      )}
    </div>
  );
};
