import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { formatCurrency } from "@/utils/formatCurrency";
import type { ISupplier } from "../types/ISupplier";

interface SupplierDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: ISupplier | null;
  onEdit: (supplier: ISupplier) => void;
  onToggleStatus: (supplier: ISupplier) => void;
  canManage: boolean;
}

export const SupplierDetailModal: React.FC<SupplierDetailModalProps> = ({
  isOpen,
  onClose,
  supplier,
  onEdit,
  onToggleStatus,
  canManage,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !supplier) return null;

  const isActive = supplier.status !== "INACTIVE";
  const hasDebt = (supplier.currentDebt || 0) > 0;
  const displayCode = `NCC-${(supplier.id || "").slice(0, 6).toUpperCase()}`;

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-detail-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        className="app-modal-panel flex flex-col w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-100 border-b border-slate-200 text-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-100 text-kv-blue-primary">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <h3
                id="supplier-detail-title"
                className="text-sm font-bold text-slate-800 tracking-wide"
              >
                Chi tiết nhà cung cấp
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {displayCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Supplier Name & Status Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-slate-900 leading-tight">
                {supplier.name}
              </h4>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Mã định danh (ID): {supplier.id}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-200/80 text-slate-600 border border-slate-300"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              {isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
            </span>
          </div>

          {/* Current Debt Highlight Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              hasDebt
                ? "bg-rose-50/70 border-rose-200"
                : "bg-emerald-50/60 border-emerald-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  hasDebt
                    ? "bg-rose-500/10 text-rose-600"
                    : "bg-emerald-500/10 text-emerald-600"
                }`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <div>
                <span className="text-xs text-slate-600 font-semibold block">
                  Dư nợ phải trả hiện tại
                </span>
                <span
                  className={`text-lg font-extrabold ${
                    hasDebt ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {formatCurrency(supplier.currentDebt || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Phone */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-slate-400 font-medium block mb-0.5">
                Số điện thoại
              </span>
              <span className="font-bold text-slate-800 font-mono text-sm">
                {supplier.phoneNumber || "—"}
              </span>
            </div>

            {/* Email */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-slate-400 font-medium block mb-0.5">
                Email
              </span>
              <span className="font-semibold text-slate-800 break-all">
                {supplier.email || "—"}
              </span>
            </div>

            {/* Tax Code */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-slate-400 font-medium block mb-0.5">
                Mã số thuế
              </span>
              <span className="font-mono font-bold text-slate-800">
                {supplier.taxCode || "—"}
              </span>
            </div>

            {/* Address */}
            <div className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <span className="text-slate-400 font-medium block mb-0.5">
                Địa chỉ
              </span>
              <span className="font-medium text-slate-800">
                {supplier.address || "—"}
              </span>
            </div>
          </div>

          {/* Note Section */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 text-slate-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Ghi chú / Mặt hàng thường lấy:</span>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {supplier.note ? (
                supplier.note
              ) : (
                <span className="text-slate-400 italic">Chưa có ghi chú về mặt hàng</span>
              )}
            </p>
          </div>

          {/* Timestamps */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Ngày tạo: {formatDateTime(supplier.createdAt)}</span>
            <span>Cập nhật: {formatDateTime(supplier.updatedAt)}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80">
          <div>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleStatus(supplier);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  isActive
                    ? "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100"
                    : "border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                }`}
              >
                {isActive ? (
                  <>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="10" y1="15" x2="10" y2="9" />
                      <line x1="14" y1="15" x2="14" y2="9" />
                    </svg>
                    <span>Ngừng hoạt động</span>
                  </>
                ) : (
                  <>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Kích hoạt lại</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Đóng
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(supplier);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark active:scale-95 text-xs font-bold text-white shadow-sm transition-all"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
