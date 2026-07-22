import React from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";

const cancelInvoiceSchema = z.object({
  cancelReason: z
    .string()
    .trim()
    .min(10, "Lý do hủy hóa đơn phải có ít nhất 10 ký tự.")
    .max(500, "Lý do hủy không được vượt quá 500 ký tự."),
});

type TCancelInvoiceFormData = z.infer<typeof cancelInvoiceSchema>;

interface CancelInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  invoiceLookupCode: string;
}

export const CancelInvoiceModal: React.FC<CancelInvoiceModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  invoiceLookupCode,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TCancelInvoiceFormData>({
    resolver: zodResolver(cancelInvoiceSchema),
    defaultValues: {
      cancelReason: "",
    },
  });

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose: () => {
      if (isSubmitting) return;
      reset();
      onClose();
    },
  });

  if (!isOpen) return null;

  const onFormSubmit = async (data: TCancelInvoiceFormData) => {
    try {
      await onConfirm(data.cancelReason.trim());
      reset();
      onClose();
    } catch {
      // Error handling is managed by parent via toast notification
    }
  };

  return createPortal(
    <div
      onClick={() => {
        if (isSubmitting) return;
        reset();
        onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-900/60 p-3 animate-backdrop-fade-in sm:p-4"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Hủy hóa đơn ${invoiceLookupCode}`}
        className="app-modal-panel w-full max-w-md overflow-hidden rounded-xl border border-rose-100 bg-white shadow-2xl animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-rose-600 px-4 py-3 text-white">
          <h2 className="text-xs font-bold uppercase tracking-wider">
            Yêu cầu hủy hóa đơn
          </h2>
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={isSubmitting}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="p-4 sm:p-5 flex flex-col gap-4 font-semibold text-slate-700 text-xs">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 leading-normal font-medium">
              Bạn đang yêu cầu hủy hóa đơn có mã tra cứu <span className="font-bold">{invoiceLookupCode}</span>.
              Hành động này không thể hoàn tác và sẽ được ghi vào nhật ký hệ thống.
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-500 font-bold uppercase text-[9px]">
                Lý do hủy hóa đơn (Bắt buộc, tối thiểu 10 ký tự):
              </label>
              <textarea
                {...register("cancelReason")}
                disabled={isSubmitting}
                placeholder="Nhập lý do hủy hóa đơn chi tiết..."
                rows={4}
                className="border border-slate-300 p-2.5 rounded-lg focus:outline-none focus:border-rose-500 text-xs font-medium resize-none"
              />
              {errors.cancelReason && (
                <span className="text-rose-600 text-[10px] font-bold">
                  ⚠️ {errors.cancelReason.message}
                </span>
              )}
            </div>
          </div>

          <div className="app-modal-footer flex flex-col-reverse gap-2 border-t border-slate-200 bg-white p-4 sm:flex-row sm:justify-end text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                reset();
                onClose();
              }}
              disabled={isSubmitting}
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex min-h-11 items-center justify-center rounded-lg bg-rose-600 px-5 text-xs font-bold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting && (
                <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              XÁC NHẬN HỦY
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CancelInvoiceModal;
