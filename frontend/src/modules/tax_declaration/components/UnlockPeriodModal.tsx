import React from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Unlock, AlertCircle, X, Loader2 } from "lucide-react";
import {
  unlockPeriodSchema,
  type TUnlockPeriodFormData,
} from "../schemas/periodLockSchemas";

interface IUnlockPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  periodLabel: string;
  onConfirmUnlock: (reason: string) => Promise<void>;
  isLoading: boolean;
}

export const UnlockPeriodModal: React.FC<IUnlockPeriodModalProps> = ({
  isOpen,
  onClose,
  periodLabel,
  onConfirmUnlock,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TUnlockPeriodFormData>({
    resolver: zodResolver(unlockPeriodSchema),
    defaultValues: {
      reason: "",
    },
  });

  if (!isOpen) return null;

  const onSubmit: SubmitHandler<TUnlockPeriodFormData> = async (data) => {
    await onConfirmUnlock(data.reason.trim());
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-amber-50 px-5 py-4 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-800">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Unlock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-800">
                Mở lại kỳ kê khai thuế
              </h2>
              <p className="text-[11px] text-amber-700 font-medium">
                {periodLabel}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5 text-slate-600">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Mở lại kỳ sẽ chuyển trạng thái về <strong>Dự thảo (Đang mở)</strong>. Mọi thao tác mở lại đều được <strong>lưu vết vĩnh viễn vào Nhật ký kiểm toán</strong>.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700 text-[11px]">
              Lý do mở lại kỳ kê khai (Bắt buộc): <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="VD: Cần lập hóa đơn điều chỉnh bổ sung theo thông báo từ Cơ quan Thuế..."
              {...register("reason")}
              className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs focus:outline-none focus:bg-white resize-none ${
                errors.reason
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-slate-200 focus:border-kv-blue-primary"
              }`}
            />
            {errors.reason && (
              <p className="text-[11px] text-rose-500 font-semibold mt-1">
                {errors.reason.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span>Xác nhận mở lại kỳ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
