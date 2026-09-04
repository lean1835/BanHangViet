import React from "react";
import { Calendar, Store } from "lucide-react";
import { useGetPointsOfSaleQuery } from "@/modules/point_of_sale/services/pointOfSaleApi";
import type { IPointOfSale } from "@/modules/point_of_sale/types/IPointOfSale";
import {
  getLocalDateString,
  getWeekDateRange,
  getPreviousWeekDateRange,
} from "@/utils/dateFormatter";
import { SALES_ANALYTICS_COPY } from "@/constants/salesAnalytics";

interface PeakAnalyticsFilterProps {
  fromDate: string;
  toDate: string;
  posId: string;
  onFilterChange: (filters: { fromDate: string; toDate: string; posId: string }) => void;
}

export const PeakAnalyticsFilter: React.FC<PeakAnalyticsFilterProps> = ({
  fromDate,
  toDate,
  posId,
  onFilterChange,
}) => {
  const { data: posRes } = useGetPointsOfSaleQuery();
  const pointOfSaleList: IPointOfSale[] = posRes?.content || [];

  const currentWeek = React.useMemo(() => getWeekDateRange(), []);
  const isCurrentWeek = fromDate === currentWeek.fromDate && toDate === currentWeek.toDate;

  const previousWeek = React.useMemo(() => getPreviousWeekDateRange(), []);
  const isPreviousWeek = fromDate === previousWeek.fromDate && toDate === previousWeek.toDate;

  const handleCurrentWeekPreset = () => {
    onFilterChange({
      fromDate: currentWeek.fromDate,
      toDate: currentWeek.toDate,
      posId,
    });
  };

  const handlePreviousWeekPreset = () => {
    onFilterChange({
      fromDate: previousWeek.fromDate,
      toDate: previousWeek.toDate,
      posId,
    });
  };

  const handlePresetChange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    onFilterChange({
      fromDate: getLocalDateString(start),
      toDate: getLocalDateString(end),
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
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={handleCurrentWeekPreset}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              isCurrentWeek
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
            }`}
            title="Thứ 2 đến Chủ nhật tuần này"
          >
            Tuần này
          </button>
          <button
            type="button"
            onClick={handlePreviousWeekPreset}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
              isPreviousWeek
                ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
            }`}
            title="Thứ 2 đến Chủ nhật tuần trước"
          >
            Tuần trước
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange(14)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer"
          >
            14 ngày
          </button>
          <button
            type="button"
            onClick={() => handlePresetChange(30)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[11px] font-bold text-slate-600 transition-colors cursor-pointer"
          >
            30 ngày
          </button>
        </div>
      </div>

      {/* POS Selector */}
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
      </div>
    </div>
  );
};
