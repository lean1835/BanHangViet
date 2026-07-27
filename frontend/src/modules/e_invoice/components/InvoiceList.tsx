import React, { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import type { IInvoice } from "../types/IInvoice";
import { getStatusClassName, getStatusLabel } from "../utils/eInvoiceHelpers";

interface InvoiceListProps {
  invoices: IInvoice[];
  onSelectInvoice: (invoice: IInvoice) => void;
}

const PAGE_SIZE = 9;

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onSelectInvoice }) => {
  const [page, setPage] = useState(0);

  // Reset về trang 0 khi kết quả lọc thay đổi
  useEffect(() => {
    setPage(0);
  }, [invoices]);

  const totalElements = invoices.length;
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  const paginatedInvoices = useMemo(() => {
    const start = page * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return invoices.slice(start, end);
  }, [invoices, page]);

  return (
    <div className="xl:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <h3 className="font-extrabold text-slate-800 text-sm border-b pb-4 mb-2">
        Danh sách hóa đơn điện tử ({invoices.length} hóa đơn)
      </h3>

      <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <th className="p-3">Số hóa đơn</th>
              <th className="p-3">Mã tra cứu</th>
              <th className="p-3">Khách hàng</th>
              <th className="p-3">Thời gian lập</th>
              <th className="p-3 text-right">Tổng thanh toán</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3">Ký hiệu</th>
              <th className="p-3">Mã cơ quan thuế</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                  Không tìm thấy hóa đơn nào khớp với bộ lọc.
                </td>
              </tr>
            ) : (
              paginatedInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => onSelectInvoice(invoice)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectInvoice(invoice);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Xem chi tiết hóa đơn ${invoice.lookupCode}`}
                  className="transition-colors hover:bg-slate-100/80 cursor-pointer focus:outline-none focus:bg-slate-100"
                >
                  <td className="p-3 font-mono font-bold text-slate-800">{invoice.invoiceNumber || "-"}</td>
                  <td className="p-3 font-mono text-slate-500 font-bold">{invoice.lookupCode}</td>
                  <td className="p-3 font-bold text-slate-700">{invoice.buyerName || invoice.customer || "-"}</td>
                  <td className="p-3 text-slate-500 font-medium">{formatDate(invoice.createdAt || invoice.time)}</td>
                  <td className="p-3 text-right font-bold text-kv-blue-primary">
                    {formatCurrency(invoice.finalAmount)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block border ${getStatusClassName(invoice.status)}`}>
                      {getStatusLabel(invoice.status)}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-500 font-bold">{invoice.invoiceSymbol || invoice.symbol}</td>
                  <td className="p-3 font-mono text-xs text-slate-500">
                    {invoice.taxAuthorityCode || "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Điều khiển phân trang */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-xs font-semibold text-slate-700">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Trang trước
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page + 1 >= totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Trang sau
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-slate-500">
                Hiển thị <span className="font-bold text-slate-800">{page * PAGE_SIZE + 1}</span> -{" "}
                <span className="font-bold text-slate-800">
                  {Math.min((page + 1) * PAGE_SIZE, totalElements)}
                </span>{" "}
                trong tổng số <span className="font-bold text-slate-800">{totalElements}</span> hóa đơn
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center font-bold"
              >
                Trang trước
              </button>
              <span className="px-3 h-8 flex items-center justify-center border border-slate-200 rounded-lg bg-slate-50 font-bold">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page + 1 >= totalPages}
                className="px-3 h-8 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 flex items-center justify-center font-bold"
              >
                Trang sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default InvoiceList;
