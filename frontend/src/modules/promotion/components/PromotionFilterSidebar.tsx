import React from "react";
import {
  PROMOTION_APPLY_SCOPE_LABELS,
  PROMOTION_STATE_LABELS,
} from "@/constants/promotion";

export interface PromotionFilterState {
  stateFilter: string;
  scopeFilter: string;
  startDate: string;
  endDate: string;
  activeNowOnly: boolean;
}

interface PromotionFilterSidebarProps {
  filter: PromotionFilterState;
  onFilterChange: (newFilter: PromotionFilterState) => void;
  onResetFilter: () => void;
}

export const PromotionFilterSidebar: React.FC<PromotionFilterSidebarProps> = ({
  filter,
  onFilterChange,
  onResetFilter,
}) => {
  const setDatePreset = (preset: "today" | "7days" | "thisMonth") => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (preset === "today") {
      const dStr = formatDate(today);
      onFilterChange({
        ...filter,
        startDate: `${dStr}T00:00:00`,
        endDate: `${dStr}T23:59:59`,
      });
    } else if (preset === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      onFilterChange({
        ...filter,
        startDate: `${formatDate(past)}T00:00:00`,
        endDate: `${formatDate(today)}T23:59:59`,
      });
    } else if (preset === "thisMonth") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      onFilterChange({
        ...filter,
        startDate: `${formatDate(firstDay)}T00:00:00`,
        endDate: `${formatDate(today)}T23:59:59`,
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sidebar Title */}
      <div className="font-extrabold text-sm text-slate-800 border-b pb-2 flex items-center justify-between">
        <span>Bộ lọc khuyến mại</span>
        <button
          type="button"
          onClick={onResetFilter}
          className="text-[10px] font-bold text-kv-blue-primary hover:text-kv-blue-dark transition-colors"
        >
          Đặt lại
        </button>
      </div>

      {/* Trạng thái hiệu lực Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="promotion-state-filter"
          className="font-bold text-slate-400 uppercase tracking-wide text-[10px]"
        >
          Trạng thái hiệu lực
        </label>
        <select
          id="promotion-state-filter"
          value={filter.stateFilter}
          onChange={(e) =>
            onFilterChange({ ...filter, stateFilter: e.target.value })
          }
          className="h-9.5 w-full px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-kv-blue-primary focus:ring-4 focus:ring-kv-blue-primary/10 shadow-2xs transition-all cursor-pointer"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(PROMOTION_STATE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Phạm vi áp dụng Dropdown */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="promotion-scope-filter"
          className="font-bold text-slate-400 uppercase tracking-wide text-[10px]"
        >
          Phạm vi áp dụng
        </label>
        <select
          id="promotion-scope-filter"
          value={filter.scopeFilter}
          onChange={(e) =>
            onFilterChange({ ...filter, scopeFilter: e.target.value })
          }
          className="h-9.5 w-full px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-kv-blue-primary focus:ring-4 focus:ring-kv-blue-primary/10 shadow-2xs transition-all cursor-pointer"
        >
          <option value="ALL">Tất cả phạm vi</option>
          {Object.entries(PROMOTION_APPLY_SCOPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Khoảng thời gian */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
        <span className="font-bold text-slate-400 uppercase tracking-wide text-[10px]">
          Thời gian áp dụng
        </span>

        {/* Quick Date Presets */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setDatePreset("today")}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-center transition-colors"
          >
            Hôm nay
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("7days")}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-center transition-colors"
          >
            7 ngày qua
          </button>
          <button
            type="button"
            onClick={() => setDatePreset("thisMonth")}
            className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-center transition-colors"
          >
            Tháng này
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-500">Từ ngày</span>
          <input
            type="date"
            value={filter.startDate ? filter.startDate.substring(0, 10) : ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                startDate: e.target.value
                  ? `${e.target.value}T00:00:00`
                  : "",
              })
            }
            className="h-9.5 w-full px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-kv-blue-primary focus:ring-4 focus:ring-kv-blue-primary/10 shadow-2xs transition-all"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-slate-500">Đến ngày</span>
          <input
            type="date"
            value={filter.endDate ? filter.endDate.substring(0, 10) : ""}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                endDate: e.target.value
                  ? `${e.target.value}T23:59:59`
                  : "",
              })
            }
            className="h-9.5 w-full px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-kv-blue-primary focus:ring-4 focus:ring-kv-blue-primary/10 shadow-2xs transition-all"
          />
        </div>
      </div>

      {/* Active Now Only Checkbox */}
      <div className="border-t border-slate-100 pt-3">
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filter.activeNowOnly}
            onChange={(e) =>
              onFilterChange({
                ...filter,
                activeNowOnly: e.target.checked,
              })
            }
            className="rounded-md border-slate-300 text-kv-blue-primary focus:ring-kv-blue-primary w-4 h-4 cursor-pointer accent-kv-blue-primary"
          />
          <span>Chỉ hiện đang hiệu lực ngay</span>
        </label>
      </div>
    </div>
  );
};
