import React from "react";
import {
  RETURN_TICKET_STATUS,
  type TReturnTicketStatus,
} from "@/constants/returnTicket";

export interface IReturnTicketSidebarProps {
  statusFilter: TReturnTicketStatus | "ALL";
  onStatusChange: (status: TReturnTicketStatus | "ALL") => void;
  fromDate: string;
  toDate: string;
  onFromDateChange: (val: string) => void;
  onToDateChange: (val: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onResetFilters: () => void;
}

export const ReturnTicketSidebar: React.FC<IReturnTicketSidebarProps> = ({
  statusFilter,
  onStatusChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  searchQuery,
  onSearchChange,
  onResetFilters,
}) => {
  const setDatePreset = (preset: "today" | "7days" | "thisMonth") => {
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
    }
  };

  const statusOptions: { value: TReturnTicketStatus | "ALL"; label: string }[] = [
    { value: "ALL", label: "Tất cả phiếu" },
    { value: RETURN_TICKET_STATUS.PENDING, label: "Chờ duyệt" },
    { value: RETURN_TICKET_STATUS.APPROVED, label: "Đã duyệt" },
    { value: RETURN_TICKET_STATUS.REJECTED, label: "Từ chối" },
  ];

  return (
    <>
      {/* Title */}
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center justify-between">
        <span>Bộ lọc phiếu trả hàng</span>
        <button
          type="button"
          onClick={onResetFilters}
          className="text-[10px] font-bold text-kv-blue-primary hover:text-kv-blue-dark transition-colors"
        >
          Đặt lại
        </button>
      </div>

      {/* Quick Search */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Tìm kiếm nhanh
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Số phiếu, mã HĐ, khách..."
          className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold"
        />
      </div>

      {/* Ticket Status Filter */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="returnTicketStatusSelect" className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Trạng thái phiếu
        </label>
        <select
          id="returnTicketStatusSelect"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as TReturnTicketStatus | "ALL")}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700 bg-white cursor-pointer"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Thời gian lập phiếu
        </span>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromDateChange(e.target.value)}
              className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToDateChange(e.target.value)}
              className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold text-slate-700"
            />
          </div>
        </div>

        {/* Date Presets */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          <button
            type="button"
            onClick={() => setDatePreset("today")}
            className="rounded border border-slate-200 bg-slate-50 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("7days")}
            className="rounded border border-slate-200 bg-slate-50 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            7 ngày
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("thisMonth")}
            className="rounded border border-slate-200 bg-slate-50 py-1.5 text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Tháng này
          </button>
        </div>
      </div>

      {/* Reset Filter Button */}
      <div className="border-t pt-3">
        <button
          type="button"
          onClick={onResetFilters}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Xóa bộ lọc
        </button>
      </div>
    </>
  );
};
