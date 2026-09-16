import React from "react";
import { createPortal } from "react-dom";
import { X, Unlock, CheckCircle2 } from "lucide-react";
import type { IHouseholdAdminItem } from "../types/platformAdminTypes";

interface UnlockHouseholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  household: IHouseholdAdminItem | null;
  onConfirm: (id: string) => Promise<void>;
  isLoading: boolean;
}

export const UnlockHouseholdModal: React.FC<UnlockHouseholdModalProps> = ({
  isOpen,
  onClose,
  household,
  onConfirm,
  isLoading,
}) => {
  if (!isOpen || !household) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm(household.id);
      onClose();
    } catch {
      // Handled by parent toast
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
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-emerald-200 overflow-hidden flex flex-col mx-4 animate-fade-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-emerald-100 bg-emerald-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 shadow-xs flex items-center justify-center">
              <Unlock size={22} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base leading-snug">
                Mở Khóa Tài Khoản Hộ
              </h3>
              <p className="text-xs text-emerald-600 font-medium">
                Khôi phục hoạt động kinh doanh cho hộ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="font-bold text-slate-900 text-base">
                {household.name}
              </div>
              <span className="font-mono text-slate-700 text-xs font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                MST: {household.taxCode}
              </span>
            </div>
            {household.lockReason && (
              <div className="text-rose-700 text-xs mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100 leading-relaxed">
                <span className="font-bold">Lý do đã khóa:</span>{" "}
                {household.lockReason}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-slate-700">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-xs">
              Khi mở khóa, hệ thống sẽ khôi phục lại đúng phân quyền cũ của từng người dùng trong hộ. Chủ hộ và nhân viên có thể đăng nhập bình thường.
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-10 px-5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors cursor-pointer inline-flex items-center justify-center text-xs"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-500/20 inline-flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Đang mở khóa...</span>
                </>
              ) : (
                <span>Xác nhận mở khóa</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
