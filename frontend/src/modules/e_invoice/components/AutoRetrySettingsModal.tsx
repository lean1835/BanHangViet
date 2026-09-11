import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Loader2 } from "lucide-react";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import {
  useGetHouseholdSettingsQuery,
  useUpdateHouseholdSettingsMutation,
} from "@/modules/settings/services/settingsApi";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

interface AutoRetrySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RETRY_ATTEMPT_OPTIONS = [
  { value: 1, label: "1 lần" },
  { value: 3, label: "3 lần (Chuẩn)" },
  { value: 5, label: "5 lần" },
  { value: 10, label: "10 lần" },
];

const RETRY_INTERVAL_OPTIONS = [
  { value: 5, label: "5 phút" },
  { value: 15, label: "15 phút (Khuyên dùng)" },
  { value: 30, label: "30 phút" },
  { value: 60, label: "1 giờ" },
];

const DEADLINE_OPTIONS = [
  { value: 12, label: "12 giờ" },
  { value: 24, label: "24 giờ (Cuối ngày)" },
  { value: 48, label: "48 giờ (2 ngày)" },
];

export const AutoRetrySettingsModal: React.FC<AutoRetrySettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dialogRef = useAccessibleDialog({ isOpen, onClose });
  const { showSuccess, showError } = useNotification();
  const { data, isLoading: isFetching } = useGetHouseholdSettingsQuery(undefined, {
    skip: !isOpen,
  });
  const [updateSettings, { isLoading: isUpdating }] = useUpdateHouseholdSettingsMutation();

  const [autoRetryEnabled, setAutoRetryEnabled] = useState<boolean>(true);
  const [maxRetryAttempts, setMaxRetryAttempts] = useState<number>(3);
  const [retryIntervalMinutes, setRetryIntervalMinutes] = useState<number>(15);
  const [maxRetryHoursDeadline, setMaxRetryHoursDeadline] = useState<number>(24);

  useEffect(() => {
    if (data?.result) {
      setAutoRetryEnabled(data.result.autoRetryEnabled ?? true);
      setMaxRetryAttempts(data.result.maxRetryAttempts ?? 3);
      setRetryIntervalMinutes(data.result.retryIntervalMinutes ?? 15);
      setMaxRetryHoursDeadline(data.result.maxRetryHoursDeadline ?? 24);
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateSettings({
        autoRetryEnabled,
        maxRetryAttempts,
        retryIntervalMinutes,
        maxRetryHoursDeadline,
      }).unwrap();

      showSuccess("Đã lưu cấu hình tự động gửi lại hóa đơn!");
      onClose();
    } catch (err) {
      const msg = getApiErrorMessage(err, "Không thể lưu cấu hình");
      showError(msg);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auto-retry-settings-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/60">
          <div>
            <h2
              id="auto-retry-settings-title"
              className="font-bold text-slate-800 text-base leading-snug"
            >
              Cấu hình tự động gửi lại hóa đơn
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tự động gửi lại hóa đơn lỗi kết nối mạng theo chu kỳ
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        {isFetching ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-kv-blue-primary animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Đang tải cấu hình...</span>
          </div>
        ) : (
          <div className="p-6 space-y-5 text-slate-800">
            {/* 1. Toggle Tiến trình tự động */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="space-y-0.5 pr-4">
                <span className="font-semibold text-xs text-slate-900 block">
                  Tiến trình tự động gửi lại
                </span>
                <span className="text-[11px] text-slate-500 font-normal leading-relaxed block">
                  Hệ thống định kỳ quét các hóa đơn chưa được cấp mã do gián đoạn kết nối
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoRetryEnabled}
                  onChange={(e) => setAutoRetryEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kv-blue-primary" />
              </label>
            </div>

            {/* 2. Số lần thử tối đa */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Số lần gửi lại tối đa</span>
                <span className="text-slate-500 text-[11px]">Quá số lần sẽ chuyển xử lý thủ công</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {RETRY_ATTEMPT_OPTIONS.map((opt) => {
                  const active = maxRetryAttempts === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMaxRetryAttempts(opt.value)}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                        active
                          ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Khoảng cách giữa các lần gửi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">
                  Khoảng cách tối thiểu giữa các lần gửi
                </span>
                <span className="text-slate-500 text-[11px]">Giãn cách tự động</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {RETRY_INTERVAL_OPTIONS.map((opt) => {
                  const active = retryIntervalMinutes === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRetryIntervalMinutes(opt.value)}
                      className={`py-2 px-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                        active
                          ? "bg-kv-blue-primary text-white border-kv-blue-primary shadow-xs"
                          : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Hạn chót xử lý hóa đơn lỗi */}
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-950">
                  Thời hạn tối đa xử lý hóa đơn lỗi
                </span>
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  {maxRetryHoursDeadline} giờ
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80 leading-relaxed font-normal">
                Hóa đơn gián đoạn quá thời hạn này kể từ lúc lập sẽ được kích hoạt cảnh báo khẩn cấp trên trang điều khiển.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                {DEADLINE_OPTIONS.map((opt) => {
                  const active = maxRetryHoursDeadline === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMaxRetryHoursDeadline(opt.value)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer text-center ${
                        active
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-white text-slate-700 border-amber-200 hover:border-amber-300 hover:bg-amber-50/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUpdating || isFetching}
            className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-kv-blue-primary hover:bg-kv-blue-dark text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            <span>{isUpdating ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
