import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Clock } from "lucide-react";
import type { IAccountantInvitation } from "../types/IAccountantInvitation";

interface ExtendAccountantModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: IAccountantInvitation | null;
  onConfirm: (id: string, newExpiryDate: string) => Promise<void>;
  isLoading: boolean;
}

export const ExtendAccountantModal: React.FC<ExtendAccountantModalProps> = ({
  isOpen,
  onClose,
  invitation,
  onConfirm,
  isLoading,
}) => {
  const [newExpiryDate, setNewExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  });
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invitation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpiryDate) {
      setError("Vui lòng chọn thời hạn mới");
      return;
    }

    try {
      await onConfirm(invitation.id, newExpiryDate);
      setError(null);
      onClose();
    } catch {
      // Error handled by parent toast
    }
  };

  const handleQuickAdd = (months: number) => {
    const d = new Date(invitation.expiryDate || new Date());
    d.setMonth(d.getMonth() + months);
    setNewExpiryDate(d.toISOString().split("T")[0]);
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-kv-blue-primary">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Gia Hạn Quyền Truy Cập
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Gia hạn thời gian làm việc cho kế toán
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
            <div className="text-slate-600">Kế toán viên:</div>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {invitation.accountantName} ({invitation.phoneNumber})
            </div>
            <div className="text-slate-500 text-[11px] mt-1">
              Hạn hiện tại:{" "}
              <span className="font-semibold text-slate-700">
                {invitation.expiryDate}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Chọn nhanh thời gian gia hạn
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickAdd(3)}
                className="flex-1 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-slate-700 hover:border-kv-blue-primary transition-all"
              >
                +3 tháng
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(6)}
                className="flex-1 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-slate-700 hover:border-kv-blue-primary transition-all"
              >
                +6 tháng
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(12)}
                className="flex-1 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold text-slate-700 hover:border-kv-blue-primary transition-all"
              >
                +1 năm
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Ngày hết hạn mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={newExpiryDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setNewExpiryDate(e.target.value);
                  if (error) setError(null);
                }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-hidden font-medium"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <span>Xác nhận gia hạn</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
