import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ShoppingBag, Loader2, AlertCircle, Sparkles } from "lucide-react";
import {
  generatePeriodSchema,
  type TGeneratePeriodFormData,
} from "../schemas/periodLockSchemas";
import { useGeneratePurchaseRegisterMutation } from "../services/taxDeclarationApi";
import { useNotification } from "@/hooks/useNotification";

interface IGeneratePurchaseRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPeriodType?: "QUARTERLY" | "MONTHLY";
  defaultYear?: number;
  defaultPeriodNumber?: number;
  onSuccess?: (periodId: string) => void;
}

export const GeneratePurchaseRegisterModal: React.FC<
  IGeneratePurchaseRegisterModalProps
> = ({
  isOpen,
  onClose,
  defaultPeriodType = "QUARTERLY",
  defaultYear = new Date().getFullYear(),
  defaultPeriodNumber = Math.floor((new Date().getMonth() + 3) / 3),
  onSuccess,
}) => {
  const { showSuccess, showError } = useNotification();
  const [generatePurchaseRegister, { isLoading }] =
    useGeneratePurchaseRegisterMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<TGeneratePeriodFormData>({
    resolver: zodResolver(generatePeriodSchema),
    defaultValues: {
      periodType: defaultPeriodType,
      year: defaultYear,
      periodNumber: defaultPeriodNumber,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        periodType: defaultPeriodType,
        year: defaultYear,
        periodNumber: defaultPeriodNumber,
      });
    }
  }, [isOpen, defaultPeriodType, defaultYear, defaultPeriodNumber, reset]);

  const periodType = watch("periodType");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  const onSubmit = async (data: TGeneratePeriodFormData) => {
    try {
      const res = await generatePurchaseRegister({
        periodType: data.periodType,
        year: Number(data.year),
        periodNumber: Number(data.periodNumber),
      }).unwrap();

      if (res.result) {
        showSuccess(
          `Lập bảng kê mua vào ${res.result.periodName} thành công! (${res.result.totalReceiptCount} phiếu nhập)`
        );
        reset();
        onClose();
        if (onSuccess) onSuccess(res.result.periodId);
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string; code?: number } };
      const errorMsg =
        apiErr?.data?.message ||
        "Không thể lập bảng kê mua vào cho kỳ này. Vui lòng kiểm tra các phiếu nhập kho đã lưu.";
      showError(errorMsg);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-modal-backdrop">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all animate-modal-scale border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/80 text-indigo-600 shadow-xs border border-indigo-100/50">
              <ShoppingBag className="h-5 w-5 shrink-0 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>Lập bảng kê hàng hóa mua vào</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tổng hợp các phiếu nhập kho phát sinh trong kỳ (NCL-12-CN-006)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:scale-90 transition-all duration-150 cursor-pointer"
          >
            <X className="h-5 w-5 stroke-[2]" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
          {/* Loại kỳ */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Loại kỳ tính thuế <span className="text-rose-500">*</span>
            </label>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-xs font-bold transition-all duration-150 active:scale-95 select-none ${
                  periodType === "QUARTERLY"
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  value="QUARTERLY"
                  {...register("periodType")}
                  className="sr-only"
                />
                <span>Theo Quý (3 tháng)</span>
              </label>

              <label
                className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-xs font-bold transition-all duration-150 active:scale-95 select-none ${
                  periodType === "MONTHLY"
                    ? "border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-xs ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  value="MONTHLY"
                  {...register("periodType")}
                  className="sr-only"
                />
                <span>Theo Tháng</span>
              </label>
            </div>
          </div>

          {/* Chọn Quý / Tháng & Năm */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                {periodType === "QUARTERLY" ? "Chọn Quý" : "Chọn Tháng"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("periodNumber", { valueAsNumber: true })}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3 py-2.5 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all"
              >
                {periodType === "QUARTERLY" ? (
                  <>
                    <option value={1}>Quý 1 (T1 - T3)</option>
                    <option value={2}>Quý 2 (T4 - T6)</option>
                    <option value={3}>Quý 3 (T7 - T9)</option>
                    <option value={4}>Quý 4 (T10 - T12)</option>
                  </>
                ) : (
                  Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))
                )}
              </select>
              {errors.periodNumber && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">
                  {errors.periodNumber.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                Năm kê khai <span className="text-rose-500">*</span>
              </label>
              <select
                {...register("year", { valueAsNumber: true })}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white focus:bg-white px-3 py-2.5 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-all"
              >
                <option value={2026}>Năm 2026</option>
                <option value={2025}>Năm 2025</option>
                <option value={2024}>Năm 2024</option>
              </select>
              {errors.year && (
                <p className="mt-1 text-[11px] text-rose-500 font-medium">
                  {errors.year.message}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-blue-50/80 p-3.5 text-xs text-blue-900 flex items-start gap-2.5 border border-blue-200/80 shadow-2xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5 stroke-[2.2]" />
            <span className="text-[11px] leading-relaxed text-blue-800">
              Hệ thống sẽ lọc các phiếu nhập đã lưu trong kỳ, trừ hàng trả lại NCC, rồi gom nhóm theo từng Nhà cung cấp kèm tổng toàn kỳ.
            </span>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 active:scale-95 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 stroke-[2.5]" />
              )}
              <span>Tổng hợp bảng kê mua vào</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
