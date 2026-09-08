import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, X, Loader2, Save } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { useAppDispatch } from "@/hooks/useRedux";
import { updateUser } from "@/stores/authSlice";
import { useUpdateProfileMutation } from "../services/profileApi";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFullName: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentFullName,
}) => {
  const dispatch = useAppDispatch();
  const { showSuccess, showError } = useNotification();
  const [updateProfile, { isLoading: isSaving }] = useUpdateProfileMutation();

  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSaving,
  });

  useEffect(() => {
    if (isOpen) {
      setFullName(currentFullName || "");
      setError(null);
    }
  }, [isOpen, currentFullName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = fullName.trim();

    if (!trimmed) {
      setError("Họ tên không được để trống");
      return;
    }

    if (trimmed.length > 100) {
      setError("Họ tên không được vượt quá 100 ký tự");
      return;
    }

    try {
      const response = await updateProfile({ fullName: trimmed }).unwrap();
      dispatch(updateUser({ fullName: response.result.fullName }));
      showSuccess("Cập nhật họ tên thành công");
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Không thể cập nhật họ tên. Vui lòng thử lại.");
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
        aria-labelledby="edit-profile-title"
        className="app-modal-panel flex w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-kv-blue-primary px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <User size={18} className="text-white/90" />
            <h2 id="edit-profile-title" className="text-sm font-bold uppercase tracking-wider">
              Chỉnh sửa họ tên
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col p-6 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-full-name" className="text-xs font-bold text-slate-700">
              Họ và tên người dùng <span className="text-rose-500">*</span>
            </label>
            <input
              id="edit-full-name"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Nhập họ và tên đầy đủ..."
              maxLength={100}
              autoFocus
              disabled={isSaving}
              className={`w-full px-3.5 py-2.5 text-sm font-medium rounded-xl border transition-colors outline-none ${
                error
                  ? "border-rose-400 bg-rose-50/40 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                  : "border-slate-300 bg-white focus:border-kv-blue-primary focus:ring-2 focus:ring-blue-100"
              }`}
            />
            {error ? (
              <span className="text-xs text-rose-500 font-medium">{error}</span>
            ) : (
              <span className="text-[11px] text-slate-400">
                Tối đa 100 ký tự, hiển thị trên các hóa đơn và chứng từ bán hàng.
              </span>
            )}
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
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Lưu thay đổi
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

export default EditProfileModal;
