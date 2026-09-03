import React from "react";
import type { ITaxRateRevenueSummaryItem } from "../types/taxRevenueSummary.types";
import { formatCurrency } from "@/utils/formatCurrency";

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
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[400px] w-full">
      {/* Block Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm">
            Bảng Tổng hợp Doanh thu chịu thuế & Tiền thuế GTGT theo Thuế suất
          </h3>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {items.length} nhóm thuế
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
              <th className="p-3 text-center w-12">STT</th>
              <th className="p-3 min-w-[220px]">Mức thuế suất</th>
              <th className="p-3 text-right">Doanh thu chịu thuế</th>
              <th className="p-3 text-right bg-indigo-50/80 text-indigo-900 border-x border-indigo-100 font-bold">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span>Tiền thuế GTGT</span>
                </div>
              </th>
              <th className="p-3 text-center">Tỷ trọng (%)</th>
              <th className="p-3 text-center">Số lượng HĐ</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700 text-xs">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold">
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
                  <tr key={idx} className="hover:bg-slate-50/50 group transition-all">
                    <td className="p-3 text-center text-slate-400 font-mono font-semibold">
                      {idx + 1}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-bold text-xs border shrink-0 ${getTaxRateBadgeStyle(
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

                    <td className="p-3 text-right font-bold text-slate-800">
                      {formatCurrency(item.revenueAmount)}
                    </td>

                    {/* Nổi bật cột Tiền thuế GTGT */}
                    <td className="p-3 text-right font-bold text-indigo-700 bg-indigo-50/40 border-x border-indigo-100/60 text-xs">
                      {formatCurrency(item.taxAmount)}
                    </td>

                    <td className="p-3 text-center font-semibold">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${Math.min(Number(revenueShare), 100)}%` }}
                          ></div>
                        </div>
                        <span>{revenueShare}%</span>
                      </div>
                    </td>

                    <td className="p-3 text-center font-bold text-slate-700">
                      {item.invoiceCount}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Footer Total Row */}
          {items.length > 0 && (
            <tfoot className="bg-slate-100 text-slate-900 font-bold border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="p-3 text-right uppercase tracking-wider text-xs font-bold text-slate-700">
                  Tổng cộng kỳ kê khai:
                </td>
                <td className="p-3 text-right text-blue-700 text-xs font-bold">
                  {formatCurrency(totalCalculatedRevenue)}
                </td>
                {/* Nổi bật Tổng tiền thuế GTGT ở chân bảng */}
                <td className="p-3 text-right bg-indigo-100/80 border-x border-indigo-200">
                  <span className="inline-block bg-indigo-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg shadow-xs">
                    {formatCurrency(totalCalculatedTax)}
                  </span>
                </td>
                <td className="p-3 text-center text-xs font-bold">100%</td>
                <td className="p-3 text-center text-xs font-bold">{totalInvoices}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
