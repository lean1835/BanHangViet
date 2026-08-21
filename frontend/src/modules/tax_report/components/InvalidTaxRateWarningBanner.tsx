import React, { useState } from "react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "@/constants/routes";
import type { IInvalidTaxRateItem } from "../types/taxRevenueSummary.types";

interface IInvalidTaxRateWarningBannerProps {
  items?: IInvalidTaxRateItem[];
  errorMessage?: string | null;
}

export const InvalidTaxRateWarningBanner: React.FC<IInvalidTaxRateWarningBannerProps> = ({
  items = [],
  errorMessage,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!errorMessage && (!items || items.length === 0)) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50 border-2 border-rose-300 rounded-2xl p-4 shadow-sm text-slate-800 space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-rose-500 text-white rounded-xl shadow-md shrink-0 mt-0.5">
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-extrabold uppercase bg-rose-600 text-white rounded-md tracking-wider">
                Cảnh báo nghiệp vụ thuế (TC-02)
              </span>
              <span className="text-xs text-rose-700 font-semibold">
                Phát sinh mức thuế ngưng hiệu lực trong kỳ kê khai
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-1">
              {errorMessage || "Có mặt hàng trong kỳ đang gán mức thuế đã ngừng hiệu lực. Vui lòng kiểm tra và cập nhật lại danh mục thuế."}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition shadow-xs flex items-center gap-1"
            >
              {isExpanded ? "Ẩn danh sách" : "Xem chi tiết"}
              <svg
                className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}

          <Link
            to={APP_ROUTES.SETTINGS_TAX_RATES}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Cập nhật mức thuế
          </Link>
        </div>
      </div>

      {/* Item List */}
      {isExpanded && items.length > 0 && (
        <div className="divide-y divide-rose-200/60 bg-white/80 backdrop-blur-xs rounded-xl border border-rose-200 overflow-hidden text-xs">
          {items.map((item) => (
            <div key={item.id} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
                    {item.productCode}
                  </span>
                  <span className="font-semibold text-slate-800">{item.productName}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500 font-mono">HĐ: {item.invoiceSymbolNumber}</span>
                </div>
                <p className="text-rose-700 font-medium leading-relaxed">{item.reason}</p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md font-bold border border-amber-300">
                  Mức thuế hiện tại: {item.assignedTaxRate}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
