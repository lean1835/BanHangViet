import React, { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import type { IInvoice } from "../types/IInvoice";
import { getStatusClassName, getStatusLabel } from "../utils/eInvoiceHelpers";

interface InvoiceListProps {
  invoices: IInvoice[];
  onSelectInvoice: (invoice: IInvoice) => void;
}

const PAGE_SIZE = 8;

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
    <div className="xl:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-2">
        <h3 className="font-extrabold text-slate-800 text-sm">
          Danh sách hóa đơn điện tử
        </h3>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {invoices.length} hóa đơn
        </span>
      </div>

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
        <TablePaginationFooter
          currentPage={page}
          pageSize={PAGE_SIZE}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={setPage}
          recordUnit="hóa đơn"
        />
      )}
    </div>
  );
};
export default InvoiceList;
