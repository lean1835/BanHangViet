import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { PROMOTION_MESSAGES } from "@/constants/promotion";
import type { IPromotion } from "../types/IPromotion";

interface PromotionDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  promo: IPromotion | null;
  isLoading?: boolean;
}

export const PromotionDeleteModal: React.FC<PromotionDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  promo,
  isLoading = false,
}) => {
  const dialogRef = useAccessibleDialog<HTMLDivElement>({
    isOpen,
    onClose,
  });

  if (!isOpen || !promo) return null;

  return createPortal(
    <div
      onClick={() => {
        if (!isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promotion-delete-modal-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-modal-bounce"
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
            <AlertTriangle size={28} />
          </div>

          <h3
            id="promotion-delete-modal-title"
            className="text-base font-bold text-slate-800 mb-2"
          >
            {PROMOTION_MESSAGES.DELETE_CONFIRM_TITLE}
          </h3>

          <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">
            Bạn có chắc chắn muốn xóa chương trình khuyến mại{" "}
            <span className="font-bold text-slate-800">"{promo.name}"</span>?
            Thao tác này sẽ ngừng áp dụng mức giảm giá cho các hóa đơn bán hàng tiếp theo.
          </p>

          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Xác nhận xóa
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
