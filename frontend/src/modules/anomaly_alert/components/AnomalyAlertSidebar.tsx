import React from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  ANOMALY_ALERT_TYPE_INFO,
  ANOMALY_SEVERITY_STYLES,
  ANOMALY_STATUS_STYLES,
  ANOMALY_UI,
  type TAnomalyAlertType,
  type TAnomalySeverity,
  type TAnomalyAlertStatus,
} from "@/constants/anomalyAlert";
import { useAnomalyAlertFilter } from "../context/AnomalyAlertFilterContext";

export const AnomalyAlertSidebar: React.FC = () => {
  const { filter, handleFilterChange, handleResetFilter } =
    useAnomalyAlertFilter();

  const hasActiveFilter = Boolean(
    filter.keyword ||
      filter.severity ||
      filter.status ||
      filter.alertType ||
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
      handleFilterChange({ startDate: dStr, endDate: dStr });
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      handleFilterChange({
        startDate: formatDate(past),
        endDate: formatDate(today),
      });
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      handleFilterChange({
        startDate: formatDate(firstDay),
        endDate: formatDate(today),
      });
    } else if (preset === "all") {
      handleFilterChange({ startDate: "", endDate: "" });
    }
  };

  return (
    <div className="flex flex-col gap-3.5 text-xs animate-in fade-in duration-200">
      {/* Title & Reset Button */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 font-extrabold text-xs text-slate-800">
          <SlidersHorizontal className="w-3.5 h-3.5 text-kv-blue-primary" />
          <span>BỘ LỌC CẢNH BÁO</span>
        </div>
        {hasActiveFilter && (
          <button
            type="button"
            onClick={handleResetFilter}
            title="Đặt lại tất cả bộ lọc"
            className="flex items-center gap-1 text-[10px] font-bold text-kv-blue-primary hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Đặt lại</span>
          </button>
        )}
      </div>

      {/* 1. Severity / Mức độ nghiêm trọng */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-slate-400" />
          <span>Mức độ nghiêm trọng</span>
        </label>
        <select
          value={filter.severity || ""}
          onChange={(e) =>
            handleFilterChange({
              severity: (e.target.value as TAnomalySeverity) || "",
            })
          }
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
        >
          <option value="">{ANOMALY_UI.FILTERS.SEVERITY_ALL}</option>
          {Object.entries(ANOMALY_SEVERITY_STYLES).map(([val, item]) => (
            <option key={val} value={val}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Status / Trạng thái xử lý */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-slate-400" />
          <span>Trạng thái xử lý</span>
        </label>
        <select
          value={filter.status || ""}
          onChange={(e) =>
            handleFilterChange({
              status: (e.target.value as TAnomalyAlertStatus) || "",
            })
          }
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
        >
          <option value="">{ANOMALY_UI.FILTERS.STATUS_ALL}</option>
          {Object.entries(ANOMALY_STATUS_STYLES).map(([val, item]) => (
            <option key={val} value={val}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Alert Type / Loại vi phạm */}
      <div className="flex flex-col gap-1.5">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Loại vi phạm
        </label>
        <select
          value={filter.alertType || ""}
          onChange={(e) =>
            handleFilterChange({
              alertType: (e.target.value as TAnomalyAlertType) || "",
            })
          }
          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 cursor-pointer shadow-2xs truncate"
        >
          <option value="">{ANOMALY_UI.FILTERS.TYPE_ALL}</option>
          {Object.entries(ANOMALY_ALERT_TYPE_INFO).map(([val, item]) => (
            <option key={val} value={val}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      {/* 5. Date Presets & Date Pickers */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
        <label className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Thời gian phát hiện
        </label>
        <div className="grid grid-cols-2 gap-1 text-[10px] font-bold mb-1">
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

        <div className="flex flex-col gap-1.5">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
              Từ ngày:
            </span>
            <input
              type="date"
              value={filter.startDate || ""}
              onChange={(e) =>
                handleFilterChange({ startDate: e.target.value })
              }
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold block mb-0.5">
              Đến ngày:
            </span>
            <input
              type="date"
              value={filter.endDate || ""}
              onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              className="w-full px-2 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary bg-white text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
