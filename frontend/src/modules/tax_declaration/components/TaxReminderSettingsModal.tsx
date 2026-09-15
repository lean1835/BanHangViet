import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X,
  BellRing,
  Clock,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Sliders,
} from "lucide-react";
import {
  useGetReminderSettingsQuery,
  useUpdateReminderSettingsMutation,
  useTriggerScanRemindersMutation,
} from "../services/taxDeclarationApi";
import { useNotification } from "@/hooks/useNotification";
import {
  taxReminderSettingsSchema,
  type TTaxReminderSettingsFormData,
} from "../schemas/periodLockSchemas";
import type { ITaxReminderSettingsResponse } from "../types/ITaxReminder";

interface TaxReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isOwner?: boolean;
  initialSettings?: ITaxReminderSettingsResponse;
}

export const TaxReminderSettingsModal: React.FC<TaxReminderSettingsModalProps> = ({
  isOpen,
  onClose,
  isOwner = true,
  initialSettings,
}) => {
  const { showSuccess, showError, showWarning } = useNotification();
  const { data: settingsRes, isLoading: isQueryLoading } = useGetReminderSettingsQuery(
    undefined,
    { skip: !isOpen || Boolean(initialSettings) }
  );

  const isFetching = isQueryLoading && !initialSettings;

  const [updateSettings, { isLoading: isUpdating }] =
    useUpdateReminderSettingsMutation();
  const [triggerScan, { isLoading: isScanning }] =
    useTriggerScanRemindersMutation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TTaxReminderSettingsFormData>({
    resolver: zodResolver(taxReminderSettingsSchema),
    mode: "onChange",
    defaultValues: {
      taxPeriodType: "QUARTERLY",
      taxReminderDaysBefore: 5,
      taxReminderEnabled: true,
    },
  });

  useEffect(() => {
    const res = settingsRes?.result || initialSettings;
    if (res) {
      reset({
        taxPeriodType: res.taxPeriodType === "MONTHLY" ? "MONTHLY" : "QUARTERLY",
        taxReminderDaysBefore: res.taxReminderDaysBefore ?? 5,
        taxReminderEnabled: res.taxReminderEnabled ?? true,
      });
    }
  }, [settingsRes, initialSettings, reset]);

  if (!isOpen) return null;

  const periodType = watch("taxPeriodType");
  const reminderDays = watch("taxReminderDaysBefore");

  const onSubmit = async (data: TTaxReminderSettingsFormData) => {
    if (!isOwner) {
      showWarning("Chỉ Chủ hộ kinh doanh mới có quyền cập nhật cấu hình nhắc nhở.");
      return;
    }

    try {
      await updateSettings(data).unwrap();
      showSuccess("Cập nhật cấu hình nhắc lịch nộp tờ khai thành công!");
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể lưu cấu hình nhắc lịch nộp tờ khai.";
      showError(msg);
    }
  };

  const handleTriggerScan = async () => {
    try {
      const res = await triggerScan().unwrap();
      const count = res.result?.activeReminders?.length || 0;
      showSuccess(
        `Đã quét kiểm tra hạn thành công! Phát hiện ${count} kỳ cần chú ý.`
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể quét nhắc hạn nộp tờ khai.";
      showError(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-settings-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
              <BellRing className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3
                id="reminder-settings-title"
                className="text-sm font-extrabold text-slate-800"
              >
                Cài đặt nhắc lịch nộp tờ khai thuế
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chủ động nhận thông báo trước hạn để hoàn tất hồ sơ và tránh bị phạt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5 overflow-y-auto flex-1">
          {isFetching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs">Đang tải cấu hình...</span>
            </div>
          ) : (
            <>
              {/* 1. Trạng thái Bật/Tắt nhắc nhở */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tự động nhắc lịch nộp tờ khai</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Gửi thông báo đến Trung tâm thông báo khi kỳ thuế sắp đến hạn
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...register("taxReminderEnabled")}
                    className="sr-only peer"
                    disabled={!isOwner}
                  />
                  <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

              {/* 2. Kỳ kê khai thuế áp dụng */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kỳ kê khai thuế của hộ kinh doanh</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => isOwner && setValue("taxPeriodType", "QUARTERLY", { shouldValidate: true })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      periodType === "QUARTERLY"
                        ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    } ${!isOwner ? "cursor-not-allowed opacity-75" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">
                        Theo Quý (3 tháng)
                      </span>
                      {periodType === "QUARTERLY" && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Hạn nộp: Ngày cuối cùng của tháng đầu quý tiếp theo (30/04, 31/07, 31/10, 31/01).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => isOwner && setValue("taxPeriodType", "MONTHLY", { shouldValidate: true })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      periodType === "MONTHLY"
                        ? "border-blue-600 bg-blue-50/50 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    } ${!isOwner ? "cursor-not-allowed opacity-75" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">
                        Theo Tháng
                      </span>
                      {periodType === "MONTHLY" && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Hạn nộp: Ngày 20 của tháng kế tiếp của kỳ kê khai.
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Số ngày nhắc trước hạn */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>Số ngày nhắc trước thời hạn nộp</span>
                  </label>
                  <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                    {reminderDays} ngày
                  </span>
                </div>

                <input
                  type="range"
                  min={1}
                  max={30}
                  {...register("taxReminderDaysBefore", { valueAsNumber: true })}
                  disabled={!isOwner}
                  className="w-full accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
                />

                {/* Phím chọn nhanh */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Chọn nhanh:</span>
                  {[3, 5, 7, 10, 15].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => isOwner && setValue("taxReminderDaysBefore", days, { shouldValidate: true })}
                      disabled={!isOwner}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                        reminderDays === days
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      } disabled:cursor-not-allowed`}
                    >
                      {days} ngày
                    </button>
                  ))}
                </div>
                {errors.taxReminderDaysBefore && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">
                    {errors.taxReminderDaysBefore.message}
                  </p>
                )}
              </div>

              {/* Quyền RBAC nhắc nhở */}
              {!isOwner && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>
                    Chỉ tài khoản Chủ hộ kinh doanh mới có quyền chỉnh sửa cấu hình này.
                  </span>
                </div>
              )}
            </>
          )}

          {/* Footer nút hành động */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTriggerScan}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 font-semibold text-xs transition-colors shadow-2xs cursor-pointer select-none disabled:opacity-50"
            >
              {isScanning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Quét kiểm tra ngay</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy
              </button>
              {isOwner && (
                <button
                  type="submit"
                  disabled={isUpdating || isFetching}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition-all shadow-xs cursor-pointer select-none disabled:opacity-50"
                >
                  {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Lưu cấu hình</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
