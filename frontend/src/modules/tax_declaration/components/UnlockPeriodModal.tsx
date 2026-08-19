import React from "react";
import { createPortal } from "react-dom";
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

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-modal-backdrop">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-modal-scale">
        {/* Header */}
        <div className="bg-amber-50 px-5 py-4 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-800">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
              <Unlock className="w-5 h-5 shrink-0 stroke-[2.2]" />
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
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5 text-slate-600">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 stroke-[2.2]" />
            <p className="text-[11px] leading-relaxed">
              Mở lại kỳ sẽ chuyển trạng thái về <strong>Đã lập bảng kê (Đang mở)</strong>. Mọi thao tác mở lại đều được <strong>lưu vết vĩnh viễn vào Nhật ký kiểm toán</strong>.
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
              className={`w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs focus:outline-none focus:bg-white resize-none transition-all ${
                errors.reason
                  ? "border-rose-400 focus:border-rose-500"
                  : "border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/10"
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
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 active:scale-95 text-white font-bold transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin shrink-0 stroke-[2.5]" />
              ) : (
                <Unlock className="w-4 h-4 shrink-0 stroke-[2.2]" />
              )}
              <span>Xác nhận mở lại kỳ</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
