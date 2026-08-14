import React, { useState, useMemo } from "react";
import { Search, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import type { ITaxAnnexInvoice } from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";

interface ITaxInvoiceAnnexTableProps {
  invoices: ITaxAnnexInvoice[];
  periodLabel: string;
}

export const TaxInvoiceAnnexTable: React.FC<ITaxInvoiceAnnexTableProps> = ({
  invoices,
  periodLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredInvoices = useMemo(() => {
    if (!searchTerm.trim()) return invoices;
    const term = searchTerm.toLowerCase().trim();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.invoiceSeries.toLowerCase().includes(term) ||
        inv.buyerName.toLowerCase().includes(term) ||
        (inv.buyerTaxCode && inv.buyerTaxCode.toLowerCase().includes(term))
    );
  }, [invoices, searchTerm]);

  const totalPages = Math.ceil(filteredInvoices.length / pageSize) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInvoices.slice(start, start + pageSize);
  }, [filteredInvoices, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4">
      {/* Header & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-kv-blue-primary" />
            <span>Phụ lục 01-2/BK-HĐKD: Bảng kê hóa đơn bán ra ({periodLabel})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Gồm các hóa đơn đã cấp mã (ISSUED) và đã trừ phần điều chỉnh giảm (QTN-22)
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo số HĐ, người mua, MST..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-kv-blue-primary"
          />
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto mt-3">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
            <tr>
              <th className="p-2.5 text-center w-12">STT</th>
              <th className="p-2.5">Ký hiệu</th>
              <th className="p-2.5">Số HĐ</th>
              <th className="p-2.5">Ngày lập</th>
              <th className="p-2.5">Khách hàng / MST</th>
              <th className="p-2.5 text-right">Tiền trước thuế</th>
              <th className="p-2.5 text-center">Thuế suất</th>
              <th className="p-2.5 text-right">Tiền thuế</th>
              <th className="p-2.5 text-right">Tổng tiền</th>
              <th className="p-2.5 text-center">Loại HĐ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedInvoices.length > 0 ? (
              paginatedInvoices.map((inv, idx) => (
                <tr key={inv.id || idx} className="hover:bg-slate-50 transition">
                  <td className="p-2.5 text-center font-bold text-slate-400">
                    {(currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td className="p-2.5 font-mono text-slate-600 font-semibold">
                    {inv.invoiceSeries}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-slate-800">
                    {inv.invoiceNumber}
                  </td>
                  <td className="p-2.5 text-slate-600 whitespace-nowrap">
                    {inv.issuedDate}
                  </td>
                  <td className="p-2.5">
                    <div className="font-bold text-slate-800">{inv.buyerName}</div>
                    {inv.buyerTaxCode && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        MST: {inv.buyerTaxCode}
                      </div>
                    )}
                  </td>
                  <td className="p-2.5 text-right font-semibold text-slate-800">
                    {formatCurrency(inv.preTaxAmount)}
                  </td>
                  <td className="p-2.5 text-center font-bold text-slate-600">
                    {inv.taxRatePercentage}%
                  </td>
                  <td className="p-2.5 text-right font-semibold text-emerald-600">
                    {formatCurrency(inv.taxAmount)}
                  </td>
                  <td className="p-2.5 text-right font-extrabold text-slate-900">
                    {formatCurrency(inv.finalAmount)}
                  </td>
                  <td className="p-2.5 text-center">
                    {inv.isAdjustment ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertCircle className="w-3 h-3" />
                        Điều chỉnh giảm
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        HĐ Gốc
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10} className="p-8 text-center text-slate-400 italic">
                  Không tìm thấy hóa đơn nào phù hợp với bộ lọc trong kỳ này.
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
              className="px-2.5 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="px-3 py-1 font-bold text-slate-700">
              Trang {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
