import React from "react";
import { SlidersHorizontal, Calendar, User, AlertTriangle, RotateCcw } from "lucide-react";
import { useReportFilter } from "../context/ReportFilterContext";
import { useGetAllEmployeesQuery } from "@/modules/employee/services/employeeApi";

const THRESHOLD_PRESETS = [
  { label: "Tất cả lệch", value: 1 },
  { label: "≥ 50.000 đ", value: 50000 },
  { label: "≥ 100.000 đ", value: 100000 },
  { label: "≥ 200.000 đ", value: 200000 },
];

export const EmployeeShiftReportSidebar: React.FC = () => {
  const {
    employeeShiftFilter,
    setEmployeeShiftFilter,
    setEmployeeShiftPreset,
    resetEmployeeShiftFilter,
  } = useReportFilter();

  const { data: employees = [] } = useGetAllEmployeesQuery();

  return (
    <div className="flex flex-col gap-4 text-xs animate-in fade-in duration-200">
      {/* Title & Reset */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 font-extrabold text-sm text-slate-800">
          <SlidersHorizontal className="w-4 h-4 text-kv-blue-primary" />
          <span>Bộ lọc ca & nhân viên</span>
        </div>
        <button
          type="button"
          onClick={resetEmployeeShiftFilter}
          className="text-[10px] font-bold text-kv-blue-primary hover:text-kv-blue-dark transition-colors flex items-center gap-1 cursor-pointer"
          title="Đặt lại bộ lọc về mặc định"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-col gap-1.5">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Khoảng thời gian nhanh
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setEmployeeShiftPreset("today")}
            className={`py-1.5 px-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center ${
              employeeShiftFilter.activePreset === "today"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setEmployeeShiftPreset("thisWeek")}
            className={`py-1.5 px-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center ${
              employeeShiftFilter.activePreset === "thisWeek"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={() => setEmployeeShiftPreset("thisMonth")}
            className={`py-1.5 px-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer text-center ${
              employeeShiftFilter.activePreset === "thisMonth"
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-kv-blue-light hover:text-kv-blue-primary"
            }`}
          >
            Tháng này
          </button>
        </div>
      </div>

      {/* Date Range Pickers */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>Thời gian tùy chỉnh</span>
        </span>
        <div className="flex flex-col gap-2">
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Từ ngày</label>
            <input
              type="date"
              value={employeeShiftFilter.fromDate}
              onChange={(e) =>
                setEmployeeShiftFilter((prev) => ({
                  ...prev,
                  fromDate: e.target.value,
                  activePreset: "custom",
                }))
              }
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 text-xs focus:bg-white focus:outline-none focus:border-kv-blue-primary transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Đến ngày</label>
            <input
              type="date"
              value={employeeShiftFilter.toDate}
              onChange={(e) =>
                setEmployeeShiftFilter((prev) => ({
                  ...prev,
                  toDate: e.target.value,
                  activePreset: "custom",
                }))
              }
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 text-xs focus:bg-white focus:outline-none focus:border-kv-blue-primary transition-all"
            />
          </div>
        </div>
      </div>

      {/* Employee Selector */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <User className="w-3 h-3 text-slate-400" />
          <span>Lọc theo nhân viên</span>
        </span>
        <select
          value={employeeShiftFilter.employeeId}
          onChange={(e) =>
            setEmployeeShiftFilter((prev) => ({
              ...prev,
              employeeId: e.target.value,
            }))
          }
          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50/50 text-slate-700 text-xs focus:bg-white focus:outline-none focus:border-kv-blue-primary transition-all"
        >
          <option value="">Tất cả nhân viên</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName || emp.username} ({emp.username})
            </option>
          ))}
        </select>
      </div>

      {/* Discrepancy Threshold Control */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Ngưỡng cảnh báo lệch</span>
          </span>
          <span className="font-black text-amber-600 text-[11px]">
            {Number(employeeShiftFilter.threshold).toLocaleString("vi-VN")} đ
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1">
          {THRESHOLD_PRESETS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() =>
                setEmployeeShiftFilter((prev) => ({
                  ...prev,
                  threshold: t.value,
                }))
              }
              className={`py-1 px-1.5 rounded-lg border text-[10px] font-bold transition-all text-center cursor-pointer ${
                employeeShiftFilter.threshold === t.value
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Toggle Only Discrepancies */}
        <label className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={employeeShiftFilter.onlyDiscrepancy}
            onChange={(e) =>
              setEmployeeShiftFilter((prev) => ({
                ...prev,
                onlyDiscrepancy: e.target.checked,
              }))
            }
            className="rounded border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-3.5 h-3.5"
          />
          <span className="text-[11px] font-bold text-slate-700">
            Chỉ xem ca có chênh lệch tiền
          </span>
        </label>
      </div>
    </div>
  );
};
