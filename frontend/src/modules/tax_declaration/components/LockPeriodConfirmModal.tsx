import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Lock, AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react";
import type { ITaxDeclarationPeriodResponse } from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";

interface ILockPeriodConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  period?: ITaxDeclarationPeriodResponse;
  onConfirmLock: (notes?: string) => Promise<void>;
  isLoading: boolean;
}

export const LockPeriodConfirmModal: React.FC<ILockPeriodConfirmModalProps> = ({
  isOpen,
  onClose,
  period,
  onConfirmLock,
  isLoading,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [notes, setNotes] = useState("");

  if (!isOpen || !period) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;
    await onConfirmLock(notes.trim() || undefined);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-modal-backdrop">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-modal-scale">
        {/* Header */}
        <div className="bg-rose-50/80 px-5 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-800">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5 shrink-0 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-800">
                Khóa số liệu & Chốt kỳ kê khai thuế
              </h2>
              <p className="text-[11px] text-rose-600 font-medium">
                Áp dụng quy tắc toàn vẹn dữ liệu thuế QTN-21
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Cảnh báo QTN-21 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 stroke-[2.2]" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <span className="font-bold">Lưu ý quan trọng trước khi chốt sổ:</span>
              <p className="text-slate-600">
                Sau khi chốt kỳ, toàn bộ số liệu <strong>{period.periodName}</strong> sẽ bị <strong>khóa vĩnh viễn (Read-only)</strong>. Mọi hóa đơn điều chỉnh giảm hoặc phiếu trả hàng phát sinh sau sẽ tự động chuyển sang kỳ mở tiếp theo.
              </p>
            </div>
          </div>

          {/* Bảng tóm tắt số liệu sẽ bị khóa */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <div className="bg-slate-100/80 px-3.5 py-2 font-bold text-[11px] text-slate-700 uppercase tracking-wide border-b border-slate-200">
              Tóm tắt số liệu sẽ được đóng băng ({period.periodName})
            </div>
            <div className="p-3.5 space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Tổng số hóa đơn phát hành:</span>
                <strong className="text-slate-900 font-bold">
                  {period.totalValidInvoices} hóa đơn hợp lệ
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Tổng doanh thu chịu thuế:</span>
                <strong className="text-slate-900 font-extrabold text-sm">
                  {formatCurrency(period.totalRevenue)}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Tổng nghĩa vụ thuế phải nộp:</span>
                <strong className="text-rose-700 font-black text-sm">
                  {formatCurrency(period.totalTaxAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Ghi chú chốt kỳ (Tùy chọn):
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhập ghi chú hoặc mã biên nhận nộp thuế..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 focus:bg-white resize-none h-16 transition-all"
            />
          </div>

          {/* Checkbox xác nhận */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 active:scale-98 cursor-pointer transition-all duration-150">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-[11px] text-slate-700 font-medium leading-relaxed">
              Tôi là <strong>Chủ hộ kinh doanh (VT-01)</strong>, đã kiểm tra đầy đủ số liệu và xác nhận chốt khóa số liệu kỳ <strong>{period.periodName}</strong>.
            </span>
          </label>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 active:scale-95 text-white font-extrabold text-xs transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0 stroke-[2.5]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
              )}
              <span>Xác nhận Chốt sổ</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
