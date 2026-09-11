import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { KeyRound, X, Loader2, Save, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { useAppDispatch } from "@/hooks/useRedux";
import { updateToken } from "@/stores/authSlice";
import { useChangePasswordMutation } from "../services/profileApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useNotification();
  const [changePassword, { isLoading: isSaving }] = useChangePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSaving,
  });

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Mật khẩu hiện tại không được để trống";
    }

    if (!newPassword) {
      newErrors.newPassword = "Mật khẩu mới không được để trống";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu mới phải từ 6 đến 100 ký tự";
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = "Mật khẩu mới không được trùng với mật khẩu hiện tại";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu mới không được để trống";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp với mật khẩu mới";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSaving) return;

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      }).unwrap();

      if (response.result?.token) {
        dispatch(updateToken(response.result.token));
      }

      showSuccess("Đổi mật khẩu thành công. Các phiên làm việc khác đã được đăng xuất.");
      onClose();
    } catch (err: any) {
      const errMsg = getApiErrorMessage(err, "Đổi mật khẩu không thành công. Vui lòng kiểm tra lại thông tin.");

      // Map common error messages to specific input fields if applicable
      const newErrors: typeof errors = {};
      if (errMsg.includes("Mật khẩu không chính xác") || errMsg.includes("WRONG_PASSWORD")) {
        newErrors.currentPassword = "Mật khẩu hiện tại không chính xác";
      } else if (errMsg.includes("trùng với mật khẩu hiện tại") || errMsg.includes("NEW_PASSWORD_SAME_AS_CURRENT")) {
        newErrors.newPassword = "Mật khẩu mới không được trùng với mật khẩu hiện tại";
      } else if (errMsg.includes("không khớp") || errMsg.includes("PASSWORD_CONFIRMATION_MISMATCH")) {
        newErrors.confirmPassword = "Mật khẩu xác nhận không khớp với mật khẩu mới";
      } else {
        newErrors.general = errMsg;
      }

      setErrors(newErrors);
      showError(errMsg);
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
        aria-labelledby="change-password-title"
        className="app-modal-panel flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-kv-blue-primary px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <KeyRound size={18} className="text-white/90" />
            <h2 id="change-password-title" className="text-sm font-bold uppercase tracking-wider">
              Đổi mật khẩu tài khoản
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
        <form onSubmit={handleSubmit} className="flex flex-col p-6 gap-4">
          {errors.general && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Mật khẩu hiện tại */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="current-password" className="text-xs font-bold text-slate-700">
              Mật khẩu hiện tại <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (errors.currentPassword || errors.general) {
                    setErrors((prev) => ({ ...prev, currentPassword: undefined, general: undefined }));
                  }
                }}
                placeholder="Nhập mật khẩu hiện tại..."
                autoFocus
                disabled={isSaving}
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm font-medium rounded-xl border transition-colors outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                  errors.currentPassword
                    ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showCurrentPassword ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"}
              >
                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.currentPassword && (
              <span className="text-xs text-rose-500 font-medium">{errors.currentPassword}</span>
            )}
          </div>

          {/* Mật khẩu mới */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-password" className="text-xs font-bold text-slate-700">
              Mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newPassword || errors.general) {
                    setErrors((prev) => ({ ...prev, newPassword: undefined, general: undefined }));
                  }
                }}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)..."
                disabled={isSaving}
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm font-medium rounded-xl border transition-colors outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                  errors.newPassword
                    ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showNewPassword ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.newPassword ? (
              <span className="text-xs text-rose-500 font-medium">{errors.newPassword}</span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Tối thiểu 6 ký tự và khác mật khẩu hiện tại.
              </span>
            )}
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="confirm-password" className="text-xs font-bold text-slate-700">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword || errors.general) {
                    setErrors((prev) => ({ ...prev, confirmPassword: undefined, general: undefined }));
                  }
                }}
                placeholder="Nhập lại mật khẩu mới..."
                disabled={isSaving}
                className={`w-full pl-3.5 pr-10 py-2.5 text-sm font-medium rounded-xl border transition-colors outline-none [&::-ms-reveal]:hidden [&::-ms-clear]:hidden ${
                  errors.confirmPassword
                    ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                    : "border-slate-300 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showConfirmPassword ? "Ẩn xác nhận mật khẩu" : "Hiện xác nhận mật khẩu"}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="text-xs text-rose-500 font-medium">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Alert Security Note */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 leading-relaxed">
            <strong>Lưu ý bảo mật:</strong> Sau khi đổi mật khẩu thành công, tất cả các thiết bị hoặc phiên đăng nhập khác của bạn sẽ bị kết thúc để bảo đảm an toàn. Phiên làm việc trên thiết bị này sẽ được tự động duy trì.
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-kv-blue-primary hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Xác nhận đổi mật khẩu
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

export default ChangePasswordModal;
