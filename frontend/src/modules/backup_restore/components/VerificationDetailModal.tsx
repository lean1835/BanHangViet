import React from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Database,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Users,
  Package,
  Truck,
  UserCheck,
} from "lucide-react";
import {
  BACKUP_RESTORE_UI,
  VERIFICATION_STATUS_STYLES,
  VERIFICATION_TRIGGER_TYPE_LABELS,
} from "@/constants/backupRestore";
import { formatDateShort } from "@/utils/dateFormatter";
import type { IBackupVerificationHistory } from "../types/IBackupRestore";

interface VerificationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  verification: IBackupVerificationHistory | null;
}

const formatFileSize = (bytes?: number | null): string => {
  if (bytes == null || isNaN(bytes) || bytes === 0) return "0 KB";
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(2)} MB`;
};

export const VerificationDetailModal: React.FC<
  VerificationDetailModalProps
> = ({ isOpen, onClose, verification }) => {
  if (!isOpen || !verification) return null;

  const isPassed = verification.status === "PASSED";
  const statusStyle =
    VERIFICATION_STATUS_STYLES[verification.status] ||
    VERIFICATION_STATUS_STYLES.FAILED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isPassed
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {isPassed ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                {BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL.TITLE}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL.SUBTITLE}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Status Result Bar */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              isPassed
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                : "bg-rose-50/80 border-rose-200 text-rose-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {isPassed ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
              )}
              <div>
                <div className="font-extrabold text-sm">
                  {isPassed
                    ? "Kiểm chứng đạt chuẩn an toàn"
                    : "Kiểm chứng không đạt yêu cầu"}
                </div>
                <div className="text-xs opacity-90 font-medium">
                  {isPassed
                    ? "Dữ liệu bản sao lưu hoàn toàn nguyên vẹn, đọc tốt và sẵn sàng phục hồi khi có thảm họa."
                    : "Phát hiện lỗi bất thường hoặc dữ liệu không toàn vẹn trong bản sao lưu."}
                </div>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black shrink-0 border ${statusStyle.bg} ${statusStyle.border}`}
            >
              {statusStyle.label}
            </span>
          </div>

          {/* Failure Reason Callout */}
          {!isPassed && verification.failureReason && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                <span>
                  {
                    BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                      .FAILURE_REASON_TITLE
                  }
                </span>
              </div>
              <p className="text-xs text-rose-700 font-semibold leading-relaxed pl-5">
                {verification.failureReason}
              </p>
            </div>
          )}

          {/* Section 1: 3 Pillars of Verification */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-kv-blue-primary" />
              <span>
                {
                  BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                    .PILLARS_SECTION
                }
              </span>
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Pillar 1 */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  verification.checkedFileReadable
                    ? "bg-slate-50 border-slate-200"
                    : "bg-rose-50/50 border-rose-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      verification.checkedFileReadable
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {verification.checkedFileReadable ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {
                        BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                          .PILLAR_1_TITLE
                      }
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {
                        BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                          .PILLAR_1_DESC
                      }
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    verification.checkedFileReadable
                      ? "text-emerald-700 bg-emerald-100"
                      : "text-rose-700 bg-rose-100"
                  }`}
                >
                  {verification.checkedFileReadable ? "Đạt" : "Lỗi"}
                </span>
              </div>

              {/* Pillar 2 */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  verification.checkedRecordCountsMatched
                    ? "bg-slate-50 border-slate-200"
                    : "bg-rose-50/50 border-rose-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      verification.checkedRecordCountsMatched
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {verification.checkedRecordCountsMatched ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {
                        BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                          .PILLAR_2_TITLE
                      }
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {
                        BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                          .PILLAR_2_DESC
                      }
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    verification.checkedRecordCountsMatched
                      ? "text-emerald-700 bg-emerald-100"
                      : "text-rose-700 bg-rose-100"
                  }`}
                >
                  {verification.checkedRecordCountsMatched ? "Đạt" : "Lỗi"}
                </span>
              </div>

              {/* Pillar 3 */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                  verification.checkedAuditChainIntact
                    ? "bg-slate-50 border-slate-200"
                    : "bg-rose-50/50 border-rose-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      verification.checkedAuditChainIntact
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {verification.checkedAuditChainIntact ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      {
                        BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                          .PILLAR_3_TITLE
                      }
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {
                        BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                          .PILLAR_3_DESC
                      }
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    verification.checkedAuditChainIntact
                      ? "text-emerald-700 bg-emerald-100"
                      : "text-rose-700 bg-rose-100"
                  }`}
                >
                  {verification.checkedAuditChainIntact ? "Đạt" : "Lỗi"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Counts of core entities */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Database className="w-4 h-4 text-kv-blue-primary" />
              <span>
                {
                  BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                    .COUNTS_SECTION
                }
              </span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                <Package className="w-4 h-4 text-blue-500 mb-1" />
                <span className="text-[11px] text-slate-500 font-semibold">
                  Hàng hóa
                </span>
                <span className="text-sm font-black text-slate-900 mt-0.5">
                  {verification.productCount ?? 0}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                <Users className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-[11px] text-slate-500 font-semibold">
                  Khách hàng
                </span>
                <span className="text-sm font-black text-slate-900 mt-0.5">
                  {verification.customerCount ?? 0}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                <Truck className="w-4 h-4 text-amber-500 mb-1" />
                <span className="text-[11px] text-slate-500 font-semibold">
                  Nhà cung cấp
                </span>
                <span className="text-sm font-black text-slate-900 mt-0.5">
                  {verification.supplierCount ?? 0}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center text-center">
                <UserCheck className="w-4 h-4 text-indigo-500 mb-1" />
                <span className="text-[11px] text-slate-500 font-semibold">
                  Tài khoản
                </span>
                <span className="text-sm font-black text-slate-900 mt-0.5">
                  {verification.userCount ?? 0}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center text-center col-span-2 sm:col-span-1">
                <FileText className="w-4 h-4 text-purple-500 mb-1" />
                <span className="text-[11px] text-slate-500 font-semibold">
                  Kiểm toán băm
                </span>
                <span className="text-sm font-black text-slate-900 mt-0.5">
                  {verification.auditLogCount ?? 0}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Session Details */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
              {BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL.INFO_SECTION}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">
                  {
                    BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                      .BACKUP_FILE_LABEL
                  }
                </span>
                <span className="font-mono font-bold text-slate-800 truncate max-w-[200px]">
                  {verification.backupFileName}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">
                  {
                    BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                      .BACKUP_TIME_LABEL
                  }
                </span>
                <span className="font-bold text-slate-800">
                  {formatDateShort(verification.backupTime)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">
                  {
                    BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                      .FILE_SIZE_LABEL
                  }
                </span>
                <span className="font-bold text-slate-800">
                  {formatFileSize(verification.fileSize)}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">
                  {
                    BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                      .EXECUTION_TIME_LABEL
                  }
                </span>
                <span className="font-mono font-bold text-slate-800">
                  {verification.executionDurationMs} ms
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">
                  {
                    BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                      .TRIGGER_TYPE_LABEL
                  }
                </span>
                <span className="font-bold text-slate-800">
                  {VERIFICATION_TRIGGER_TYPE_LABELS[
                    verification.triggerType
                  ] || verification.triggerType}
                </span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">
                  {
                    BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL
                      .VERIFIED_AT_LABEL
                  }
                </span>
                <span className="font-bold text-slate-800">
                  {formatDateShort(verification.verifiedAt)}
                </span>
              </div>
            </div>

            {verification.notes && (
              <div className="mt-2 p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700">
                <strong className="text-slate-800">Ghi chú:</strong>{" "}
                {verification.notes}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            {BACKUP_RESTORE_UI.VERIFICATION.DETAIL_MODAL.CLOSE_BTN}
          </button>
        </div>
      </div>
    </div>
  );
};
