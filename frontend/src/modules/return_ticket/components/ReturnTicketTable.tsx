import React from "react";
import { formatCurrency } from "@/utils/formatCurrency";
import { USER_ROLES } from "@/constants/roles";
import { TablePaginationFooter } from "@/components/common/TablePaginationFooter";
import {
  getReturnTicketStatusBadge,
  getRefundPaymentMethodLabel,
  formatReturnTicketDateTime,
} from "../utils/returnTicketHelpers";
import type { IReturnTicket } from "../types/IReturnTicket";

export interface IReturnTicketTableProps {
  tickets: IReturnTicket[];
  isLoading: boolean;
  isError: boolean;
  currentRole: string;
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSelectTicket: (ticket: IReturnTicket) => void;
  onApproveTicket?: (ticketId: string) => void;
  onRejectTicket?: (ticket: IReturnTicket) => void;
  onPrintTicket?: (ticket: IReturnTicket) => void;
  onOpenCreate?: () => void;
}

export const ReturnTicketTable: React.FC<IReturnTicketTableProps> = ({
  tickets,
  isLoading,
  isError,
  currentRole,
  currentPage,
  totalPages,
  totalElements,
  pageSize: _pageSize,
  onPageChange,
  onSelectTicket,
  onApproveTicket,
  onRejectTicket,
  onPrintTicket,
  onOpenCreate: _onOpenCreate,
}) => {
  const isOwner = currentRole === USER_ROLES.OWNER;

  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center flex-1 w-full min-h-[400px]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-kv-blue-primary" />
        <span className="text-slate-500 font-bold text-xs mt-3">Đang tải danh sách phiếu trả hàng...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center flex-1 w-full min-h-[400px]">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center text-rose-700 max-w-md">
          <h4 className="font-extrabold text-sm mb-1">Không thể tải danh sách phiếu trả hàng</h4>
          <p className="text-xs font-semibold">Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-1 w-full justify-between">
      <div>
        {/* Title */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <h3 className="font-extrabold text-slate-800 text-sm">
            Danh sách phiếu trả hàng
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {totalElements} phiếu trả
          </span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
        <table className="responsive-data-table responsive-data-table--page w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs">
              <th className="p-3">Mã phiếu trả</th>
              <th className="p-3">Hóa đơn gốc</th>
              <th className="p-3">Khách hàng</th>
              <th className="p-3">Thời gian lập</th>
              <th className="p-3 text-right">Tổng tiền hoàn</th>
              <th className="p-3 text-center">Hình thức</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3">Người lập</th>
              <th className="p-3 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-xs font-medium">Không tìm thấy phiếu trả hàng nào khớp với bộ lọc.</p>
                  </div>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const statusBadge = getReturnTicketStatusBadge(ticket.status);
                const isPending = ticket.status === "PENDING";

                return (
                  <tr
                    key={ticket.id}
                    onClick={() => onSelectTicket(ticket)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectTicket(ticket);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Xem chi tiết phiếu ${ticket.ticketNumber}`}
                    className="transition-colors hover:bg-slate-100/80 cursor-pointer focus:outline-none focus:bg-slate-100"
                  >
                    <td className="p-3 font-mono font-bold text-kv-blue-primary">
                      {ticket.ticketNumber}
                    </td>
                    <td className="p-3 font-mono text-slate-600 font-bold">
                      {ticket.originalInvoiceLookupCode || ticket.originalInvoiceNumber || ticket.originalInvoiceId}
                    </td>
                    <td className="p-3 font-bold text-slate-700">
                      {ticket.customerName || "Khách lẻ"}
                    </td>
                    <td className="p-3 text-slate-500 font-medium">
                      {formatReturnTicketDateTime(ticket.createdAt)}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-600">
                      {formatCurrency(ticket.totalReturnAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {getRefundPaymentMethodLabel(ticket.refundPaymentMethod)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-medium text-[11px]">
                      {ticket.createdByUserName || "Nhân viên"}
                    </td>
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Quick Owner Approval */}
                        {isOwner && isPending && onApproveTicket && (
                          <button
                            type="button"
                            onClick={() => onApproveTicket(ticket.id)}
                            title="Duyệt nhanh phiếu & hoàn tồn kho"
                            className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                          >
                            Duyệt
                          </button>
                        )}
                        {isOwner && isPending && onRejectTicket && (
                          <button
                            type="button"
                            onClick={() => onRejectTicket(ticket)}
                            title="Từ chối phiếu"
                            className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors"
                          >
                            Từ chối
                          </button>
                        )}
                        {/* Print Action - Only for APPROVED */}
                        {ticket.status === "APPROVED" && onPrintTicket && (
                          <button
                            type="button"
                            onClick={() => onPrintTicket(ticket)}
                            title="In phiếu trả hàng"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 6 2 18 2 18 9" />
                              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                              <rect x="6" y="14" width="12" height="8" />
                            </svg>
                          </button>
                        )}
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
          pageSize={_pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
          onPageChange={onPageChange}
          recordUnit="phiếu trả"
        />
      )}
    </div>
  );
};
