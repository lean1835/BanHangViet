import React, { useEffect } from "react";
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-integrity-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 app-modal-backdrop animate-backdrop-fade-in"
    >
      <div className="app-modal-panel w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-modal-bounce-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 app-modal-header">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl shadow-2xs ${
                result?.valid
                  ? "bg-emerald-100 text-emerald-700"
                  : result
                  ? "bg-rose-100 text-rose-700"
                  : "bg-blue-100 text-kv-blue-primary"
              }`}
            >
              {result?.valid ? (
                <ShieldCheck className="w-5 h-5" />
              ) : result ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <RefreshCw className="w-5 h-5 animate-spin" />
              )}
            </div>
            <div>
              <h3 id="audit-integrity-title" className="text-base font-bold text-slate-800">
                Xác thực tính toàn vẹn nhật ký kiểm toán
              </h3>
              <p className="text-xs text-slate-500">
                Kiểm tra tính bất biến và chống can thiệp của toàn bộ bản ghi kiểm toán
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng modal xác thực"
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 hover:rotate-90 active:scale-90 p-2 rounded-xl transition-all duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs app-modal-body">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <RefreshCw className="w-8 h-8 text-kv-blue-primary animate-spin" />
              <p className="font-bold text-sm text-slate-700">
                Đang rà soát và kiểm tra toàn bộ dữ liệu nhật ký...
              </p>
              <span className="text-xs text-slate-400">
                Quá trình này rà soát liên kết dữ liệu từ bản ghi đầu tiên đến bản ghi mới nhất.
              </span>
            </div>
          ) : result?.valid ? (
            /* SUCCESS CASE */
            <div className="space-y-4">
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3.5 shadow-2xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-emerald-900 text-sm">
                    Dữ liệu nhật ký kiểm toán hoàn toàn toàn vẹn và hợp lệ!
                  </h4>
                  <p className="text-emerald-800 leading-relaxed">
                    Hệ thống đã rà soát thành công toàn bộ dữ liệu nhật ký. Không phát hiện bất kỳ dấu hiệu can thiệp, chỉnh sửa hay sai lệch dữ liệu nào.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 border border-slate-200/70 rounded-2xl shadow-2xs">
                <div>
                  <span className="text-slate-500 font-extrabold uppercase text-[11px] block mb-0.5">
                    Tổng số bản ghi đã rà soát:
                  </span>
                  <span className="font-mono text-base font-black text-slate-800">
                    {result.totalRecordsChecked.toLocaleString("vi-VN")} bản ghi
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-extrabold uppercase text-[11px] block mb-0.5">
                    Thời điểm xác thực:
                  </span>
                  <span className="font-bold text-slate-700">
                    {formatDateTime(result.verifiedAt)}
                  </span>
                </div>
              </div>
            </div>
          ) : result ? (
            /* CORRUPTED CASE */
            <div className="space-y-4">
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 shadow-2xs">
                <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-rose-900 text-sm">
                    CẢNH BÁO: Phát hiện dữ liệu nhật ký kiểm toán có dấu hiệu bị can thiệp trái phép!
                  </h4>
                  <p className="text-rose-800 leading-relaxed">
                    Phát hiện sai lệch hoặc dữ liệu có dấu hiệu bị can thiệp trái phép trực tiếp dưới cơ sở dữ liệu.
                  </p>
                </div>
              </div>

              <div className="space-y-2 p-4 bg-rose-50/50 border border-rose-200/80 rounded-2xl shadow-2xs">
                <div className="flex justify-between border-b border-rose-100 pb-2">
                  <span className="text-rose-700 font-bold">Vị trí Sequence bị lỗi:</span>
                  <span className="font-mono font-black text-rose-900">
                    Sequence #{result.corruptedSequenceNumber ?? "N/A"}
                  </span>
                </div>
                {result.corruptedLogId && (
                  <div className="flex justify-between border-b border-rose-100 pb-2">
                    <span className="text-rose-700 font-bold">Mã bản ghi ID:</span>
                    <span className="font-mono text-rose-900 select-all font-semibold">
                      {result.corruptedLogId}
                    </span>
                  </div>
                )}
                <div className="pt-1">
                  <span className="text-rose-700 font-bold block mb-1">
                    Nguyên nhân lỗi phát hiện:
                  </span>
                  <p className="font-mono text-[11px] text-rose-950 bg-white p-3 rounded-xl border border-rose-200">
                    {result.failureReason || "Sai lệch liên kết dữ liệu nhật ký"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
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
};
