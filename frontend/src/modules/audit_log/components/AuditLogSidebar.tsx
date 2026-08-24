import React from "react";
import { RotateCcw, Search, Database, Calendar, SlidersHorizontal, User } from "lucide-react";
import {
  AUDIT_ACTION_OPTIONS,
  AUDIT_TARGET_TABLES,
} from "@/constants/auditLog";

import type { IAuditLogFilterState } from "../context/AuditLogFilterContext";

interface AuditLogSidebarProps {
  filter: IAuditLogFilterState;
  onFilterChange: (newFilter: Partial<IAuditLogFilterState>) => void;
  onResetFilter: () => void;
  variant?: "horizontal" | "sidebar";
}

export const AuditLogSidebar: React.FC<AuditLogSidebarProps> = ({
  filter,
  onFilterChange,
  onResetFilter,
  variant = "sidebar",
}) => {
  const hasActiveFilter = Boolean(
    filter.username ||
      filter.action ||
      filter.targetTable ||
      filter.startDate ||
      filter.endDate
  );

  const setDatePreset = (preset: "today" | "7days" | "thisMonth" | "all") => {
    const today = new Date();
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    if (preset === "today") {
      const dStr = formatDate(today);
      onFilterChange({ startDate: dStr, endDate: dStr });
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      onFilterChange({ startDate: formatDate(past), endDate: formatDate(today) });
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      onFilterChange({ startDate: formatDate(firstDay), endDate: formatDate(today) });
    } else if (preset === "all") {
      onFilterChange({ startDate: "", endDate: "" });
    }
  };

  if (variant === "horizontal") {
    return (
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
          {/* Lọc theo tài khoản username */}
          <div className="relative min-w-[180px] max-w-[220px]">
            <input
              type="text"
              placeholder="Nhập username..."
              value={filter.username}
              onChange={(e) => onFilterChange({ username: e.target.value })}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 bg-slate-50/50 text-xs font-semibold text-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Lọc theo Hành vi */}
          <div className="min-w-[160px]">
            <select
              value={filter.action}
              onChange={(e) => onFilterChange({ action: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 bg-white text-xs font-bold text-slate-700"
            >
              {AUDIT_ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Bảng tác động */}
          <div className="min-w-[170px]">
            <select
              value={filter.targetTable}
              onChange={(e) => onFilterChange({ targetTable: e.target.value })}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 bg-white text-xs font-bold text-slate-700"
            >
              <option value="">Tất cả bảng dữ liệu</option>
              {AUDIT_TARGET_TABLES.map((tbl) => (
                <option key={tbl.value} value={tbl.value}>
                  {tbl.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lọc theo Khoảng thời gian */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
            <span className="text-slate-500 font-bold text-[11px] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Từ:
            </span>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20"
            />
            <span className="text-slate-500 font-bold text-[11px]">Đến:</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20"
            />
          </div>
        </div>

        {/* Nút đặt lại */}
        {hasActiveFilter && (
          <button
            onClick={onResetFilter}
            title="Đặt lại bộ lọc"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>
    );
  }

  // Sidebar Vertical Variant (Default)
  return (
    <div className="flex flex-col gap-3.5 text-xs">
      {/* Title & Reset Button */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-800">
          <SlidersHorizontal className="w-3.5 h-3.5 text-kv-blue-primary" />
          <span>BỘ LỌC KIỂM TOÁN</span>
        </div>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            title="Đặt lại tất cả bộ lọc"
            className="flex items-center gap-1 text-[10px] font-bold text-kv-blue-primary hover:text-red-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* Quick Search Username */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <User className="w-3 h-3 text-slate-400" />
          <span>Tài khoản thực hiện</span>
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Nhập username..."
            value={filter.username}
            onChange={(e) => onFilterChange({ username: e.target.value })}
            className="w-full pl-7 pr-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-semibold text-slate-800 placeholder:text-slate-400 shadow-2xs"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Action / Thao tác */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Hành vi / Thao tác
        </label>
        <select
          value={filter.action}
          onChange={(e) => onFilterChange({ action: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
        >
          {AUDIT_ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Target Table / Bảng dữ liệu tác động */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <Database className="w-3 h-3 text-slate-400" />
          <span>Mục tiêu tác động</span>
        </label>
        <select
          value={filter.targetTable}
          onChange={(e) => onFilterChange({ targetTable: e.target.value })}
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
        >
          <option value="">Tất cả bảng dữ liệu</option>
          {AUDIT_TARGET_TABLES.map((tbl) => (
            <option key={tbl.value} value={tbl.value}>
              {tbl.label}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range & Quick Presets */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Khoảng thời gian</span>
        </label>

        {/* Date Presets Buttons */}
        <div className="grid grid-cols-2 gap-1 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setDatePreset("today")}
            className="py-1 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-kv-blue-light hover:text-kv-blue-primary hover:border-kv-blue-primary transition-all text-slate-600 text-center cursor-pointer shadow-2xs"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("7days")}
            className="py-1 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-kv-blue-light hover:text-kv-blue-primary hover:border-kv-blue-primary transition-all text-slate-600 text-center cursor-pointer shadow-2xs"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("thisMonth")}
            className="py-1 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-kv-blue-light hover:text-kv-blue-primary hover:border-kv-blue-primary transition-all text-slate-600 text-center cursor-pointer shadow-2xs"
          >
            Tháng này
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("all")}
            className="py-1 px-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-kv-blue-light hover:text-kv-blue-primary hover:border-kv-blue-primary transition-all text-slate-600 text-center cursor-pointer shadow-2xs"
          >
            Toàn bộ
          </button>
        </div>

        {/* Date Inputs */}
        <div className="flex flex-col gap-1.5 mt-1">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Từ ngày:</span>
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">Đến ngày:</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
