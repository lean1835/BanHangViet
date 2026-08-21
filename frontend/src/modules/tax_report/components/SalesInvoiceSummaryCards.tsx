import React from "react";
import type { ITaxPeriodResponse } from "../types/salesInvoiceListing.types";
import { formatCurrency } from "@/utils/formatCurrency";

interface ISalesInvoiceSummaryCardsProps {
  period?: ITaxPeriodResponse;
  isLoading?: boolean;
}

export const SalesInvoiceSummaryCards: React.FC<ISalesInvoiceSummaryCardsProps> = ({
  period,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const totalRevenue = period?.totalRevenue || 0;
  const totalTaxAmount = period?.totalTaxAmount || 0;
  const totalValidInvoices = period?.totalValidInvoices || 0;
  const isLocked = period?.status === "LOCKED";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {/* 1. Thống kê số lượng hóa đơn & Trạng thái kỳ */}
      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 ease-out cursor-default">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-emerald-50 rounded-full opacity-60 pointer-events-none group-hover:scale-125 group-hover:opacity-90 transition-all duration-500 ease-out"></div>
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Số HĐ hợp lệ & Trạng thái
          </span>
          <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ease-out shadow-2xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-bold text-slate-800 tracking-tight mt-2 flex items-baseline gap-1.5 relative z-10 group-hover:text-slate-900 transition-colors">
          {totalValidInvoices}
          <span className="text-xs font-medium text-slate-500">hóa đơn đã cấp mã</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-xs relative z-10">
          {isLocked ? (
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold border border-rose-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
              Đã chốt (LOCKED)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              Đang mở (GENERATED)
            </span>
          )}
        </div>
      </div>

      {/* 2. Doanh thu chưa thuế */}
      <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 ease-out cursor-default">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-blue-50 rounded-full opacity-60 pointer-events-none group-hover:scale-125 group-hover:opacity-90 transition-all duration-500 ease-out"></div>
        <div className="flex items-center justify-between relative z-10">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Doanh thu chịu thuế (Net)
          </span>
          <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ease-out shadow-2xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-bold text-blue-600 tracking-tight mt-2 relative z-10 group-hover:text-blue-700 transition-colors">
          {formatCurrency(totalRevenue)}
        </div>
        <p className="text-xs text-slate-400 mt-1 font-medium relative z-10">
          Đã loại trừ HĐ hủy & trừ HĐ điều chỉnh giảm
        </p>
      </div>

      {/* 3. Tổng tiền thuế GTGT (Net) */}
      <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group hover:shadow-lg hover:shadow-indigo-500/10 hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 ease-out cursor-default">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-indigo-50 rounded-full opacity-60 pointer-events-none group-hover:scale-125 group-hover:opacity-90 transition-all duration-500 ease-out"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tổng tiền thuế GTGT (Net)
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200 group-hover:bg-indigo-100 transition-colors">
              Nghĩa vụ thuế
            </span>
          </div>
          <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 ease-out shadow-2xs">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </span>
        </div>
        <div className="text-2xl font-bold text-indigo-600 tracking-tight mt-2 relative z-10 group-hover:text-indigo-700 transition-colors">
          {formatCurrency(totalTaxAmount)}
        </div>
        <p className="text-xs text-slate-400 mt-1 font-medium relative z-10">
          Tổng tiền thuế GTGT phát sinh trong kỳ
        </p>
      </div>
    </div>
  );
};
