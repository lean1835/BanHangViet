import React, { useState } from "react";
import { Lock, AlertTriangle, CheckCircle2, X, Loader2 } from "lucide-react";
import type { ITaxDeclarationSummary } from "../types/ITaxDeclaration";
import { formatCurrency } from "@/utils/formatCurrency";

interface ILockPeriodConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: ITaxDeclarationSummary;
  onConfirmLock: (notes?: string) => Promise<void>;
  isLoading: boolean;
}

export const LockPeriodConfirmModal: React.FC<ILockPeriodConfirmModalProps> = ({
  isOpen,
  onClose,
  summary,
  onConfirmLock,
  isLoading,
}) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;
    await onConfirmLock(notes.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-rose-50/80 px-5 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-800">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
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
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Cảnh báo QTN-21 */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] leading-relaxed">
              <span className="font-bold">Lưu ý quan trọng trước khi chốt sổ:</span>
              <p className="text-slate-600">
                Sau khi chốt kỳ, toàn bộ số liệu <strong>{summary.periodLabel}</strong> sẽ bị <strong>khóa vĩnh viễn (Read-only)</strong>. Mọi hóa đơn điều chỉnh giảm hoặc phiếu trả hàng phát sinh sau sẽ tự động chuyển sang kỳ mở tiếp theo.
              </p>
            </div>
          </div>

          {/* Bảng tóm tắt số liệu sẽ bị khóa */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <div className="bg-slate-100/80 px-3.5 py-2 font-bold text-[11px] text-slate-700 uppercase tracking-wide border-b border-slate-200">
              Tóm tắt số liệu sẽ được đóng băng ({summary.periodLabel})
            </div>
            <div className="p-3.5 space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Tổng số hóa đơn phát hành:</span>
                <strong className="text-slate-900 font-bold">
                  {summary.validInvoicesCount} hóa đơn hợp lệ
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Tổng doanh thu chịu thuế:</span>
                <strong className="text-slate-900 font-extrabold text-sm">
                  {formatCurrency(summary.totalRevenue)}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Thuế GTGT mô phỏng:</span>
                <strong className="text-emerald-700 font-bold">
                  {formatCurrency(summary.totalVatAmount)}
                </strong>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Thuế TNCN mô phỏng:</span>
                <strong className="text-indigo-700 font-bold">
                  {formatCurrency(summary.totalPitAmount)}
                </strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-800">
                <span className="font-bold">TỔNG THUẾ PHẢI NỘP:</span>
                <strong className="text-rose-600 font-black text-sm">
                  {formatCurrency(summary.totalPayableTaxAmount)}
                </strong>
              </div>
            </div>
          </div>

          {/* Ghi chú chốt kỳ */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 text-[11px]">
              Ghi chú chốt kỳ (Tùy chọn):
            </label>
            <input
              type="text"
              placeholder="VD: Đã nộp tờ khai qua Cổng Thuế điện tử eTax thành công..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>

          {/* Checkbox cam kết */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 transition cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 cursor-pointer"
            />
            <span className="text-[11px] text-slate-700 font-medium leading-normal">
              Tôi là <strong>Chủ hộ kinh doanh ({summary.representativeName || "Người đại diện"})</strong>, xác nhận đã rà soát tờ khai và đồng ý <strong>khóa toàn bộ số liệu</strong> của kỳ này.
            </span>
          </label>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={!isConfirmed || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Xác nhận chốt & khóa số liệu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
