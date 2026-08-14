import React from "react";
import type { ITaxRateGroupSummary } from "../types/taxRevenueSummary.types";

interface ITaxRevenueByRateTableProps {
  items: ITaxRateGroupSummary[];
  isLoading?: boolean;
}

export const TaxRevenueByRateTable: React.FC<ITaxRevenueByRateTableProps> = ({
  items,
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

  // Calculated Totals for footer
  const totalTaxableRevenue = items.reduce((acc, curr) => acc + curr.taxableRevenue, 0);
  const totalTaxAmount = items.reduce((acc, curr) => acc + curr.taxAmount, 0);
  const totalPayment = items.reduce((acc, curr) => acc + curr.totalPayment, 0);
  const totalInvoiceItems = items.reduce((acc, curr) => acc + curr.invoiceItemCount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Title Bar */}
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Bảng Tổng hợp Doanh thu chịu thuế & Tiền thuế GTGT theo Thuế suất (TC-01)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu nhóm theo từng mức thuế suất đang hiệu lực trong kỳ kê khai
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
              <th className="py-3.5 px-4">Mức thuế suất</th>
              <th className="py-3.5 px-4 text-right">Doanh thu chịu thuế (VND)</th>
              <th className="py-3.5 px-4 text-right">Tiền thuế GTGT (VND)</th>
              <th className="py-3.5 px-4 text-right">Tổng thanh toán (VND)</th>
              <th className="py-3.5 px-4 text-center">Tỷ trọng (%)</th>
              <th className="py-3.5 px-4 text-center">Số dòng HĐ</th>
              <th className="py-3.5 px-4 text-center">Trạng thái</th>
              <th className="py-3.5 px-4">Ghi chú</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  Chưa có dữ liệu tổng hợp doanh thu cho kỳ này.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const isExpired = item.status === "EXPIRED";
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isExpired ? "bg-rose-50/40" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-extrabold text-xs border ${
                            item.taxRateValue === 8
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : item.taxRateValue === 5
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : item.taxRateValue === 0
                              ? "bg-slate-100 text-slate-700 border-slate-200"
                              : isExpired
                              ? "bg-rose-100 text-rose-800 border-rose-300"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {item.taxRateLabel}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-800 font-mono">
                      {formatVnd(item.taxableRevenue)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-indigo-600 font-mono">
                      {formatVnd(item.taxAmount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      {formatVnd(item.totalPayment)}
                    </td>

                    <td className="py-3.5 px-4 text-center font-semibold">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div
                            className="bg-blue-600 h-full rounded-full"
                            style={{ width: `${Math.min(item.revenueSharePercent, 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-mono">{item.revenueSharePercent.toFixed(1)}%</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-semibold">
                      {item.invoiceItemCount}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 border border-rose-300">
                          Hết hiệu lực
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Áp dụng
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {item.note || "-"}
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
                <td colSpan={2} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs">
                  Tổng cộng kỳ kê khai:
                </td>
                <td className="py-3.5 px-4 text-right text-blue-700 font-mono text-sm">
                  {formatVnd(totalTaxableRevenue)}
                </td>
                <td className="py-3.5 px-4 text-right text-indigo-700 font-mono text-sm">
                  {formatVnd(totalTaxAmount)}
                </td>
                <td className="py-3.5 px-4 text-right text-emerald-700 font-mono text-sm">
                  {formatVnd(totalPayment)}
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-xs">100%</td>
                <td className="py-3.5 px-4 text-center font-mono text-xs">{totalInvoiceItems}</td>
                <td colSpan={2} className="py-3.5 px-4 text-xs text-slate-500 font-normal">
                  (Bảng kê đã làm sạch hóa đơn hủy & điều chỉnh)
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
