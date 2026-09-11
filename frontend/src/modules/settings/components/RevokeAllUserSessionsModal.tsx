import React, { useState } from "react";
import { LogOut, X, Loader2, AlertOctagon } from "lucide-react";

interface RevokeAllUserSessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => Promise<void>;
  targetName?: string;
  isAllOther?: boolean;
  isLoading?: boolean;
}

export const RevokeAllUserSessionsModal: React.FC<RevokeAllUserSessionsModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetName,
  isAllOther = false,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(reason.trim() || undefined);
    setReason("");
  };

  const title = isAllOther
    ? "Đăng xuất khỏi tất cả các thiết bị khác"
    : `Đăng xuất toàn bộ phiên của ${targetName || "nhân viên"}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoke-all-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-modal-backdrop"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-scale">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-rose-50/70">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
            </div>
            <h2 id="revoke-all-modal-title" className="text-base font-bold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-800 leading-relaxed font-medium">
            {isAllOther ? (
              <span>
                Bạn sẽ bị đăng xuất khỏi tất cả các trình duyệt và thiết bị khác. Phiên làm việc trên thiết bị hiện tại này vẫn sẽ được duy trì.
              </span>
            ) : (
              <span>
                Toàn bộ phiên làm việc của tài khoản <strong>{targetName}</strong> trên mọi thiết bị sẽ bị chấm dứt ngay lập tức.
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Lý do đăng xuất (tùy chọn):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thu hồi các phiên..."
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-sm shadow-rose-600/30 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Xác nhận đăng xuất tất cả</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
