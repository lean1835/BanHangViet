import React from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/dateFormatter";
import type { IInvoice } from "../types/IInvoice";
import { getStatusClassName, getStatusLabel } from "../utils/eInvoiceHelpers";

interface InvoiceListProps {
  invoices: IInvoice[];
  onSelectInvoice: (invoice: IInvoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onSelectInvoice }) => {
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
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                  Không tìm thấy hóa đơn nào khớp với bộ lọc.
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="transition-colors hover:bg-slate-50/50">
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
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => onSelectInvoice(invoice)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-slate-100 px-3 text-[10px] font-bold text-slate-600 transition-colors hover:bg-slate-200 focus:outline-none lg:min-h-8"
                    >
                      Chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default InvoiceList;
