import React, { useState } from "react";
import { useNotification } from "@/hooks/useNotification";

interface CreateSupplierGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGroup: (groupName: string, notes?: string) => void;
}

export const CreateSupplierGroupModal: React.FC<CreateSupplierGroupModalProps> = ({
  isOpen,
  onClose,
  onSaveGroup,
}) => {
  const { showSuccess, showError } = useNotification();
  const [groupName, setGroupName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) {
      setError("Tên nhóm nhà cung cấp không được để trống");
      return;
    }

    setIsSubmitting(true);
    try {
      onSaveGroup(trimmed, notes.trim());
      showSuccess(`Đã tạo nhóm nhà cung cấp "${trimmed}" thành công!`);
      setGroupName("");
      setNotes("");
      setError("");
      onClose();
    } catch (err: any) {
      showError(err?.message || "Không thể tạo nhóm nhà cung cấp");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-auth-fade-in">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
            <h2 className="text-sm font-bold">Tạo mới Nhóm nhà cung cấp</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng modal tạo nhóm nhà cung cấp"
            className="text-slate-400 hover:text-white p-1 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-semibold text-slate-700">
          <div>
            <label htmlFor="modal-group-name" className="block mb-1 font-bold text-slate-700">
              Tên nhóm nhà cung cấp <span className="text-rose-500">*</span>
            </label>
            <input
              id="modal-group-name"
              type="text"
              value={groupName}
              onChange={(e) => {
                setError("");
                setGroupName(e.target.value);
              }}
              placeholder="VD: Gia vị & Phụ gia, Bao bì - Vật tư..."
              className={`w-full h-9 px-3 border rounded-lg focus:outline-none text-xs font-semibold ${
                error ? "border-rose-500 focus:border-rose-500" : "border-slate-300 focus:border-kv-blue-primary"
              }`}
              autoFocus
            />
            {error && <p className="text-rose-500 text-[11px] mt-1 font-normal">{error}</p>}
          </div>

          <div>
            <label htmlFor="modal-group-notes" className="block mb-1 font-bold text-slate-700">
              Ghi chú
            </label>
            <textarea
              id="modal-group-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mô tả hoặc ghi chú thêm về nhóm nhà cung cấp..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-kv-blue-primary text-xs font-semibold resize-none"
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 transition-colors font-bold text-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 h-9 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang lưu...
                </>
              ) : (
                "Lưu nhóm"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
