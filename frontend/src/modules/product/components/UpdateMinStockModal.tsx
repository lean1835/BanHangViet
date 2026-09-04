import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PRODUCT_FORM_LIMITS, PRODUCT_VALIDATION_MESSAGES } from "@/constants/product";
import { useUpdateMinStockMutation } from "@/modules/product/services/productApi";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { useNotification } from "@/hooks/useNotification";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage";
import { formatNumber } from "@/utils/formatCurrency";

interface UpdateMinStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    sku: string;
    unit: string;
    stockQuantity: number;
    minStockQuantity: number;
  } | null;
}

const updateMinStockSchema = z.object({
  minStockQuantity: z
    .number({ invalid_type_error: PRODUCT_VALIDATION_MESSAGES.MIN_STOCK_REQUIRED })
    .min(
      PRODUCT_FORM_LIMITS.MIN_NON_NEGATIVE_VALUE,
      PRODUCT_VALIDATION_MESSAGES.MIN_STOCK_NEGATIVE
    ),
});

type FormValues = z.infer<typeof updateMinStockSchema>;

export const UpdateMinStockModal: React.FC<UpdateMinStockModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { showSuccess, showError } = useNotification();
  const [updateMinStock, { isLoading: isSubmitting }] = useUpdateMinStockMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(updateMinStockSchema),
    defaultValues: {
      minStockQuantity: 0,
    },
  });

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSubmitting,
  });

  useEffect(() => {
    if (isOpen && product) {
      reset({
        minStockQuantity: product.minStockQuantity || 0,
      });
    }
  }, [isOpen, product, reset]);

  if (!isOpen || !product) return null;

  const onSubmit = async (values: FormValues) => {
    try {
      await updateMinStock({
        id: product.id,
        minStockQuantity: values.minStockQuantity,
      }).unwrap();
      showSuccess(`Cập nhật ngưỡng tồn tối thiểu cho "${product.name}" thành công!`);
      onClose();
    } catch (error: unknown) {
      showError(
        getApiErrorMessage(error, "Không thể cập nhật ngưỡng tồn tối thiểu!")
      );
    }
  };

  return createPortal(
    <div
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-2 backdrop-blur-sm animate-backdrop-fade-in sm:items-center sm:p-4"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Cài đặt ngưỡng tồn tối thiểu"
        className="app-modal-panel flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="app-modal-header flex items-center justify-between bg-kv-blue-primary px-5 py-3.5 text-white">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-xs font-bold uppercase tracking-wider">
              Cài đặt ngưỡng tồn tối thiểu
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            aria-label="Đóng"
            className="flex min-h-8 min-w-8 items-center justify-center text-white/80 transition-colors hover:text-white"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Product Info Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs text-slate-700 flex flex-col gap-1">
          <div className="font-bold text-slate-900 line-clamp-1">{product.name}</div>
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Mã SKU: <span className="font-semibold text-slate-700">{product.sku}</span></span>
            <span>Tồn hiện tại: <span className={`font-black ${product.stockQuantity <= 0 ? "text-rose-600" : "text-amber-600"}`}>{formatNumber(product.stockQuantity)} {product.unit}</span></span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col text-xs font-semibold text-slate-700">
          <div className="p-5 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-slate-700 font-bold">
                Ngưỡng tồn tối thiểu ({product.unit}) <span className="text-rose-500">*</span>:
              </label>
              <input
                type="number"
                step="any"
                min="0"
                autoFocus
                placeholder="Ví dụ: 10"
                {...register("minStockQuantity", { valueAsNumber: true })}
                className={`border ${errors.minStockQuantity ? "border-rose-500" : "border-slate-300"} h-10 px-3 rounded-lg focus:outline-none focus:border-kv-blue-primary text-slate-800 text-sm font-semibold`}
              />
              {errors.minStockQuantity && (
                <span className="text-[11px] text-rose-500 font-bold">{errors.minStockQuantity.message}</span>
              )}
              <p className="text-[11px] text-slate-400 font-normal leading-relaxed">
                Khi số lượng tồn thực tế nhỏ hơn hoặc bằng ngưỡng này, hệ thống sẽ tự động hiển thị trong danh sách cảnh báo tồn và tính toán lượng đề xuất nhập hàng.
              </p>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-slate-50 p-4">
            <button
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
              className="min-h-9 rounded-lg bg-white border border-slate-300 px-4 font-bold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-wait disabled:opacity-60"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-9 rounded-lg bg-kv-blue-primary px-5 font-bold text-white shadow-sm transition-colors hover:bg-kv-blue-dark disabled:cursor-wait disabled:opacity-60"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu ngưỡng tồn"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
