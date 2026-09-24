import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, UserX } from "lucide-react";
import type { IAccountantInvitation } from "../types/IAccountantInvitation";

interface RevokeAccountantModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: IAccountantInvitation | null;
  onConfirm: (id: string, reason: string) => Promise<void>;
  isLoading: boolean;
}

export const RevokeAccountantModal: React.FC<RevokeAccountantModalProps> = ({
  isOpen,
  onClose,
  invitation,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invitation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do thu hồi quyền");
      return;
    }

    try {
      await onConfirm(invitation.id, reason.trim());
      setReason("");
      setError(null);
      onClose();
    } catch {
      // Error handled by parent toast
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
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-100 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <UserX size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {invitation.status === "PENDING"
                  ? "Thu Hồi Lời Mời Kế Toán"
                  : "Thu Hồi Quyền Truy Cập"}
              </h3>
              <p className="text-[11px] text-rose-600 font-medium">
                {invitation.status === "PENDING"
                  ? "Hủy bỏ lời mời và vô hiệu hóa mã truy cập"
                  : "Cắt phiên làm việc của kế toán ngay lập tức"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 flex items-start gap-2.5">
            <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="text-slate-700 leading-relaxed">
              {invitation.status === "PENDING" ? (
                <>
                  Bạn có chắc chắn muốn thu hồi lời mời kế toán{" "}
                  <strong className="text-slate-900 font-extrabold">
                    {invitation.accountantName}
                  </strong>{" "}
                  ({invitation.phoneNumber})? Lời mời sẽ bị hủy bỏ và vô hiệu hóa ngay tức thì.
                </>
              ) : (
                <>
                  Bạn có chắc chắn muốn thu hồi quyền truy cập của kế toán{" "}
                  <strong className="text-slate-900 font-extrabold">
                    {invitation.accountantName}
                  </strong>{" "}
                  ({invitation.phoneNumber})? Kế toán sẽ bị đăng xuất khỏi dữ liệu của hộ ngay tức thì.
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-100/70 border border-rose-300 text-rose-700 rounded-lg font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Lý do thu hồi quyền <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Ví dụ: Hết hạn hợp đồng dịch vụ / Chuyển giao công việc..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              className="w-full p-3 border border-slate-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-hidden font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold transition-colors"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-md shadow-rose-500/20 flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <span>Xác nhận thu hồi</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
