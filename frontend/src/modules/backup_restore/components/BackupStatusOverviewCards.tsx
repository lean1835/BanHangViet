import React from "react";
import {
  Database,
  Clock,
  HardDrive,
  Play,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { BACKUP_RESTORE_UI, BACKUP_STATUS_STYLES } from "@/constants/backupRestore";
import { formatDateShort } from "@/utils/dateFormatter";
import type { IBackupStatusOverview } from "../types/IBackupRestore";

interface BackupStatusOverviewCardsProps {
  overview?: IBackupStatusOverview | null;
  isLoading: boolean;
  isTriggering: boolean;
  onTriggerBackup: () => void;
}

const formatStorageSize = (bytes?: number | null): string => {
  if (bytes == null || isNaN(bytes) || bytes === 0) return "0 KB";
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(2)} MB`;
};

export const BackupStatusOverviewCards: React.FC<BackupStatusOverviewCardsProps> = ({
  overview,
  isLoading,
  isTriggering,
  onTriggerBackup,
}) => {
  const isEnabled = overview?.isAutoBackupEnabled ?? false;
  const lastStatus = overview?.lastBackupStatus;
  const statusStyle = lastStatus ? BACKUP_STATUS_STYLES[lastStatus] : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Auto Backup Schedule Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">
            {BACKUP_RESTORE_UI.OVERVIEW.AUTO_STATUS_LABEL}
          </span>
          <div
            className={`p-2 rounded-lg ${
              isEnabled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
            }`}
          >
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="h-6 w-24 bg-slate-100 animate-pulse rounded" />
          ) : (
            <div className="flex items-center gap-2">
              <span
                className={`font-black text-sm px-2.5 py-0.5 rounded-full ${
                  isEnabled
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {isEnabled ? "Đang bật" : "Đang tắt"}
              </span>
              {isEnabled && (
                <span className="text-xs font-bold text-slate-600">
                  ({overview?.scheduledTime || "02:00"})
                </span>
              )}
            </div>
          )}
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Chạy định kỳ mỗi ngày lúc {overview?.scheduledTime || "02:00"}
          </p>
        </div>
      </div>

      {/* 2. Retention Policy & Count */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">
            {BACKUP_RESTORE_UI.OVERVIEW.RETENTION_LABEL}
          </span>
          <div className="p-2 bg-blue-50 text-kv-blue-primary rounded-lg">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="h-6 w-20 bg-slate-100 animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-800">
                {overview?.activeBackupCount ?? 0}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                / {overview?.retentionCount ?? 30} bản lưu tối đa
              </span>
            </div>
          )}
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Tự động dọn dẹp bản cũ nhất khi vượt ngưỡng
          </p>
        </div>
      </div>

      {/* 3. Total Storage */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">
            {BACKUP_RESTORE_UI.OVERVIEW.TOTAL_STORAGE_LABEL}
          </span>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <HardDrive className="w-4 h-4" />
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="h-6 w-24 bg-slate-100 animate-pulse rounded" />
          ) : (
            <span className="text-lg font-black text-slate-800">
              {formatStorageSize(overview?.totalStorageSizeBytes)}
            </span>
          )}
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Tổng kích thước các tệp sao lưu trên hệ thống
          </p>
        </div>
      </div>

      {/* 4. Last Backup Status & Quick Trigger */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">
            {BACKUP_RESTORE_UI.OVERVIEW.LAST_BACKUP_LABEL}
          </span>
          <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="space-y-2">
          {isLoading ? (
            <div className="h-6 w-28 bg-slate-100 animate-pulse rounded" />
          ) : overview?.lastBackupTime ? (
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="text-xs font-bold text-slate-700">
                {formatDateShort(overview.lastBackupTime)}
              </span>
              {statusStyle && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle.bg}`}
                >
                  {statusStyle.label}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-semibold text-slate-400">
              Chưa có lần sao lưu nào
            </span>
          )}

          <button
            onClick={onTriggerBackup}
            disabled={isTriggering}
            className="w-full bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {isTriggering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{BACKUP_RESTORE_UI.OVERVIEW.TRIGGERING_BTN}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{BACKUP_RESTORE_UI.OVERVIEW.TRIGGER_BTN}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
