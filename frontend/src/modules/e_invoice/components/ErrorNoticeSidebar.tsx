import React from "react";

export interface ErrorNoticeSidebarProps {
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  handlingTypeFilter: string;
  setHandlingTypeFilter: (type: string) => void;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onResetFilters: () => void;
}

export const NOTICE_STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Bản nháp (Chưa gửi CQT)" },
  { value: "ACCEPTED", label: "CQT Đã tiếp nhận" },
  { value: "REJECTED", label: "CQT Bị từ chối" },
];

export const NOTICE_HANDLING_TYPE_OPTIONS = [
  { value: "ALL", label: "Tất cả hình thức" },
  { value: "CANCEL", label: "Hủy bỏ hóa đơn" },
  { value: "ADJUST", label: "Điều chỉnh hóa đơn" },
  { value: "REPLACE", label: "Thay thế hóa đơn" },
  { value: "EXPLAIN", label: "Giải trình thông tin" },
];

export const ErrorNoticeSidebar: React.FC<ErrorNoticeSidebarProps> = ({
  statusFilter,
  setStatusFilter,
  handlingTypeFilter,
  setHandlingTypeFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  searchQuery,
  setSearchQuery,
  onResetFilters,
}) => {
  const setDatePreset = (preset: "today" | "7days" | "thisMonth") => {
    const today = new Date();
    const formatDateStr = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "today") {
      const dStr = formatDateStr(today);
      setFromDate(dStr);
      setToDate(dStr);
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setFromDate(formatDateStr(past));
      setToDate(formatDateStr(today));
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(today));
    }
  };

  return (
    <>
      {/* Tiêu đề */}
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        Bộ lọc thông báo sai sót
      </div>

      {/* Tìm kiếm nhanh */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Tìm kiếm nhanh
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Mã thông báo, số HĐ, mã CQT..."
          className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold"
        />
      </div>

      {/* Hình thức xử lý sai sót */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Hình thức xử lý sai sót
        </span>
        <select
          value={handlingTypeFilter}
          onChange={(e) => setHandlingTypeFilter(e.target.value)}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700 cursor-pointer"
        >
          {NOTICE_HANDLING_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bộ lọc trạng thái CQT */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Trạng thái Cơ quan Thuế
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold bg-white text-slate-700 cursor-pointer"
        >
          {NOTICE_STATUS_OPTIONS.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Bộ lọc thời gian */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Thời gian lập thông báo
        </span>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-300 h-8 px-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-700"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-300 h-8 px-2 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-bold text-slate-700"
            />
          </div>
        </div>

        {/* Nút chọn nhanh thời gian */}
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

      {/* Nút Xóa bộ lọc */}
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
