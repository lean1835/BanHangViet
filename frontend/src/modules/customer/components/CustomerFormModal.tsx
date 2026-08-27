import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Crown, ShieldAlert, Sparkles } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CUSTOMER_FORM_DEFAULTS,
  CUSTOMER_UI,
} from "@/constants/customer";
import { USER_ROLES } from "@/constants/roles";
import { useDashboardDemo } from "@/providers/DashboardDemoProvider";
import { useAccessibleDialog } from "@/hooks/useAccessibleDialog";
import { formatNumber } from "@/utils/formatCurrency";
import type { ICustomer } from "../types/ICustomer";

const customerSchema = z
  .object({
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
    isVip: z.boolean().optional(),
    discountRate: z
      .number({ invalid_type_error: "Mức chiết khấu phải là số." })
      .min(0, "Mức chiết khấu không được âm.")
      .optional(),
    discountType: z.enum(["PERCENTAGE", "CASH"]).optional(),
    reminderDaysBefore: z
      .number({ invalid_type_error: "Số ngày phải là số." })
      .min(0, "Không được nhỏ hơn 0")
      .max(365, "Tối đa 365 ngày")
      .optional(),
    reminderDaysAfter: z
      .number({ invalid_type_error: "Số ngày phải là số." })
      .min(0, "Không được nhỏ hơn 0")
      .max(365, "Tối đa 365 ngày")
      .optional(),
    dueDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.discountType === "PERCENTAGE" && (data.discountRate || 0) > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Mức chiết khấu phần trăm không được vượt quá 100%.",
      path: ["discountRate"],
    }
  );

