import React from "react";
import type { ITaxRateRevenueSummaryItem } from "../types/taxRevenueSummary.types";

interface ITaxRevenueByRateTableProps {
  items: ITaxRateRevenueSummaryItem[];
  grandTotalRevenue?: number;
  grandTotalTax?: number;
  isLoading?: boolean;
}

export const TaxRevenueByRateTable: React.FC<ITaxRevenueByRateTableProps> = ({
  items,
  grandTotalRevenue = 0,
  grandTotalTax = 0,
  isLoading = false,
}) => {
  const formatVnd = (val: number = 0) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalCalculatedRevenue = grandTotalRevenue || items.reduce((acc, curr) => acc + curr.revenueAmount, 0);
  const totalCalculatedTax = grandTotalTax || items.reduce((acc, curr) => acc + curr.taxAmount, 0);
  const totalInvoices = items.reduce((acc, curr) => acc + curr.invoiceCount, 0);

  const getTaxRateBadgeStyle = (percentage: number) => {
    switch (percentage) {
      case 10:
        return "bg-rose-50 text-rose-700 border-rose-200";
      case 8:
        return "bg-blue-50 text-blue-700 border-blue-200";
      case 5:
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case 3:
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case 1:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case 0:
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-teal-50 text-teal-700 border-teal-200";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Title Bar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Bảng Tổng hợp Doanh thu chịu thuế & Tiền thuế GTGT theo Thuế suất (NCL-12-CN-002)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu phân tách theo từng mức thuế suất áp dụng trong kỳ kê khai
          </p>
        </div>

        <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">
          Tổng số nhóm thuế: <strong className="text-slate-800">{items.length}</strong>
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100/70 text-slate-600 font-extrabold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 text-center w-12">STT</th>
              <th className="py-3.5 px-4 min-w-[220px]">Mức thuế suất</th>
              <th className="py-3.5 px-4 text-right">Doanh thu chịu thuế (VND)</th>
              <th className="py-3.5 px-4 text-right bg-indigo-50/80 text-indigo-900 border-x border-indigo-100 font-black">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span>Tiền thuế GTGT (VND)</span>
                </div>
              </th>
              <th className="py-3.5 px-4 text-center">Tỷ trọng (%)</th>
              <th className="py-3.5 px-4 text-center">Số lượng HĐ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Chưa có dữ liệu tổng hợp doanh thu cho kỳ này.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const revenueShare =
                  totalCalculatedRevenue > 0
                    ? ((item.revenueAmount / totalCalculatedRevenue) * 100).toFixed(1)
                    : "0.0";

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-mono font-black text-xs border shrink-0 ${getTaxRateBadgeStyle(
                            item.taxRatePercentage
                          )}`}
                        >
                          {item.taxRatePercentage}%
                        </span>
                        <span className="font-semibold text-slate-800" title={item.taxRateName}>
                          {item.taxRateName ? `${item.taxRateName}` : `Thuế suất ${item.taxRatePercentage}%`}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-mono">
                      {formatVnd(item.revenueAmount)}
                    </td>

                    {/* Nổi bật cột Tiền thuế GTGT */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-indigo-700 bg-indigo-50/40 border-x border-indigo-100/60 text-[13px]">
                      {formatVnd(item.taxAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${Math.min(Number(revenueShare), 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-mono">{revenueShare}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-semibold">
                      {item.invoiceCount}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer Total Row */}
          {items.length > 0 && (
            <tfoot className="bg-slate-100 text-slate-900 font-extrabold border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs font-black text-slate-700">
                  Tổng cộng kỳ kê khai:
                </td>
                <td className="py-3.5 px-4 text-right text-blue-700 font-mono text-sm font-bold">
                  {formatVnd(totalCalculatedRevenue)}
                </td>
                {/* Nổi bật Tổng tiền thuế GTGT ở chân bảng */}
                <td className="py-3.5 px-4 text-right bg-indigo-100/80 border-x border-indigo-200">
                  <span className="inline-block bg-indigo-600 text-white font-mono font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                    {formatVnd(totalCalculatedTax)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-xs">100%</td>
                <td className="py-3.5 px-4 text-center font-mono text-xs">{totalInvoices}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
