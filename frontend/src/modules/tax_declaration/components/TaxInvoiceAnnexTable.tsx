import React, { useState, useMemo } from "react";
import { Search, FileText, CheckCircle2, ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { ITaxSalesRegisterItemResponse } from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDateOnly } from "@/utils/dateFormatter";

interface ITaxInvoiceAnnexTableProps {
  invoices: ITaxSalesRegisterItemResponse[];
  periodLabel: string;
  isLoading?: boolean;
}

export const TaxInvoiceAnnexTable: React.FC<ITaxInvoiceAnnexTableProps> = ({
  invoices,
  periodLabel,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    const term = searchTerm.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.invoiceSymbol?.toLowerCase().includes(term) ||
        (inv.buyerName && inv.buyerName.toLowerCase().includes(term)) ||
        (inv.buyerTaxCode && inv.buyerTaxCode.toLowerCase().includes(term))
    );
  }, [invoices, searchTerm]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 transition-all">
      {/* Header & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600 shrink-0 stroke-[2.2]" />
            <span>Phụ lục 01-2/BK-HĐKD: Bảng kê hóa đơn bán ra ({periodLabel})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gồm các hóa đơn hợp lệ đã được cấp mã và đã trừ phần điều chỉnh giảm (QTN-21, QTN-22)
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0 stroke-[2.2]" />
          <input
            type="text"
            placeholder="Tìm số HĐ, ký hiệu, khách hàng, MST..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-3 text-center w-12">STT</th>
              <th className="p-3">Mẫu số & Ký hiệu</th>
              <th className="p-3">Số HĐ</th>
              <th className="p-3">Ngày lập</th>
              <th className="p-3">Khách hàng / MST</th>
              <th className="p-3 text-right">Doanh thu chưa thuế</th>
              <th className="p-3 text-center">Thuế suất</th>
              <th className="p-3 text-right">Tiền thuế</th>
              <th className="p-3 text-right">Tổng thanh toán</th>
              <th className="p-3 text-center">Loại HĐ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: 5 }, (_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                  <td className="p-3 text-center">
                    <div className="h-4 w-4 bg-slate-200 rounded mx-auto" />
                  </td>
                  <td className="p-3"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                  <td className="p-3"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                  <td className="p-3"><div className="h-4 w-20 bg-slate-200 rounded" /></td>
                  <td className="p-3"><div className="h-4 w-32 bg-slate-200 rounded" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-24 bg-slate-200 rounded ml-auto" /></td>
                  <td className="p-3 text-center"><div className="h-4 w-8 bg-slate-200 rounded mx-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-20 bg-slate-200 rounded ml-auto" /></td>
                  <td className="p-3 text-right"><div className="h-4 w-24 bg-slate-200 rounded ml-auto" /></td>
                  <td className="p-3 text-center"><div className="h-4 w-16 bg-slate-200 rounded mx-auto" /></td>
                </tr>
              ))
            ) : paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((inv, idx) => {
                const totalAmount = Number(inv.revenueAmount || 0) + Number(inv.taxAmount || 0);
                const formattedDate = formatDateOnly(inv.issueDate);

                return (
                  <tr key={inv.id || idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </td>
                    <td className="p-3 font-mono text-slate-600 font-semibold">
                      {inv.invoicePattern ? `${inv.invoicePattern}/` : ""}{inv.invoiceSymbol}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {inv.invoiceNumber}
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      {formattedDate}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{inv.buyerName || "Khách mua lẻ"}</div>
                      {inv.buyerTaxCode && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          MST: {inv.buyerTaxCode}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold text-slate-800">
                      {formatCurrency(inv.revenueAmount)}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-600">
                      {inv.taxRatePercentage}%
                    </td>
                    <td className="p-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(inv.taxAmount)}
                    </td>
                    <td className="p-3 text-right font-extrabold text-slate-900">
                      {formatCurrency(totalAmount)}
                    </td>
                    <td className="p-3 text-center">
                      {inv.invoiceType === "ADJUSTMENT_DECREASE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                          <ArrowDownRight className="w-3 h-3 text-amber-600 shrink-0 stroke-[2.5]" />
                          Điều chỉnh giảm
                        </span>
                      ) : inv.invoiceType === "ADJUSTMENT_INCREASE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
                          <ArrowUpRight className="w-3 h-3 text-blue-600 shrink-0 stroke-[2.5]" />
                          Điều chỉnh tăng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 stroke-[2.5]" />
                          HĐ Gốc
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-slate-300 stroke-[1.8]" />
                    <p className="font-medium text-slate-500">Chưa có hóa đơn nào trong bảng kê này.</p>
                    <p className="text-xs text-slate-400">Các hóa đơn sau khi được Cơ quan Thuế cấp mã sẽ tự động xuất hiện tại đây.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2 text-xs">
          <span className="text-slate-500">
            Hiển thị {paginatedInvoices.length} trên tổng số {filteredInvoices.length} hóa đơn
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>
            <span className="px-3 py-1.5 font-bold text-slate-700 bg-slate-50 rounded-lg border border-slate-100">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
