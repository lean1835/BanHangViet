import React, { useState, useEffect, useMemo } from "react";
// Native SVG Icons (standard 24x24 viewBox, currentColor, strokeWidth=2)
interface SvgIconProps {
  size?: number;
  className?: string;
}

const ClockIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SendIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const RotateCcwIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const SaveIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const HistoryIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <polyline points="12 7 12 12 15 15" />
  </svg>
);

const AlertTriangleIcon: React.FC<SvgIconProps> = ({ size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
import {
  useGetHouseholdSettingsQuery,
  useUpdateHouseholdSettingsMutation,
} from "../services/settingsApi";
import {
  useGetAuditLogsQuery,
} from "@/modules/audit_log/services/auditLogApi";
import type { IActivityLog } from "@/modules/audit_log/types/IAuditLog";
import {
  type IBusinessDeadlinesConfig,
  type IBusinessDeadlinesAuditLog,
  DEFAULT_BUSINESS_DEADLINES,
  DEADLINES_VALIDATION_BOUNDS,
} from "../types/IBusinessDeadlines";
import { useNotification } from "@/hooks/useNotification";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { USER_ROLES } from "@/constants/roles";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";

const SETTING_LABELS: Record<string, string> = {
  maxRetryAttempts: "Số lần tự động gửi lại tối đa",
  retryIntervalMinutes: "Khoảng cách giữa các lần thử lại",
  maxRetryHoursDeadline: "Hạn tối đa gửi lại hóa đơn lỗi",
  maxOrderHoldingHours: "Thời gian giữ đơn hàng treo tối đa",
  bankTransferTimeoutMinutes: "Thời gian chờ chuyển khoản QR",
  returnDaysLimit: "Thời hạn đổi trả hàng",
  returnPolicyDays: "Thời hạn đổi trả hàng",
  maxOfflineSyncHours: "Hạn đồng bộ ngoại tuyến",
  debtReminderDaysBefore: "Số ngày gửi nhắc nhở công nợ trước hạn",
  autoRetryEnabled: "Tự động thử lại khi gửi hóa đơn",
};

const formatBackendAuditLog = (log: IActivityLog): IBusinessDeadlinesAuditLog => {
  let oldParsed: Record<string, unknown> = {};
  let newParsed: Record<string, unknown> = {};
  try {
    if (log.oldValue) oldParsed = JSON.parse(log.oldValue);
  } catch {
    // ignore
  }
  try {
    if (log.newValue) newParsed = JSON.parse(log.newValue);
  } catch {
    // ignore
  }

  const changedKeys = Object.keys(newParsed).filter(
    (k) => oldParsed[k] !== undefined && String(oldParsed[k]) !== String(newParsed[k])
  );

  let settingLabel = "Cập nhật các mốc thời hạn nghiệp vụ";
  let oldValDisplay = "-";
  let newValDisplay = "-";

  if (changedKeys.length === 1) {
    const k = changedKeys[0];
    settingLabel = SETTING_LABELS[k] || k;
    oldValDisplay = String(oldParsed[k]);
    newValDisplay = String(newParsed[k]);
  } else if (changedKeys.length > 1) {
    settingLabel = `Điều chỉnh ${changedKeys.length} mốc thời hạn`;
    oldValDisplay = changedKeys.map((k) => `${SETTING_LABELS[k] || k}: ${oldParsed[k]}`).join(" | ");
    newValDisplay = changedKeys.map((k) => `${SETTING_LABELS[k] || k}: ${newParsed[k]}`).join(" | ");
  } else if (log.oldValue || log.newValue) {
    oldValDisplay = log.oldValue || "-";
    newValDisplay = log.newValue || "-";
  }

  const timestamp = log.createdAt
    ? new Date(log.createdAt).toLocaleString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "-";

  return {
    id: log.id,
    timestamp,
    actorName: log.fullName || log.username || "Chủ hộ",
    actorRole: "Chủ hộ kinh doanh (VT-01)",
    settingKey: changedKeys.length === 1 ? changedKeys[0] : "multiple",
    settingLabel,
    oldValue: oldValDisplay,
    newValue: newValDisplay,
    reason: "Chủ hộ lưu cấu hình thời hạn mới",
  };
};

export const BusinessDeadlinesPanel: React.FC = () => {
  const { showSuccess, showError, showWarning } = useNotification();
  const { currentRole } = useDashboardDemo();

  const isOwner = currentRole === USER_ROLES.OWNER;

  const { data: apiData } = useGetHouseholdSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateHouseholdSettingsMutation();

  const [formData, setFormData] = useState<IBusinessDeadlinesConfig>(DEFAULT_BUSINESS_DEADLINES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const { data: auditLogsData, refetch: refetchAuditLogs } = useGetAuditLogsQuery({
    action: "UPDATE_HOUSEHOLD_SETTINGS",
    size: 20,
  });

  const auditLogs: IBusinessDeadlinesAuditLog[] = useMemo(() => {
    const apiLogs = auditLogsData?.result?.content;
    if (Array.isArray(apiLogs) && apiLogs.length > 0) {
      return apiLogs.map(formatBackendAuditLog);
    }
    return [];
  }, [auditLogsData]);

  useEffect(() => {
    if (apiData?.result) {
      setFormData((prev) => ({
        ...prev,
        ...apiData.result,
      }));
    }
  }, [apiData]);

  // Validation function
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (
      formData.maxRetryAttempts < DEADLINES_VALIDATION_BOUNDS.maxRetryAttempts.min ||
      formData.maxRetryAttempts > DEADLINES_VALIDATION_BOUNDS.maxRetryAttempts.max
    ) {
      newErrors.maxRetryAttempts = `Số lần thử phải từ ${DEADLINES_VALIDATION_BOUNDS.maxRetryAttempts.min} đến ${DEADLINES_VALIDATION_BOUNDS.maxRetryAttempts.max} lần`;
    }

    if (
      formData.retryIntervalMinutes < DEADLINES_VALIDATION_BOUNDS.retryIntervalMinutes.min ||
      formData.retryIntervalMinutes > DEADLINES_VALIDATION_BOUNDS.retryIntervalMinutes.max
    ) {
      newErrors.retryIntervalMinutes = `Khoảng cách giữa các lần thử từ ${DEADLINES_VALIDATION_BOUNDS.retryIntervalMinutes.min} đến ${DEADLINES_VALIDATION_BOUNDS.retryIntervalMinutes.max} phút`;
    }

    if (
      formData.maxRetryHoursDeadline < DEADLINES_VALIDATION_BOUNDS.maxRetryHoursDeadline.min ||
      formData.maxRetryHoursDeadline > DEADLINES_VALIDATION_BOUNDS.maxRetryHoursDeadline.max
    ) {
      newErrors.maxRetryHoursDeadline = `Hạn tối đa gửi lại từ ${DEADLINES_VALIDATION_BOUNDS.maxRetryHoursDeadline.min} đến ${DEADLINES_VALIDATION_BOUNDS.maxRetryHoursDeadline.max} giờ`;
    }

    if (
      formData.maxOrderHoldingHours < DEADLINES_VALIDATION_BOUNDS.maxOrderHoldingHours.min ||
      formData.maxOrderHoldingHours > DEADLINES_VALIDATION_BOUNDS.maxOrderHoldingHours.max
    ) {
      newErrors.maxOrderHoldingHours = `Thời gian treo đơn từ ${DEADLINES_VALIDATION_BOUNDS.maxOrderHoldingHours.min} đến ${DEADLINES_VALIDATION_BOUNDS.maxOrderHoldingHours.max} giờ`;
    }

    if (
      formData.bankTransferTimeoutMinutes < DEADLINES_VALIDATION_BOUNDS.bankTransferTimeoutMinutes.min ||
      formData.bankTransferTimeoutMinutes > DEADLINES_VALIDATION_BOUNDS.bankTransferTimeoutMinutes.max
    ) {
      newErrors.bankTransferTimeoutMinutes = `Thời gian chờ chuyển khoản từ ${DEADLINES_VALIDATION_BOUNDS.bankTransferTimeoutMinutes.min} đến ${DEADLINES_VALIDATION_BOUNDS.bankTransferTimeoutMinutes.max} phút`;
    }

    if (
      formData.returnPolicyDays < DEADLINES_VALIDATION_BOUNDS.returnPolicyDays.min ||
      formData.returnPolicyDays > DEADLINES_VALIDATION_BOUNDS.returnPolicyDays.max
    ) {
      newErrors.returnPolicyDays = `Thời hạn đổi trả hàng từ ${DEADLINES_VALIDATION_BOUNDS.returnPolicyDays.min} đến ${DEADLINES_VALIDATION_BOUNDS.returnPolicyDays.max} ngày`;
    }

    if (
      formData.debtReminderDaysBefore < DEADLINES_VALIDATION_BOUNDS.debtReminderDaysBefore.min ||
      formData.debtReminderDaysBefore > DEADLINES_VALIDATION_BOUNDS.debtReminderDaysBefore.max
    ) {
      newErrors.debtReminderDaysBefore = `Số ngày nhắc nợ từ ${DEADLINES_VALIDATION_BOUNDS.debtReminderDaysBefore.min} đến ${DEADLINES_VALIDATION_BOUNDS.debtReminderDaysBefore.max} ngày`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Detect when deadlines are relaxed compared to defaults
  const relaxedDeadlinesWarnings = React.useMemo(() => {
    const warnings: string[] = [];
    if (formData.maxRetryHoursDeadline > 24) {
      warnings.push(
        "Hạn tối đa gửi lại hóa đơn lỗi > 24 giờ có thể dẫn đến việc báo cáo hóa đơn chậm trễ với Cơ quan Thuế."
      );
    }
    if (formData.returnPolicyDays > 30) {
      warnings.push(
        "Thời hạn đổi trả hàng > 30 ngày có thể gây khó khăn trong việc đối chiếu kỳ kế toán và hóa đơn điều chỉnh."
      );
    }
    return warnings;
  }, [formData]);

  const handleFieldChange = (key: keyof IBusinessDeadlinesConfig, val: number | boolean | string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: val,
    }));
    // Clear error for field
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOwner) {
      showError("Chỉ có vai trò Chủ hộ kinh doanh (VT-01) mới có quyền sửa mốc thời hạn.");
      return;
    }

    if (!validate()) {
      showError("Vui lòng kiểm tra lại các trường cấu hình thời hạn có giá trị chưa hợp lệ.");
      return;
    }

    try {
      await updateSettings(formData).unwrap();
      refetchAuditLogs();
      try {
        localStorage.setItem("household_business_deadlines", JSON.stringify(formData));
      } catch {
        // ignore
      }
      showSuccess("Đã lưu và áp dụng thành công các mốc thời hạn nghiệp vụ của hộ!");
    } catch (err) {
      const msg = getApiErrorMessage(err, "Không thể lưu cấu hình mốc thời hạn");
      showError(msg);
    }
  };

  const handleResetToDefaults = () => {
    setFormData(DEFAULT_BUSINESS_DEADLINES);
    setErrors({});
    setIsResetConfirmOpen(false);
    showWarning("Đã tải lại bộ thông số mặc định khuyến nghị. Nhấn 'Lưu cấu hình' để xác nhận áp dụng.");
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto">
      {/* Header card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-kv-blue-light text-kv-blue-primary">
              <ClockIcon size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">
                Cấu hình mốc thời hạn nghiệp vụ của hộ
              </h1>
              <p className="text-xs text-slate-500">
                Quản lý các mốc thời hạn gửi lại hóa đơn, treo đơn và chính sách đổi trả
              </p>
            </div>
          </div>
        </div>

        {isOwner ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcwIcon size={14} />
              Khôi phục mặc định
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-kv-blue-primary hover:bg-kv-blue-dark rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {isUpdating ? (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang lưu...
                </span>
              ) : (
                <>
                  <SaveIcon size={14} />
                  Lưu cấu hình
                </>
              )}
            </button>
          </div>
        ) : (
          <span className="text-xs px-2.5 py-1 font-semibold rounded-full bg-slate-100 text-slate-600">
            Chế độ chỉ xem (Dành cho Kế toán VT-03)
          </span>
        )}
      </div>

      {/* Relaxed Warnings Alert Box */}
      {relaxedDeadlinesWarnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 flex items-start gap-3 animate-fade-in">
          <AlertTriangleIcon size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold mb-1">Lưu ý về mốc thời hạn nới lỏng:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-800">
              {relaxedDeadlinesWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Main Settings Sections */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* SECTION 1: Hóa đơn điện tử & Gửi thuế */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <SendIcon size={16} className="text-kv-blue-primary" />
            <h2 className="text-sm font-bold text-slate-800">
              1. Hóa đơn điện tử & Quy tắc gửi lại Cơ quan Thuế
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Auto retry switch */}
            <div className="md:col-span-2 flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-700 block">
                  Tự động thử lại khi gửi hóa đơn thất bại
                </span>
                <span className="text-[11px] text-slate-500">
                  Hệ thống tự động quét và gửi lại các hóa đơn gặp lỗi mạng/máy chủ thuế bận theo chu kỳ
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  aria-label="Bật tự động thử lại khi gửi hóa đơn thất bại"
                  disabled={!isOwner}
                  checked={formData.autoRetryEnabled}
                  onChange={(e) => handleFieldChange("autoRetryEnabled", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-kv-blue-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              </label>
            </div>

            {/* Max retry attempts */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số lần tự động gửi lại tối đa:
              </label>
              <div className="relative">
                <input
                  type="number"
                  aria-label="Số lần tự động gửi lại tối đa"
                  disabled={!isOwner || !formData.autoRetryEnabled}
                  value={formData.maxRetryAttempts}
                  onChange={(e) => handleFieldChange("maxRetryAttempts", parseInt(e.target.value) || 0)}
                  className={`w-full h-10 px-3 text-xs font-semibold rounded-lg border bg-white ${
                    errors.maxRetryAttempts ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-kv-blue-primary"
                  } focus:outline-none disabled:bg-slate-100 disabled:text-slate-400`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  lần (1 - 10)
                </span>
              </div>
              {errors.maxRetryAttempts && (
                <p className="text-[11px] text-red-500 mt-1">{errors.maxRetryAttempts}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">Mặc định: 3 lần. Chạm số lần tối đa sẽ chuyển sang xử lý thủ công.</p>
            </div>

            {/* Retry interval */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khoảng cách giữa các lần thử lại:
              </label>
              <div className="relative">
                <input
                  type="number"
                  aria-label="Khoảng cách giữa các lần thử lại"
                  disabled={!isOwner || !formData.autoRetryEnabled}
                  value={formData.retryIntervalMinutes}
                  onChange={(e) => handleFieldChange("retryIntervalMinutes", parseInt(e.target.value) || 0)}
                  className={`w-full h-10 px-3 text-xs font-semibold rounded-lg border bg-white ${
                    errors.retryIntervalMinutes ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-kv-blue-primary"
                  } focus:outline-none disabled:bg-slate-100 disabled:text-slate-400`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  phút (5 - 1440)
                </span>
              </div>
              {errors.retryIntervalMinutes && (
                <p className="text-[11px] text-red-500 mt-1">{errors.retryIntervalMinutes}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">Mặc định: 15 phút. Khuyên dùng từ 15 đến 30 phút.</p>
            </div>

            {/* Max retry hours deadline */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thời hạn tối đa cho phép gửi lại hóa đơn lỗi:
              </label>
              <div className="relative max-w-md">
                <input
                  type="number"
                  aria-label="Thời hạn tối đa cho phép gửi lại hóa đơn lỗi"
                  disabled={!isOwner}
                  value={formData.maxRetryHoursDeadline}
                  onChange={(e) => handleFieldChange("maxRetryHoursDeadline", parseInt(e.target.value) || 0)}
                  className={`w-full h-10 px-3 text-xs font-semibold rounded-lg border bg-white ${
                    errors.maxRetryHoursDeadline ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-kv-blue-primary"
                  } focus:outline-none disabled:bg-slate-100 disabled:text-slate-400`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  giờ (1 - 168 giờ)
                </span>
              </div>
              {errors.maxRetryHoursDeadline && (
                <p className="text-[11px] text-red-500 mt-1">{errors.maxRetryHoursDeadline}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Mặc định: 24 giờ. Quá thời hạn này, hóa đơn bị gắn nhãn Quá hạn gửi thuế và gửi cảnh báo khẩn tới Chủ hộ.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Bán hàng & Treo đơn */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <ClockIcon size={16} className="text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">
              2. Mốc thời hạn Bán hàng & Treo đơn
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Max Order Holding Hours */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thời gian giữ đơn hàng treo tối đa:
              </label>
              <div className="relative">
                <input
                  type="number"
                  aria-label="Thời gian giữ đơn hàng treo tối đa"
                  disabled={!isOwner}
                  value={formData.maxOrderHoldingHours}
                  onChange={(e) => handleFieldChange("maxOrderHoldingHours", parseInt(e.target.value) || 0)}
                  className={`w-full h-10 px-3 text-xs font-semibold rounded-lg border bg-white ${
                    errors.maxOrderHoldingHours ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-kv-blue-primary"
                  } focus:outline-none disabled:bg-slate-100 disabled:text-slate-400`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  giờ (1 - 72)
                </span>
              </div>
              {errors.maxOrderHoldingHours && (
                <p className="text-[11px] text-red-500 mt-1">{errors.maxOrderHoldingHours}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">Mặc định: 12 giờ. Quá hạn sẽ nhắc thu ngân xử lý cuối ca.</p>
            </div>

            {/* Bank transfer timeout */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thời gian chờ chuyển khoản QR:
              </label>
              <div className="relative">
                <input
                  type="number"
                  aria-label="Thời gian chờ chuyển khoản QR"
                  disabled={!isOwner}
                  value={formData.bankTransferTimeoutMinutes}
                  onChange={(e) => handleFieldChange("bankTransferTimeoutMinutes", parseInt(e.target.value) || 0)}
                  className={`w-full h-10 px-3 text-xs font-semibold rounded-lg border bg-white ${
                    errors.bankTransferTimeoutMinutes ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-kv-blue-primary"
                  } focus:outline-none disabled:bg-slate-100 disabled:text-slate-400`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  phút (1 - 1440)
                </span>
              </div>
              {errors.bankTransferTimeoutMinutes && (
                <p className="text-[11px] text-red-500 mt-1">{errors.bankTransferTimeoutMinutes}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">Mặc định: 15 phút. Quá hạn mã QR sẽ tự động hủy phiên thanh toán.</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Đổi trả hàng & Quản lý Công nợ */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <RotateCcwIcon size={16} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-800">
              3. Mốc thời hạn Đổi trả hàng & Nhắc nhở Công nợ
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Return policy days */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thời hạn cho phép đổi / trả hàng:
              </label>
              <div className="relative">
                <input
                  type="number"
                  aria-label="Thời hạn cho phép đổi / trả hàng"
                  disabled={!isOwner}
                  value={formData.returnPolicyDays}
                  onChange={(e) => handleFieldChange("returnPolicyDays", parseInt(e.target.value) || 0)}
                  className={`w-full h-10 px-3 text-xs font-semibold rounded-lg border bg-white ${
                    errors.returnPolicyDays ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-kv-blue-primary"
                  } focus:outline-none disabled:bg-slate-100 disabled:text-slate-400`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  ngày (1 - 90)
                </span>
              </div>
              {errors.returnPolicyDays && (
                <p className="text-[11px] text-red-500 mt-1">{errors.returnPolicyDays}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Mặc định: 7 ngày kể từ ngày hóa đơn được cấp mã. Quá hạn chỉ cho lập phiếu trả khi chủ hộ duyệt ngoại lệ.
              </p>
            </div>

            {/* Debt reminder days before */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số ngày gửi nhắc nhở công nợ trước hạn:
              </label>
              <div className="relative">
                <input
                  type="number"
                  aria-label="Số ngày gửi nhắc nhở công nợ trước hạn"
                  disabled={!isOwner}
                  value={formData.debtReminderDaysBefore}
                  onChange={(e) => handleFieldChange("debtReminderDaysBefore", parseInt(e.target.value) || 0)}
                  className={`w-full h-10 px-3 text-xs font-semibold rounded-lg border bg-white ${
                    errors.debtReminderDaysBefore ? "border-red-400 focus:ring-red-100" : "border-slate-300 focus:border-kv-blue-primary"
                  } focus:outline-none disabled:bg-slate-100 disabled:text-slate-400`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                  ngày (1 - 30)
                </span>
              </div>
              {errors.debtReminderDaysBefore && (
                <p className="text-[11px] text-red-500 mt-1">{errors.debtReminderDaysBefore}</p>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                Mặc định: 3 ngày trước ngày đáo hạn thanh toán của khách hàng hoặc nhà cung cấp.
              </p>
            </div>
          </div>
        </div>

      </form>

      {/* Lịch sử thay đổi cấu hình (Audit Log - Lưu vết kiểm toán) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <HistoryIcon size={16} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-800">
              Nhật ký thay đổi mốc thời hạn (Lưu vết kiểm toán)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {auditLogs.length} bản ghi ghi nhận
          </span>
        </div>

        <div className="overflow-hidden border border-slate-200 rounded-lg shadow-2xs">
          <div
            data-testid="deadlines-audit-log-scroll"
            className="overflow-x-auto max-h-[290px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
          >
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 bg-slate-50">Thời gian</th>
                  <th className="py-2.5 px-3 bg-slate-50">Người thực hiện</th>
                  <th className="py-2.5 px-3 bg-slate-50">Mục điều chỉnh</th>
                  <th className="py-2.5 px-3 bg-slate-50">Giá trị cũ</th>
                  <th className="py-2.5 px-3 bg-slate-50">Giá trị mới</th>
                  <th className="py-2.5 px-3 bg-slate-50">Lý do điều chỉnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      Chưa có nhật ký thay đổi mốc thời hạn nào được ghi nhận.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium whitespace-nowrap text-slate-700">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-800 block">{log.actorName}</span>
                      <span className="text-[10px] text-slate-400">{log.actorRole}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">
                      {log.settingLabel}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px]">
                        {log.oldValue}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700">
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px]">
                        {log.newValue}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {log.reason || "Cập nhật cấu hình định kỳ"}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset Defaults */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-up">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <AlertTriangleIcon size={24} />
              <h3 className="text-base font-bold text-slate-800">
                Xác nhận khôi phục mặc định?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Hành động này sẽ thiết lập lại toàn bộ các mốc thời hạn gửi lại hóa đơn, treo đơn và thời hạn đổi trả về giá trị khuyến nghị chuẩn của Bán Hàng Việt. Bạn có muốn tiếp tục?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
              >
                Đồng ý khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
