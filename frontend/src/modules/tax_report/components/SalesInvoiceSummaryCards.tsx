import React from "react";
import type { ISalesInvoiceSummary } from "../types/salesInvoiceListing.types";

interface ISalesInvoiceSummaryCardsProps {
  summary?: ISalesInvoiceSummary;
  isLoading?: boolean;
}

export const SalesInvoiceSummaryCards: React.FC<ISalesInvoiceSummaryCardsProps> = ({
  summary,
  isLoading = false,
}) => {
  const formatVnd = (val: number = 0) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Doanh thu chưa thuế */}
      <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-blue-50 rounded-full opacity-50 pointer-events-none"></div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Doanh thu chịu thuế (Net)
        </span>
        <div className="text-xl font-extrabold text-blue-600 mt-2">
          {formatVnd(summary?.totalRevenue)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          (Đã trừ bớt phần điều chỉnh giảm)
        </p>
      </div>

      {/* Tổng tiền thuế GTGT */}
      <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-indigo-50 rounded-full opacity-50 pointer-events-none"></div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Tổng tiền thuế GTGT (Net)
        </span>
        <div className="text-xl font-extrabold text-indigo-600 mt-2">
          {formatVnd(summary?.totalTaxAmount)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          (Tổng tiền thuế GTGT phát sinh)
        </p>
      </div>

      {/* Tổng thanh toán */}
      <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 bg-emerald-50 rounded-full opacity-50 pointer-events-none"></div>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Tổng thanh toán
        </span>
        <div className="text-xl font-extrabold text-emerald-600 mt-2">
          {formatVnd(summary?.totalAmount)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          (Bao gồm tiền hàng & thuế GTGT)
        </p>
      </div>

      {/* Thống kê số lượng hóa đơn */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Số lượng HĐ trong kỳ
        </span>
        <div className="text-xl font-extrabold text-slate-800 mt-1">
          {summary?.totalInvoices || 0} <span className="text-xs font-normal text-slate-500">hóa đơn</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px]">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            Hợp lệ: {summary?.validInvoicesCount || 0}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
            Hủy: {summary?.canceledInvoicesCount || 0}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
            ĐC: {summary?.adjustedInvoicesCount || 0}
          </span>
        </div>
      </div>
    </div>
  );
};
