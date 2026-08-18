import React from "react";
import type { ITaxRevenueSummaryResponse } from "../types/taxRevenueSummary.types";

interface ITaxRevenueKPICardsProps {
  summary?: ITaxRevenueSummaryResponse;
  hasExpiredWarning?: boolean;
  isLoading?: boolean;
}

export const TaxRevenueKPICards: React.FC<ITaxRevenueKPICardsProps> = ({
  summary,
  hasExpiredWarning = false,
  isLoading = false,
}) => {
  const formatVnd = (val: number = 0) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const totalRevenue = summary?.totalRevenue || 0;
  const totalTaxAmount = summary?.totalTaxAmount || 0;
  const activeTaxRateCount = summary?.taxRateSummaries?.length || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 1. Tổng doanh thu chịu thuế (Net) */}
      <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-blue-50 rounded-full opacity-60 pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Doanh thu chịu thuế (Net)
          </span>
          <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-black text-blue-600 tracking-tight mt-2 font-mono">
          {formatVnd(totalRevenue)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">
          Doanh thu đã loại hóa đơn hủy & trừ ĐC giảm
        </p>
      </div>

      {/* 2. NỔI BẬT: Tổng tiền thuế GTGT phải nộp (Hero Highlight Card) */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white p-5 rounded-2xl shadow-lg shadow-indigo-200/50 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:scale-[1.01] border border-indigo-500/30">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-white/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-100">
              Thuế GTGT phải nộp
            </span>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-white/20 text-white rounded-full backdrop-blur-xs border border-white/25">
              Nghĩa vụ thuế
            </span>
          </div>
          <span className="p-2 bg-white/20 text-white rounded-xl backdrop-blur-xs shadow-xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </span>
        </div>
        <div className="text-3xl font-black tracking-tight mt-2 text-white font-mono drop-shadow-xs relative z-10">
          {formatVnd(totalTaxAmount)}
        </div>
        <p className="text-[11px] text-indigo-100/90 mt-1 font-medium relative z-10">
          Số tiền thuế GTGT cần kê khai & nộp trong kỳ
        </p>
      </div>

      {/* 3. Phân tích nhóm thuế suất & Trạng thái */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Phân tích mức thuế
          </span>
          <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-black text-slate-800 tracking-tight mt-2 flex items-baseline gap-1 font-mono">
          {activeTaxRateCount}
          <span className="text-xs font-medium text-slate-500">mức thuế suất áp dụng</span>
        </div>
        <div className="mt-2 text-[11px]">
          {hasExpiredWarning ? (
            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
              Phát sinh thuế ngưng hiệu lực
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ✓ Thuế suất hợp lệ 100%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
