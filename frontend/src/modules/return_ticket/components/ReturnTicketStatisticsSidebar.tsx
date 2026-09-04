import React from "react";
import { SlidersHorizontal, Calendar, RotateCcw } from "lucide-react";

export interface IReturnTicketStatisticsSidebarProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  topLimit: number;
  onTopLimitChange: (val: number) => void;
  onResetFilters: () => void;
}

export const ReturnTicketStatisticsSidebar: React.FC<IReturnTicketStatisticsSidebarProps> = ({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  topLimit,
  onTopLimitChange,
  onResetFilters,
}) => {
  const setDatePreset = (preset: "today" | "7days" | "thisMonth" | "lastMonth") => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "today") {
      const dStr = formatDate(today);
      onFromDateChange(dStr);
      onToDateChange(dStr);
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      onFromDateChange(formatDate(past));
      onToDateChange(formatDate(today));
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      onFromDateChange(formatDate(firstDay));
      onToDateChange(formatDate(today));
    } else if (preset === "lastMonth") {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      onFromDateChange(formatDate(firstDayLastMonth));
      onToDateChange(formatDate(lastDayLastMonth));
    }
  };

  return (
    <div className="flex flex-col gap-4 text-xs animate-in fade-in duration-200">
      {/* Title */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-kv-blue-primary" />
          <span>Bộ lọc thống kê</span>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-[10px] font-bold text-kv-blue-primary hover:text-kv-blue-dark transition-colors flex items-center gap-1 cursor-pointer"
          title="Đặt lại bộ lọc về mặc định"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Date Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Khoảng thời gian nhanh
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setDatePreset("today")}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-[11px] font-bold text-slate-600 hover:bg-kv-blue-light hover:text-kv-blue-primary transition-colors cursor-pointer"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("7days")}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-[11px] font-bold text-slate-600 hover:bg-kv-blue-light hover:text-kv-blue-primary transition-colors cursor-pointer"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("thisMonth")}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-[11px] font-bold text-slate-600 hover:bg-kv-blue-light hover:text-kv-blue-primary transition-colors cursor-pointer"
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("lastMonth")}
            className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2 text-[11px] font-bold text-slate-600 hover:bg-kv-blue-light hover:text-kv-blue-primary transition-colors cursor-pointer"
          >
            Tháng trước
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Thời gian thống kê</span>
        </span>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Top Limit Selection */}
      <div className="flex flex-col gap-1.5 border-t pt-3">
        <label htmlFor="topLimitSelect" className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Giới hạn mặt hàng trả nhiều
        </label>
        <select
          id="topLimitSelect"
          value={topLimit}
          onChange={(e) => onTopLimitChange(Number(e.target.value))}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer"
        >
          <option value={5}>Top 5 mặt hàng</option>
          <option value={10}>Top 10 mặt hàng</option>
          <option value={15}>Top 15 mặt hàng</option>
          <option value={20}>Top 20 mặt hàng</option>
        </select>
      </div>
      
      {/* Reset Filter Button */}
      <div className="border-t pt-3">
        <button
          type="button"
          onClick={onResetFilters}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Xóa bộ lọc
        </button>
      </div>
    </div>
  );
};

export default ReturnTicketStatisticsSidebar;
