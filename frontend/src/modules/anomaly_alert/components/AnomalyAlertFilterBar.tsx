import React from "react";
import { Search, RotateCcw } from "lucide-react";
import {
  ANOMALY_ALERT_TYPE_INFO,
  ANOMALY_SEVERITY_STYLES,
  ANOMALY_STATUS_STYLES,
  ANOMALY_UI,
  type TAnomalyAlertType,
  type TAnomalySeverity,
  type TAnomalyAlertStatus,
} from "@/constants/anomalyAlert";
import type { IAnomalyAlertFilterParams } from "../types/IAnomalyAlert";

interface AnomalyAlertFilterBarProps {
  filter: IAnomalyAlertFilterParams;
  onFilterChange: (newFilter: Partial<IAnomalyAlertFilterParams>) => void;
  onResetFilter: () => void;
}

export const AnomalyAlertFilterBar: React.FC<AnomalyAlertFilterBarProps> = ({
  filter,
  onFilterChange,
  onResetFilter,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-start gap-3 text-xs">
      {/* Search Input */}
      <div className="relative w-full md:w-72 shrink-0">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={filter.keyword || ""}
          onChange={(e) => onFilterChange({ keyword: e.target.value })}
          placeholder={ANOMALY_UI.FILTERS.SEARCH_PLACEHOLDER}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary bg-slate-50/50"
        />
      </div>

      {/* Dropdown Filters */}
      <div className="flex items-center flex-wrap gap-2 w-full md:w-auto justify-start">
        {/* Severity */}
        <select
          value={filter.severity || ""}
          onChange={(e) =>
            onFilterChange({ severity: (e.target.value as TAnomalySeverity) || "" })
          }
          className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-kv-blue-primary"
        >
          <option value="">{ANOMALY_UI.FILTERS.SEVERITY_ALL}</option>
          {Object.entries(ANOMALY_SEVERITY_STYLES).map(([val, item]) => (
            <option key={val} value={val}>
              {item.label}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filter.status || ""}
          onChange={(e) =>
            onFilterChange({ status: (e.target.value as TAnomalyAlertStatus) || "" })
          }
          className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-kv-blue-primary"
        >
          <option value="">{ANOMALY_UI.FILTERS.STATUS_ALL}</option>
          {Object.entries(ANOMALY_STATUS_STYLES).map(([val, item]) => (
            <option key={val} value={val}>
              {item.label}
            </option>
          ))}
        </select>

        {/* Type */}
        <select
          value={filter.alertType || ""}
          onChange={(e) =>
            onFilterChange({ alertType: (e.target.value as TAnomalyAlertType) || "" })
          }
          className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-kv-blue-primary max-w-[200px] truncate"
        >
          <option value="">{ANOMALY_UI.FILTERS.TYPE_ALL}</option>
          {Object.entries(ANOMALY_ALERT_TYPE_INFO).map(([val, item]) => (
            <option key={val} value={val}>
              {item.label}
            </option>
          ))}
        </select>

        {/* Reset */}
        <button
          onClick={onResetFilter}
          title={ANOMALY_UI.FILTERS.RESET_BTN}
          className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
