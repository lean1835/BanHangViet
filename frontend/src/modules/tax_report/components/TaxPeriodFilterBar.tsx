import React from "react";
import type { EPeriodType, ITaxPeriodQueryParams } from "../types/salesInvoiceListing.types";

interface ITaxPeriodFilterBarProps {
  filters: ITaxPeriodQueryParams;
  onChange: (newFilters: Partial<ITaxPeriodQueryParams>) => void;
  onGenerate: () => void;
  isLoading?: boolean;
}

export const TaxPeriodFilterBar: React.FC<ITaxPeriodFilterBarProps> = ({
  filters,
  onChange,
  onGenerate,
  isLoading = false,
}) => {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handlePeriodTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as EPeriodType;
    let defaultVal = 1;
    if (newType === "MONTHLY") {
      defaultVal = new Date().getMonth() + 1;
    } else if (newType === "QUARTERLY") {
      defaultVal = Math.floor(new Date().getMonth() / 3) + 1;
    }
    onChange({ periodType: newType, periodNumber: defaultVal, page: 0 });
  };

  const handlePeriodNumberChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ periodNumber: Number(e.target.value), page: 0 });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ year: Number(e.target.value), page: 0 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ search: e.target.value, page: 0 });
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between transition-all">
      {/* Dynamic Period Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Loại kỳ:
          </label>
          <select
            value={filters.periodType}
            onChange={handlePeriodTypeChange}
            className="h-9 px-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
          >
            <option value="MONTHLY">Theo Tháng</option>
            <option value="QUARTERLY">Theo Quý</option>
          </select>
        </div>

        {/* Month Selector */}
        {filters.periodType === "MONTHLY" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Tháng:
            </label>
            <select
              value={filters.periodNumber}
              onChange={handlePeriodNumberChange}
              className="h-9 px-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Quarter Selector */}
        {filters.periodType === "QUARTERLY" && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Quý:
            </label>
            <select
              value={filters.periodNumber}
              onChange={handlePeriodNumberChange}
              className="h-9 px-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
            >
              <option value={1}>Quý I (Tháng 1 - 3)</option>
              <option value={2}>Quý II (Tháng 4 - 6)</option>
              <option value={3}>Quý III (Tháng 7 - 9)</option>
              <option value={4}>Quý IV (Tháng 10 - 12)</option>
            </select>
          </div>
        )}

        {/* Year Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Năm:
          </label>
          <select
            value={filters.year}
            onChange={handleYearChange}
            className="h-9 px-3 py-1 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-700"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                Năm {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Search Input & Action Buttons */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 md:w-64">
          <input
            type="text"
            placeholder="Tìm số HĐ, người mua, MST..."
            value={filters.search || ""}
            onChange={handleSearchChange}
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium placeholder-slate-400"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="h-9 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isLoading ? "Đang xử lý..." : "Lập / Cập nhật bảng kê"}
        </button>
      </div>
    </div>
  );
};
