import React from "react";
import {
  Calendar,
  RotateCw,
  ShieldCheck,
} from "lucide-react";

export type TDailyIssueType = "ALL" | "UNINVOICED_ORDERS" | "PENDING_INVOICES" | "FAILED_INVOICES";
export type TDailyDurationFilter = "ALL" | "CRITICAL" | "IN_DAY";

interface DailyControlSidebarProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  issueTypeFilter: TDailyIssueType;
  setIssueTypeFilter: (type: TDailyIssueType) => void;
  durationFilter: TDailyDurationFilter;
  setDurationFilter: (duration: TDailyDurationFilter) => void;
  summary?: {
    isCleanDay: boolean;
    totalUninvoiced: number;
    totalPending: number;
    totalFailed: number;
  };
  onRefresh?: () => void;
  isFetching?: boolean;
}

export const DailyControlSidebar: React.FC<DailyControlSidebarProps> = ({
  selectedDate,
  setSelectedDate,
  issueTypeFilter,
  setIssueTypeFilter,
  durationFilter,
  setDurationFilter,
  summary,
  onRefresh,
  isFetching,
}) => {
  const todayStr = new Date().toISOString().split("T")[0];

  const handleQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setSelectedDate(d.toISOString().split("T")[0]);
  };


  return (
    <>
      <div className="flex items-center justify-between border-b pb-2">
        <div className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-kv-blue-primary" />
          <span>Bộ lọc Kiểm soát</span>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isFetching}
            title="Làm mới đối chiếu"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-kv-blue-primary" : ""}`} />
          </button>
        )}
      </div>

      {/* Chọn ngày đối chiếu */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Ngày kiểm soát
        </span>
        <div className="flex items-center gap-1.5 border border-slate-300 h-9 px-2.5 rounded-lg bg-white focus-within:border-kv-blue-primary">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          />
        </div>

        {/* Nút chọn nhanh */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          <button
            type="button"
            onClick={() => handleQuickDate(0)}
            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
              selectedDate === todayStr
                ? "bg-kv-blue-primary text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => handleQuickDate(1)}
            className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
          >
            Hôm qua
          </button>
          <button
            type="button"
            onClick={() => handleQuickDate(7)}
            className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
          >
            7 ngày trước
          </button>
        </div>
      </div>

      {/* Phân loại vấn đề (dạng dropdown) */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Phân loại vấn đề
        </span>
        <select
          value={issueTypeFilter}
          onChange={(e) => setIssueTypeFilter(e.target.value as TDailyIssueType)}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700 cursor-pointer"
        >
          <option value="UNINVOICED_ORDERS">
            Đơn chưa xuất HĐ {(summary?.totalUninvoiced ?? 0) > 0 ? `(${summary?.totalUninvoiced})` : ""}
          </option>
          <option value="PENDING_INVOICES">
            HĐ chờ cấp mã {(summary?.totalPending ?? 0) > 0 ? `(${summary?.totalPending})` : ""}
          </option>
          <option value="FAILED_INVOICES">
            HĐ gửi lỗi / Treo {(summary?.totalFailed ?? 0) > 0 ? `(${summary?.totalFailed})` : ""}
          </option>
        </select>
      </div>

      {/* Lọc theo thời gian treo */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Mức độ thời gian treo
        </span>
        <select
          value={durationFilter}
          onChange={(e) => setDurationFilter(e.target.value as TDailyDurationFilter)}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700 cursor-pointer"
        >
          <option value="ALL">Tất cả thời gian</option>
          <option value="CRITICAL">⚠️ Treo nguy cấp (&gt; 24 giờ)</option>
          <option value="IN_DAY">Trong ngày (≤ 24 giờ)</option>
        </select>
      </div>
    </>
  );
};
