import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { formatCurrency, formatNumber } from "@/utils/formatCurrency";
import { USER_ROLES } from "@/constants/roles";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import {
  getReturnTicketStatusBadge,
  getRefundPaymentMethodLabel,
  formatReturnTicketDateTime,
} from "../utils/returnTicketHelpers";
import {
  useApproveReturnTicketMutation,
  useCreateDecreaseAdjustmentInvoiceMutation,
} from "../services/returnTicketApi";
import { ReturnTicketRejectModal } from "./ReturnTicketRejectModal";
import { ReturnTicketPrintModal } from "./ReturnTicketPrintModal";
import type { IReturnTicket } from "../types/IReturnTicket";

interface ReturnTicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: IReturnTicket;
  currentRole: string;
  onRefresh?: () => void;
}

export const ReturnTicketDetailModal: React.FC<ReturnTicketDetailModalProps> = ({
  isOpen,
  onClose,
  ticket,
  currentRole,
  onRefresh,
}) => {
  const { showSuccess, showError } = useNotification();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const [approveTicket, { isLoading: isApproving }] = useApproveReturnTicketMutation();
  const [createAdjInvoice, { isLoading: isCreatingAdj }] = useCreateDecreaseAdjustmentInvoiceMutation();

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const isOwner = currentRole === USER_ROLES.OWNER;
  const isAccountant = currentRole === USER_ROLES.ACCOUNTANT;
  const canApproveOrReject = isOwner && ticket.status === "PENDING";
  const canCreateAdjustmentInvoice =
    (isOwner || isAccountant) && ticket.status === "APPROVED";

  const handleApprove = async () => {
    try {
      await approveTicket(ticket.id).unwrap();
      showSuccess(`Đã duyệt phiếu trả hàng ${ticket.ticketNumber} thành công! Tồn kho đã được hoàn.`);
      onRefresh?.();
      onClose();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể duyệt phiếu trả hàng"));
    }
  };

  const handleCreateAdjustmentInvoice = async () => {
    try {
      await createAdjInvoice(ticket.id).unwrap();
      showSuccess(`Đã lập hóa đơn điều chỉnh giảm từ phiếu trả hàng ${ticket.ticketNumber} thành công!`);
      onRefresh?.();
      onClose();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể lập hóa đơn điều chỉnh giảm"));
    }
  };

  const statusBadge = getReturnTicketStatusBadge(ticket.status);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-backdrop-fade-in"
        onClick={onClose}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ticket-detail-title"
          className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-modal-smooth-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-kv-blue-primary/10 text-kv-blue-primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 10h18" />
                  <path d="M7 15h2" />
                  <path d="M15 15h2" />
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="ticket-detail-title" className="text-base font-black text-slate-800 uppercase tracking-tight font-mono">
                    {ticket.ticketNumber}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {statusBadge.label}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  Lập lúc {formatReturnTicketDateTime(ticket.createdAt)} bởi{" "}
                  <strong className="text-slate-700">{ticket.createdByUserName || "Nhân viên"}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                In phiếu
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {/* Status Feedback Notice if Rejected */}
            {ticket.status === "REJECTED" && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-800 text-xs shadow-sm">
                <div className="flex items-center gap-2 font-extrabold uppercase text-[11px] mb-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  Phiếu đã bị từ chối duyệt
                </div>
                <p className="font-semibold">
                  Lý do từ chối: <span className="font-normal italic">"{ticket.rejectReason || "Không nêu rõ"}"</span>
                </p>
                {ticket.rejectedAt && (
                  <span className="text-[10px] text-rose-600 block mt-1">
                    Thời gian: {formatReturnTicketDateTime(ticket.rejectedAt)}
                  </span>
                )}
              </div>
            )}

            {/* Status Feedback Notice if Approved */}
            {ticket.status === "APPROVED" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 text-xs shadow-sm">
                <div className="flex items-center gap-2 font-extrabold uppercase text-[11px] mb-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Phiếu đã được duyệt và hoàn tồn kho
                </div>
                <p className="font-medium text-[11px]">
                  Duyệt bởi: <strong className="font-bold">{ticket.approvedByUserName || "Chủ hộ"}</strong> lúc{" "}
                  {formatReturnTicketDateTime(ticket.approvedAt)}
                </p>
              </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Hóa đơn gốc (Mã tra cứu):</span>
                <strong className="font-mono text-kv-blue-primary font-bold">
                  {ticket.originalInvoiceLookupCode || ticket.originalInvoiceNumber || "N/A"}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Khách hàng:</span>
                <strong className="text-slate-800">{ticket.customerName || "Khách lẻ"}</strong>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Hình thức hoàn tiền:</span>
                <strong className="text-slate-700">{getRefundPaymentMethodLabel(ticket.refundPaymentMethod)}</strong>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block">Tổng tiền hoàn trả:</span>
                <strong className="text-base font-black text-rose-600">
                  {formatCurrency(ticket.totalReturnAmount)}
                </strong>
              </div>
            </div>

            {/* Items Table */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Danh sách hàng hóa trả lại ({ticket.items?.length || 0} mặt hàng)
              </h3>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                      <th className="p-3">#</th>
                      <th className="p-3">Tên sản phẩm</th>
                      <th className="p-3 text-center">ĐVT</th>
                      <th className="p-3 text-right">Số lượng trả</th>
                      <th className="p-3 text-right">Đơn giá hoàn</th>
                      <th className="p-3 text-right">Thuế GTGT</th>
                      <th className="p-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {ticket.items?.map((it, idx) => (
                      <tr key={it.id || idx} className="hover:bg-slate-50/80">
                        <td className="p-3 text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-800">{it.productName}</td>
                        <td className="p-3 text-center text-slate-500">{it.unit || "Cái"}</td>
                        <td className="p-3 text-right font-bold text-kv-blue-primary">
                          {formatNumber(it.quantity)}
                        </td>
                        <td className="p-3 text-right text-slate-600 font-medium">
                          {formatCurrency(it.unitPrice)}
                        </td>
                        <td className="p-3 text-right text-slate-500 font-medium">
                          {it.taxRatePercentage ? `${it.taxRatePercentage}%` : "0%"}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Status / History Details */}
            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Lý do trả hàng:</span>
                <span className="font-medium text-slate-800 italic">{ticket.reason || "Không có lý do cụ thể"}</span>
              </div>
              {ticket.status === "APPROVED" && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                  <span className="text-emerald-700 font-bold">Người duyệt phiếu:</span>
                  <span className="font-bold text-emerald-800">
                    {ticket.approvedByUserName || "Chủ hộ"} ({formatReturnTicketDateTime(ticket.approvedAt)})
                  </span>
                </div>
              )}
              {ticket.status === "REJECTED" && (
                <div className="flex flex-col gap-1 border-t border-slate-200 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-rose-700 font-bold">Lý do từ chối:</span>
                    <span className="text-slate-500 text-[11px]">{formatReturnTicketDateTime(ticket.rejectedAt)}</span>
                  </div>
                  <p className="text-rose-800 font-medium bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                    {ticket.rejectReason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
            {ticket.status === "APPROVED" ? (
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                In phiếu
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2.5">
              {canApproveOrReject && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                  >
                    Từ chối phiếu
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isApproving ? "Đang duyệt..." : "DUYỆT PHIẾU & HOÀN TỒN KHO"}
                  </button>
                </>
              )}

              {canCreateAdjustmentInvoice && (
                <button
                  type="button"
                  onClick={handleCreateAdjustmentInvoice}
                  disabled={isCreatingAdj}
                  className="flex items-center gap-2 rounded-xl bg-kv-blue-primary px-5 py-2.5 text-xs font-extrabold text-white hover:bg-kv-blue-dark transition-colors shadow-sm disabled:opacity-50"
                >
                  {isCreatingAdj ? "Đang xử lý..." : "LẬP HÓA ĐƠN ĐIỀU CHỈNH GIẢM"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      <ReturnTicketRejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        ticketId={ticket.id}
        ticketNumber={ticket.ticketNumber}
        onSuccess={() => {
          onRefresh?.();
          onClose();
        }}
      />

      {/* Print Modal */}
      <ReturnTicketPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        ticket={ticket}
      />
    </>,
    document.body
  );
};
