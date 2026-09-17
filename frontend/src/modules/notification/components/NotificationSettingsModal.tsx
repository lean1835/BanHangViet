import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Lock,
  RotateCcw,
  Save,
  FileText,
  DollarSign,
  Package,
  Cpu,
} from "lucide-react";
import {
  useGetNotificationSettingsQuery,
  useUpdateNotificationSettingsBatchMutation,
} from "../services/notificationApi";
import type { INotificationSettingItemResponse } from "../types/IAppNotification";

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: settingsRes, isLoading } = useGetNotificationSettingsQuery(
    undefined,
    { skip: !isOpen }
  );
  const [updateBatch, { isLoading: isSaving }] =
    useUpdateNotificationSettingsBatchMutation();

  const [settingsMap, setSettingsMap] = useState<Record<string, boolean>>({});
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Sync settings when query loads
  useEffect(() => {
    if (settingsRes?.result) {
      const map: Record<string, boolean> = {};
      settingsRes.result.forEach((item) => {
        map[item.notificationType] = item.isEnabled;
      });
      setSettingsMap(map);
    }
  }, [settingsRes]);

  const rawSettings: INotificationSettingItemResponse[] = useMemo(
    () => settingsRes?.result || [],
    [settingsRes?.result]
  );

  // Group settings by category
  const groupedSettings = useMemo(() => {
    const groups: Record<string, INotificationSettingItemResponse[]> = {};
    rawSettings.forEach((item) => {
      const cat = item.category || "GENERAL";
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(item);
    });
    return groups;
  }, [rawSettings]);

  if (!isOpen) return null;

  const handleToggle = (notificationType: string, isMandatory: boolean) => {
    if (isMandatory) return; // Khóa không cho tắt mục bắt buộc theo TC-05
    setSettingsMap((prev) => ({
      ...prev,
      [notificationType]: !prev[notificationType],
    }));
    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);
  };

  const handleSave = async () => {
    try {
      setSaveErrorMessage(null);
      setSaveSuccessMessage(null);

      const payload = Object.entries(settingsMap).map(([type, enabled]) => ({
        notificationType: type,
        isEnabled: enabled,
      }));

      await updateBatch({ settings: payload }).unwrap();
      setSaveSuccessMessage("Đã lưu cấu hình thông báo thành công!");
      setTimeout(() => {
        setSaveSuccessMessage(null);
      }, 3000);
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string } };
      setSaveErrorMessage(
        errorObj?.data?.message || "Không thể cập nhật cài đặt thông báo. Vui lòng thử lại."
      );
    }
  };

  const handleReset = () => {
    if (settingsRes?.result) {
      const map: Record<string, boolean> = {};
      settingsRes.result.forEach((item) => {
        map[item.notificationType] = item.isEnabled;
      });
      setSettingsMap(map);
      setSaveSuccessMessage(null);
      setSaveErrorMessage(null);
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "E_INVOICE":
        return {
          label: "Hóa đơn điện tử & Bán hàng",
          icon: <FileText className="w-4 h-4 text-blue-600" />,
        };
      case "TAX_FINANCE":
        return {
          label: "Tài chính, Công nợ & Thuế",
          icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
        };
      case "INVENTORY":
        return {
          label: "Kho bãi & Hàng hóa",
          icon: <Package className="w-4 h-4 text-amber-600" />,
        };
      case "SYSTEM":
        return {
          label: "Hệ thống & Dữ liệu",
          icon: <Cpu className="w-4 h-4 text-purple-600" />,
        };
      default:
        return {
          label: "Thông báo khác",
          icon: <Sliders className="w-4 h-4 text-slate-600" />,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex flex-col max-h-[90vh] w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cài đặt nhận thông báo công việc
              </h3>
              <p className="text-xs text-slate-500">
                Cấu hình bật/tắt từng nhóm cảnh báo tác nghiệp (Dành cho Chủ hộ)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Thông báo kết quả lưu */}
        {saveSuccessMessage && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{saveSuccessMessage}</span>
          </div>
        )}

        {saveErrorMessage && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800 border border-rose-200 animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{saveErrorMessage}</span>
          </div>
        )}

        {/* Body content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-sm font-medium text-slate-400">
              Đang tải danh sách cài đặt thông báo...
            </div>
          ) : rawSettings.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium text-slate-400">
              Chưa có cấu hình thông báo nào.
            </div>
          ) : (
            Object.entries(groupedSettings).map(([catKey, items]) => {
              const catInfo = getCategoryTitle(catKey);
              return (
                <div
                  key={catKey}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                    {catInfo.icon}
                    <h4 className="text-sm font-bold text-slate-800">
                      {catInfo.label}
                    </h4>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const isChecked =
                        settingsMap[item.notificationType] !== undefined
                          ? settingsMap[item.notificationType]
                          : item.isEnabled;
                      const isMandatory = item.isMandatory;

                      return (
                        <div
                          key={item.notificationType}
                          className="flex items-start justify-between gap-4 py-3 first:pt-1 last:pb-1"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-slate-900">
                                {item.title}
                              </span>
                              {isMandatory && (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                  <Lock className="w-3 h-3" />
                                  Bắt buộc
                                </span>
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                              {item.description}
                            </p>
                            {isMandatory && (
                              <p className="mt-1 text-[11px] italic text-amber-700">
                                * Thông báo an toàn bắt buộc theo quy định, không thể tắt.
                              </p>
                            )}
                          </div>

                          {/* Switch Toggle */}
                          <div className="pt-0.5 shrink-0">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isChecked}
                              aria-label={`Bật tắt ${item.title}`}
                              disabled={isMandatory}
                              onClick={() =>
                                handleToggle(item.notificationType, isMandatory)
                              }
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                isMandatory
                                  ? "bg-blue-600 opacity-60 cursor-not-allowed"
                                  : isChecked
                                  ? "bg-blue-600"
                                  : "bg-slate-300 hover:bg-slate-400"
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isChecked ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/90 px-6 py-3.5">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading || isSaving}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
            <span>Hoàn tác</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || isSaving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
