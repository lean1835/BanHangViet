import React from "react";
import {
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import {
  BACKUP_RESTORE_UI,
  VERIFICATION_STATUS_STYLES,
  VERIFICATION_TRIGGER_TYPE_LABELS,
} from "@/constants/backupRestore";
import { formatDateShort } from "@/utils/dateFormatter";
import type { IBackupVerificationHistory } from "../types/IBackupRestore";

interface BackupVerificationHistoryTableProps {
  histories: IBackupVerificationHistory[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
  onViewDetail: (history: IBackupVerificationHistory) => void;
}

const formatFileSize = (bytes?: number | null): string => {
  if (bytes == null || isNaN(bytes) || bytes === 0) return "0 KB";
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(2)} MB`;
};

export const BackupVerificationHistoryTable: React.FC<
  BackupVerificationHistoryTableProps
> = ({
  histories,
  isLoading,
  page,
  totalPages,
  totalElements,
  onPageChange,
  onViewDetail,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-kv-blue-primary rounded-md">
            <FileCheck2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">
              {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.TITLE}
            </h4>
            <span className="text-xs text-slate-400 font-semibold">
              Tổng cộng {totalElements} phiên kiểm thử đã ghi nhận
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">
                {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.COLUMNS.BACKUP_FILE}
              </th>
              <th className="py-3 px-4">
                {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.COLUMNS.TRIGGER_TYPE}
              </th>
              <th className="py-3 px-4">
                {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.COLUMNS.DURATION}
              </th>
              <th className="py-3 px-4">
                {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.COLUMNS.PILLARS}
              </th>
              <th className="py-3 px-4">
                {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.COLUMNS.STATUS}
              </th>
              <th className="py-3 px-4">
                {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.COLUMNS.VERIFIED_AT}
              </th>
              <th className="py-3 px-4 text-center">
                {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.COLUMNS.ACTION}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-4">
                    <div className="h-4 bg-slate-100 rounded w-3/4 mb-1" />
                    <div className="h-3 bg-slate-100 rounded w-1/4" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-slate-100 rounded w-20" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-slate-100 rounded w-16" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-slate-100 rounded w-28" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-slate-100 rounded w-16" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-4 bg-slate-100 rounded w-28" />
                  </td>
                  <td className="py-3 px-4">
                    <div className="h-6 bg-slate-100 rounded w-16 mx-auto" />
                  </td>
                </tr>
              ))
            ) : histories.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileCheck2 className="w-8 h-8 text-slate-300" />
                    <span className="text-xs">
                      {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.EMPTY}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              histories.map((history) => {
                const statusStyle =
                  VERIFICATION_STATUS_STYLES[history.status] ||
                  VERIFICATION_STATUS_STYLES.FAILED;

                return (
                  <tr
                    key={history.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Tên tệp sao lưu */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 truncate max-w-xs">
                        {history.backupFileName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {formatFileSize(history.fileSize)}
                      </div>
                    </td>

                    {/* Hình thức */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        {history.triggerType === "AUTOMATIC" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {VERIFICATION_TRIGGER_TYPE_LABELS[history.triggerType] ||
                              history.triggerType}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-kv-blue-primary font-bold border border-blue-200">
                            <Zap className="w-3 h-3 text-kv-blue-primary" />
                            {VERIFICATION_TRIGGER_TYPE_LABELS[history.triggerType] ||
                              history.triggerType}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Thời gian chạy */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-slate-700">
                        {history.executionDurationMs} ms
                      </span>
                    </td>

                    {/* 3 Trụ cột kiểm tra */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {/* Trụ cột 1: Đọc tệp */}
                        <div
                          title={
                            history.checkedFileReadable
                              ? "Trụ cột 1: Đọc tệp thành công & Hợp lệ hộ kinh doanh"
                              : "Trụ cột 1: Đọc tệp thất bại"
                          }
                          className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            history.checkedFileReadable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {history.checkedFileReadable ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>Tệp</span>
                        </div>

                        {/* Trụ cột 2: Đối soát bản ghi */}
                        <div
                          title={
                            history.checkedRecordCountsMatched
                              ? `Trụ cột 2: Đủ bản ghi chính (${history.productCount} SP, ${history.customerCount} KH, ${history.supplierCount} NCC, ${history.userCount} NV)`
                              : "Trụ cột 2: Thiếu dữ liệu thực thể chính"
                          }
                          className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            history.checkedRecordCountsMatched
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {history.checkedRecordCountsMatched ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>Bản ghi</span>
                        </div>

                        {/* Trụ cột 3: Chuỗi kiểm toán */}
                        <div
                          title={
                            history.checkedAuditChainIntact
                              ? `Trụ cột 3: Chuỗi băm SHA-256 nhật ký nguyên vẹn (${history.auditLogCount} logs)`
                              : "Trụ cột 3: Phát hiện đứt gãy chuỗi kiểm toán!"
                          }
                          className={`flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            history.checkedAuditChainIntact
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {history.checkedAuditChainIntact ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          <span>Chuỗi băm</span>
                        </div>
                      </div>
                    </td>

                    {/* Kết quả */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${statusStyle.bg} ${statusStyle.border}`}
                      >
                        {history.status === "PASSED" ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {statusStyle.label}
                      </span>
                    </td>

                    {/* Thời điểm kiểm thử */}
                    <td className="py-3 px-4 text-slate-500">
                      {formatDateShort(history.verifiedAt)}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onViewDetail(history)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-kv-blue-primary hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-1 px-2.5 rounded-lg transition-colors cursor-pointer"
                        title="Xem bảng điểm chi tiết"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>
                          {BACKUP_RESTORE_UI.VERIFICATION.HISTORY.DETAIL_BTN}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <span>
            Trang {page + 1} / {totalPages} (Tổng {totalElements} kết quả)
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 0}
              className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
