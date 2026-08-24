import React from "react";
import { RotateCcw, Database } from "lucide-react";
import {
  BACKUP_RESTORE_UI,
  BACKUP_TYPE_LABELS,
} from "@/constants/backupRestore";
import { formatDateShort } from "@/utils/dateFormatter";
import type { IBackupHistory } from "../types/IBackupRestore";

interface AvailableBackupsTableProps {
  backups: IBackupHistory[];
  isLoading: boolean;
  onSelectBackup: (backupId: string) => void;
}

const formatFileSize = (bytes?: number | null): string => {
  if (bytes == null || isNaN(bytes) || bytes === 0) return "0 KB";
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(2)} MB`;
};

export const AvailableBackupsTable: React.FC<AvailableBackupsTableProps> = ({
  backups,
  isLoading,
  onSelectBackup,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">
              {BACKUP_RESTORE_UI.RESTORE.AVAILABLE_TITLE}
            </h4>
            <span className="text-xs text-slate-400 font-semibold">
              {BACKUP_RESTORE_UI.RESTORE.AVAILABLE_SUBTITLE}
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">{BACKUP_RESTORE_UI.RESTORE.COLUMNS.FILE_NAME}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.RESTORE.COLUMNS.TYPE}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.RESTORE.COLUMNS.SIZE}</th>
              <th className="py-3 px-4">{BACKUP_RESTORE_UI.RESTORE.COLUMNS.TIME}</th>
              <th className="py-3 px-4 text-right">{BACKUP_RESTORE_UI.RESTORE.COLUMNS.ACTION}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-slate-400 font-bold">
                  Đang tải danh sách bản sao lưu khả dụng...
                </td>
              </tr>
            ) : backups.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  <Database className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-xs">{BACKUP_RESTORE_UI.RESTORE.EMPTY_AVAILABLE}</p>
                </td>
              </tr>
            ) : (
              backups.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-slate-50/80 transition-colors font-semibold"
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-kv-blue-primary shrink-0" />
                      <span className="truncate max-w-[260px]" title={b.fileName}>
                        {b.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-800">
                      {BACKUP_TYPE_LABELS[b.backupType] || b.backupType}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {formatFileSize(b.fileSize)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-medium">
                    {formatDateShort(b.backupTime || b.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onSelectBackup(b.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{BACKUP_RESTORE_UI.RESTORE.RESTORE_ACTION_BTN}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