export type CustomerFormValues = z.input<typeof customerSchema>;

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
  const { currentRole } = useDashboardDemo();
  const canManageDiscount = currentRole === USER_ROLES.OWNER || !currentRole;

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
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      creditLimit: CUSTOMER_FORM_DEFAULTS.CREDIT_LIMIT,
      isVip: false,
      discountRate: 0,
      discountType: "PERCENTAGE",
      reminderDaysBefore: 3,
      reminderDaysAfter: 3,
      dueDate: "",
    },
  });

  const isVipWatched = watch("isVip");
  const discountTypeWatched = watch("discountType");

  const [creditLimitDisplay, setCreditLimitDisplay] = useState<string>("");
  const [discountRateDisplay, setDiscountRateDisplay] = useState<string>("");

  useEffect(() => {
    if (customer) {
      const val = customer.creditLimit ?? CUSTOMER_FORM_DEFAULTS.CREDIT_LIMIT;
      const rate = customer.discountRate ?? 0;
      const discType = customer.discountType || "PERCENTAGE";
      const isVip = Boolean(customer.isVip || rate > 0);

      reset({
        name: customer.name || "",
        phone: customer.phone || customer.phoneNumber || "",
        email: customer.email || "",
        address: customer.address || "",
        creditLimit: val,
        isVip,
        discountRate: rate,
        discountType: discType,
        reminderDaysBefore: customer.reminderDaysBefore ?? 3,
        reminderDaysAfter: customer.reminderDaysAfter ?? 3,
        dueDate: customer.dueDate || "",
      });
      setCreditLimitDisplay(formatNumber(val));
      setDiscountRateDisplay(discType === "CASH" ? formatNumber(rate) : String(rate));
    } else {
      const val = CUSTOMER_FORM_DEFAULTS.CREDIT_LIMIT;
      reset({
        name: "",
        phone: "",
        email: "",
        address: "",
        creditLimit: val,
        isVip: false,
        discountRate: 0,
        discountType: "PERCENTAGE",
        reminderDaysBefore: 3,
        reminderDaysAfter: 3,
        dueDate: "",
      });
      setCreditLimitDisplay(formatNumber(val));
      setDiscountRateDisplay("0");
    }
    setGlobalError("");
    setDuplicateCustomer(null);
  }, [customer, isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: CustomerFormValues) => {
    const cleanPhone = values.phone;

    const duplicateCust = existingCustomers.find(
      (c) =>
        (c.phone || c.phoneNumber)?.trim().replace(/\s+/g, "") === cleanPhone &&
        c.id !== customer?.id
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
        phoneNumber: cleanPhone,
        email: values.email || "",
        address: values.address || "",
        creditLimit: Number(values.creditLimit),
        discountRate: canManageDiscount ? Number(values.discountRate || 0) : (customer?.discountRate ?? 0),
        discountType: canManageDiscount ? values.discountType : (customer?.discountType ?? "PERCENTAGE"),
        isVip: canManageDiscount ? Boolean(values.isVip) : Boolean(customer?.isVip),
        reminderDaysBefore: Number(values.reminderDaysBefore ?? 3),
        reminderDaysAfter: Number(values.reminderDaysAfter ?? 3),
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
        className="app-modal-panel w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8 animate-modal-bounce-in max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-kv-blue-primary flex items-center justify-center font-bold">
              <Crown size={18} />
            </div>
            <h2 id="customer-modal-title" className="text-base font-extrabold text-slate-800">
              {isEditMode ? CUSTOMER_UI.MODAL.EDIT_TITLE : CUSTOMER_UI.MODAL.CREATE_TITLE}
            </h2>
          </div>
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
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 flex flex-col gap-4 overflow-y-auto">
          {globalError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {globalError}
            </div>
          )}

          {/* Section 1: Thông tin cơ bản */}
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
                      Bấm vào đây để mở hồ sơ khách hàng "{duplicateCustomer.name}"
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
                type="text"
                value={creditLimitDisplay}
                onChange={(e) => {
                  const rawVal = e.target.value.replace(/\D/g, "");
                  const numVal = rawVal ? Number(rawVal) : 0;
                  setCreditLimitDisplay(rawVal ? formatNumber(numVal) : "0");
                  setValue("creditLimit", numVal, { shouldValidate: true });
                }}
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

            {/* Nhắc nợ trước hạn */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700" title="Nhắc nợ trước khi đến hạn thanh toán">
                Nhắc nợ trước hạn
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={365}
                  {...register("reminderDaysBefore", { valueAsNumber: true })}
                  className="h-9 px-3 pr-12 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-kv-blue-primary w-full bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                  ngày
                </span>
              </div>
            </div>

            {/* Nhắc nợ sau hạn */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-700" title="Nhắc nợ sau khi quá hạn thanh toán">
                Nhắc nợ sau hạn
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={365}
                  {...register("reminderDaysAfter", { valueAsNumber: true })}
                  className="h-9 px-3 pr-12 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-kv-blue-primary w-full bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                  ngày
                </span>
              </div>
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

          {/* Section 2: Chính sách Khách hàng thân thiết & Chiết khấu riêng (NCL-15-CN-003) */}
          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Chiết khấu riêng & Khách thân thiết (NCL-15-CN-003)
                </span>
              </div>

              {!canManageDiscount && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <ShieldAlert size={12} />
                  Chỉ Chủ hộ được sửa
                </span>
              )}
            </div>

            {!canManageDiscount && (
              <div className="text-[11px] text-amber-800 font-medium bg-amber-100/70 p-2.5 rounded-lg border border-amber-200 flex items-start gap-1.5">
                <span>🔒 Mức chiết khấu riêng thuộc thẩm quyền phê duyệt của Chủ hộ kinh doanh. Nhân viên bán hàng chỉ được xem thông tin theo chính sách bảo mật (NCL-15-CN-003-TC-03).</span>
              </div>
            )}

            {/* VIP Checkbox Card */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/80 border border-amber-200/80 shadow-2xs">
              <label
                htmlFor="isVipCheckbox"
                className="flex items-center gap-2.5 cursor-pointer select-none flex-1"
              >
                <input
                  type="checkbox"
                  id="isVipCheckbox"
                  {...register("isVip")}
                  disabled={!canManageDiscount}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 disabled:opacity-60 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-800">
                  Gán nhãn Khách hàng thân thiết / VIP
                </span>
                {isVipWatched && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-white shadow-2xs">
                    VIP
                  </span>
                )}
              </label>
            </div>

            {/* Row 1: Mức chiết khấu riêng (Full width, rộng rãi không bao giờ rớt dòng) */}
            <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-white/60 border border-amber-200/60">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-700">
                  Mức chiết khấu riêng
                </label>
                <div className="inline-flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 shrink-0">
                  <button
                    type="button"
                    disabled={!canManageDiscount}
                    onClick={() => {
                      setValue("discountType", "PERCENTAGE", { shouldValidate: true });
                      const rate = Number(watch("discountRate") || 0);
                      setDiscountRateDisplay(String(Math.min(100, rate)));
                    }}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                      discountTypeWatched === "PERCENTAGE"
                        ? "bg-white text-amber-700 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    % Phần trăm
                  </button>
                  <button
                    type="button"
                    disabled={!canManageDiscount}
                    onClick={() => {
                      setValue("discountType", "CASH", { shouldValidate: true });
                      const rate = Number(watch("discountRate") || 0);
                      setDiscountRateDisplay(formatNumber(rate));
                    }}
                    className={`px-3 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-all ${
                      discountTypeWatched === "CASH"
                        ? "bg-white text-amber-700 shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ₫ Cố định
                  </button>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  disabled={!canManageDiscount}
                  value={discountRateDisplay}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, "");
                    let numVal = rawVal ? Number(rawVal) : 0;
                    if (discountTypeWatched === "PERCENTAGE" && numVal > 100) {
                      numVal = 100;
                    }
                    setDiscountRateDisplay(
                      discountTypeWatched === "CASH"
                        ? formatNumber(numVal)
                        : String(numVal)
                    );
                    setValue("discountRate", numVal, { shouldValidate: true });
                  }}
                  placeholder={discountTypeWatched === "PERCENTAGE" ? "Ví dụ: 5" : "Ví dụ: 50,000"}
                  className={`h-9 px-3 pr-8 rounded-lg border text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 w-full bg-white disabled:bg-slate-100 disabled:opacity-75 ${
                    errors.discountRate ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                  {discountTypeWatched === "PERCENTAGE" ? "%" : "₫"}
                </span>
              </div>
              {errors.discountRate && (
                <span className="text-[11px] font-semibold text-rose-600">
                  {errors.discountRate.message}
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-2 shrink-0">
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
