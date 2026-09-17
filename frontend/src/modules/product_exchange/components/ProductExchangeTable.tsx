import React from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import {
  getExchangeTypeBadge,
  getExchangeTypeLabel,
  getExchangeStatusBadge,
  getExchangeStatusLabel,
  formatExchangeTicketDateTime,
} from "../utils/productExchangeHelpers";
import type { IProductExchangeTicket } from "../types/IProductExchange";

export interface IProductExchangeTableProps {
  tickets: IProductExchangeTicket[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onViewDetail: (ticket: IProductExchangeTicket) => void;
  onPrintTicket: (ticket: IProductExchangeTicket) => void;
}

export const ProductExchangeTable: React.FC<IProductExchangeTableProps> = ({
  tickets,
  isLoading,
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onViewDetail,
  onPrintTicket,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center flex-1 w-full min-h-[400px]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-kv-blue-primary" />
        <span className="text-slate-500 font-bold text-xs mt-3">
          Đang tải danh sách phiếu đổi hàng...
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 w-full justify-between">
      <div>
        {/* Title & Badge */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 className="font-extrabold text-slate-800 text-sm">
            Danh sách phiếu đổi hàng
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {totalElements} phiếu đổi
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
                <th className="p-3">Mã phiếu đổi</th>
                <th className="p-3">Hóa đơn gốc</th>
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Thời gian lập</th>
                <th className="p-3 text-right">Tiền hàng trả</th>
                <th className="p-3 text-right">Tiền hàng đổi</th>
                <th className="p-3 text-right">Chênh lệch</th>
                <th className="p-3 text-center">Hình thức</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="text-xs font-medium">
                        Không tìm thấy phiếu đổi hàng nào khớp với bộ lọc.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => {
                  const typeBadge = getExchangeTypeBadge(ticket.exchangeType);
                  const statusBadge = getExchangeStatusBadge(ticket.status);

                  return (
                    <tr
                      key={ticket.id}
                      onClick={() => onViewDetail(ticket)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onViewDetail(ticket);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`Xem chi tiết phiếu ${ticket.ticketNumber}`}
                      className="transition-colors hover:bg-slate-100/80 cursor-pointer focus:outline-none focus:bg-slate-100"
                    >
                      {/* Mã phiếu đổi */}
                      <td className="p-3 font-mono font-bold text-kv-blue-primary">
                        {ticket.ticketNumber}
                      </td>

                      {/* Hóa đơn gốc */}
                      <td className="p-3 font-mono text-slate-600 font-bold">
                        {ticket.originalInvoiceNumber}
                      </td>

                      {/* Khách hàng */}
                      <td className="p-3 font-bold text-slate-700">
                        {ticket.customerName || "Khách lẻ"}
                      </td>

                      {/* Thời gian lập */}
                      <td className="p-3 text-slate-500 font-medium">
                        {formatExchangeTicketDateTime(ticket.createdAt)}
                      </td>

                      {/* Tiền hàng trả */}
                      <td className="p-3 text-right font-medium text-rose-600">
                        {formatCurrency(ticket.totalReturnAmount)}
                      </td>

                      {/* Tiền hàng đổi */}
                      <td className="p-3 text-right font-medium text-blue-600">
                        {formatCurrency(ticket.totalExchangeAmount)}
                      </td>

                      {/* Chênh lệch */}
                      <td className="p-3 text-right font-bold text-slate-800">
                        {ticket.differenceAmount > 0
                          ? `+${formatCurrency(ticket.differenceAmount)}`
                          : formatCurrency(ticket.differenceAmount)}
                      </td>

                      {/* Hình thức / Loại đổi */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold border ${typeBadge.bg} ${typeBadge.text} ${typeBadge.border}`}
                        >
                          {getExchangeTypeLabel(ticket.exchangeType)}
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {getExchangeStatusLabel(ticket.status)}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td
                        className="p-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPrintTicket(ticket)}
                            title="In phiếu đổi hàng"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="6 9 6 2 18 2 18 9" />
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                              <rect x="14" y="14" width="12" height="8" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <TablePaginationFooter
          currentPage={currentPage}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={onPageChange}
          recordUnit="phiếu đổi"
        />
      )}
    </div>
  );
};
