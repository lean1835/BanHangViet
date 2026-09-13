import React, { useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, X } from "lucide-react";
import { useRejectCashExpenseMutation } from "../services/cashTransactionApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { useNotification } from "@/hooks/useNotification";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { formatCurrency } from "@/utils/formatCurrency";

interface RejectExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
  transactionCode?: string;
  amount?: number;
  onSuccess?: () => void;
}

export const RejectExpenseModal: React.FC<RejectExpenseModalProps> = ({
  isOpen,
  onClose,
  transactionId,
  transactionCode,
  amount,
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const [reason, setReason] = useState("");
  const [rejectExpense, { isLoading }] = useRejectCashExpenseMutation();

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isLoading,
  });

  if (!isOpen || !transactionId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showError("Vui lòng nhập lý do từ chối phiếu chi");
      return;
    }

    try {
      await rejectExpense({
        id: transactionId,
        body: { reason: reason.trim() },
      }).unwrap();
      showSuccess(`Đã từ chối phiếu chi ${transactionCode || ""}`);
      setReason("");
      onSuccess?.();
      onClose();
    } catch (err: unknown) {
      showError(getApiErrorMessage(err, "Không thể từ chối phiếu chi"));
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-modal-title"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col animate-scale-up"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
            <AlertCircle className="w-5 h-5" />
            <h3 id="reject-modal-title">Từ chối duyệt phiếu chi</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <p className="text-slate-600 font-medium">
            Bạn đang từ chối phiếu chi{" "}
            <b className="text-slate-900 font-bold">{transactionCode}</b> với số tiền{" "}
            <b className="text-rose-600 font-extrabold">{amount ? formatCurrency(amount) : ""}</b>.
          </p>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5">
              Lý do từ chối <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do không đồng ý chi (bắt buộc)..."
              disabled={isLoading}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500 resize-none text-xs"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !reason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md shadow-rose-600/20 disabled:opacity-50"
            >
              {isLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
