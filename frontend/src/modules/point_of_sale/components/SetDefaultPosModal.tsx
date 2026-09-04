import React from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Star, Loader2, X } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { IPointOfSale } from "../types/IPointOfSale";

interface SetDefaultPosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  pointOfSale?: IPointOfSale | null;
  isLoading?: boolean;
}

export const SetDefaultPosModal: React.FC<SetDefaultPosModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  pointOfSale,
  isLoading = false,
}) => {
  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isLoading,
  });

  if (!isOpen || !pointOfSale) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/55 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2.5 text-amber-600">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 text-amber-600">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Đặt làm điểm bán mặc định
              </h2>
              <p className="text-xs text-slate-500">Ưu tiên phục vụ bán hàng & giao dịch</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-600 leading-relaxed">
            Bạn có muốn đặt điểm bán{" "}
            <strong className="text-slate-900">{pointOfSale.name}</strong> ({pointOfSale.posCode}) làm điểm bán mặc định của hộ kinh doanh?
          </p>
          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-800">
            Điểm bán mặc định sẽ tự động áp dụng khi nhân viên mở ca bán hàng không chỉ định quầy, và là chi nhánh chính xuất hiện trong mẫu hóa đơn.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-sm shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Xác nhận đặt mặc định
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
