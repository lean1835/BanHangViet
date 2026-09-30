import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Crown,
  ShieldAlert,
  Sparkles,
  User,
  Phone,
  Mail,
  FileText,
  MapPin,
  CreditCard,
  Calendar,
  Bell,
} from "lucide-react";
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
    taxCode: z
      .string()
      .transform((val) => val.trim())
      .refine(
        (val) => !val || /^\d{10}$|^\d{13}$|^\d{10}-\d{3}$/.test(val),
        "Mã số thuế không hợp lệ (phải gồm 10 hoặc 13 chữ số, ví dụ: 0101234567 hoặc 0101234567-001)."
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
    discountType: z
      .string()
      .optional()
      .transform((val) => {
        if (!val) return "PERCENTAGE" as const;
        const upper = String(val).toUpperCase();
        if (upper === "CASH" || upper === "FIXED" || upper === "FIXED_AMOUNT") {
          return "CASH" as const;
        }
        return "PERCENTAGE" as const;
      })
      .pipe(z.enum(["PERCENTAGE", "CASH"])),
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
      taxCode: "",
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
      const rawDiscType = customer.discountType as string | undefined;
      const discType: "PERCENTAGE" | "CASH" =
        rawDiscType === "CASH" ||
        rawDiscType === "FIXED" ||
        rawDiscType === "FIXED_AMOUNT"
          ? "CASH"
          : "PERCENTAGE";
      const isVip = Boolean(customer.isVip || rate > 0);

      reset({
        name: customer.name || "",
        phone: customer.phone || customer.phoneNumber || "",
        taxCode: customer.taxCode || "",
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
        taxCode: "",
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

  const onInvalid = (fieldErrors: typeof errors) => {
    const errorKeys = Object.keys(fieldErrors);
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0] as keyof typeof fieldErrors;
      const msg =
        fieldErrors[firstKey]?.message ||
        "Vui lòng kiểm tra lại các trường thông tin có viền đỏ!";
      setGlobalError(msg);

      const errorElement = document.querySelector(
        `[name="${firstKey}"]`
      ) as HTMLElement;
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        errorElement.focus?.();
      }
    }
  };

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
        taxCode: values.taxCode ? values.taxCode.trim() : "",
        email: values.email || "",
        address: values.address || "",
        creditLimit: Number(values.creditLimit),
        discountRate: canManageDiscount ? Number(values.discountRate || 0) : (customer?.discountRate ?? 0),
        discountType: canManageDiscount
          ? (values.discountType as "PERCENTAGE" | "CASH" | undefined)
          : (customer?.discountType ?? "PERCENTAGE"),
        isVip: canManageDiscount ? Boolean(values.isVip) : Boolean(customer?.isVip),
        reminderDaysBefore: Number(values.reminderDaysBefore ?? 3),
        reminderDaysAfter: Number(values.reminderDaysAfter ?? 3),
        debt: customer?.debt ?? 0,
        dueDate: values.dueDate || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      if (apiErr?.data?.message) {
        setGlobalError(apiErr.data.message);
      } else if (err instanceof Error) {
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
        className="app-modal-panel w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200/90 overflow-hidden flex flex-col my-6 animate-modal-bounce-in max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50/20 to-white shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 font-bold">
              <Crown size={20} />
            </div>
            <div className="min-w-0">
              <h2 id="customer-modal-title" className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                {isEditMode ? CUSTOMER_UI.MODAL.EDIT_TITLE : CUSTOMER_UI.MODAL.CREATE_TITLE}
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                Quản lý hồ sơ khách hàng, chính sách hạn mức nợ & chiết khấu thân thiết
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng modal"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-6 flex flex-col gap-5 overflow-y-auto pos-tabs-scrollbar">
          {globalError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-shake">
              <ShieldAlert size={16} className="shrink-0 text-rose-500" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Section 1: Thông tin định danh & Liên hệ */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-black text-slate-800 uppercase tracking-wider">
              <User size={15} className="text-blue-600" />
              <span>1. Thông tin định danh & Liên hệ</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">
                  {CUSTOMER_UI.MODAL.LABELS.NAME} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder={CUSTOMER_UI.MODAL.PLACEHOLDERS.NAME}
                  className={`h-10 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs ${
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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-400" />
                  <span>{CUSTOMER_UI.MODAL.LABELS.PHONE} <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  {...register("phone")}
                  placeholder={CUSTOMER_UI.MODAL.PLACEHOLDERS.PHONE}
                  className={`h-10 px-3.5 rounded-xl border text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs ${
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
                        className="text-[11px] font-bold text-blue-600 hover:underline text-left"
                      >
                        Bấm vào đây để mở hồ sơ khách hàng "{duplicateCustomer.name}"
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  <span>{CUSTOMER_UI.MODAL.LABELS.EMAIL}</span>
                </label>
                <input
                  type="email"
                  {...register("email")}
                  placeholder={CUSTOMER_UI.MODAL.PLACEHOLDERS.EMAIL}
                  className={`h-10 px-3.5 rounded-xl border text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs ${
                    errors.email ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
                {errors.email && (
                  <span className="text-[11px] font-semibold text-rose-600">
                    {errors.email.message}
                  </span>
                )}
              </div>

              {/* Tax Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileText size={13} className="text-slate-400" />
                  <span>Mã số thuế (Doanh nghiệp)</span>
                </label>
                <input
                  type="text"
                  {...register("taxCode")}
                  placeholder="Ví dụ: 0101234567 hoặc 0101234567-001"
                  className={`h-10 px-3.5 rounded-xl border text-xs sm:text-sm font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs ${
                    errors.taxCode ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
                {errors.taxCode && (
                  <span className="text-[11px] font-semibold text-rose-600">
                    {errors.taxCode.message}
                  </span>
                )}
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-400" />
                  <span>Địa chỉ trụ sở / Liên hệ nhận hàng</span>
                </label>
                <input
                  type="text"
                  {...register("address")}
                  placeholder="Nhập địa chỉ của khách hàng / doanh nghiệp..."
                  className="h-10 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Chính sách công nợ & Thời hạn thanh toán */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider">
              <CreditCard size={15} className="text-indigo-600" />
              <span>2. Chính sách công nợ & Kỳ hạn thanh toán</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Credit Limit */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {CUSTOMER_UI.MODAL.LABELS.CREDIT_LIMIT} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
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
                    className={`h-10 px-3.5 pr-8 rounded-xl border text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs bg-white w-full ${
                      errors.creditLimit ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                    đ
                  </span>
                </div>
                {errors.creditLimit && (
                  <span className="text-[11px] font-semibold text-rose-600">
                    {errors.creditLimit.message}
                  </span>
                )}
              </div>

              {/* Due Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>{CUSTOMER_UI.MODAL.LABELS.DUE_DATE}</span>
                </label>
                <input
                  type="date"
                  {...register("dueDate")}
                  className="h-10 px-3.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs bg-white"
                />
              </div>

              {/* Nhắc nợ trước hạn */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5" title="Nhắc nợ trước khi đến hạn thanh toán">
                  <Bell size={13} className="text-slate-400" />
                  <span>Nhắc nợ trước hạn</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={365}
                    {...register("reminderDaysBefore", { valueAsNumber: true })}
                    className="h-10 px-3.5 pr-12 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white transition-all shadow-2xs"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-bold pointer-events-none">
                    ngày
                  </span>
                </div>
              </div>

              {/* Nhắc nợ sau hạn */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5" title="Nhắc nợ sau khi quá hạn thanh toán">
                  <Bell size={13} className="text-slate-400" />
                  <span>Nhắc nợ sau hạn</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={365}
                    {...register("reminderDaysAfter", { valueAsNumber: true })}
                    className="h-10 px-3.5 pr-12 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full bg-white transition-all shadow-2xs"
                  />
                  <span className="absolute right-3.5 top-3 text-xs text-slate-400 font-bold pointer-events-none">
                    ngày
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Chính sách Khách hàng thân thiết & Chiết khấu riêng */}
          <div className="rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/50 via-orange-50/20 to-white p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200/70 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-600" />
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  3. Chiết khấu riêng & Khách thân thiết
                </span>
              </div>

              {!canManageDiscount && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                  <ShieldAlert size={12} />
                  Quyền quản lý của Chủ hộ
                </span>
              )}
            </div>

            {!canManageDiscount && (
              <div className="text-xs text-amber-800 font-medium bg-amber-100/70 p-3 rounded-xl border border-amber-200 flex items-start gap-2">
                <span>🔒 Mức chiết khấu riêng thuộc thẩm quyền phê duyệt của Chủ hộ kinh doanh. Nhân viên bán hàng chỉ được xem thông tin theo chính sách bảo mật.</span>
              </div>
            )}

            {/* VIP Checkbox Card (Spacious toggle box) */}
            <div className={`p-3.5 rounded-xl border transition-all ${
              isVipWatched
                ? "bg-amber-100/50 border-amber-300 shadow-xs"
                : "bg-white/80 border-amber-200/80"
            }`}>
              <label
                htmlFor="isVipCheckbox"
                className="flex items-center justify-between cursor-pointer select-none gap-3"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isVipCheckbox"
                    {...register("isVip")}
                    disabled={!canManageDiscount}
                    className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 disabled:opacity-60 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      Gán nhãn Khách hàng thân thiết / VIP
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Ưu tiên phục vụ và áp dụng các chương trình tri ân đặc biệt
                    </span>
                  </div>
                </div>

                {isVipWatched && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs">
                    <Crown size={12} />
                    VIP
                  </span>
                )}
              </label>
            </div>

            {/* Mức chiết khấu riêng (Spacious container) */}
            <div className="flex flex-col gap-2 p-4 rounded-xl bg-white/80 border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <label className="text-xs font-bold text-slate-800 block">
                    Mức chiết khấu riêng cho khách hàng này
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Tự động áp dụng khi lập hóa đơn bán lẻ hoặc bán buôn
                  </span>
                </div>

                <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                  <button
                    type="button"
                    disabled={!canManageDiscount}
                    onClick={() => {
                      setValue("discountType", "PERCENTAGE", { shouldValidate: true });
                      const rate = Number(watch("discountRate") || 0);
                      setDiscountRateDisplay(String(Math.min(100, rate)));
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      discountTypeWatched === "PERCENTAGE"
                        ? "bg-white text-amber-700 shadow-xs"
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
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      discountTypeWatched === "CASH"
                        ? "bg-white text-amber-700 shadow-xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    ₫ Cố định
                  </button>
                </div>
              </div>

              <div className="relative mt-1">
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
                  placeholder={discountTypeWatched === "PERCENTAGE" ? "Ví dụ: 5 hoặc 10" : "Ví dụ: 50,000"}
                  className={`h-10 px-3.5 pr-9 rounded-xl border text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 w-full bg-white disabled:bg-slate-100 disabled:opacity-75 transition-all shadow-2xs ${
                    errors.discountRate ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
                <span className="absolute right-3.5 top-3 text-xs font-extrabold text-slate-400 pointer-events-none">
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

          {/* Footer Actions (Spacious & Executive) */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-2 shrink-0">
            {globalError ? (
              <span className="text-xs font-bold text-rose-600 line-clamp-1 pr-2">
                {globalError}
              </span>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 px-5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all"
              >
                {CUSTOMER_UI.MODAL.CANCEL}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="h-10 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-xs sm:text-sm font-extrabold text-white shadow-md shadow-blue-500/25 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : isEditMode ? (
                  CUSTOMER_UI.MODAL.SUBMIT_EDIT
                ) : (
                  CUSTOMER_UI.MODAL.SUBMIT_CREATE
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
