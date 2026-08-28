import React from "react";
import { Calendar, Store, RefreshCw } from "lucide-react";
import { useGetPointsOfSaleQuery } from "@/modules/point_of_sale/services/pointOfSaleApi";
import type { IPointOfSale } from "@/modules/point_of_sale/types/IPointOfSale";
import { SALES_ANALYTICS_COPY } from "@/constants/salesAnalytics";

interface PeakAnalyticsFilterProps {
  fromDate: string;
  toDate: string;
  posId: string;
  onFilterChange: (filters: { fromDate: string; toDate: string; posId: string }) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const PeakAnalyticsFilter: React.FC<PeakAnalyticsFilterProps> = ({
  fromDate,
  toDate,
  posId,
  onFilterChange,
  onRefresh,
  isLoading,
}) => {
  const { data: posRes } = useGetPointsOfSaleQuery();
  const pointOfSaleList: IPointOfSale[] = posRes?.content || [];

  const handlePresetChange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    onFilterChange({
      fromDate: start.toISOString().split("T")[0],
      toDate: end.toISOString().split("T")[0],
      posId,
    });
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      {/* Date Range Inputs */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-kv-blue-primary" />
          <span>Thời gian:</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) =>
              onFilterChange({
                fromDate: e.target.value,
                toDate,
                posId,
              })
            }
            className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-kv-blue-primary"
          />
          <span className="text-xs text-slate-400 font-bold">-</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) =>
              onFilterChange({
                fromDate,
                toDate: e.target.value,
                posId,
              })
            }
            className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-kv-blue-primary"
          />
        </div>

        {/* Quick Presets Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handlePresetChange(7)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition-colors"
          >
            7 ngày
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange(14)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition-colors"
          >
            14 ngày
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange(30)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition-colors"
          >
            30 ngày
          </button>
        </div>
      </div>

      {/* POS Selector & Refresh */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Store className="w-4 h-4 text-slate-400" />
          <select
            value={posId}
            onChange={(e) =>
              onFilterChange({
                fromDate,
                toDate,
                posId: e.target.value,
              })
            }
            className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:border-kv-blue-primary min-w-[160px]"
          >
            <option value="">{SALES_ANALYTICS_COPY.PEAK_HOURS.ALL_POS}</option>
            {pointOfSaleList.map((pos) => (
              <option key={pos.id} value={pos.id}>
                {pos.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 px-3.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          <span>Làm mới</span>
        </button>
      </div>
    </div>
  );
};
