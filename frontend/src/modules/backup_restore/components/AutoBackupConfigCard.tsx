import React, { useState, useEffect } from "react";
import { Clock, Save, Loader2, AlertCircle } from "lucide-react";
import {
  BACKUP_TYPES,
  BACKUP_TYPE_LABELS,
  BACKUP_RESTORE_CONFIG,
  BACKUP_RESTORE_UI,
  type TBackupType,
} from "@/constants/backupRestore";
import { useNotification } from "@/hooks/useNotification";
import { useUpdateBackupConfigMutation } from "../services/autoBackupApi";
import type { IBackupConfig } from "../types/IBackupRestore";

interface AutoBackupConfigCardProps {
  config?: IBackupConfig | null;
  isLoading: boolean;
}

export const AutoBackupConfigCard: React.FC<AutoBackupConfigCardProps> = ({
  config,
  isLoading,
}) => {
  const { showSuccess, showError } = useNotification();
  const [updateConfig, { isLoading: isSaving }] = useUpdateBackupConfigMutation();

  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [scheduledTime, setScheduledTime] = useState<string>("02:00");
  const [retentionCount, setRetentionCount] = useState<number>(30);
  const [backupType, setBackupType] = useState<TBackupType>(BACKUP_TYPES.FULL);

  useEffect(() => {
    if (config) {
      setIsEnabled(config.isAutoBackupEnabled);
      setScheduledTime(config.scheduledTime || "02:00");
      setRetentionCount(config.retentionCount || 30);
      setBackupType(config.backupType || BACKUP_TYPES.FULL);
    }
  }, [config]);

  const isTimeValid = BACKUP_RESTORE_CONFIG.TIME_REGEX.test(scheduledTime);
  const isRetentionValid =
    retentionCount >= BACKUP_RESTORE_CONFIG.MIN_RETENTION_COUNT &&
    retentionCount <= BACKUP_RESTORE_CONFIG.MAX_RETENTION_COUNT;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isTimeValid) {
      showError("Thời gian sao lưu không đúng định dạng HH:mm (từ 00:00 đến 23:59)!");
      return;
    }

    if (!isRetentionValid) {
      showError("Số lượng bản sao lưu giữ lại phải từ 1 đến 100 bản!");
      return;
    }

    try {
      await updateConfig({
        isAutoBackupEnabled: isEnabled,
        scheduledTime,
        retentionCount: Number(retentionCount),
        backupType,
      }).unwrap();

      showSuccess("Cập nhật cấu hình sao lưu tự động thành công!");
    } catch {
      showError("Không thể cập nhật cấu hình sao lưu. Vui lòng thử lại!");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-5">
        <div className="p-2 bg-blue-50 text-kv-blue-primary rounded-lg">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-800 text-base leading-tight">
            {BACKUP_RESTORE_UI.CONFIG.CARD_TITLE}
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Thiết lập thời gian chạy sao lưu định kỳ và chính sách lưu giữ số lượng bản sao
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Toggle auto-backup */}
        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
          <div className="space-y-0.5">
            <span className="font-bold text-slate-800 text-xs block">
              {BACKUP_RESTORE_UI.CONFIG.ENABLE_LABEL}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Hệ thống sẽ tự động tạo một bản sao lưu CSDL hoàn chỉnh vào khung giờ chỉ định hằng ngày
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              disabled={isLoading || isSaving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kv-blue-primary"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scheduled Time */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {BACKUP_RESTORE_UI.CONFIG.TIME_LABEL} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              placeholder="02:00"
              maxLength={5}
              disabled={isLoading || isSaving || !isEnabled}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 bg-white shadow-xs ${
                !isTimeValid && isEnabled
                  ? "border-rose-300 focus:ring-rose-200"
                  : "border-slate-300 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary"
              } ${!isEnabled ? "opacity-60 bg-slate-50" : ""}`}
            />
            {!isTimeValid && isEnabled && (
              <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> Định dạng hợp lệ là HH:mm (00:00 - 23:59)
              </p>
            )}
            <p className="text-[11px] text-slate-400 font-medium">
              Khuyến nghị chọn khung giờ nửa đêm (00:00 - 04:00) khi cửa hàng ít giao dịch.
            </p>
          </div>

          {/* Retention Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {BACKUP_RESTORE_UI.CONFIG.RETENTION_LABEL} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={BACKUP_RESTORE_CONFIG.MIN_RETENTION_COUNT}
              max={BACKUP_RESTORE_CONFIG.MAX_RETENTION_COUNT}
              value={retentionCount}
              onChange={(e) => setRetentionCount(Number(e.target.value))}
              disabled={isLoading || isSaving || !isEnabled}
              className={`w-full border rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 bg-white shadow-xs ${
                !isRetentionValid && isEnabled
                  ? "border-rose-300 focus:ring-rose-200"
                  : "border-slate-300 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary"
              } ${!isEnabled ? "opacity-60 bg-slate-50" : ""}`}
            />
            {!isRetentionValid && isEnabled && (
              <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" /> Giới hạn lưu trữ từ 1 đến 100 bản
              </p>
            )}
            <p className="text-[11px] text-slate-400 font-medium">
              Khi số bản vượt quá {retentionCount}, bản cũ nhất sẽ tự động dọn dẹp (TC-02).
            </p>
          </div>

          {/* Backup Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              {BACKUP_RESTORE_UI.CONFIG.TYPE_LABEL}
            </label>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value as TBackupType)}
              disabled={isLoading || isSaving || !isEnabled}
              className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-kv-blue-primary/20 focus:border-kv-blue-primary bg-white shadow-xs ${
                !isEnabled ? "opacity-60 bg-slate-50" : ""
              }`}
            >
              {Object.entries(BACKUP_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 font-medium">
              Mặc định toàn bộ cơ sở dữ liệu bao gồm Hàng hóa, Đơn hàng và Hóa đơn.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isLoading || isSaving || !isTimeValid || !isRetentionValid}
            className="bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold px-5 h-9 rounded-lg transition-all flex items-center gap-2 text-xs shadow-xs disabled:opacity-50 cursor-pointer active:scale-98"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{BACKUP_RESTORE_UI.CONFIG.SAVING_BTN}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{BACKUP_RESTORE_UI.CONFIG.SAVE_BTN}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
