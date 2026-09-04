import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, Loader2, X } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { IPointOfSale } from "../types/IPointOfSale";

interface DeletePointOfSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  pointOfSale?: IPointOfSale | null;
  isLoading?: boolean;
}

export const DeletePointOfSaleModal: React.FC<DeletePointOfSaleModalProps> = ({
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

  const isDefault = Boolean(pointOfSale.isDefault);

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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5 text-rose-600">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Xác nhận xóa điểm bán
              </h2>
              <p className="text-xs text-slate-500">Thao tác không thể hoàn tác</p>
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

        {/* Content */}
        <div className="p-6 space-y-3">
          {isDefault ? (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Không thể xóa điểm bán mặc định
              </p>
              <p>
                Điểm bán <strong>{pointOfSale.name}</strong> hiện đang là điểm bán mặc định của hộ kinh doanh. Bạn phải thiết lập một điểm bán khác làm mặc định trước khi xóa.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bạn có chắc chắn muốn xóa điểm bán{" "}
                <strong className="text-slate-900">{pointOfSale.name}</strong> (Mã: {pointOfSale.posCode}) tại địa chỉ <em>{pointOfSale.address}</em>?
              </p>
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-100">
                Lưu ý: Dữ liệu lịch sử giao dịch và hóa đơn cũ thuộc điểm này vẫn được bảo lưu để phục vụ báo cáo kiểm toán và kê khai thuế.
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
          >
            {isDefault ? "Đã hiểu" : "Hủy bỏ"}
          </button>
          {!isDefault && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-sm shadow-rose-500/20 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Xóa điểm bán
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
