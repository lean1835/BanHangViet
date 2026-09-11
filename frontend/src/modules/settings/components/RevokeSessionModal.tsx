import React, { useState } from "react";
import { LogOut, X, Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import type { IUserSession } from "../types/IUserSession";
import { DeviceBadge } from "./DeviceBadge";

interface RevokeSessionModalProps {
  session: IUserSession | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sessionId: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
}

const QUICK_REASONS = [
  "Thiết bị lạ nghi ngờ",
  "Nhân viên đã hết ca làm",
  "Đổi máy bán hàng khác",
  "Bảo mật tài khoản định kỳ",
];

export const RevokeSessionModal: React.FC<RevokeSessionModalProps> = ({
  session,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");

  if (!isOpen || !session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(session.id, reason.trim() || undefined);
    setReason("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="revoke-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-modal-backdrop"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-scale">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-rose-50/50">
          <div className="flex items-center gap-2.5 text-rose-700">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <h2 id="revoke-modal-title" className="text-base font-bold">
              Đăng xuất phiên làm việc từ xa
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Target Info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Tài khoản:</span>
              <span className="font-bold text-slate-800">
                {session.fullName} (@{session.username})
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Thiết bị:</span>
              <DeviceBadge deviceType={session.deviceType} deviceName={session.deviceName} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Địa chỉ IP:</span>
              <span className="font-mono text-slate-700 font-semibold">{session.ipAddress}</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Khi đăng xuất, thiết bị này sẽ bị ngắt kết nối ngay lập tức ở lần thao tác tiếp theo. Người dùng sẽ phải đăng nhập lại để tiếp tục làm việc.
            </span>
          </div>

          {/* Quick Reason Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Lý do đăng xuất (tùy chọn):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors cursor-pointer ${
                    reason === r
                      ? "bg-kv-blue-light border-kv-blue-primary text-kv-blue-primary font-semibold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do chi tiết nếu có..."
              disabled={isLoading}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          {/* Footer Actions */}
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
                  <span>Đăng xuất phiên này</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
