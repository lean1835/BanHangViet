import React from "react";
import {
  Database,
  FileCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BACKUP_RESTORE_UI,
  BACKUP_STATUS_STYLES,
  BACKUP_TYPE_LABELS,
  BACKUP_TRIGGER_TYPE_LABELS,
} from "@/constants/backupRestore";
import { formatDateShort } from "@/utils/dateFormatter";
import type { IBackupHistory } from "../types/IBackupRestore";

interface BackupHistoryTableProps {
  histories: IBackupHistory[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
}

const formatFileSize = (bytes?: number | null): string => {
  if (bytes == null || isNaN(bytes) || bytes === 0) return "0 KB";
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(2)} MB`;
};

export const BackupHistoryTable: React.FC<BackupHistoryTableProps> = ({
  histories,
  isLoading,
  page,
  totalPages,
  totalElements,
  onPageChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-kv-blue-primary rounded-md">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">
              {BACKUP_RESTORE_UI.HISTORY.TABLE_TITLE}
            </h4>
            <span className="text-xs text-slate-400 font-semibold">
              Tổng cộng {totalElements} bản ghi sao lưu đã được thực hiện
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">{BACKUP_RESTORE_UI.HISTORY.COLUMNS.FILE_NAME}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.HISTORY.COLUMNS.TYPE}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.HISTORY.COLUMNS.TRIGGER}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.HISTORY.COLUMNS.SIZE}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.HISTORY.COLUMNS.STATUS}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.HISTORY.COLUMNS.CREATED_BY}</th>
              <th className="py-3 px-4">{BACKUP_RESTORE_UI.HISTORY.COLUMNS.TIME}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                  Đang tải danh sách lịch sử sao lưu...
                </td>
              </tr>
            ) : histories.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <Database className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-xs">{BACKUP_RESTORE_UI.HISTORY.EMPTY}</p>
                </td>
              </tr>
            ) : (
              histories.map((h) => {
                const statusStyle = BACKUP_STATUS_STYLES[h.status] || {
                  bg: "bg-slate-100 text-slate-600 border-slate-300",
                  label: h.status,
                };
                return (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50/80 transition-colors font-semibold"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-kv-blue-primary shrink-0" />
                        <span className="truncate max-w-[220px]" title={h.fileName}>
                          {h.fileName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">
                        {BACKUP_TYPE_LABELS[h.backupType] || h.backupType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs text-slate-600 font-medium">
                        {BACKUP_TRIGGER_TYPE_LABELS[h.triggerType] || h.triggerType}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {formatFileSize(h.fileSize)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusStyle.bg}`}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {h.createdByUserName || "Hệ thống tự động"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {formatDateShort(h.backupTime || h.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs">
          <span className="text-slate-500 font-semibold">
            Trang <strong className="text-slate-800">{page + 1}</strong> / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 0}
              aria-label="Trang trước"
              className="p-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages - 1}
              aria-label="Trang sau"
              className="p-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
