import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "@/utils/formatCurrency";
import type { ISupplier } from "../types/ISupplier";

interface SupplierDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  supplier: ISupplier | null;
  isDeleting: boolean;
}

export const SupplierDeleteModal: React.FC<SupplierDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  supplier,
  isDeleting,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !supplier) return null;

  const hasDebt = (supplier.currentDebt || 0) > 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-supplier-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        className="app-modal-panel flex flex-col w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <h3
            id="delete-supplier-modal-title"
            className="text-lg font-bold text-slate-800"
          >
            Xác nhận xóa nhà cung cấp?
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Bạn có chắc chắn muốn xóa hồ sơ nhà cung cấp{" "}
            <strong className="text-slate-900 font-bold">
              {supplier.name}
            </strong>{" "}
            ({supplier.phoneNumber})?
          </p>

          {hasDebt && (
            <div className="mt-3.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
              <div className="flex items-start gap-2.5">
                <svg
                  className="w-5 h-5 text-amber-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="text-xs text-amber-800 font-medium">
                  <p className="font-bold">Cảnh báo công nợ:</p>
                  <p>
                    Nhà cung cấp này đang có dư nợ{" "}
                    <span className="font-bold text-rose-600">
                      {formatCurrency(supplier.currentDebt)}
                    </span>
                    . Hệ thống sẽ không cho phép xóa khi còn dư nợ.
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-400">
            Lưu ý: Không thể xóa nhà cung cấp đã từng phát sinh phiếu nhập hàng
            hoặc đang còn công nợ.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-sm font-bold text-white shadow-md shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xác nhận xóa</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
