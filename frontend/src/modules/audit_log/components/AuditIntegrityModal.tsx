import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CheckCircle2, AlertOctagon, ShieldAlert, ShieldCheck, RefreshCw } from "lucide-react";
import type { IAuditIntegrityResponse } from "../types/IAuditLog";

interface AuditIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: IAuditIntegrityResponse | null;
  isLoading: boolean;
  onReverify: () => void;
}

export const AuditIntegrityModal: React.FC<AuditIntegrityModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onReverify,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const date = new Date(isoString);
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const isValid = result?.valid ?? true;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-integrity-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 app-modal-backdrop animate-backdrop-fade-in"
    >
      <div className="app-modal-panel w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-modal-bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 app-modal-header">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl shadow-2xs ${
                isValid
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              {isValid ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="audit-integrity-title" className="font-extrabold text-slate-800 text-sm">
                Xác thực tính toàn vẹn nhật ký kiểm toán
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Kiểm tra tính bất biến và chống can thiệp của toàn bộ bản ghi kiểm toán
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 app-modal-body">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 text-kv-blue-primary animate-spin" />
              <p className="font-bold text-sm text-slate-700">
                Đang rà soát và kiểm tra toàn bộ dữ liệu nhật ký...
              </p>
            </div>
          ) : (
            <>
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  isValid
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-rose-50/80 border-rose-200 text-rose-900"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isValid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertOctagon className="w-5 h-5 text-rose-600" />
                  )}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs">
                    {isValid
                      ? "Dữ liệu nhật ký kiểm toán hoàn toàn toàn vẹn và hợp lệ!"
                      : "CẢNH BÁO: Phát hiện dữ liệu nhật ký kiểm toán có dấu hiệu bị can thiệp trái phép!"}
                  </h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                    {isValid
                      ? "Hệ thống đã rà soát thành công toàn bộ dữ liệu nhật ký. Không phát hiện bất kỳ dấu hiệu can thiệp, chỉnh sửa hay sai lệch dữ liệu nào."
                      : "Phát hiện sai lệch hoặc dữ liệu có dấu hiệu bị can thiệp trái phép trực tiếp dưới cơ sở dữ liệu."}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Tổng số bản ghi đã rà soát:
                  </span>
                  <p className="text-base font-extrabold text-slate-800">
                    {result?.totalRecordsChecked || 0} bản ghi
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Thời điểm xác thực:
                  </span>
                  <p className="text-xs font-bold text-slate-700 font-mono pt-1">
                    {formatDateTime(result?.verifiedAt)}
                  </p>
                </div>
              </div>

              {/* Tampered Pinpoint Box (if invalid) */}
              {!isValid && result && (
                <div className="p-4 rounded-2xl bg-rose-100/50 border border-rose-300 space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    <span>Vị trí phát hiện can thiệp:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 font-medium">Bản ghi số (Sequence):</span>
                      <span className="font-bold text-rose-700 ml-1.5 font-mono">
                        Sequence #{result.corruptedSequenceNumber ?? "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium">Mã định danh (ID):</span>
                      <span className="font-bold text-slate-800 ml-1.5 font-mono truncate inline-block max-w-[140px] align-bottom">
                        {result.corruptedLogId || "N/A"}
                      </span>
                    </div>
                    <div className="col-span-2 mt-1">
                      <span className="text-slate-500 font-medium">Chi tiết lỗi: </span>
                      <p className="font-semibold text-rose-700 mt-0.5">
                        {result.failureReason || "Sai lệch liên kết dữ liệu nhật ký"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 app-modal-footer">
          <button
            onClick={onReverify}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-all disabled:opacity-50 shadow-2xs active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Kiểm tra lại toàn bộ</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : modalContent;
};
