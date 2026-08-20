import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  SUPPLIER_VALIDATION,
  SUPPLIER_ERROR_CODES,
  SUPPLIER_MESSAGES,
} from "@/constants/supplier";
import { formatNumber } from "@/utils/formatCurrency";
import type { ISupplier } from "../types/ISupplier";

const supplierSchema = z.object({
  code: z.string().trim().max(50).optional().or(z.literal("")),
  name: z
    .string()
    .trim()
    .min(1, "Tên nhà cung cấp không được để trống")
    .max(SUPPLIER_VALIDATION.NAME_MAX, `Tên nhà cung cấp không vượt quá ${SUPPLIER_VALIDATION.NAME_MAX} ký tự`),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Số điện thoại không được để trống")
    .max(SUPPLIER_VALIDATION.PHONE_MAX, `Số điện thoại không vượt quá ${SUPPLIER_VALIDATION.PHONE_MAX} ký tự`)
    .refine(
      (val) => SUPPLIER_VALIDATION.PHONE_PATTERN.test(val),
      "Số điện thoại không hợp lệ (Ví dụ: 0912345678 hoặc +84912345678)"
    ),
  email: z
    .string()
    .trim()
    .max(SUPPLIER_VALIDATION.EMAIL_MAX, `Email không vượt quá ${SUPPLIER_VALIDATION.EMAIL_MAX} ký tự`)
    .refine(
      (val) => !val || SUPPLIER_VALIDATION.EMAIL_PATTERN.test(val),
      "Email không đúng định dạng"
    )
    .optional()
    .or(z.literal("")),
  taxCode: z
    .string()
    .trim()
    .max(SUPPLIER_VALIDATION.TAX_CODE_MAX, `Mã số thuế không vượt quá ${SUPPLIER_VALIDATION.TAX_CODE_MAX} ký tự`)
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(SUPPLIER_VALIDATION.ADDRESS_MAX, `Địa chỉ không vượt quá ${SUPPLIER_VALIDATION.ADDRESS_MAX} ký tự`)
    .optional()
    .or(z.literal("")),
  initialDebt: z.number({ invalid_type_error: "Vui lòng nhập số tiền hợp lệ" }).min(0, "Nợ ban đầu không được âm"),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  note: z
    .string()
    .trim()
    .max(SUPPLIER_VALIDATION.NOTE_MAX, `Ghi chú không vượt quá ${SUPPLIER_VALIDATION.NOTE_MAX} ký tự`)
    .optional()
    .or(z.literal("")),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
  initialData?: ISupplier | null;
  serverError?: { code?: number; message?: string } | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  serverError,
}) => {
  const isEditing = Boolean(initialData);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      phoneNumber: "",
      email: "",
      taxCode: "",
      address: "",
      initialDebt: 0,
      status: "ACTIVE",
      note: "",
    },
  });

  const [debtDisplay, setDebtDisplay] = useState<string>("0");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const debtVal = initialData.currentDebt ?? 0;
        reset({
          code: `NCC-${(initialData.id || "").slice(0, 6).toUpperCase()}`,
          name: initialData.name || "",
          phoneNumber: initialData.phoneNumber || "",
          email: initialData.email || "",
          taxCode: initialData.taxCode || "",
          address: initialData.address || "",
          initialDebt: debtVal,
          status: initialData.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
          note: initialData.note || "",
        });
        setDebtDisplay(formatNumber(debtVal));
      } else {
        reset({
          code: "",
          name: "",
          phoneNumber: "",
          email: "",
          taxCode: "",
          address: "",
          initialDebt: 0,
          status: "ACTIVE",
          note: "",
        });
        setDebtDisplay("0");
      }
    }
  }, [isOpen, initialData, reset]);

  // Handle server errors
  useEffect(() => {
    if (serverError) {
      if (serverError.code === SUPPLIER_ERROR_CODES.PHONE_EXISTS) {
        setError("phoneNumber", {
          type: "server",
          message: SUPPLIER_MESSAGES.PHONE_EXISTS_ERROR,
        });
      }
    }
  }, [serverError, setError]);

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleFormSubmit = async (data: SupplierFormValues) => {
    try {
      await onSubmit(data);
    } catch {
      // Handled by parent
    }
  };

  const handleDebtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, "");
    if (!rawVal) {
      setDebtDisplay("0");
      setValue("initialDebt", 0, { shouldValidate: true });
      return;
    }
    const num = parseInt(rawVal, 10);
    setDebtDisplay(formatNumber(num));
    setValue("initialDebt", num, { shouldValidate: true });
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="supplier-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-backdrop-fade-in"
    >
      <div
        className="app-modal-panel flex flex-col w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-modal-bounce-in max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dark Navy Header matching Screenshot 1 */}
        <div className="bg-[#1e293b] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-5 h-5 text-white/90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h2
              id="supplier-modal-title"
              className="text-sm font-bold tracking-wide text-white"
            >
              {isEditing
                ? "Cập nhật thông tin nhà cung cấp"
                : "Thêm nhà cung cấp mới"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng"
            className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body Form */}
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="flex flex-col flex-1 min-h-0 text-xs font-semibold text-slate-700"
        >
          <div className="app-modal-body p-6 space-y-4 overflow-y-auto">
            {/* Row 1: Mã nhà cung cấp & Tên nhà cung cấp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="supplier-code"
                  className="block text-slate-700 font-bold mb-1.5"
                >
                  Mã nhà cung cấp <span className="text-slate-400 font-normal">(Mặc định tự sinh)</span>
                </label>
                <input
                  id="supplier-code"
                  type="text"
                  placeholder="NCC00001"
                  disabled={isSubmitting}
                  {...register("code")}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-kv-blue-primary focus:ring-1 focus:ring-kv-blue-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="supplier-name"
                  className="block text-slate-700 font-bold mb-1.5"
                >
                  Tên nhà cung cấp <span className="text-rose-500">*</span>
                </label>
                <input
                  id="supplier-name"
                  type="text"
                  autoFocus
                  placeholder="Công ty TNHH Nông Sản Việt Nam"
                  disabled={isSubmitting}
                  {...register("name")}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                    errors.name
                      ? "border-rose-300 bg-rose-50/40 text-rose-900 focus:ring-rose-200"
                      : "border-slate-300 bg-white text-slate-900 focus:border-kv-blue-primary focus:ring-kv-blue-primary"
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {errors.name.message}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Điện thoại & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="supplier-phone"
                  className="block text-slate-700 font-bold mb-1.5"
                >
                  Điện thoại <span className="text-rose-500">*</span>
                </label>
                <input
                  id="supplier-phone"
                  type="tel"
                  placeholder="0912345678"
                  disabled={isSubmitting}
                  {...register("phoneNumber")}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                    errors.phoneNumber
                      ? "border-rose-300 bg-rose-50/40 text-rose-900 focus:ring-rose-200"
                      : "border-slate-300 bg-white text-slate-900 focus:border-kv-blue-primary focus:ring-kv-blue-primary"
                  }`}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="supplier-email"
                  className="block text-slate-700 font-bold mb-1.5"
                >
                  Email
                </label>
                <input
                  id="supplier-email"
                  type="email"
                  placeholder="nhacungcap@gmail.com"
                  disabled={isSubmitting}
                  {...register("email")}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                    errors.email
                      ? "border-rose-300 bg-rose-50/40 text-rose-900 focus:ring-rose-200"
                      : "border-slate-300 bg-white text-slate-900 focus:border-kv-blue-primary focus:ring-kv-blue-primary"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Mã số thuế & Địa chỉ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="supplier-tax-code"
                  className="block text-slate-700 font-bold mb-1.5"
                >
                  Mã số thuế
                </label>
                <input
                  id="supplier-tax-code"
                  type="text"
                  placeholder="0101234567"
                  disabled={isSubmitting}
                  {...register("taxCode")}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                    errors.taxCode
                      ? "border-rose-300 bg-rose-50/40 text-rose-900 focus:ring-rose-200"
                      : "border-slate-300 bg-white text-slate-900 focus:border-kv-blue-primary focus:ring-kv-blue-primary"
                  }`}
                />
                {errors.taxCode && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {errors.taxCode.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="supplier-address"
                  className="block text-slate-700 font-bold mb-1.5"
                >
                  Địa chỉ
                </label>
                <input
                  id="supplier-address"
                  type="text"
                  placeholder="Số 123 đường ABC, Quận XYZ, TP. Hà Nội"
                  disabled={isSubmitting}
                  {...register("address")}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 ${
                    errors.address
                      ? "border-rose-300 bg-rose-50/40 text-rose-900 focus:ring-rose-200"
                      : "border-slate-300 bg-white text-slate-900 focus:border-kv-blue-primary focus:ring-kv-blue-primary"
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-[11px] font-semibold text-rose-600">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>

            {/* Row 4: Nợ cần trả / Nợ ban đầu */}
            <div>
              <label
                htmlFor="supplier-debt"
                className="block text-slate-700 font-bold mb-1.5"
              >
                {isEditing ? "Nợ cần trả hiện tại (VND)" : "Nợ ban đầu (VND)"}
              </label>
              <div className="relative">
                <input
                  id="supplier-debt"
                  type="text"
                  value={debtDisplay}
                  onChange={handleDebtChange}
                  disabled={isSubmitting}
                  className="w-full pl-3 pr-10 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-kv-blue-primary focus:ring-1 focus:ring-kv-blue-primary text-right"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                  đ
                </span>
              </div>
              {errors.initialDebt && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">
                  {errors.initialDebt.message}
                </p>
              )}
            </div>

            {/* Row 5: Ghi chú */}
            <div>
              <label
                htmlFor="supplier-note"
                className="block text-slate-700 font-bold mb-1.5"
              >
                Ghi chú / Mặt hàng thường lấy
              </label>
              <textarea
                id="supplier-note"
                rows={3}
                placeholder="Ví dụ: Chuyên cung cấp bia nước ngọt, thực phẩm khô, gia vị..."
                disabled={isSubmitting}
                {...register("note")}
                className="w-full px-3 py-2 rounded-lg border text-sm transition-all focus:outline-none focus:ring-1 resize-none border-slate-300 bg-white text-slate-900 focus:border-kv-blue-primary focus:ring-kv-blue-primary"
              />
              {errors.note && (
                <p className="mt-1 text-[11px] font-semibold text-rose-600">
                  {errors.note.message}
                </p>
              )}
            </div>

            {/* Row 6: Trạng thái (khi chỉnh sửa) */}
            {isEditing && (
              <div>
                <label
                  htmlFor="supplier-status"
                  className="block text-slate-700 font-bold mb-1.5"
                >
                  Trạng thái hoạt động
                </label>
                <select
                  id="supplier-status"
                  disabled={isSubmitting}
                  {...register("status")}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-kv-blue-primary focus:ring-1 focus:ring-kv-blue-primary font-medium"
                >
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="INACTIVE">Ngừng hoạt động</option>
                </select>
              </div>
            )}
          </div>

          {/* Footer Form */}
          <div className="app-modal-footer px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-white text-xs font-bold shadow-md shadow-blue-500/15 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 animate-spin text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Đang lưu...</span>
                </>
              ) : (
                <span>{isEditing ? "Cập nhật" : "Lưu nhà cung cấp"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
