import React from "react";
import {
  History,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BACKUP_RESTORE_UI,
  RESTORE_STATUS_STYLES,
  BACKUP_TYPE_LABELS,
} from "@/constants/backupRestore";
import { formatDate } from "@/utils/dateFormatter";
import type { IRestoreHistory } from "../types/IBackupRestore";

interface RestoreHistoryTableProps {
  histories: IRestoreHistory[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (newPage: number) => void;
}

export const RestoreHistoryTable: React.FC<RestoreHistoryTableProps> = ({
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
          <div className="p-1.5 bg-amber-50 text-amber-700 rounded-md">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">
              {BACKUP_RESTORE_UI.RESTORE.HISTORY_TITLE}
            </h4>
            <span className="text-xs text-slate-400 font-semibold">
              Tổng cộng {totalElements} lần phục hồi CSDL đã thực hiện
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">{BACKUP_RESTORE_UI.RESTORE.HISTORY_COLUMNS.RESTORE_ID}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.RESTORE.HISTORY_COLUMNS.BACKUP_FILE}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.RESTORE.HISTORY_COLUMNS.TYPE}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.RESTORE.HISTORY_COLUMNS.STATUS}</th>
              <th className="py-3 px-3">{BACKUP_RESTORE_UI.RESTORE.HISTORY_COLUMNS.RESTORED_BY}</th>
              <th className="py-3 px-4">{BACKUP_RESTORE_UI.RESTORE.HISTORY_COLUMNS.RESTORED_AT}</th>
              <th className="py-3 px-4">{BACKUP_RESTORE_UI.RESTORE.HISTORY_COLUMNS.NOTES}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 font-bold">
                  Đang tải danh sách lịch sử phục hồi...
                </td>
              </tr>
            ) : histories.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-xs">{BACKUP_RESTORE_UI.RESTORE.EMPTY_HISTORY}</p>
                </td>
              </tr>
            ) : (
              histories.map((h) => {
                const statusStyle = RESTORE_STATUS_STYLES[h.status] || {
                  bg: "bg-slate-100 text-slate-600 border-slate-300",
                  label: h.status,
                };
                return (
                  <tr
                    key={h.id}
                    className="hover:bg-slate-50/80 transition-colors font-semibold"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate max-w-[120px]" title={h.id}>
                          {h.id.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      <span className="truncate max-w-[200px] block" title={h.backupFileName}>
                        {h.backupFileName}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">
                        {BACKUP_TYPE_LABELS[h.backupType] || h.backupType}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusStyle.bg}`}
                      >
                        {statusStyle.label}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {h.restoredByUserName || "Chủ hộ"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {formatDate(h.restoredAt || h.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-[180px] truncate">
                      {h.notes || "—"}
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
