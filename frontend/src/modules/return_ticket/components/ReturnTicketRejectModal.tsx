import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useRejectReturnTicketMutation } from "../services/returnTicketApi";

interface ReturnTicketRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumber: string;
  onSuccess?: () => void;
}

export const ReturnTicketRejectModal: React.FC<ReturnTicketRejectModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketNumber,
  onSuccess,
}) => {
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();

  const [rejectTicket, { isLoading }] = useRejectReturnTicketMutation();

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setError("Vui lòng nhập lý do từ chối phiếu trả hàng");
      return;
    }
    if (trimmed.length > 500) {
      setError("Lý do từ chối không được vượt quá 500 ký tự");
      return;
    }

    try {
      await rejectTicket({
        ticketId,
        body: { rejectReason: trimmed },
      }).unwrap();

      showSuccess(`Đã từ chối phiếu trả hàng ${ticketNumber}`);
      setRejectReason("");
      setError(null);
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể từ chối phiếu trả hàng"));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-backdrop-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-ticket-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl overflow-hidden animate-modal-smooth-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <h2 id="reject-ticket-title" className="text-sm font-extrabold text-slate-800 uppercase tracking-tight">
                Từ chối phiếu trả hàng
              </h2>
              <p className="text-[11px] font-semibold text-slate-500 font-mono">
                Số phiếu: {ticketNumber}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
              Lý do từ chối <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nhập lý do chi tiết từ chối phiếu trả hàng (ví dụ: Hàng không còn nguyên tem mác, hết thời hạn trả hàng, phiếu sai thông tin...)"
              className="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-800 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/10 placeholder:text-slate-400"
            />
            <div className="flex items-center justify-between text-[10px] font-semibold">
              {error ? (
                <span className="text-rose-600 font-bold">{error}</span>
              ) : (
                <span className="text-slate-400">Bắt buộc nhập lý do</span>
              )}
              <span className="text-slate-400">{rejectReason.length}/500</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-rose-600/30 hover:bg-rose-700 transition-all disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận từ chối"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
