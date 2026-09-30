import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mail, X, Loader2, Save, ShieldCheck } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { useAppDispatch } from "@/hooks/useRedux";
import { updateUser } from "@/stores/authSlice";
import { useUpdateEmailMutation } from "../services/profileApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface UpdateEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail?: string | null;
}

export const UpdateEmailModal: React.FC<UpdateEmailModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
}) => {
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useNotification();
  const [updateEmail, { isLoading: isSaving }] = useUpdateEmailMutation();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSaving,
  });

  useEffect(() => {
    if (isOpen) {
      setEmail(currentEmail || "");
      setError(null);
    }
  }, [isOpen, currentEmail]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }

    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setError("Địa chỉ email không đúng định dạng (Ví dụ: yourname@gmail.com)");
      return;
    }

    if (currentEmail && currentEmail.toLowerCase() === trimmed.toLowerCase()) {
      setError("Địa chỉ email mới trùng với email hiện tại");
      return;
    }

    try {
      const response = await updateEmail({ email: trimmed }).unwrap();
      dispatch(updateUser({ email: response.result.email }));
      showSuccess("Cập nhật địa chỉ email liên kết thành công!");
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Không thể cập nhật email. Vui lòng thử lại.");
      setError(msg);
      showError(msg);
    }
  };

  return createPortal(
    <div
      onClick={() => {
        if (!isSaving) onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-3 sm:items-center sm:p-4 animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-email-title"
        className="app-modal-panel flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-kv-blue-primary px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <Mail size={18} className="text-white/90" />
            <h2 id="update-email-title" className="text-sm font-bold uppercase tracking-wider">
              {currentEmail ? "Cập nhật địa chỉ Email" : "Liên kết địa chỉ Email"}
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={isSaving}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <div className="flex items-start gap-3 p-3.5 bg-blue-50/80 rounded-xl border border-blue-100 text-xs text-blue-900">
            <ShieldCheck size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <span>
              Email (Gmail) dùng để <strong>xác thực khi quên mật khẩu</strong> và nhận các thông báo, hóa đơn điện tử quan trọng từ hệ thống.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-email-input" className="text-xs font-bold text-slate-700">
              Địa chỉ Gmail / Email <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="user-email-input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSaving}
                placeholder="Ví dụ: cuahangviet@gmail.com"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 transition-all focus:outline-none ${
                  error
                    ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:border-kv-blue-primary focus:bg-white focus:ring-2 focus:ring-blue-100"
                }`}
              />
            </div>
            {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>{currentEmail ? "Cập nhật email" : "Liên kết email"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
