import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CUSTOMER_FORM_DEFAULTS,
  CUSTOMER_UI,
} from "@/constants/customer";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import type { ICustomer } from "../types/ICustomer";

const customerSchema = z.object({
  name: z
    .string()
    .min(1, "Vui lòng nhập họ và tên khách hàng.")
    .transform((val) => val.trim()),
  phone: z
    .string()
    .min(1, "Vui lòng nhập số điện thoại.")
    .transform((val) => val.trim().replace(/\s+/g, ""))
    .refine(
      (val) => /^(0|\+?84)(2[0-9]{8,9}|[35789][0-9]{8})$/.test(val),
      "Số điện thoại không hợp lệ (ví dụ: 0988888888 hoặc 0283899999)."
    ),
  email: z
    .string()
    .transform((val) => val.trim())
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Địa chỉ Email không đúng định dạng."
    )
    .optional(),
  address: z
    .string()
    .transform((val) => val.trim())
    .optional(),
  creditLimit: z
    .number({ invalid_type_error: "Hạn mức nợ phải là một số." })
    .min(0, "Hạn mức nợ không được là số âm."),
  dueDate: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    customerData: Omit<ICustomer, "id" | "debt"> & { id?: string; debt?: number }
  ) => void | Promise<void>;
  customer?: ICustomer | null;
  existingCustomers?: ICustomer[];
  onOpenEditModal?: (customer: ICustomer) => void;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer,
  existingCustomers = [],
  onOpenEditModal,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [duplicateCustomer, setDuplicateCustomer] = useState<ICustomer | null>(null);

  const dialogRef = useAccessibleDialog({
    isOpen,
    onClose,
    canClose: !isSubmitting,
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      creditLimit: CUSTOMER_FORM_DEFAULTS.CREDIT_LIMIT,
      dueDate: "",
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        creditLimit: customer.creditLimit ?? CUSTOMER_FORM_DEFAULTS.CREDIT_LIMIT,
        dueDate: customer.dueDate || "",
      });
    } else {
      reset({
        name: "",
        phone: "",
        email: "",
        address: "",
        creditLimit: CUSTOMER_FORM_DEFAULTS.CREDIT_LIMIT,
        dueDate: "",
      });
    }
    setGlobalError("");
    setDuplicateCustomer(null);
  }, [customer, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: CustomerFormValues) => {
    const cleanPhone = values.phone;

    // Check duplicate phone number against existing customers (excluding current editing customer)
    const duplicateCust = existingCustomers.find(
      (c) => c.phone?.trim().replace(/\s+/g, "") === cleanPhone && c.id !== customer?.id
    );

    if (duplicateCust) {
      setDuplicateCustomer(duplicateCust);
      setError("phone", {
        type: "manual",
        message: `Số điện thoại "${cleanPhone}" đã tồn tại trên hệ thống.`,
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setGlobalError("");
      await onSave({
        id: customer?.id,
        name: values.name,
        phone: cleanPhone,
        email: values.email || "",
        address: values.address || "",
        creditLimit: Number(values.creditLimit),
        debt: customer?.debt ?? 0,
        dueDate: values.dueDate || undefined,
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setGlobalError(err.message);
      } else {
        setGlobalError("Có lỗi xảy ra khi lưu thông tin khách hàng.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = Boolean(customer);

  return createPortal(
    <div
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      className="app-modal-backdrop fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-900/40 p-2 sm:p-4 backdrop-blur-sm animate-backdrop-fade-in"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-modal-title"
        className="app-modal-panel w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-modal-bounce-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 id="customer-modal-title" className="text-base font-extrabold text-slate-800">
            {isEditMode ? CUSTOMER_UI.MODAL.EDIT_TITLE : CUSTOMER_UI.MODAL.CREATE_TITLE}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng modal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4">
          {globalError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {globalError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">
                {CUSTOMER_UI.MODAL.LABELS.NAME}
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder={CUSTOMER_UI.MODAL.PLACEHOLDERS.NAME}
                className={`h-9 px-3 rounded-lg border text-xs font-semibold text-slate-800 focus:outline-none focus:border-kv-blue-primary ${
                  errors.name ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                }`}
              />
              {errors.name && (
                <span className="text-[11px] font-semibold text-rose-600">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                {CUSTOMER_UI.MODAL.LABELS.PHONE}
              </label>
              <input
                type="text"
                {...register("phone")}
                placeholder={CUSTOMER_UI.MODAL.PLACEHOLDERS.PHONE}
                className={`h-9 px-3 rounded-lg border text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-kv-blue-primary ${
                  errors.phone ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                }`}
              />
              {errors.phone && (
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-rose-600">
                    {errors.phone.message}
                  </span>
                  {duplicateCustomer && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenEditModal) {
                          onOpenEditModal(duplicateCustomer);
                        }
                      }}
                      className="text-[11px] font-bold text-kv-blue-primary hover:underline text-left"
                    >
                      👉 Bấm vào đây để mở hồ sơ khách hàng "{duplicateCustomer.name}"
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                {CUSTOMER_UI.MODAL.LABELS.EMAIL}
              </label>
              <input
                type="email"
                {...register("email")}
                placeholder={CUSTOMER_UI.MODAL.PLACEHOLDERS.EMAIL}
                className={`h-9 px-3 rounded-lg border text-xs font-semibold text-slate-800 focus:outline-none focus:border-kv-blue-primary ${
                  errors.email ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                }`}
              />
              {errors.email && (
                <span className="text-[11px] font-semibold text-rose-600">
                  {errors.email.message}
                </span>
              )}
            </div>

            {/* Credit Limit */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                {CUSTOMER_UI.MODAL.LABELS.CREDIT_LIMIT}
              </label>
              <input
                type="number"
                min="0"
                step="100000"
                {...register("creditLimit", { valueAsNumber: true })}
                placeholder={CUSTOMER_UI.MODAL.PLACEHOLDERS.CREDIT_LIMIT}
                className={`h-9 px-3 rounded-lg border text-xs font-bold text-slate-800 focus:outline-none focus:border-kv-blue-primary ${
                  errors.creditLimit ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                }`}
              />
              {errors.creditLimit && (
                <span className="text-[11px] font-semibold text-rose-600">
                  {errors.creditLimit.message}
                </span>
              )}
            </div>

            {/* Due Date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700">
                {CUSTOMER_UI.MODAL.LABELS.DUE_DATE}
              </label>
              <input
                type="date"
                {...register("dueDate")}
                className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-kv-blue-primary"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-xs font-bold text-slate-700">
                {CUSTOMER_UI.MODAL.LABELS.ADDRESS}
              </label>
              <input
                type="text"
                {...register("address")}
                placeholder={CUSTOMER_UI.MODAL.PLACEHOLDERS.ADDRESS}
                className="h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-kv-blue-primary"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-lg border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              {CUSTOMER_UI.MODAL.CANCEL}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 px-5 rounded-lg bg-kv-blue-primary hover:bg-kv-blue-dark text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting
                ? "Đang lưu..."
                : isEditMode
                  ? CUSTOMER_UI.MODAL.SUBMIT_EDIT
                  : CUSTOMER_UI.MODAL.SUBMIT_CREATE}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
