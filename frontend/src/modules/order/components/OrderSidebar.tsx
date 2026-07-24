import React from "react";
import { ORDER_UI } from "@/constants/order";

interface OrderSidebarProps {
  statusFilter: string[];
  setStatusFilter: React.Dispatch<React.SetStateAction<string[]>>;
  fromDate: string;
  setFromDate: (date: string) => void;
  toDate: string;
  setToDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ORDER_STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả" },
  { value: "CREATING", label: "Đang tạo (Nháp)" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELED", label: "Đã hủy" },
];

export const OrderSidebar: React.FC<OrderSidebarProps> = ({
  statusFilter,
  setStatusFilter,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  searchQuery,
  setSearchQuery,
}) => {
  const selectedStatus = statusFilter.length === 0 ? "ALL" : statusFilter[0];

  const handleStatusRadioChange = (val: string) => {
    if (val === "ALL") {
      setStatusFilter([]);
    } else {
      setStatusFilter([val]);
    }
  };

  return (
    <>
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2">
        {ORDER_UI.SIDEBAR.TITLE}
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
          placeholder="Mã đơn, thu ngân, khách..."
          className="border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold"
        />
      </div>

      {/* Bộ lọc thời gian */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Thời gian tạo đơn
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
      </div>

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-col gap-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          {ORDER_UI.SIDEBAR.STATUS_FILTER_LABEL}
        </span>
        <div className="flex flex-col gap-2 font-medium text-slate-700">
          {ORDER_STATUS_OPTIONS.map((status) => (
            <label key={status.value} className="flex min-h-11 cursor-pointer items-center gap-2 lg:min-h-0 text-xs">
              <input
                type="radio"
                name="orderStatusFilter"
                value={status.value}
                checked={selectedStatus === status.value}
                onChange={() => handleStatusRadioChange(status.value)}
                className="border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
              />
              <span>{status.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
};
