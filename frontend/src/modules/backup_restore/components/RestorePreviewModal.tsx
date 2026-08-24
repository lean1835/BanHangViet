import React, { useState } from "react";
import {
  X,
  RotateCcw,
  AlertTriangle,
  AlertOctagon,
  Loader2,
} from "lucide-react";
import {
  BACKUP_RESTORE_UI,
  BACKUP_TYPE_LABELS,
} from "@/constants/backupRestore";
import { formatDate } from "@/utils/dateFormatter";
import type { IRestorePreview } from "../types/IBackupRestore";

interface RestorePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData?: IRestorePreview | null;
  isLoading: boolean;
  isExecuting: boolean;
  onConfirmRestore: (notes: string) => void;
}

const formatFileSize = (bytes?: number | null): string => {
  if (bytes == null || isNaN(bytes) || bytes === 0) return "0 KB";
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(2)} MB`;
};

export const RestorePreviewModal: React.FC<RestorePreviewModalProps> = ({
  isOpen,
  onClose,
  previewData,
  isLoading,
  isExecuting,
  onConfirmRestore,
}) => {
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  if (!isOpen) return null;

  const isEligible = previewData?.isEligibleForRestore ?? false;

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || !isEligible || isExecuting) return;
    onConfirmRestore(notes);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-preview-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 app-modal-backdrop animate-backdrop-fade-in"
    >
      <div className="app-modal-panel w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-modal-bounce-in flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800 shadow-2xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 id="restore-preview-title" className="text-base font-extrabold text-slate-800">
                {BACKUP_RESTORE_UI.PREVIEW_MODAL.TITLE}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {BACKUP_RESTORE_UI.PREVIEW_MODAL.SUBTITLE}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExecuting}
            aria-label="Đóng modal"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 text-kv-blue-primary animate-spin" />
              <p className="font-bold text-sm text-slate-700">
                Đang nạp và kiểm tra tính toàn vẹn bản sao lưu...
              </p>
            </div>
          ) : !previewData ? (
            <div className="py-8 text-center text-slate-400 font-bold">
              Không thể tải thông tin bản sao lưu.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ineligible Warning (TC-02) */}
              {!isEligible ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-900 shadow-2xs">
                  <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">
                      Bản sao lưu không đủ điều kiện phục hồi!
                    </h4>
                    <p className="text-xs text-rose-800 leading-relaxed font-medium">
                      {previewData.warningMessage ||
                        BACKUP_RESTORE_UI.PREVIEW_MODAL.INELIGIBLE_ALERT}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-900 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm">
                      {BACKUP_RESTORE_UI.PREVIEW_MODAL.WARNING_TITLE}
                    </h4>
                    <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                      {BACKUP_RESTORE_UI.PREVIEW_MODAL.WARNING_DESC}
                    </p>
                  </div>
                </div>
              )}

              {/* Backup Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                    {BACKUP_RESTORE_UI.PREVIEW_MODAL.FILE_NAME_LABEL}
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs break-all">
                    {previewData.fileName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                    {BACKUP_RESTORE_UI.PREVIEW_MODAL.BACKUP_TIME_LABEL}
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {formatDate(previewData.backupTime)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                    {BACKUP_RESTORE_UI.PREVIEW_MODAL.TYPE_LABEL}
                  </span>
                  <span className="font-bold text-slate-800 text-xs">
                    {BACKUP_TYPE_LABELS[previewData.backupType] || previewData.backupType}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">
                    {BACKUP_RESTORE_UI.PREVIEW_MODAL.SIZE_LABEL}
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-xs">
                    {formatFileSize(previewData.fileSize)}
                  </span>
                </div>
              </div>

              {previewData.summaryDescription && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-900 text-xs">
                  <span className="font-bold block mb-0.5">Tóm tắt dữ liệu phục hồi:</span>
                  <p className="font-medium text-slate-700">{previewData.summaryDescription}</p>
                </div>
              )}

              {/* Confirmation Form */}
              {isEligible && (
                <form id="restore-confirm-form" onSubmit={handleExecute} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      {BACKUP_RESTORE_UI.PREVIEW_MODAL.NOTES_LABEL}
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={BACKUP_RESTORE_UI.PREVIEW_MODAL.NOTES_PLACEHOLDER}
                      disabled={isExecuting}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isConfirmed}
                      onChange={(e) => setIsConfirmed(e.target.checked)}
                      disabled={isExecuting}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 mt-0.5 shrink-0"
                    />
                    <span className="text-xs font-bold text-amber-950 leading-snug">
                      {BACKUP_RESTORE_UI.PREVIEW_MODAL.CONFIRM_CHECKBOX}
                    </span>
                  </label>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isExecuting}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {BACKUP_RESTORE_UI.PREVIEW_MODAL.CANCEL_BTN}
          </button>

          {isEligible && (
            <button
              type="submit"
              form="restore-confirm-form"
              disabled={!isConfirmed || isExecuting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer active:scale-95"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{BACKUP_RESTORE_UI.PREVIEW_MODAL.EXECUTING_BTN}</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>{BACKUP_RESTORE_UI.PREVIEW_MODAL.EXECUTE_BTN}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
