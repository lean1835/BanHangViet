import React, { useState, useRef, useEffect } from "react";
import type { EPeriodType, ITaxPeriodQueryParams } from "../types/salesInvoiceListing.types";

interface ITaxPeriodFilterBarProps {
  filters: ITaxPeriodQueryParams;
  onChange: (newFilters: Partial<ITaxPeriodQueryParams>) => void;
  onGenerate: () => void;
  isLoading?: boolean;
}

interface IOption<T> {
  label: string;
  value: T;
}

interface IAnimatedDropdownProps<T> {
  label: string;
  value: T;
  options: IOption<T>[];
  onChange: (val: T) => void;
  minWidthClass?: string;
}

function AnimatedDropdown<T extends string | number>({
  label,
  value,
  options,
  onChange,
  minWidthClass = "min-w-[120px]",
}: IAnimatedDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="flex items-center gap-2" ref={dropdownRef}>
      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider select-none">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-9 px-3 text-xs bg-slate-50 hover:bg-white hover:border-blue-400 border rounded-xl font-semibold text-slate-700 hover:shadow-xs transition-all duration-200 flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 ${
            isOpen ? "border-blue-500 ring-2 ring-blue-500/20 bg-white" : "border-slate-300"
          } ${minWidthClass}`}
        >
          <span className="truncate">{selectedOption?.label || value}</span>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ease-out ${
              isOpen ? "rotate-180 text-blue-600" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1.5 z-50 min-w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1 animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs font-semibold rounded-lg flex items-center justify-between gap-2 transition-all duration-150 text-left cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-blue-600 font-bold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-blue-600"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export const TaxPeriodFilterBar: React.FC<ITaxPeriodFilterBarProps> = ({
  filters,
  onChange,
  onGenerate,
  isLoading = false,
}) => {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const periodTypeOptions: IOption<EPeriodType>[] = [
    { label: "Theo Tháng", value: "MONTHLY" },
    { label: "Theo Quý", value: "QUARTERLY" },
  ];

  const monthOptions: IOption<number>[] = Array.from({ length: 12 }, (_, i) => ({
    label: `Tháng ${i + 1}`,
    value: i + 1,
  }));

  const quarterOptions: IOption<number>[] = [
    { label: "Quý I (Tháng 1 - 3)", value: 1 },
    { label: "Quý II (Tháng 4 - 6)", value: 2 },
    { label: "Quý III (Tháng 7 - 9)", value: 3 },
    { label: "Quý IV (Tháng 10 - 12)", value: 4 },
  ];

  const yearSelectOptions: IOption<number>[] = yearOptions.map((y) => ({
    label: `Năm ${y}`,
    value: y,
  }));

  const handlePeriodTypeChange = (newType: EPeriodType) => {
    let defaultVal = 1;
    if (newType === "MONTHLY") {
      defaultVal = new Date().getMonth() + 1;
    } else if (newType === "QUARTERLY") {
      defaultVal = Math.floor(new Date().getMonth() / 3) + 1;
    }
    onChange({ periodType: newType, periodNumber: defaultVal, page: 0 });
  };

  const handlePeriodNumberChange = (newNumber: number) => {
    onChange({ periodNumber: newNumber, page: 0 });
  };

  const handleYearChange = (newYear: number) => {
    onChange({ year: newYear, page: 0 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ search: e.target.value, page: 0 });
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between transition-all">
      {/* Dynamic Period Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Period Type Dropdown */}
        <AnimatedDropdown<EPeriodType>
          label="Loại kỳ:"
          value={filters.periodType}
          options={periodTypeOptions}
          onChange={handlePeriodTypeChange}
          minWidthClass="min-w-[125px]"
        />

        {/* Month Selector */}
        {filters.periodType === "MONTHLY" && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <AnimatedDropdown<number>
              label="Tháng:"
              value={filters.periodNumber}
              options={monthOptions}
              onChange={handlePeriodNumberChange}
              minWidthClass="min-w-[110px]"
            />
          </div>
        )}

        {/* Quarter Selector */}
        {filters.periodType === "QUARTERLY" && (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <AnimatedDropdown<number>
              label="Quý:"
              value={filters.periodNumber}
              options={quarterOptions}
              onChange={handlePeriodNumberChange}
              minWidthClass="min-w-[170px]"
            />
          </div>
        )}

        {/* Year Selector */}
        <AnimatedDropdown<number>
          label="Năm:"
          value={filters.year}
          options={yearSelectOptions}
          onChange={handleYearChange}
          minWidthClass="min-w-[105px]"
        />
      </div>

      {/* Search Input & Action Buttons */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 md:w-64 group">
          <input
            type="text"
            placeholder="Tìm số HĐ, người mua, MST..."
            value={filters.search || ""}
            onChange={handleSearchChange}
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 focus:bg-white font-medium placeholder-slate-400 transition-all duration-200"
          />
          <svg
            className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 absolute left-3 top-2.5 transition-colors duration-200"
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
          title={isLoading ? "Đang xử lý..." : "Lập / Cập nhật bảng kê"}
          aria-label="Lập / Cập nhật bảng kê"
          className="h-9 w-9 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25 hover:scale-105 active:scale-95 rounded-xl transition-all duration-200 ease-out shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shrink-0 group"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500 ease-in-out"}`}
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
        </button>
      </div>
    </div>
  );
};
