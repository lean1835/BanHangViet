import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Undo2, X, AlertTriangle } from "lucide-react";
import { PRICE_ADJUSTMENT_MESSAGES } from "@/constants/priceAdjustment";
import type { IPriceAdjustmentBatch } from "../types/IPriceAdjustment";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

interface RevertPriceAdjustmentModalProps {
  batch: IPriceAdjustmentBatch | null;
  isOpen: boolean;
  isReverting: boolean;
  onClose: () => void;
  onConfirm: (batchId: string, revertReason: string) => void;
}

export const RevertPriceAdjustmentModal: React.FC<RevertPriceAdjustmentModalProps> = ({
  batch,
  isOpen,
  isReverting,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useAccessibleDialog({
    isOpen: isOpen && Boolean(batch),
    onClose,
    canClose: !isReverting,
  });

  if (!isOpen || !batch) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(PRICE_ADJUSTMENT_MESSAGES.REVERT_REASON_REQUIRED);
      return;
    }
    setError(null);
    onConfirm(batch.id, reason.trim());
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revert-modal-title"
      onMouseDown={(e) => e.target === e.currentTarget && !isReverting && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-auth-fade-in"
    >
      <div
        ref={dialogRef}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-amber-600">
            <Undo2 className="w-5 h-5" />
            <h3
              id="revert-modal-title"
              className="font-extrabold text-slate-800 text-base"
            >
              Hoàn tác đợt điều chỉnh giá
            </h3>
          </div>
          <button
            type="button"
            disabled={isReverting}
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info card */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Xác nhận khôi phục giá bán cũ</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Bạn đang chuẩn bị hoàn tác đợt:{" "}
            <strong className="text-slate-900 font-extrabold">{batch.name}</strong>{" "}
            (Mã: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">{batch.batchCode}</code>).
            Toàn bộ <strong>{batch.totalItems}</strong> mặt hàng trong đợt này sẽ được khôi phục về giá bán cũ ngay lập tức.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700">
              Nhập lý do hoàn tác (*):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="VD: Nhập nhầm tỷ lệ tăng giá, áp dụng lại đợt mới..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-semibold text-slate-800 focus:border-kv-blue-primary focus:outline-none resize-none shadow-2xs"
              maxLength={500}
            />
            {error && (
              <span className="text-[11px] font-bold text-rose-600">⚠️ {error}</span>
            )}
            <span className="text-[10px] text-slate-400 text-right">
              {reason.length}/500 ký tự
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isReverting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isReverting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isReverting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang hoàn tác...</span>
                </>
              ) : (
                <>
                  <Undo2 className="w-4 h-4" />
                  <span>Xác nhận hoàn tác</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
