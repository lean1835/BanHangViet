import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface SupplierGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (groupName: string, note?: string) => void;
}

export const SupplierGroupModal: React.FC<SupplierGroupModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [groupName, setGroupName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setGroupName("");
      setNote("");
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) {
      setError("Vui lòng nhập tên nhóm nhà cung cấp");
      return;
    }
    onSave(trimmed, note.trim() || undefined);
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-group-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        className="app-modal-panel flex flex-col w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark Header */}
        <div className="bg-[#1e293b] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white/90"
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
            <h2
              id="supplier-group-modal-title"
              className="text-sm font-bold tracking-wide text-white"
            >
              Tạo mới Nhóm nhà cung cấp
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <label
                htmlFor="group-name-input"
                className="block text-slate-700 font-bold mb-1.5"
              >
                Tên nhóm nhà cung cấp <span className="text-rose-500">*</span>
              </label>
              <input
                id="group-name-input"
                type="text"
                autoFocus
                placeholder="VD: Gia vị & Phụ gia, Bao bì - Vật tư..."
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  if (error) setError("");
                }}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                  error
                    ? "border-rose-300 bg-rose-50/40 text-rose-900 focus:ring-rose-200"
                    : "border-slate-300 bg-white text-slate-900 focus:border-kv-blue-primary focus:ring-kv-blue-primary"
                }`}
              />
              {error && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">
                  {error}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="group-note-input"
                className="block text-slate-700 font-bold mb-1.5"
              >
                Ghi chú
              </label>
              <textarea
                id="group-note-input"
                rows={3}
                placeholder="Mô tả hoặc ghi chú thêm về nhóm nhà cung cấp..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-kv-blue-primary focus:ring-1 focus:ring-kv-blue-primary resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-xs font-bold text-white shadow-sm transition-colors"
            >
              Lưu nhóm
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
