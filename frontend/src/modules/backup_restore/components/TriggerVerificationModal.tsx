import React, { useState } from "react";
import {
  X,
  Play,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { BACKUP_RESTORE_UI } from "@/constants/backupRestore";
import { formatDateShort } from "@/utils/dateFormatter";
import type { IBackupHistory } from "../types/IBackupRestore";

interface TriggerVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBackups: IBackupHistory[];
  isLoadingBackups: boolean;
  isTriggering: boolean;
  onConfirmTrigger: (
    backupHistoryId?: string,
    notes?: string
  ) => Promise<void>;
}

export const TriggerVerificationModal: React.FC<
  TriggerVerificationModalProps
> = ({
  isOpen,
  onClose,
  availableBackups,
  isLoadingBackups,
  isTriggering,
  onConfirmTrigger,
}) => {
  const [useLatest, setUseLatest] = useState<boolean>(true);
  const [selectedBackupId, setSelectedBackupId] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = useLatest ? undefined : selectedBackupId || undefined;
    await onConfirmTrigger(targetId, notes.trim() || undefined);
  };

  const activeBackups = availableBackups.filter(
    (b) => b.status === "SUCCESS"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-kv-blue-primary">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.TITLE}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.SUBTITLE}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isTriggering}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Notice Box - Sandbox Safety Guarantee */}
          <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold text-emerald-900">
              <div className="font-bold text-emerald-800 uppercase tracking-wide text-[11px] mb-0.5">
                {BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.NOTICE_TITLE}
              </div>
              <p className="leading-relaxed">
                {BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.NOTICE_DESC}
              </p>
            </div>
          </div>

          {/* Target Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              {BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.TARGET_SELECT_LABEL}
            </label>

            <div className="space-y-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors has-checked:border-kv-blue-primary has-checked:bg-blue-50/30">
                <input
                  type="radio"
                  name="target_mode"
                  checked={useLatest}
                  onChange={() => setUseLatest(true)}
                  className="w-4 h-4 text-kv-blue-primary"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-slate-800">
                    {BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.TARGET_LATEST_OPTION}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Tự động tìm và chạy thử bản sao lưu thành công gần đây nhất trong kho
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors has-checked:border-kv-blue-primary has-checked:bg-blue-50/30">
                <input
                  type="radio"
                  name="target_mode"
                  checked={!useLatest}
                  onChange={() => setUseLatest(false)}
                  className="w-4 h-4 text-kv-blue-primary mt-0.5"
                />
                <div className="flex-1 space-y-2">
                  <div className="text-xs font-bold text-slate-800">
                    Chọn bản sao lưu cụ thể:
                  </div>

                  {!useLatest && (
                    <select
                      value={selectedBackupId}
                      onChange={(e) => setSelectedBackupId(e.target.value)}
                      disabled={isLoadingBackups || activeBackups.length === 0}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:border-kv-blue-primary"
                    >
                      <option value="">-- Chọn tệp sao lưu muốn kiểm chứng --</option>
                      {activeBackups.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.fileName} ({formatDateShort(b.backupTime)})
                        </option>
                      ))}
                    </select>
                  )}

                  {!useLatest && activeBackups.length === 0 && !isLoadingBackups && (
                    <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Không tìm thấy bản sao lưu nào ở trạng thái thành công.
                    </p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.NOTES_LABEL}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.NOTES_PLACEHOLDER
              }
              maxLength={500}
              className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-kv-blue-primary font-medium text-slate-800 resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isTriggering}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.CANCEL_BTN}
            </button>
            <button
              type="submit"
              disabled={isTriggering || (!useLatest && !selectedBackupId)}
              className="px-5 py-2 text-xs font-extrabold text-white bg-kv-blue-primary hover:bg-blue-600 rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isTriggering ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {
                      BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL
                        .SUBMITTING_BTN
                    }
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {BACKUP_RESTORE_UI.VERIFICATION.TRIGGER_MODAL.SUBMIT_BTN}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
