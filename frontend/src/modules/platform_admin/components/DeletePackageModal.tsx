import React from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X, Trash2 } from "lucide-react";
import type { IServicePackageItem } from "../types/platformAdminTypes";

interface DeletePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pkg: IServicePackageItem | null;
  onConfirm: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const DeletePackageModal: React.FC<DeletePackageModalProps> = ({
  isOpen,
  onClose,
  pkg,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen || !pkg) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm(pkg.id);
      onClose();
    } catch {
      // Handled by parent
    }
  };

  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Xác nhận xóa gói dịch vụ</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Mã gói: <span className="font-bold text-slate-800">{pkg.code}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3 text-xs text-slate-700">
          <p>
            Bạn có chắc chắn muốn xóa gói dịch vụ{" "}
            <strong className="text-slate-900 font-bold">{pkg.name}</strong> không?
          </p>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
            <strong>Cơ chế bảo vệ dữ liệu:</strong>
            <p className="mt-1">
              Nếu gói này đã từng được gán cho bất kỳ Hộ kinh doanh nào, hệ thống sẽ{" "}
              <strong>tự động chuyển sang trạng thái Tạm ngưng (Ngưng phát hành)</strong> để
              bảo đảm tính toàn vẹn dữ liệu hợp đồng và hạn mức, thay vì xóa vĩnh viễn.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
