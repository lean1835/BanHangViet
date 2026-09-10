import React, { useMemo } from "react";
import { Calendar } from "lucide-react";
import { STOCK_CARD_CONFIG } from "@/constants/product";

interface StockCardFilterBarProps {
  fromDate: string;
  toDate: string;
  onDateChange: (fromDate: string, toDate: string) => void;
  onReset?: () => void;
  isLoading?: boolean;
}

const formatDateToISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const StockCardFilterBar: React.FC<StockCardFilterBarProps> = ({
  fromDate,
  toDate,
  onDateChange,
}) => {
  const todayStr = useMemo(() => formatDateToISO(new Date()), []);

  // Validation logic
  const validationError = useMemo(() => {
    if (!fromDate || !toDate) return null;
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (start > end) {
      return "Từ ngày phải nhỏ hơn hoặc bằng Đến ngày";
    }
    const diffDays = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays > STOCK_CARD_CONFIG.MAX_DAYS_RANGE) {
      return `Khoảng thời gian không được vượt quá ${STOCK_CARD_CONFIG.MAX_DAYS_RANGE} ngày (1 năm)`;
    }
    return null;
  }, [fromDate, toDate]);

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
      <div className="flex flex-wrap items-center gap-4">
        {/* Label icon */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Tra cứu ngày:</span>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-2">
          <label htmlFor="stockCardFromDate" className="text-xs font-semibold text-slate-500">
            Từ:
          </label>
          <input
            id="stockCardFromDate"
            type="date"
            max={todayStr}
            value={fromDate}
            onChange={(e) => onDateChange(e.target.value, toDate)}
            className="h-8 px-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="stockCardToDate" className="text-xs font-semibold text-slate-500">
            Đến:
          </label>
          <input
            id="stockCardToDate"
            type="date"
            max={todayStr}
            value={toDate}
            onChange={(e) => onDateChange(fromDate, e.target.value)}
            className="h-8 px-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary"
          />
        </div>
      </div>

      {/* Validation Message */}
      {validationError && (
        <div
          role="alert"
          className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
        >
          <span>⚠️ {validationError}</span>
        </div>
      )}
    </div>
  );
};

export default StockCardFilterBar;
