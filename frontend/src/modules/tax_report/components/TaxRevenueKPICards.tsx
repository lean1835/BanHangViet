import React from "react";
import type { ITaxRevenueSummary } from "../types/taxRevenueSummary.types";

interface ITaxRevenueKPICardsProps {
  summary?: ITaxRevenueSummary;
  isLoading?: boolean;
}

export const TaxRevenueKPICards: React.FC<ITaxRevenueKPICardsProps> = ({
  summary,
  isLoading = false,
}) => {
  const formatVnd = (val: number = 0) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng doanh thu chịu thuế (Net) */}
      <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
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
        <div className="text-2xl font-black text-blue-600 tracking-tight mt-2">
          {formatVnd(summary?.totalTaxableRevenue)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">
          Doanh thu đã loại hóa đơn hủy & trừ ĐC giảm
        </p>
      </div>

      {/* 2. Tổng tiền thuế GTGT phải nộp */}
      <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-indigo-50 rounded-full opacity-60 pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Thuế GTGT phải nộp
          </span>
          <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-black text-indigo-600 tracking-tight mt-2">
          {formatVnd(summary?.totalTaxAmount)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">
          Tổng số thuế GTGT của tất cả nhóm thuế suất
        </p>
      </div>

      {/* 3. Tổng thanh toán */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-md transition">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-emerald-50 rounded-full opacity-60 pointer-events-none group-hover:scale-110 transition-transform"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Tổng thanh toán
          </span>
          <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-black text-emerald-600 tracking-tight mt-2">
          {formatVnd(summary?.totalAmount)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">
          (Doanh thu chưa thuế + Tiền thuế GTGT)
        </p>
      </div>

      {/* 4. Nhóm thuế suất & Trạng thái */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
          Phân tích mức thuế
        </span>
        <div className="text-2xl font-black text-slate-800 tracking-tight mt-2 flex items-baseline gap-1">
          {summary?.activeTaxRateGroupsCount || 0}
          <span className="text-xs font-medium text-slate-500">mức thuế suất áp dụng</span>
        </div>
        <div className="mt-2 text-[11px]">
          {summary?.hasExpiredTaxRateWarning ? (
            <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
              Phát sinh thuế ngưng hiệu lực
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✓ Thuế suất hợp lệ 100%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
