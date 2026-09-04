import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "@/utils/formatCurrency";
import type { ISupplier } from "../types/ISupplier";

interface SupplierStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  supplier: ISupplier | null;
  isUpdating: boolean;
}

export const SupplierStatusModal: React.FC<SupplierStatusModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  supplier,
  isUpdating,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isUpdating) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isUpdating, onClose]);

  if (!isOpen || !supplier) return null;

  const willBeInactive = supplier.status !== "INACTIVE"; // Currently ACTIVE -> switching to INACTIVE
  const hasDebt = (supplier.currentDebt || 0) > 0;
  const displayCode = `NCC-${(supplier.id || "").slice(0, 6).toUpperCase()}`;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-supplier-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isUpdating) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        className="app-modal-panel flex flex-col w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-b border-slate-200 text-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-1.5 rounded-lg ${
                willBeInactive ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              {willBeInactive ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="10" y1="15" x2="10" y2="9" />
                  <line x1="14" y1="15" x2="14" y2="9" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <h3
              id="status-supplier-modal-title"
              className="text-sm font-bold text-slate-800 tracking-wide"
            >
              {willBeInactive
                ? "Xác nhận ngừng hoạt động nhà cung cấp"
                : "Xác nhận kích hoạt lại nhà cung cấp"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            aria-label="Đóng"
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn chuyển trạng thái nhà cung cấp{" "}
              <strong className="text-slate-900 font-bold">{supplier.name}</strong>{" "}
              ({displayCode}) sang{" "}
              <strong
                className={
                  willBeInactive ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"
                }
              >
                {willBeInactive ? "Ngừng hoạt động" : "Đang hoạt động"}
              </strong>
              ?
            </p>

            {/* Supplier Details Card */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Số điện thoại:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {supplier.phoneNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Dư nợ hiện tại:</span>
                <span
                  className={`font-bold ${
                    hasDebt ? "text-rose-600" : "text-slate-700"
                  }`}
                >
                  {formatCurrency(supplier.currentDebt || 0)}
                </span>
              </div>
            </div>

            {/* Notice */}
            {willBeInactive ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>
                  Khi ngừng hoạt động, nhà cung cấp này sẽ <strong>không thể chọn</strong> khi lập phiếu nhập kho mới. Toàn bộ lịch sử nhập và công nợ vẫn được lưu giữ đầy đủ.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p>
                  Nhà cung cấp sẽ được đưa trở lại danh sách hoạt động và có thể chọn khi lập phiếu nhập kho.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isUpdating}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold text-white shadow-sm active:scale-95 transition-all disabled:opacity-50 ${
              willBeInactive
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isUpdating ? (
              <>
                <svg
                  className="w-3.5 h-3.5 animate-spin text-white"
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
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>{willBeInactive ? "Xác nhận ngừng HĐ" : "Xác nhận kích hoạt"}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
