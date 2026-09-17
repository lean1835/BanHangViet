import React, { useState } from "react";
import {
  EXCHANGE_TYPES,
  EXCHANGE_STATUS,
} from "@/constants/productExchange";

export interface IProductExchangeSidebarProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  exchangeTypeFilter?: string;
  onExchangeTypeChange?: (val: string) => void;
  statusFilter?: string;
  onStatusChange?: (val: string) => void;
  fromDate?: string;
  toDate?: string;
  onFromDateChange?: (val: string) => void;
  onToDateChange?: (val: string) => void;
  onResetFilters?: () => void;
  disabled?: boolean;
}

export const ProductExchangeSidebar: React.FC<IProductExchangeSidebarProps> = ({
  searchQuery: propSearchQuery,
  onSearchChange,
  exchangeTypeFilter: propExchangeType,
  onExchangeTypeChange,
  statusFilter: propStatusFilter,
  onStatusChange,
  fromDate: propFromDate,
  toDate: propToDate,
  onFromDateChange,
  onToDateChange,
  onResetFilters,
  disabled = false,
}) => {
  const [internalSearch, setInternalSearch] = useState("");
  const [internalExchangeType, setInternalExchangeType] = useState("ALL");
  const [internalStatus, setInternalStatus] = useState("ALL");
  const [internalFromDate, setInternalFromDate] = useState("");
  const [internalToDate, setInternalToDate] = useState("");

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : internalSearch;
  const handleSearchChange = onSearchChange || setInternalSearch;

  const exchangeTypeFilter =
    propExchangeType !== undefined ? propExchangeType : internalExchangeType;
  const handleExchangeTypeChange = onExchangeTypeChange || setInternalExchangeType;

  const statusFilter = propStatusFilter !== undefined ? propStatusFilter : internalStatus;
  const handleStatusChange = onStatusChange || setInternalStatus;

  const fromDate = propFromDate !== undefined ? propFromDate : internalFromDate;
  const handleFromDateChange = onFromDateChange || setInternalFromDate;

  const toDate = propToDate !== undefined ? propToDate : internalToDate;
  const handleToDateChange = onToDateChange || setInternalToDate;

  const handleReset =
    onResetFilters ||
    (() => {
      setInternalSearch("");
      setInternalExchangeType("ALL");
      setInternalStatus("ALL");
      setInternalFromDate("");
      setInternalToDate("");
    });

  const setDatePreset = (preset: "today" | "7days" | "thisMonth") => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "today") {
      const dStr = formatDate(today);
      handleFromDateChange(dStr);
      handleToDateChange(dStr);
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      handleFromDateChange(formatDate(past));
      handleToDateChange(formatDate(today));
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      handleFromDateChange(formatDate(firstDay));
      handleToDateChange(formatDate(today));
    }
  };

  return (
    <>
      {/* Title */}
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center justify-between">
        <span>Bộ lọc phiếu đổi hàng</span>
        {disabled ? (
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
            Khóa
          </span>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="text-[10px] font-bold text-kv-blue-primary hover:text-kv-blue-dark transition-colors cursor-pointer"
          >
            Đặt lại
          </button>
        )}
      </div>

      {/* Quick Search */}
      <div className="flex flex-col gap-2">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Tìm kiếm nhanh
        </span>
        <input
          type="text"
          disabled={disabled}
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Số phiếu, mã HĐ, khách..."
          className={`border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold ${
            disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : ""
          }`}
        />
      </div>

      {/* Exchange Type Filter */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="exchangeTypeSelect"
          className="font-bold text-slate-400 uppercase tracking-wide text-[10px]"
        >
          Loại hình đổi hàng
        </label>
        <select
          id="exchangeTypeSelect"
          disabled={disabled}
          value={exchangeTypeFilter}
          onChange={(e) => handleExchangeTypeChange(e.target.value)}
          className={`w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold ${
            disabled
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "text-slate-700 bg-white cursor-pointer"
          }`}
        >
          <option value="ALL">Tất cả loại đổi</option>
          <option value={EXCHANGE_TYPES.EQUAL_VALUE}>Đổi ngang giá (diff = 0)</option>
          <option value={EXCHANGE_TYPES.HIGHER_VALUE}>Đổi giá cao hơn (+ bù tiền)</option>
          <option value={EXCHANGE_TYPES.LOWER_VALUE}>Đổi giá thấp hơn</option>
        </select>
      </div>

      {/* Ticket Status Filter */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="exchangeStatusSelect"
          className="font-bold text-slate-400 uppercase tracking-wide text-[10px]"
        >
          Trạng thái phiếu
        </label>
        <select
          id="exchangeStatusSelect"
          disabled={disabled}
          value={statusFilter}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold ${
            disabled
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "text-slate-700 bg-white cursor-pointer"
          }`}
        >
          <option value="ALL">Tất cả phiếu</option>
          <option value={EXCHANGE_STATUS.COMPLETED}>Hoàn thành</option>
          <option value={EXCHANGE_STATUS.CANCELLED}>Đã hủy</option>
        </select>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col gap-2 border-t pt-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Thời gian lập phiếu
        </span>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
              Từ ngày
            </label>
            <input
              type="date"
              disabled={disabled}
              value={fromDate}
              onChange={(e) => handleFromDateChange(e.target.value)}
              className={`w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold ${
                disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "text-slate-700"
              }`}
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">
              Đến ngày
            </label>
            <input
              type="date"
              disabled={disabled}
              value={toDate}
              onChange={(e) => handleToDateChange(e.target.value)}
              className={`w-full border border-slate-300 h-9 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold ${
                disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "text-slate-700"
              }`}
            />
          </div>
        </div>

        {/* Date Presets */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDatePreset("today")}
            className={`rounded border border-slate-200 py-1.5 text-[10px] font-bold transition-colors ${
              disabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDatePreset("7days")}
            className={`rounded border border-slate-200 py-1.5 text-[10px] font-bold transition-colors ${
              disabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
            }`}
          >
            7 ngày
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDatePreset("thisMonth")}
            className={`rounded border border-slate-200 py-1.5 text-[10px] font-bold transition-colors ${
              disabled
                ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer"
            }`}
          >
            Tháng này
          </button>
        </div>
      </div>

      {/* Reset Filter Button */}
      <div className="border-t pt-3">
        <button
          type="button"
          disabled={disabled}
          onClick={handleReset}
          className={`w-full border border-slate-300 h-9 rounded-lg font-bold text-xs transition-colors ${
            disabled
              ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
              : "hover:bg-slate-50 text-slate-600 cursor-pointer"
          }`}
        >
          Xóa bộ lọc
        </button>
      </div>
    </>
  );
};
